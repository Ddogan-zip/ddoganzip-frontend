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
} from "@chakra-ui/react";

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

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">
          메뉴 주문 (회원용)
        </Heading>

        {/* 음성 인식 섹션 */}
        <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
          <Heading size="lg" mb={4}>
            음성 명령
          </Heading>
          <Text>
            마이크: {listening ? "켜짐 (말씀하세요...)" : "꺼짐"}
          </Text>
          <Text mt={2}>음성 인식 텍스트: {transcript}</Text>
          {isProcessing && <Spinner mt={2} />}
          {voiceResult && (
            <Alert status="info" mt={4} variant="subtle">
              <AlertIcon />
              <Box>
                <AlertTitle>분석 결과:</AlertTitle>
                <AlertDescription>{voiceResult.reply}</AlertDescription>
              </Box>
            </Alert>
          )}
        </Box>

        {/* 장바구니 섹션 */}
        <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
          <Heading size="lg" mb={4}>
            장바구니
          </Heading>
          {cart.length === 0 ? (
            <Text>장바구니가 비어있습니다.</Text>
          ) : (
            <List spacing={3} mb={4}>
              {cart.map((item) => (
                <ListItem
                  key={item.id}
                  display="flex"
                  justifyContent="space-between"
                >
                  <Text>
                    {item.name} x {item.quantity}
                  </Text>
                  <Text fontWeight="bold">
                    {(item.price * item.quantity).toLocaleString()}원
                  </Text>
                </ListItem>
              ))}
              <Divider my={2} />
              <ListItem
                display="flex"
                justifyContent="space-between"
              >
                <Text fontWeight="bold" fontSize="lg">
                  총 금액:
                </Text>
                <Text
                  fontWeight="bold"
                  fontSize="lg"
                  color="green.500"
                >
                  {cart
                    .reduce(
                      (total, item) =>
                        total + item.price * item.quantity,
                      0
                    )
                    .toLocaleString()}
                  원
                </Text>
              </ListItem>
            </List>
          )}
          <Button
            colorScheme="green"
            size="lg"
            width="100%"
            onClick={() => submitOrder(cart)}
            isLoading={isPlacingOrder}
            disabled={isPlacingOrder || cart.length === 0} // ✅
          >
            {isPlacingOrder ? "주문 처리 중..." : "주문하기"}
          </Button>
        </Box>

        {/* 메뉴 목록 섹션 */}
        <Box>
          <Heading size="lg" mb={4}>
            메뉴 목록
          </Heading>
          {isMenuLoading ? (
            <Spinner />
          ) : (
            <List spacing={3}>
              {menuItems?.map((item) => (
                <ListItem
                  key={item.id}
                  p={3}
                  shadow="sm"
                  borderWidth="1px"
                  borderRadius="md"
                >
                  <HStack justifyContent="space-between">
                    <Text fontWeight="medium">{item.name}</Text>
                    <Text color="gray.600">
                      {item.price.toLocaleString()}원
                    </Text>
                  </HStack>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </VStack>
    </Box>
  );
}
