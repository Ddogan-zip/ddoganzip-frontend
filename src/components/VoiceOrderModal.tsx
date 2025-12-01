// 음성 주문 모달 컴포넌트
import { useState, useEffect, useRef, useCallback } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Icon,
  Badge,
  Spinner,
  useColorModeValue,
  Divider,
  Alert,
  AlertIcon,
  useToast,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVolumeUp,
  FaVolumeMute,
  FaShoppingCart,
  FaRobot,
  FaUser,
} from "react-icons/fa";
import type { DinnerMenuItem, DinnerDetail, CartItemRequest, Customization } from "../api/types";
import {
  chatWithAI,
  getInitialGreeting,
  speakText,
  stopSpeaking,
  type ChatMessage,
  type OrderState,
} from "../api/groqService";

// 펄스 애니메이션
const pulseAnimation = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(72, 187, 120, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(72, 187, 120, 0); }
`;

interface VoiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  menuItems: DinnerMenuItem[];
  menuDetails: Map<number, DinnerDetail>;
  onOrderComplete: (order: CartItemRequest, deliveryDate?: string) => void;
}

interface ConversationItem {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function VoiceOrderModal({
  isOpen,
  onClose,
  customerName,
  menuItems,
  menuDetails,
  onOrderComplete,
}: VoiceOrderModalProps) {
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 대화 상태
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [orderState, setOrderState] = useState<OrderState>({
    quantity: 1,
    customizations: [],
    isConfirmed: false,
  });

  // UI 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListeningActive, setIsListeningActive] = useState(false);

  // 음성 인식
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // 모달 열릴 때 초기화 및 인사
  useEffect(() => {
    if (isOpen) {
      // 상태 초기화
      setConversation([]);
      setChatHistory([]);
      setOrderState({
        quantity: 1,
        customizations: [],
        isConfirmed: false,
      });
      setIsProcessing(false);
      setIsSpeaking(false);
      setIsListeningActive(false);
      resetTranscript();

      // 초기 인사
      const greeting = getInitialGreeting(customerName);
      setConversation([
        { role: "assistant", content: greeting, timestamp: new Date() },
      ]);

      // 음성 출력
      if (!isMuted) {
        setIsSpeaking(true);
        speakText(greeting, () => {
          setIsSpeaking(false);
          // 인사 후 자동으로 마이크 시작
          startListening();
        });
      } else {
        // 음소거 상태면 바로 마이크 시작
        startListening();
      }
    } else {
      // 모달 닫힐 때 정리
      SpeechRecognition.stopListening();
      stopSpeaking();
    }
  }, [isOpen, customerName, isMuted]);

  // 음성 인식 시작
  const startListening = useCallback(() => {
    resetTranscript();
    setIsListeningActive(true);
    SpeechRecognition.startListening({ language: "ko-KR", continuous: false });
  }, [resetTranscript]);

  // 음성 인식 중지
  const stopListening = useCallback(() => {
    setIsListeningActive(false);
    SpeechRecognition.stopListening();
  }, []);

  // 음성 인식 완료 처리
  useEffect(() => {
    // listening이 false가 되고, transcript가 있으면 처리
    if (!listening && transcript && isListeningActive && !isProcessing) {
      processUserInput(transcript);
    }
  }, [listening, transcript, isListeningActive, isProcessing]);

  // 사용자 입력 처리
  const processUserInput = async (userText: string) => {
    if (!userText.trim()) {
      startListening();
      return;
    }

    setIsListeningActive(false);
    setIsProcessing(true);
    resetTranscript();

    // 사용자 메시지 추가
    const userMessage: ConversationItem = {
      role: "user",
      content: userText,
      timestamp: new Date(),
    };
    setConversation((prev) => [...prev, userMessage]);

    // AI에게 보낼 메시지 히스토리 업데이트
    const newChatHistory: ChatMessage[] = [
      ...chatHistory,
      { role: "user" as const, content: userText },
    ];
    setChatHistory(newChatHistory);

    try {
      // AI 응답 받기
      const response = await chatWithAI(
        newChatHistory,
        customerName,
        menuItems,
        menuDetails
      );

      // 어시스턴트 메시지 추가
      const assistantMessage: ConversationItem = {
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
      };
      setConversation((prev) => [...prev, assistantMessage]);

      // 채팅 히스토리 업데이트
      setChatHistory([
        ...newChatHistory,
        { role: "assistant" as const, content: response.message },
      ]);

      // 주문 상태 업데이트
      setOrderState(response.orderState);

      // 음성 출력
      if (!isMuted) {
        setIsSpeaking(true);
        speakText(response.message, () => {
          setIsSpeaking(false);
          // 주문 확정이 아니면 다시 마이크 시작
          if (response.action !== "confirm" && response.action !== "cancel") {
            startListening();
          }
        });
      } else {
        // 음소거 상태면 바로 다음 동작
        if (response.action !== "confirm" && response.action !== "cancel") {
          startListening();
        }
      }

      // 액션 처리
      if (response.action === "confirm") {
        handleOrderConfirm(response.orderState);
      } else if (response.action === "cancel") {
        toast({
          title: "주문 취소",
          description: "음성 주문이 취소되었습니다.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        onClose();
      }
    } catch (error) {
      console.error("AI 응답 오류:", error);
      const errorMessage = "죄송합니다. 일시적인 오류가 발생했습니다. 다시 말씀해주세요.";
      setConversation((prev) => [
        ...prev,
        { role: "assistant", content: errorMessage, timestamp: new Date() },
      ]);

      if (!isMuted) {
        setIsSpeaking(true);
        speakText(errorMessage, () => {
          setIsSpeaking(false);
          startListening();
        });
      } else {
        startListening();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 주문 확정 처리
  const handleOrderConfirm = (state: OrderState) => {
    if (!state.dinnerId || !state.servingStyleId) {
      toast({
        title: "주문 정보 부족",
        description: "디너와 서빙 스타일을 선택해주세요.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // 커스터마이징을 API 형식으로 변환
    const customizations: Customization[] = state.customizations.map((c) => ({
      action: c.action,
      dishId: c.dishId,
      quantity: c.quantity,
    }));

    const orderRequest: CartItemRequest = {
      dinnerId: state.dinnerId,
      servingStyleId: state.servingStyleId,
      quantity: state.quantity,
      customizations: customizations.length > 0 ? customizations : undefined,
    };

    onOrderComplete(orderRequest, state.deliveryDate);
    onClose();
  };

  // 마이크 토글
  const toggleMicrophone = () => {
    if (listening || isListeningActive) {
      stopListening();
    } else {
      startListening();
    }
  };

  // 음소거 토글
  const toggleMute = () => {
    if (!isMuted) {
      stopSpeaking();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  const bgColor = useColorModeValue("white", "gray.800");
  const userBubbleBg = useColorModeValue("blue.100", "blue.800");
  const assistantBubbleBg = useColorModeValue("gray.100", "gray.700");

  if (!browserSupportsSpeechRecognition) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>브라우저 지원 오류</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="error">
              <AlertIcon />
              이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.
            </Alert>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>닫기</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent maxH="80vh" bg={bgColor}>
        <ModalHeader>
          <HStack justify="space-between">
            <HStack>
              <Icon as={FaMicrophone} color="green.500" />
              <Text>음성 주문</Text>
            </HStack>
            <HStack spacing={2}>
              {listening && (
                <Badge colorScheme="green" fontSize="sm" px={3} py={1} rounded="full">
                  LIVE
                </Badge>
              )}
              {isSpeaking && (
                <Badge colorScheme="purple" fontSize="sm" px={3} py={1} rounded="full">
                  <HStack spacing={1}>
                    <Icon as={FaVolumeUp} boxSize={3} />
                    <Text>재생 중</Text>
                  </HStack>
                </Badge>
              )}
              {isProcessing && (
                <Badge colorScheme="orange" fontSize="sm" px={3} py={1} rounded="full">
                  <HStack spacing={1}>
                    <Spinner size="xs" />
                    <Text>처리 중</Text>
                  </HStack>
                </Badge>
              )}
            </HStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch" h="400px">
            {/* 대화 내용 */}
            <Box
              flex={1}
              overflowY="auto"
              p={4}
              bg={useColorModeValue("gray.50", "gray.900")}
              rounded="xl"
            >
              <VStack spacing={3} align="stretch">
                {conversation.map((item, index) => (
                  <HStack
                    key={index}
                    justify={item.role === "user" ? "flex-end" : "flex-start"}
                  >
                    {item.role === "assistant" && (
                      <Icon as={FaRobot} color="green.500" boxSize={5} />
                    )}
                    <Box
                      maxW="80%"
                      p={3}
                      rounded="xl"
                      bg={item.role === "user" ? userBubbleBg : assistantBubbleBg}
                      roundedBottomRight={item.role === "user" ? "none" : "xl"}
                      roundedBottomLeft={item.role === "assistant" ? "none" : "xl"}
                    >
                      <Text fontSize="md">{item.content}</Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {item.timestamp.toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </Box>
                    {item.role === "user" && (
                      <Icon as={FaUser} color="blue.500" boxSize={5} />
                    )}
                  </HStack>
                ))}
                <div ref={messagesEndRef} />
              </VStack>
            </Box>

            {/* 현재 인식 중인 텍스트 */}
            {transcript && (
              <Box p={3} bg="blue.50" rounded="md">
                <Text fontSize="sm" color="blue.600" fontWeight="medium">
                  인식 중: {transcript}
                </Text>
              </Box>
            )}

            {/* 주문 상태 요약 */}
            {(orderState.dinnerName || orderState.servingStyle) && (
              <Box p={3} bg="green.50" rounded="md">
                <Text fontSize="sm" fontWeight="bold" color="green.700" mb={1}>
                  현재 주문 내용
                </Text>
                <VStack align="start" spacing={0}>
                  {orderState.dinnerName && (
                    <Text fontSize="sm">디너: {orderState.dinnerName}</Text>
                  )}
                  {orderState.servingStyle && (
                    <Text fontSize="sm">스타일: {orderState.servingStyle}</Text>
                  )}
                  {orderState.quantity > 1 && (
                    <Text fontSize="sm">수량: {orderState.quantity}</Text>
                  )}
                  {orderState.customizations.length > 0 && (
                    <Text fontSize="sm">
                      변경: {orderState.customizations.map((c) => `${c.dishName} ${c.quantity}개`).join(", ")}
                    </Text>
                  )}
                  {orderState.deliveryDate && (
                    <Text fontSize="sm">배송일: {orderState.deliveryDate}</Text>
                  )}
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <Divider />

        <ModalFooter>
          <HStack spacing={4} w="100%" justify="space-between">
            <HStack spacing={2}>
              {/* 음소거 버튼 */}
              <Button
                size="lg"
                variant={isMuted ? "solid" : "outline"}
                colorScheme={isMuted ? "red" : "gray"}
                onClick={toggleMute}
                leftIcon={isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              >
                {isMuted ? "음소거" : "스피커"}
              </Button>
            </HStack>

            {/* 마이크 버튼 */}
            <Button
              size="lg"
              w="150px"
              h="60px"
              colorScheme={listening ? "green" : "gray"}
              onClick={toggleMicrophone}
              isDisabled={isProcessing || isSpeaking}
              leftIcon={listening ? <FaMicrophone /> : <FaMicrophoneSlash />}
              animation={listening ? `${pulseAnimation} 2s infinite` : undefined}
              _hover={{
                transform: "scale(1.05)",
              }}
            >
              {listening ? "듣는 중..." : "말하기"}
            </Button>

            <HStack spacing={2}>
              {/* 취소 버튼 */}
              <Button variant="ghost" onClick={onClose}>
                취소
              </Button>

              {/* 수동 주문 버튼 (주문 정보가 있을 때만) */}
              {orderState.dinnerId && orderState.servingStyleId && (
                <Button
                  colorScheme="green"
                  leftIcon={<FaShoppingCart />}
                  onClick={() => handleOrderConfirm(orderState)}
                >
                  주문 확정
                </Button>
              )}
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
