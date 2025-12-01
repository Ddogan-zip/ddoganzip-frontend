import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { getMenuList, getMenuDetails } from "../api/menu";
import { getCart, addCartItem, updateCartItemQuantity, removeCartItem } from "../api/cart";
import { checkout } from "../api/orders";
import { getUserProfile } from "../api/auth";
import type { DinnerMenuItem, DinnerDetail, Customization, CartItemRequest } from "../api/types";
import { MEMBER_GRADE_CONFIG } from "../api/types";
import type { VoiceCommand } from "../api/voice";
import { processVoiceCommand } from "../api/voice";
import VoiceOrderModal from "../components/VoiceOrderModal";
import {
  Box,
  Button,
  Heading,
  Text,
  Spinner,
  VStack,
  HStack,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  useColorModeValue,
  Icon,
  Badge,
  SimpleGrid,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Radio,
  RadioGroup,
  Stack,
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaShoppingCart,
  FaTrash,
  FaPlus,
  FaMinus,
  FaInfoCircle,
  FaTag,
  FaCrown,
} from "react-icons/fa";

export default function MenuOrderPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // 메뉴 목록 조회
  const { data: menuItems, isPending: isMenuLoading } = useQuery({
    queryKey: ["menu-items"],
    queryFn: getMenuList,
  });

  // 장바구니 조회 (백엔드에서 가져오기)
  const { data: cartData, isPending: isCartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  // 사용자 프로필 조회 (회원 등급 정보)
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
  });

  // 모달 상태
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isCheckoutOpen, onOpen: onCheckoutOpen, onClose: onCheckoutClose } = useDisclosure();
  const { isOpen: isVoiceOrderOpen, onOpen: onVoiceOrderOpen, onClose: onVoiceOrderClose } = useDisclosure();

  // 메뉴 상세 정보 캐시 (음성 주문용)
  const [menuDetailsCache, setMenuDetailsCache] = useState<Map<number, DinnerDetail>>(new Map());

  // 선택된 메뉴 상세 정보
  const [selectedDinner, setSelectedDinner] = useState<DinnerDetail | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // 메뉴 추가 폼 상태
  const [selectedStyleId, setSelectedStyleId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState<Map<number, Customization>>(new Map());

  // Checkout 폼 상태
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  // 음성 인식 상태
  const [voiceResult, setVoiceResult] = useState<VoiceCommand | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 메뉴 상세 조회
  const handleMenuClick = async (dinner: DinnerMenuItem) => {
    setIsLoadingDetails(true);
    try {
      const details = await getMenuDetails(dinner.dinnerId);
      setSelectedDinner(details);
      // 캐시에 저장 (음성 주문용)
      setMenuDetailsCache((prev) => new Map(prev).set(dinner.dinnerId, details));
      // 기본값 설정
      if (details.availableStyles.length > 0) {
        setSelectedStyleId(details.availableStyles[0].styleId.toString());
      }
      setQuantity(1);
      setCustomizations(new Map());
      onDetailOpen();
    } catch (error: any) {
      toast({
        title: "메뉴 상세 조회 실패",
        description: error.message || "메뉴 정보를 불러올 수 없습니다.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // 음성 주문 시작 시 모든 메뉴 상세 정보 로드
  const handleVoiceOrderOpen = async () => {
    if (!menuItems) return;

    // 모든 메뉴 상세 정보를 미리 로드
    const cache = new Map<number, DinnerDetail>();
    for (const item of menuItems) {
      if (!menuDetailsCache.has(item.dinnerId)) {
        try {
          const details = await getMenuDetails(item.dinnerId);
          cache.set(item.dinnerId, details);
        } catch (error) {
          console.error(`메뉴 ${item.name} 상세 조회 실패:`, error);
        }
      } else {
        cache.set(item.dinnerId, menuDetailsCache.get(item.dinnerId)!);
      }
    }
    setMenuDetailsCache(cache);
    onVoiceOrderOpen();
  };

  // 음성 주문 완료 처리
  const handleVoiceOrderComplete = (orderRequest: CartItemRequest, deliveryDate?: string) => {
    addToCartMutation.mutate(orderRequest, {
      onSuccess: () => {
        toast({
          title: "음성 주문 완료",
          description: "장바구니에 추가되었습니다. 주문을 확정해주세요.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        // 배송일이 지정된 경우 저장
        if (deliveryDate) {
          setDeliveryDate(deliveryDate);
        }
      },
    });
  };

  // 장바구니에 추가
  const addToCartMutation = useMutation({
    mutationFn: addCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "✅ 장바구니에 추가",
        description: "상품이 추가되었습니다.",
        status: "success",
        duration: 1500,
        isClosable: true,
      });
      onDetailClose();
    },
    onError: (error: any) => {
      toast({
        title: "추가 실패",
        description: error.message || "장바구니에 추가할 수 없습니다.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const handleAddToCart = () => {
    if (!selectedDinner || !selectedStyleId) {
      toast({
        title: "서빙 스타일 선택 필요",
        description: "서빙 스타일을 선택해주세요.",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const customizationsList = Array.from(customizations.values());

    const request: CartItemRequest = {
      dinnerId: selectedDinner.dinnerId,
      servingStyleId: parseInt(selectedStyleId),
      quantity,
      customizations: customizationsList.length > 0 ? customizationsList : undefined,
    };

    addToCartMutation.mutate(request);
  };

  // 장바구니 수량 변경
  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      updateCartItemQuantity(itemId, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: any) => {
      toast({
        title: "수량 변경 실패",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  // 장바구니에서 제거
  const removeItemMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "제거 완료",
        description: "상품이 장바구니에서 제거되었습니다.",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "제거 실패",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  // Checkout
  const checkoutMutation = useMutation({
    mutationFn: checkout,
    onSuccess: (orderId) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "🎉 주문 완료!",
        description: `주문번호: ${orderId}. 주문이 성공적으로 접수되었습니다.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onCheckoutClose();
      setDeliveryAddress("");
      setDeliveryDate("");
    },
    onError: (error: any) => {
      toast({
        title: "주문 실패",
        description: error.message || "주문을 처리할 수 없습니다.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const handleCheckout = () => {
    if (!cartData || cartData.items.length === 0) {
      toast({
        title: "장바구니 비어있음",
        description: "장바구니가 비어있어 주문할 수 없습니다.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onCheckoutOpen();
  };

  const handleConfirmCheckout = () => {
    if (!deliveryAddress.trim()) {
      toast({
        title: "배송 주소 필요",
        description: "배송 주소를 입력해주세요.",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    checkoutMutation.mutate({
      deliveryAddress,
      deliveryDate: deliveryDate || undefined,
    });
  };

  // 커스터마이징 수량 변경 (기본 수량 기준)
  const handleCustomizationQuantityChange = (dishId: number, currentQuantity: number, defaultQuantity: number) => {
    setCustomizations((prev) => {
      const newMap = new Map(prev);

      if (currentQuantity === defaultQuantity) {
        // 기본 수량과 같으면 커스터마이징 없음
        newMap.delete(dishId);
      } else if (currentQuantity > defaultQuantity) {
        // 기본 수량보다 많으면 ADD
        newMap.set(dishId, {
          action: "ADD",
          dishId,
          quantity: currentQuantity - defaultQuantity,
        });
      } else if (currentQuantity < defaultQuantity) {
        // 기본 수량보다 적으면 REMOVE (0 포함)
        newMap.set(dishId, {
          action: "REMOVE",
          dishId,
          quantity: defaultQuantity - currentQuantity,
        });
      }

      return newMap;
    });
  };

  const {
    transcript,
    listening,
    finalTranscript,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  // 장바구니 데이터 디버깅
  useEffect(() => {
    if (cartData) {
      console.log("=== Cart Data Debug ===");
      console.log("Total items:", cartData.items.length);
      console.log("Total price from backend:", cartData.totalPrice);
      cartData.items.forEach((item, idx) => {
        console.log(`Item ${idx}:`, item.dinnerName);
        console.log(`  itemTotalPrice:`, item.itemTotalPrice);
        console.log(`  quantity:`, item.quantity);
        console.log(`  customizations:`, item.customizations);
        item.customizations.forEach((custom, cIdx) => {
          console.log(`    Custom ${cIdx}:`, {
            action: custom.action,
            dishName: custom.dishName,
            quantity: custom.quantity,
            pricePerUnit: custom.pricePerUnit,
            dishId: custom.dishId,
          });
        });
      });
    }
  }, [cartData]);

  // 마운트 시 음성 인식 시작 / 언마운트 시 정리
  useEffect(() => {
    SpeechRecognition.startListening({ continuous: true, language: "ko-KR" });

    return () => {
      SpeechRecognition.stopListening();
    };
  }, []);

  // finalTranscript가 생길 때마다 음성 명령 처리
  useEffect(() => {
    if (!finalTranscript) return;

    let cancelled = false;

    (async () => {
      try {
        setIsProcessing(true);
        const result = await processVoiceCommand(finalTranscript);
        if (cancelled) return;

        setVoiceResult(result);

        // 주문 명령 처리 - 메뉴 상세 모달 열기
        if (
          result.action === "order" &&
          result.dinner_type &&
          menuItems
        ) {
          const itemName = result.dinner_type;
          const targetItem = menuItems.find(
            (item) => item.name.toLowerCase().includes(itemName.toLowerCase())
          );

          if (targetItem) {
            handleMenuClick(targetItem);
            toast({
              title: "음성 인식 성공",
              description: `"${targetItem.name}" 메뉴를 선택했습니다. 옵션을 선택해주세요.`,
              status: "info",
              duration: 2000,
              isClosable: true,
            });
          } else {
            toast({
              title: "메뉴 없음",
              description: `"${itemName}" 메뉴를 찾을 수 없습니다.`,
              status: "warning",
              duration: 3000,
              isClosable: true,
            });
          }
        }

        // 결제 명령 처리
        if (result.action === "checkout") {
          handleCheckout();
        }
      } finally {
        if (!cancelled) setIsProcessing(false);
        resetTranscript();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [finalTranscript, menuItems, toast, resetTranscript]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>브라우저 지원 오류</AlertTitle>
        <AlertDescription>
          이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를
          사용해주세요.
        </AlertDescription>
      </Alert>
    );
  }

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const cartItems = cartData?.items || [];
  const totalPrice = cartData?.totalPrice || 0;

  return (
    <>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box
          bgGradient={useColorModeValue(
            "linear(to-r, brand.50, purple.50)",
            "linear(to-r, gray.800, gray.700)"
          )}
          p={8}
          rounded="2xl"
          shadow="md"
        >
          <HStack justify="space-between" align="start">
            <Box>
              <Heading
                as="h1"
                size="xl"
                mb={2}
                bgGradient="linear(to-r, brand.500, purple.500)"
                bgClip="text"
              >
                메뉴 주문
              </Heading>
              <Text
                color={useColorModeValue("gray.700", "gray.300")}
                fontSize="lg"
                fontWeight="medium"
              >
                음성으로 간편하게 주문하거나, 메뉴를 직접 선택하세요
              </Text>
            </Box>
            <Button
              size="lg"
              colorScheme="green"
              leftIcon={<FaMicrophone />}
              onClick={handleVoiceOrderOpen}
              isDisabled={!menuItems || menuItems.length === 0}
              px={8}
              py={6}
              fontSize="lg"
              fontWeight="bold"
              rounded="xl"
              shadow="lg"
              _hover={{
                transform: "translateY(-2px)",
                shadow: "xl",
              }}
              transition="all 0.2s"
            >
              음성 주문
            </Button>
          </HStack>
        </Box>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* 왼쪽: 음성 인식 & 장바구니 */}
          <VStack spacing={6} align="stretch">
            {/* 음성 인식 섹션 */}
            <Card
              bg={cardBg}
              shadow="xl"
              borderWidth="2px"
              borderColor={listening ? "green.400" : borderColor}
              rounded="2xl"
              transition="all 0.3s"
              _hover={{ shadow: "2xl" }}
            >
              <CardHeader bgGradient={listening ? "linear(to-r, green.50, green.100)" : undefined} roundedTop="2xl">
                <HStack justify="space-between">
                  <HStack>
                    <Icon
                      as={listening ? FaMicrophone : FaMicrophoneSlash}
                      boxSize={6}
                      color={listening ? "green.500" : "gray.400"}
                    />
                    <Heading size="md">음성 명령</Heading>
                  </HStack>
                  {listening && (
                    <Badge colorScheme="green" fontSize="sm" px={3} py={1} rounded="full">
                      ● LIVE
                    </Badge>
                  )}
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <HStack
                    p={3}
                    bg={
                      listening
                        ? useColorModeValue("green.50", "green.900")
                        : useColorModeValue("gray.100", "gray.700")
                    }
                    rounded="md"
                    justify="space-between"
                  >
                    <Text fontWeight="medium">마이크 상태:</Text>
                    <Badge colorScheme={listening ? "green" : "gray"}>
                      {listening ? "켜짐 (말씀하세요...)" : "꺼짐"}
                    </Badge>
                  </HStack>

                  {transcript && (
                    <Box
                      p={4}
                      bg={useColorModeValue("blue.50", "blue.900")}
                      rounded="md"
                    >
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        음성 인식 텍스트:
                      </Text>
                      <Text fontWeight="medium">{transcript}</Text>
                    </Box>
                  )}

                  {isProcessing && (
                    <HStack justify="center" p={4}>
                      <Spinner color="brand.500" />
                      <Text>처리 중...</Text>
                    </HStack>
                  )}

                  {voiceResult && (
                    <Alert status="info" variant="subtle" rounded="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle fontSize="sm">분석 결과</AlertTitle>
                        <AlertDescription fontSize="sm">
                          {voiceResult.reply}
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* 장바구니 섹션 */}
            <Card
              bg={cardBg}
              shadow="xl"
              borderWidth="2px"
              borderColor={cartItems.length > 0 ? "brand.400" : borderColor}
              rounded="2xl"
              transition="all 0.3s"
              _hover={{ shadow: "2xl" }}
            >
              <CardHeader
                bgGradient={cartItems.length > 0 ? "linear(to-r, brand.50, purple.50)" : undefined}
                roundedTop="2xl"
              >
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={FaShoppingCart} color="brand.500" boxSize={6} />
                    <Heading size="md">장바구니</Heading>
                  </HStack>
                  <Badge
                    colorScheme={cartItems.length > 0 ? "brand" : "gray"}
                    fontSize="md"
                    px={3}
                    py={1}
                    rounded="full"
                  >
                    {cartItems.length}개
                  </Badge>
                </HStack>
              </CardHeader>
              <CardBody>
                {isCartLoading ? (
                  <VStack py={8}>
                    <Spinner size="lg" color="brand.500" />
                    <Text>장바구니 로딩 중...</Text>
                  </VStack>
                ) : cartItems.length === 0 ? (
                  <VStack py={8} spacing={3}>
                    <Icon
                      as={FaShoppingCart}
                      boxSize={12}
                      color="gray.300"
                    />
                    <Text color={useColorModeValue("gray.600", "gray.400")}>
                      장바구니가 비어있습니다
                    </Text>
                  </VStack>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {cartItems.map((item) => (
                      <Box
                        key={item.itemId}
                        p={3}
                        bg={useColorModeValue("gray.50", "gray.700")}
                        rounded="md"
                      >
                        <HStack justify="space-between" mb={2}>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">{item.dinnerName}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {item.servingStyleName} ({item.servingStylePrice.toLocaleString()}원)
                            </Text>
                          </VStack>
                          <IconButton
                            aria-label="Remove item"
                            icon={<FaTrash />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => removeItemMutation.mutate(item.itemId)}
                          />
                        </HStack>
                        {item.customizations.length > 0 && (
                          <VStack align="start" spacing={1} mb={2}>
                            {item.customizations.map((custom, idx) => {
                              const customTotal = (custom.quantity || 0) * (custom.pricePerUnit || 0) * (item.quantity || 1);
                              return (
                                <HStack key={idx} justify="space-between" width="100%">
                                  <Text fontSize="xs" color="blue.600">
                                    • {custom.action}: {custom.dishName} (x{custom.quantity})
                                  </Text>
                                  <Text
                                    fontSize="xs"
                                    fontWeight="bold"
                                    color={custom.action === "ADD" ? "green.600" : "red.600"}
                                  >
                                    {custom.action === "ADD" ? "+" : "-"}
                                    {customTotal.toLocaleString()}원
                                  </Text>
                                </HStack>
                              );
                            })}
                          </VStack>
                        )}
                        <HStack justify="space-between">
                          <HStack>
                            <IconButton
                              aria-label="Decrease quantity"
                              icon={<FaMinus />}
                              size="sm"
                              onClick={() =>
                                updateQuantityMutation.mutate({
                                  itemId: item.itemId,
                                  quantity: Math.max(1, item.quantity - 1),
                                })
                              }
                              isDisabled={item.quantity <= 1}
                            />
                            <Text fontWeight="medium" minW="30px" textAlign="center">
                              {item.quantity}
                            </Text>
                            <IconButton
                              aria-label="Increase quantity"
                              icon={<FaPlus />}
                              size="sm"
                              onClick={() =>
                                updateQuantityMutation.mutate({
                                  itemId: item.itemId,
                                  quantity: item.quantity + 1,
                                })
                              }
                            />
                          </HStack>
                          <Text fontWeight="bold" color="brand.500">
                            {(() => {
                              // 커스터마이징 가격 계산
                              const customPrice = item.customizations.reduce((sum, custom) => {
                                const customTotal = (custom.quantity || 0) * (custom.pricePerUnit || 0) * (item.quantity || 1);
                                return custom.action === "ADD" ? sum + customTotal : sum - customTotal;
                              }, 0);
                              const totalWithCustom = (item.itemTotalPrice || 0) + customPrice;
                              return totalWithCustom.toLocaleString();
                            })()}원
                          </Text>
                        </HStack>
                      </Box>
                    ))}
                    <Divider />

                    {/* 회원 등급 할인 정보 */}
                    {userProfile && (
                      <Box p={3} bg="purple.50" rounded="md">
                        <HStack justify="space-between" mb={2}>
                          <HStack>
                            <Icon as={FaCrown} color="purple.500" />
                            <Badge colorScheme={MEMBER_GRADE_CONFIG[userProfile.memberGrade].colorScheme} fontSize="sm">
                              {MEMBER_GRADE_CONFIG[userProfile.memberGrade].label}
                            </Badge>
                          </HStack>
                          {MEMBER_GRADE_CONFIG[userProfile.memberGrade].discountPercent > 0 && (
                            <Badge colorScheme="purple" fontSize="sm">
                              {MEMBER_GRADE_CONFIG[userProfile.memberGrade].discountPercent}% 할인
                            </Badge>
                          )}
                        </HStack>
                        {MEMBER_GRADE_CONFIG[userProfile.memberGrade].discountPercent > 0 && (
                          <Text fontSize="xs" color="purple.600">
                            주문 시 회원 등급 할인이 자동 적용됩니다
                          </Text>
                        )}
                      </Box>
                    )}

                    <VStack align="stretch" spacing={1} p={2}>
                      {(() => {
                        // 모든 아이템의 커스터마이징 가격 합산
                        const totalCustomPrice = cartItems.reduce((sum, item) => {
                          const itemCustomPrice = item.customizations.reduce((customSum, custom) => {
                            const customTotal = (custom.quantity || 0) * (custom.pricePerUnit || 0) * (item.quantity || 1);
                            return custom.action === "ADD" ? customSum + customTotal : customSum - customTotal;
                          }, 0);
                          return sum + itemCustomPrice;
                        }, 0);
                        const originalTotal = (totalPrice || 0) + totalCustomPrice;
                        const discountPercent = userProfile ? MEMBER_GRADE_CONFIG[userProfile.memberGrade].discountPercent : 0;
                        const discountAmount = Math.floor(originalTotal * discountPercent / 100);
                        const finalTotal = originalTotal - discountAmount;

                        return (
                          <>
                            <HStack justify="space-between">
                              <Text fontSize="sm" color="gray.600">상품 금액</Text>
                              <Text fontSize="sm">{originalTotal.toLocaleString()}원</Text>
                            </HStack>
                            {discountAmount > 0 && (
                              <HStack justify="space-between">
                                <HStack>
                                  <Icon as={FaTag} color="purple.500" boxSize={3} />
                                  <Text fontSize="sm" color="purple.600">
                                    등급 할인 ({discountPercent}%)
                                  </Text>
                                </HStack>
                                <Text fontSize="sm" fontWeight="bold" color="purple.600">
                                  -{discountAmount.toLocaleString()}원
                                </Text>
                              </HStack>
                            )}
                            <Divider />
                            <HStack justify="space-between">
                              <Text fontSize="lg" fontWeight="bold">예상 결제 금액</Text>
                              <Text fontSize="xl" fontWeight="bold" color="green.500">
                                {finalTotal.toLocaleString()}원
                              </Text>
                            </HStack>
                          </>
                        );
                      })()}
                    </VStack>
                  </VStack>
                )}
              </CardBody>
              <CardFooter>
                <Button
                  leftIcon={<FaShoppingCart />}
                  bgGradient="linear(to-r, green.400, green.600)"
                  color="white"
                  size="lg"
                  width="100%"
                  onClick={handleCheckout}
                  isDisabled={cartItems.length === 0}
                  _hover={{
                    bgGradient: "linear(to-r, green.500, green.700)",
                    transform: "translateY(-2px)",
                    shadow: "lg",
                  }}
                >
                  주문하기
                </Button>
              </CardFooter>
            </Card>
          </VStack>

          {/* 오른쪽: 메뉴 목록 */}
          <Box>
            <Heading size="md" mb={4}>
              메뉴 목록
            </Heading>
            {isMenuLoading ? (
              <VStack py={12}>
                <Spinner size="xl" color="brand.500" thickness="4px" />
                <Text color={useColorModeValue("gray.600", "gray.400")}>
                  메뉴를 불러오는 중...
                </Text>
              </VStack>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4}>
                {menuItems?.map((item) => {
                  const inCart = cartItems.find((it) => it.dinnerId === item.dinnerId);
                  return (
                    <Card
                      key={item.dinnerId}
                      bg={cardBg}
                      shadow="lg"
                      borderWidth="2px"
                      borderColor={inCart ? "green.400" : borderColor}
                      rounded="2xl"
                      transition="all 0.3s"
                      _hover={{
                        shadow: "2xl",
                        transform: "translateY(-4px)",
                        borderColor: "brand.400",
                      }}
                      cursor="pointer"
                      onClick={() => handleMenuClick(item)}
                      position="relative"
                      overflow="hidden"
                      _before={
                        inCart
                          ? {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              height: "4px",
                              bgGradient: "linear(to-r, green.400, green.600)",
                            }
                          : undefined
                      }
                    >
                      <CardBody p={6}>
                        <HStack justify="space-between" align="start">
                          <VStack align="start" spacing={2} flex={1}>
                            <HStack>
                              <Text fontWeight="bold" fontSize="xl">
                                {item.name}
                              </Text>
                              <Icon as={FaInfoCircle} color="brand.400" boxSize={4} />
                            </HStack>
                            <Text color="gray.500" fontSize="sm">
                              {item.description}
                            </Text>
                            {inCart && (
                              <Badge colorScheme="green" fontSize="sm" px={3} py={1} rounded="full">
                                🛒 장바구니에 담김
                              </Badge>
                            )}
                          </VStack>
                          <VStack align="end" spacing={1}>
                            <Text fontSize="xs" color="gray.500">시작 가격</Text>
                            <Text
                              fontSize="2xl"
                              fontWeight="black"
                              bgGradient="linear(to-r, brand.500, purple.500)"
                              bgClip="text"
                            >
                              {item.basePrice.toLocaleString()}원~
                            </Text>
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  );
                })}
              </SimpleGrid>
            )}
          </Box>
        </SimpleGrid>
      </VStack>

      {/* 메뉴 상세 모달 */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedDinner?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoadingDetails ? (
              <VStack py={8}>
                <Spinner size="xl" color="brand.500" />
                <Text>메뉴 정보 로딩 중...</Text>
              </VStack>
            ) : selectedDinner && (
              <VStack spacing={6} align="stretch">
                <Box>
                  <Text fontWeight="bold" mb={2}>메뉴 설명</Text>
                  <Text color="gray.600">{selectedDinner.description}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>포함된 요리</Text>
                  <VStack align="stretch" spacing={2}>
                    {selectedDinner.dishes.map((dish) => (
                      <HStack key={dish.dishId} p={3} bg="gray.50" rounded="md">
                        <VStack align="start" flex={1}>
                          <Text fontWeight="medium">{dish.name}</Text>
                          <Text fontSize="sm" color="gray.600">{dish.description}</Text>
                        </VStack>
                        <Text fontWeight="bold" color="brand.500">
                          x{dish.defaultQuantity}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                <FormControl isRequired>
                  <FormLabel fontWeight="bold">서빙 스타일 선택</FormLabel>
                  <RadioGroup value={selectedStyleId} onChange={setSelectedStyleId}>
                    <Stack spacing={3}>
                      {selectedDinner.availableStyles.map((style) => (
                        <Radio key={style.styleId} value={style.styleId.toString()}>
                          <HStack>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{style.name}</Text>
                              <Text fontSize="sm" color="gray.600">{style.description}</Text>
                            </VStack>
                            <Text fontWeight="bold" color="brand.500" ml={4}>
                              +{style.additionalPrice.toLocaleString()}원
                            </Text>
                          </HStack>
                        </Radio>
                      ))}
                    </Stack>
                  </RadioGroup>
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="bold">수량</FormLabel>
                  <HStack>
                    <IconButton
                      aria-label="Decrease"
                      icon={<FaMinus />}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      isDisabled={quantity <= 1}
                    />
                    <Text fontWeight="bold" fontSize="lg" minW="40px" textAlign="center">
                      {quantity}
                    </Text>
                    <IconButton
                      aria-label="Increase"
                      icon={<FaPlus />}
                      onClick={() => setQuantity(quantity + 1)}
                    />
                  </HStack>
                </FormControl>

                <Box>
                  <FormLabel fontWeight="bold">구성 품목 수량 조절</FormLabel>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    기본 수량에서 추가하거나 제거할 수 있습니다
                  </Text>
                  <VStack align="stretch" spacing={3}>
                    {selectedDinner.dishes.map((dish) => {
                      const customization = customizations.get(dish.dishId);
                      const defaultQty = dish.defaultQuantity;
                      // 실제 표시되는 수량 = 기본 수량 + (ADD) - (REMOVE)
                      let displayQty = defaultQty;
                      if (customization) {
                        if (customization.action === "ADD") {
                          displayQty = defaultQty + customization.quantity;
                        } else if (customization.action === "REMOVE") {
                          displayQty = defaultQty - customization.quantity;
                        }
                      }

                      const isModified = displayQty !== defaultQty;
                      const priceChange = (displayQty - defaultQty) * dish.basePrice;

                      return (
                        <HStack
                          key={dish.dishId}
                          p={3}
                          bg={isModified ? "brand.50" : "gray.50"}
                          border={isModified ? "2px" : "1px"}
                          borderColor={isModified ? "brand.400" : "gray.200"}
                          rounded="md"
                          justify="space-between"
                        >
                          <VStack align="start" spacing={0} flex={1}>
                            <HStack>
                              <Text fontWeight="medium">{dish.name}</Text>
                              <Badge colorScheme="blue" fontSize="xs">
                                기본 {defaultQty}개
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              {dish.basePrice.toLocaleString()}원/개
                            </Text>
                            {isModified && (
                              <Text
                                fontSize="sm"
                                fontWeight="bold"
                                color={priceChange > 0 ? "green.600" : "red.600"}
                              >
                                {priceChange > 0 ? "+" : ""}
                                {priceChange.toLocaleString()}원
                              </Text>
                            )}
                          </VStack>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="감소"
                              icon={<FaMinus />}
                              size="sm"
                              onClick={() =>
                                handleCustomizationQuantityChange(
                                  dish.dishId,
                                  Math.max(0, displayQty - 1),
                                  defaultQty
                                )
                              }
                              isDisabled={displayQty === 0}
                              colorScheme={displayQty < defaultQty ? "red" : "gray"}
                            />
                            <VStack spacing={0}>
                              <Text fontWeight="bold" minW="30px" textAlign="center">
                                {displayQty}
                              </Text>
                              {isModified && (
                                <Text fontSize="xs" color="gray.500">
                                  ({displayQty > defaultQty ? "+" : ""}
                                  {displayQty - defaultQty})
                                </Text>
                              )}
                            </VStack>
                            <IconButton
                              aria-label="증가"
                              icon={<FaPlus />}
                              size="sm"
                              onClick={() =>
                                handleCustomizationQuantityChange(dish.dishId, displayQty + 1, defaultQty)
                              }
                              colorScheme={displayQty > defaultQty ? "green" : "brand"}
                            />
                          </HStack>
                        </HStack>
                      );
                    })}
                  </VStack>
                </Box>

                <Box p={4} bg="green.50" rounded="md">
                  <HStack justify="space-between">
                    <Text fontWeight="bold">예상 금액:</Text>
                    <Text fontSize="2xl" fontWeight="black" color="green.600">
                      {(() => {
                        const basePrice = selectedDinner.basePrice;
                        const stylePrice = selectedDinner.availableStyles.find(
                          (s) => s.styleId.toString() === selectedStyleId
                        )?.additionalPrice || 0;
                        // 커스터마이징 가격 계산: ADD는 +, REMOVE는 -
                        const customPrice = Array.from(customizations.values()).reduce(
                          (sum, c) => {
                            const dish = selectedDinner.dishes.find((d) => d.dishId === c.dishId);
                            const dishPrice = (dish?.basePrice || 0) * c.quantity;
                            // ADD면 가격 추가, REMOVE면 가격 감소
                            return c.action === "ADD" ? sum + dishPrice : sum - dishPrice;
                          },
                          0
                        );
                        return ((basePrice + stylePrice + customPrice) * quantity).toLocaleString();
                      })()}
                      원
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDetailClose}>
              취소
            </Button>
            <Button
              colorScheme="green"
              onClick={handleAddToCart}
              isLoading={addToCartMutation.isPending}
            >
              장바구니에 추가
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Checkout 모달 */}
      <Modal isOpen={isCheckoutOpen} onClose={onCheckoutClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>주문 확인</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold" mb={2}>주문 내역</Text>
                <VStack align="stretch" spacing={2}>
                  {cartItems.map((item) => {
                    // 커스터마이징 가격 계산
                    const itemCustomPrice = item.customizations.reduce((customSum, custom) => {
                      const customTotal = (custom.quantity || 0) * (custom.pricePerUnit || 0) * (item.quantity || 1);
                      return custom.action === "ADD" ? customSum + customTotal : customSum - customTotal;
                    }, 0);
                    const itemTotalWithCustom = (item.itemTotalPrice || 0) + itemCustomPrice;

                    return (
                      <HStack key={item.itemId} justify="space-between" p={2} bg="gray.50" rounded="md">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">{item.dinnerName}</Text>
                          <Text fontSize="xs" color="gray.600">
                            {item.servingStyleName} x {item.quantity}
                          </Text>
                          {item.customizations.length > 0 && (
                            <Text fontSize="xs" color="blue.600">
                              커스터마이징 포함
                            </Text>
                          )}
                        </VStack>
                        <Text fontWeight="bold">{itemTotalWithCustom.toLocaleString()}원</Text>
                      </HStack>
                    );
                  })}
                  <Divider />

                  {/* 결제 금액 상세 */}
                  <Box p={3} bg="gray.50" rounded="md">
                    <VStack align="stretch" spacing={2}>
                      {(() => {
                        // 모든 아이템의 커스터마이징 가격 합산
                        const totalCustomPrice = cartItems.reduce((sum, item) => {
                          const itemCustomPrice = item.customizations.reduce((customSum, custom) => {
                            const customTotal = (custom.quantity || 0) * (custom.pricePerUnit || 0) * (item.quantity || 1);
                            return custom.action === "ADD" ? customSum + customTotal : customSum - customTotal;
                          }, 0);
                          return sum + itemCustomPrice;
                        }, 0);
                        const originalTotal = (totalPrice || 0) + totalCustomPrice;
                        const discountPercent = userProfile ? MEMBER_GRADE_CONFIG[userProfile.memberGrade].discountPercent : 0;
                        const discountAmount = Math.floor(originalTotal * discountPercent / 100);
                        const finalTotal = originalTotal - discountAmount;

                        return (
                          <>
                            <HStack justify="space-between">
                              <Text fontSize="sm" color="gray.600">상품 금액</Text>
                              <Text fontSize="sm">{originalTotal.toLocaleString()}원</Text>
                            </HStack>

                            {userProfile && discountAmount > 0 && (
                              <HStack justify="space-between">
                                <HStack>
                                  <Icon as={FaTag} color="purple.500" boxSize={3} />
                                  <Text fontSize="sm" color="purple.600">
                                    {MEMBER_GRADE_CONFIG[userProfile.memberGrade].label} 할인 ({discountPercent}%)
                                  </Text>
                                </HStack>
                                <Text fontSize="sm" fontWeight="bold" color="purple.600">
                                  -{discountAmount.toLocaleString()}원
                                </Text>
                              </HStack>
                            )}

                            <Divider />

                            <HStack justify="space-between">
                              <Text fontSize="lg" fontWeight="bold">최종 결제 금액</Text>
                              <Text fontSize="2xl" fontWeight="black" color="green.600">
                                {finalTotal.toLocaleString()}원
                              </Text>
                            </HStack>
                          </>
                        );
                      })()}
                    </VStack>
                  </Box>
                </VStack>
              </Box>

              <FormControl isRequired>
                <FormLabel>배송 주소</FormLabel>
                <Input
                  placeholder="배송받을 주소를 입력하세요"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>희망 배송 일시 (선택사항)</FormLabel>
                <Input
                  type="datetime-local"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  placeholder="배송받을 날짜와 시간을 선택하세요"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCheckoutClose}>
              취소
            </Button>
            <Button
              colorScheme="green"
              onClick={handleConfirmCheckout}
              isLoading={checkoutMutation.isPending}
            >
              주문 확정
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 음성 주문 모달 */}
      <VoiceOrderModal
        isOpen={isVoiceOrderOpen}
        onClose={onVoiceOrderClose}
        customerName={userProfile?.name || "고객"}
        menuItems={menuItems || []}
        menuDetails={menuDetailsCache}
        onOrderComplete={handleVoiceOrderComplete}
      />
    </>
  );
}
