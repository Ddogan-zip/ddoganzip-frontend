import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { getMenuItems } from "../api/menu";
import type { CartItem } from "../api/orders";
import { placeOrder } from "../api/orders";
import type { VoiceCommand } from "../api/voice";
import { processVoiceCommand } from "../api/voice";
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

export default function MenuOrderPage() {
  // 타입 명시하면 menuItems도 자동으로 MenuItem[]로 추론됨
  const { data: menuItems, isPending: isMenuLoading } = useQuery({
    queryKey: ["menu-items"],
    queryFn: getMenuItems,
  });

  // ✅ 장바구니는 배열 + 초기값 []
  const [cart, setCart] = useState<CartItem[]>([]);
  // ✅ 음성 결과 상태
  const [voiceResult, setVoiceResult] = useState<VoiceCommand | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  const { mutate: submitOrder, isPending: isPlacingOrder } = useMutation({
    mutationFn: placeOrder,
    onSuccess: () => {
      toast({
        title: "주문 완료",
        description: "주문이 성공적으로 접수되었습니다.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setCart([]); // ✅ 장바구니 비우기
    },
    onError: (error) => {
      toast({
        title: "주문 실패",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

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
                (it) => it.id === targetItem.id
              );
              if (existing) {
                return prevCart.map((it) =>
                  it.id === targetItem.id
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
          if (cart.length > 0) {
            submitOrder(cart);
          } else {
            toast({
              title: "장바구니 비어있음",
              description: "장바구니가 비어있어 결제할 수 없습니다.",
              status: "info",
              duration: 3000,
              isClosable: true,
            });
          }
        }
      } finally {
        if (!cancelled) setIsProcessing(false);
        resetTranscript();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [finalTranscript, menuItems, cart, submitOrder, toast, resetTranscript]);
  // 여기 deps는 eslint 기준 맞추려면 이렇게, 
  // 사실 cart는 빼고 finalTranscript, menuItems 정도만 두는 것도 가능함(로직에 따라 조정)

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

  const removeFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <VStack spacing={8} align="stretch">
      {/* Header */}
      <Box>
        <Heading as="h1" size="xl" mb={2}>
          메뉴 주문
        </Heading>
        <Text color={useColorModeValue("gray.600", "gray.400")}>
          음성으로 간편하게 주문하거나, 메뉴를 직접 선택하세요
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
        {/* 왼쪽: 음성 인식 & 장바구니 */}
        <VStack spacing={6} align="stretch">
          {/* 음성 인식 섹션 */}
          <Card bg={cardBg} shadow="lg" borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">음성 명령</Heading>
                <Icon
                  as={listening ? FaMicrophone : FaMicrophoneSlash}
                  boxSize={6}
                  color={listening ? "green.500" : "gray.400"}
                />
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
          <Card bg={cardBg} shadow="lg" borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <HStack justify="space-between">
                <HStack>
                  <Icon as={FaShoppingCart} color="brand.500" />
                  <Heading size="md">장바구니</Heading>
                </HStack>
                <Badge colorScheme="brand" fontSize="md" px={2} py={1}>
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
                  {cart.map((item) => (
                    <Box
                      key={item.id}
                      p={3}
                      bg={useColorModeValue("gray.50", "gray.700")}
                      rounded="md"
                    >
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="medium">{item.name}</Text>
                        <IconButton
                          aria-label="Remove item"
                          icon={<FaTrash />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id)}
                        />
                      </HStack>
                      <HStack justify="space-between">
                        <HStack>
                          <IconButton
                            aria-label="Decrease quantity"
                            icon={<FaMinus />}
                            size="sm"
                            onClick={() => updateQuantity(item.id, -1)}
                          />
                          <Text fontWeight="medium" minW="30px" textAlign="center">
                            {item.quantity}
                          </Text>
                          <IconButton
                            aria-label="Increase quantity"
                            icon={<FaPlus />}
                            size="sm"
                            onClick={() => updateQuantity(item.id, 1)}
                          />
                        </HStack>
                        <Text fontWeight="bold" color="brand.500">
                          {(item.price * item.quantity).toLocaleString()}원
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
                colorScheme="green"
                size="lg"
                width="100%"
                onClick={() => submitOrder(cart)}
                isLoading={isPlacingOrder}
                isDisabled={isPlacingOrder || cart.length === 0}
              >
                {isPlacingOrder ? "주문 처리 중..." : "주문하기"}
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
              {menuItems?.map((item) => (
                <Card
                  key={item.id}
                  bg={cardBg}
                  shadow="md"
                  borderWidth="1px"
                  borderColor={borderColor}
                  transition="all 0.3s"
                  _hover={{
                    shadow: "xl",
                    transform: "translateY(-2px)",
                  }}
                  cursor="pointer"
                  onClick={() => {
                    const existing = cart.find((it) => it.id === item.id);
                    if (existing) {
                      updateQuantity(item.id, 1);
                    } else {
                      setCart((prev) => [...prev, { ...item, quantity: 1 }]);
                    }
                    toast({
                      title: "장바구니에 추가",
                      description: `${item.name}이(가) 추가되었습니다.`,
                      status: "success",
                      duration: 1500,
                      isClosable: true,
                      position: "bottom-right",
                    });
                  }}
                >
                  <CardBody>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" fontSize="lg">
                          {item.name}
                        </Text>
                        <Badge colorScheme="brand">주문 가능</Badge>
                      </VStack>
                      <VStack align="end" spacing={1}>
                        <Text
                          fontSize="xl"
                          fontWeight="bold"
                          color="brand.500"
                        >
                          {item.price.toLocaleString()}원
                        </Text>
                        {cart.find((it) => it.id === item.id) && (
                          <Badge colorScheme="green">
                            장바구니에 {cart.find((it) => it.id === item.id)?.quantity}개
                          </Badge>
                        )}
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </SimpleGrid>
    </VStack>
  );
}
