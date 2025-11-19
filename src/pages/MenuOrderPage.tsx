import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { getMenuList, getMenuDetails } from "../api/menu";
import type { DinnerMenuItem, DinnerDetail, Customization } from "../api/types";
import type { VoiceCommand } from "../api/voice";
import { processVoiceCommand } from "../api/voice";
import MenuDetailModal from "../components/MenuDetailModal";
import {
  Box,
  Button,
  Heading,
  Text,
  Spinner,
  VStack,
  HStack,
  List,
  ListItem,
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
} from "@chakra-ui/react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaShoppingCart,
  FaTrash,
  FaPlus,
  FaMinus,
} from "react-icons/fa";

// 장바구니 아이템 타입 (DinnerMenuItem + quantity + serving style + customizations)
interface CartItemLocal extends DinnerMenuItem {
  quantity: number;
  servingStyleId: number;
  servingStyleName: string;
  servingStylePrice: number;
  customizations: Customization[];
}

export default function MenuOrderPage() {
  // 실제 백엔드 API 사용 (DinnerMenuItem 반환)
  const { data: menuItems, isPending: isMenuLoading } = useQuery({
    queryKey: ["menu-items"],
    queryFn: getMenuList,
  });

  // 장바구니는 배열 + 초기값 []
  const [cart, setCart] = useState<CartItemLocal[]>([]);
  // 음성 결과 상태
  const [voiceResult, setVoiceResult] = useState<VoiceCommand | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // 메뉴 상세 모달 상태
  const [selectedMenuDetail, setSelectedMenuDetail] = useState<DinnerDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const toast = useToast();

  // 주문하기 기능 (추후 실제 checkout API 연동)
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "장바구니 비어있음",
        description: "장바구니가 비어있어 주문할 수 없습니다.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // TODO: 실제 checkout API 호출
    // const orderId = await checkout({
    //   deliveryAddress: "...",
    //   paymentMethod: "CREDIT_CARD"
    // });

    toast({
      title: "주문 완료",
      description: `${cart.length}개 아이템이 주문되었습니다.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    setCart([]); // 장바구니 비우기
  };

  const {
    transcript,
    listening,
    finalTranscript,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  // 마운트 시 음성 인식 시작 / 언마운트 시 정리
  useEffect(() => {
    SpeechRecognition.startListening({ continuous: true, language: "ko-KR" });

    return () => {
      SpeechRecognition.stopListening();
    };
  }, []); // ✅

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

        // 주문 명령 처리
        if (
          result.action === "order" &&
          result.dinner_type &&
          result.quantity
        ) {
          const itemName = result.dinner_type;
          const quantity = result.quantity;
          const targetItem = menuItems?.find(
            (item) => item.name.toLowerCase() === itemName.toLowerCase()
          );

          if (targetItem) {
            setCart((prevCart) => {
              const existing = prevCart.find(
                (it) => it.dinnerId === targetItem.dinnerId
              );
              if (existing) {
                return prevCart.map((it) =>
                  it.dinnerId === targetItem.dinnerId
                    ? { ...it, quantity: it.quantity + quantity }
                    : it
                );
              }
              return [...prevCart, { ...targetItem, quantity }];
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

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item, i) =>
          i === index
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // 메뉴 클릭 시 상세 정보 불러오기
  const handleMenuClick = async (dinnerId: number) => {
    setIsLoadingDetail(true);
    try {
      const detail = await getMenuDetails(dinnerId);
      setSelectedMenuDetail(detail);
      setIsModalOpen(true);
    } catch (error) {
      toast({
        title: "메뉴 상세 정보 로드 실패",
        description: "메뉴 상세 정보를 불러올 수 없습니다.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 모달에서 장바구니에 추가
  const handleAddToCartFromModal = (
    dinnerId: number,
    servingStyleId: number,
    quantity: number,
    customizations: Customization[]
  ) => {
    if (!selectedMenuDetail) return;

    const servingStyle = selectedMenuDetail.availableStyles.find(
      (s) => s.styleId === servingStyleId
    );
    if (!servingStyle) return;

    const newItem: CartItemLocal = {
      ...selectedMenuDetail,
      quantity,
      servingStyleId,
      servingStyleName: servingStyle.name,
      servingStylePrice: servingStyle.additionalPrice,
      customizations,
    };

    setCart((prev) => [...prev, newItem]);

    toast({
      title: "✅ 장바구니에 추가",
      description: `${selectedMenuDetail.name} (${servingStyle.name})이(가) 추가되었습니다.`,
      status: "success",
      duration: 1500,
      isClosable: true,
      position: "bottom-right",
    });
  };

  const totalPrice = cart.reduce(
    (total, item) => total + (item.basePrice + item.servingStylePrice) * item.quantity,
    0
  );

  return (
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
        <Heading
          as="h1"
          size="xl"
          mb={2}
          bgGradient="linear(to-r, brand.500, purple.500)"
          bgClip="text"
        >
          🎤 메뉴 주문
        </Heading>
        <Text
          color={useColorModeValue("gray.700", "gray.300")}
          fontSize="lg"
          fontWeight="medium"
        >
          음성으로 간편하게 주문하거나, 메뉴를 직접 선택하세요
        </Text>
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
            borderColor={cart.length > 0 ? "brand.400" : borderColor}
            rounded="2xl"
            transition="all 0.3s"
            _hover={{ shadow: "2xl" }}
          >
            <CardHeader
              bgGradient={cart.length > 0 ? "linear(to-r, brand.50, purple.50)" : undefined}
              roundedTop="2xl"
            >
              <HStack justify="space-between">
                <HStack>
                  <Icon as={FaShoppingCart} color="brand.500" boxSize={6} />
                  <Heading size="md">장바구니</Heading>
                </HStack>
                <Badge
                  colorScheme={cart.length > 0 ? "brand" : "gray"}
                  fontSize="md"
                  px={3}
                  py={1}
                  rounded="full"
                >
                  {cart.length}개
                </Badge>
              </HStack>
            </CardHeader>
            <CardBody>
              {cart.length === 0 ? (
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
                  {cart.map((item, index) => (
                    <Box
                      key={`${item.dinnerId}-${index}`}
                      p={3}
                      bg={useColorModeValue("gray.50", "gray.700")}
                      rounded="md"
                    >
                      <HStack justify="space-between" mb={2}>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{item.name}</Text>
                          <Badge colorScheme="purple" fontSize="xs">
                            {item.servingStyleName}
                          </Badge>
                          {item.customizations.length > 0 && (
                            <Text fontSize="xs" color="gray.500">
                              커스터마이징 {item.customizations.length}개
                            </Text>
                          )}
                        </VStack>
                        <IconButton
                          aria-label="Remove item"
                          icon={<FaTrash />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => removeFromCart(index)}
                        />
                      </HStack>
                      <HStack justify="space-between">
                        <HStack>
                          <IconButton
                            aria-label="Decrease quantity"
                            icon={<FaMinus />}
                            size="sm"
                            onClick={() => updateQuantity(index, -1)}
                          />
                          <Text fontWeight="medium" minW="30px" textAlign="center">
                            {item.quantity}
                          </Text>
                          <IconButton
                            aria-label="Increase quantity"
                            icon={<FaPlus />}
                            size="sm"
                            onClick={() => updateQuantity(index, 1)}
                          />
                        </HStack>
                        <Text fontWeight="bold" color="brand.500">
                          {((item.basePrice + item.servingStylePrice) * item.quantity).toLocaleString()}원
                        </Text>
                      </HStack>
                    </Box>
                  ))}
                  <Divider />
                  <HStack justify="space-between" p={2}>
                    <Text fontSize="lg" fontWeight="bold">
                      총 금액:
                    </Text>
                    <Text fontSize="xl" fontWeight="bold" color="green.500">
                      {totalPrice.toLocaleString()}원
                    </Text>
                  </HStack>
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
                isDisabled={cart.length === 0}
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
                const cartItems = cart.filter((it) => it.dinnerId === item.dinnerId);
                const inCart = cartItems.length > 0;
                const totalInCart = cartItems.reduce((sum, it) => sum + it.quantity, 0);
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
                    onClick={() => handleMenuClick(item.dinnerId)}
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
                            <Badge colorScheme="green" rounded="full" px={2}>
                              ✓ 주문 가능
                            </Badge>
                          </HStack>
                          <Text color="gray.500" fontSize="sm">
                            {item.description}
                          </Text>
                          {inCart && (
                            <Badge colorScheme="green" fontSize="sm" px={3} py={1} rounded="full">
                              🛒 장바구니에 {totalInCart}개
                            </Badge>
                          )}
                        </VStack>
                        <VStack align="end" spacing={1}>
                          <Text
                            fontSize="2xl"
                            fontWeight="black"
                            bgGradient="linear(to-r, brand.500, purple.500)"
                            bgClip="text"
                          >
                            {item.basePrice.toLocaleString()}원
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

      {/* Menu Detail Modal */}
      <MenuDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        menuDetail={selectedMenuDetail}
        onAddToCart={handleAddToCartFromModal}
      />
    </VStack>
  );
}
