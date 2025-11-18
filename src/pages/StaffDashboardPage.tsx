import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LegacyOrder } from "../api/orders";
import { getPendingOrders, updateOrderStatus } from "../api/orders";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  useToast,
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
} from "@chakra-ui/react";
import { FaCheckCircle, FaTimesCircle, FaBox, FaClock } from "react-icons/fa";
import { useEffect } from "react";

export default function StaffDashboardPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const { data: pendingOrders, isPending } = useQuery<LegacyOrder[]>({
    queryKey: ["pending-orders"],
    queryFn: getPendingOrders,
    refetchInterval: 5000,
  });

  const { mutate: changeOrderStatus, isPending: isUpdatingStatus } =
    useMutation({
      mutationFn: updateOrderStatus,
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["pending-orders"] });
        toast({
          title: "주문 상태 변경 완료",
          description: `주문 #${variables.orderId}이(가) ${
            variables.status === "accepted" ? "수락" : "거절"
          }되었습니다.`,
          status: variables.status === "accepted" ? "success" : "info",
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error) => {
        toast({
          title: "상태 변경 실패",
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      },
    });

  // 새 주문 알림
  useEffect(() => {
    if (pendingOrders && pendingOrders.length > 0) {
      const latestOrder = pendingOrders[0];
      toast({
        title: "새로운 주문",
        description: `주문 #${latestOrder.id}이(가) 접수되었습니다.`,
        status: "info",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    }
  }, [pendingOrders?.length]);

  return (
    <VStack spacing={8} align="stretch">
      {/* Header */}
      <Box
        bgGradient={useColorModeValue(
          "linear(to-r, orange.50, red.50)",
          "linear(to-r, gray.800, gray.700)"
        )}
        p={8}
        rounded="2xl"
        shadow="xl"
      >
        <Heading
          size="2xl"
          mb={3}
          bgGradient="linear(to-r, orange.500, red.500)"
          bgClip="text"
        >
          👨‍💼 주문 대시보드
        </Heading>
        <HStack spacing={2} align="center">
          <Icon as={FaClock} color="green.500" boxSize={5} />
          <Text
            color={useColorModeValue("gray.700", "gray.300")}
            fontSize="lg"
            fontWeight="medium"
          >
            5초마다 자동으로 새로운 주문을 확인합니다
          </Text>
        </HStack>
      </Box>

      {/* Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Card
          bg={cardBg}
          shadow="xl"
          borderWidth="2px"
          borderColor="orange.400"
          rounded="2xl"
          transition="all 0.3s"
          _hover={{ shadow: "2xl", transform: "translateY(-4px)" }}
        >
          <CardBody>
            <Stat>
              <StatLabel fontSize="md" fontWeight="medium">
                🔔 대기 중인 주문
              </StatLabel>
              <StatNumber
                fontSize="4xl"
                fontWeight="black"
                bgGradient="linear(to-r, orange.500, red.500)"
                bgClip="text"
              >
                {pendingOrders?.length || 0}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card
          bg={cardBg}
          shadow="xl"
          borderWidth="2px"
          borderColor="green.400"
          rounded="2xl"
          transition="all 0.3s"
          _hover={{ shadow: "2xl", transform: "translateY(-4px)" }}
        >
          <CardBody>
            <Stat>
              <StatLabel fontSize="md" fontWeight="medium">
                🔄 자동 새로고침
              </StatLabel>
              <StatNumber fontSize="2xl" mt={2}>
                <Badge colorScheme="green" fontSize="lg" px={4} py={2} rounded="full">
                  ● 활성
                </Badge>
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card
          bg={cardBg}
          shadow="xl"
          borderWidth="2px"
          borderColor={isPending ? "yellow.400" : "green.400"}
          rounded="2xl"
          transition="all 0.3s"
          _hover={{ shadow: "2xl", transform: "translateY(-4px)" }}
        >
          <CardBody>
            <Stat>
              <StatLabel fontSize="md" fontWeight="medium">
                📡 시스템 상태
              </StatLabel>
              <StatNumber fontSize="2xl" mt={2}>
                {isPending ? (
                  <Badge colorScheme="yellow" fontSize="lg" px={4} py={2} rounded="full">
                    ⏳ 로딩 중
                  </Badge>
                ) : (
                  <Badge colorScheme="green" fontSize="lg" px={4} py={2} rounded="full">
                    ✓ 온라인
                  </Badge>
                )}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Loading State */}
      {isPending && (
        <Box textAlign="center" py={8}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text mt={4} color={useColorModeValue("gray.600", "gray.400")}>
            주문 목록을 불러오는 중...
          </Text>
        </Box>
      )}

      {/* Update Status Indicator */}
      {isUpdatingStatus && (
        <Alert status="info" variant="subtle">
          <AlertIcon />
          <AlertTitle>처리 중</AlertTitle>
          <AlertDescription>주문 상태를 업데이트하는 중...</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isPending && pendingOrders && pendingOrders.length === 0 && (
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          minH="200px"
          rounded="lg"
        >
          <Icon as={FaBox} boxSize={12} color="brand.500" mb={4} />
          <AlertTitle fontSize="lg" mb={2}>
            대기 중인 주문이 없습니다
          </AlertTitle>
          <AlertDescription maxW="sm">
            새로운 주문이 들어오면 자동으로 표시됩니다.
          </AlertDescription>
        </Alert>
      )}

      {/* Orders List */}
      <VStack spacing={4} align="stretch">
        {pendingOrders?.map((order: LegacyOrder) => (
          <Card
            key={order.id}
            bg={cardBg}
            shadow="xl"
            borderWidth="2px"
            borderColor="yellow.400"
            rounded="2xl"
            transition="all 0.3s"
            _hover={{ shadow: "2xl", transform: "translateY(-2px)" }}
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "6px",
              bgGradient: "linear(to-r, yellow.400, orange.400)",
            }}
          >
            <CardHeader pt={8}>
              <HStack justify="space-between">
                <VStack align="start" spacing={2}>
                  <Heading
                    size="lg"
                    bgGradient="linear(to-r, orange.500, red.500)"
                    bgClip="text"
                  >
                    🍽️ 주문 #{order.id}
                  </Heading>
                  <HStack>
                    <Icon as={FaClock} color="gray.500" boxSize={4} />
                    <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
                      {new Date(order.createdAt).toLocaleString("ko-KR")}
                    </Text>
                  </HStack>
                </VStack>
                <Badge
                  colorScheme="yellow"
                  fontSize="md"
                  px={4}
                  py={2}
                  rounded="full"
                  fontWeight="bold"
                >
                  ⏳ 대기중
                </Badge>
              </HStack>
            </CardHeader>

            <Divider />

            <CardBody>
              <VStack align="stretch" spacing={2}>
                <Text fontWeight="semibold" mb={2}>
                  주문 내역:
                </Text>
                {order.items.map((item, index) => (
                  <HStack
                    key={index}
                    justify="space-between"
                    p={2}
                    bg={useColorModeValue("gray.50", "gray.700")}
                    rounded="md"
                  >
                    <Text>
                      {item.name} x {item.quantity}
                    </Text>
                    <Text fontWeight="medium">
                      {(item.price * item.quantity).toLocaleString()}원
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </CardBody>

            <Divider />

            <CardFooter pt={6}>
              <HStack spacing={4} width="100%">
                <Button
                  leftIcon={<FaCheckCircle />}
                  bgGradient="linear(to-r, green.400, green.600)"
                  color="white"
                  flex={1}
                  size="lg"
                  rounded="full"
                  onClick={() =>
                    changeOrderStatus({ orderId: order.id, status: "accepted" })
                  }
                  isDisabled={isUpdatingStatus}
                  _hover={{
                    bgGradient: "linear(to-r, green.500, green.700)",
                    transform: "translateY(-2px)",
                    shadow: "xl",
                  }}
                  _active={{
                    transform: "translateY(0)",
                  }}
                  shadow="md"
                >
                  ✅ 수락
                </Button>
                <Button
                  leftIcon={<FaTimesCircle />}
                  variant="outline"
                  borderColor="red.400"
                  borderWidth="2px"
                  color="red.500"
                  flex={1}
                  size="lg"
                  rounded="full"
                  onClick={() =>
                    changeOrderStatus({ orderId: order.id, status: "rejected" })
                  }
                  isDisabled={isUpdatingStatus}
                  _hover={{
                    bg: useColorModeValue("red.50", "red.900"),
                    borderColor: "red.500",
                    transform: "translateY(-2px)",
                    shadow: "xl",
                  }}
                  _active={{
                    transform: "translateY(0)",
                  }}
                >
                  ❌ 거절
                </Button>
              </HStack>
            </CardFooter>
          </Card>
        ))}
      </VStack>
    </VStack>
  );
}
