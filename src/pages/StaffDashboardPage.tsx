import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActiveOrders, updateOrderStatus } from "../api/staff";
import type { ActiveOrder, OrderStatus } from "../api/types";
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
import { FaBox, FaClock, FaUser, FaMapMarkerAlt } from "react-icons/fa";

// 상태별 한글 이름과 색상
const STATUS_CONFIG: Record<OrderStatus, { label: string; colorScheme: string }> = {
  CHECKING_STOCK: { label: "재고 확인 중", colorScheme: "yellow" },
  RECEIVED: { label: "주문 접수", colorScheme: "blue" },
  IN_KITCHEN: { label: "조리 중", colorScheme: "purple" },
  DELIVERING: { label: "배달 중", colorScheme: "orange" },
  DELIVERED: { label: "배달 완료", colorScheme: "green" },
  CANCELLED: { label: "취소됨", colorScheme: "red" },
};

// 다음 가능한 상태들
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  CHECKING_STOCK: ["RECEIVED", "CANCELLED"],
  RECEIVED: ["IN_KITCHEN", "CANCELLED"],
  IN_KITCHEN: ["DELIVERING", "CANCELLED"],
  DELIVERING: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export default function StaffDashboardPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");

  const { data: activeOrders, isPending } = useQuery<ActiveOrder[]>({
    queryKey: ["active-orders"],
    queryFn: getActiveOrders,
    refetchInterval: 5000,
  });

  const { mutate: changeOrderStatus, isPending: isUpdatingStatus } =
    useMutation({
      mutationFn: ({ orderId, status }: { orderId: number; status: OrderStatus }) =>
        updateOrderStatus(orderId, { status }),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["active-orders"] });
        toast({
          title: "주문 상태 변경 완료",
          description: `주문 #${variables.orderId}의 상태가 "${
            STATUS_CONFIG[variables.status].label
          }"(으)로 변경되었습니다.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error: any) => {
        toast({
          title: "상태 변경 실패",
          description: error.response?.data?.error?.message || error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      },
    });

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
          👨‍💼 주문 관리 대시보드
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
        >
          <CardBody>
            <Stat>
              <StatLabel fontSize="md" fontWeight="medium">
                🔔 진행 중인 주문
              </StatLabel>
              <StatNumber
                fontSize="4xl"
                fontWeight="black"
                bgGradient="linear(to-r, orange.500, red.500)"
                bgClip="text"
              >
                {activeOrders?.length || 0}
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
      {!isPending && activeOrders && activeOrders.length === 0 && (
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
            진행 중인 주문이 없습니다
          </AlertTitle>
          <AlertDescription maxW="sm">
            새로운 주문이 들어오면 자동으로 표시됩니다.
          </AlertDescription>
        </Alert>
      )}

      {/* Orders List */}
      <VStack spacing={4} align="stretch">
        {activeOrders?.map((order: ActiveOrder) => {
          const statusConfig = STATUS_CONFIG[order.status];
          const nextStatuses = NEXT_STATUSES[order.status];

          return (
            <Card
              key={order.orderId}
              bg={cardBg}
              shadow="xl"
              borderWidth="2px"
              borderColor={`${statusConfig.colorScheme}.400`}
              rounded="2xl"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "6px",
                bgGradient: `linear(to-r, ${statusConfig.colorScheme}.400, ${statusConfig.colorScheme}.600)`,
              }}
            >
              <CardHeader pt={8}>
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={3} flex={1}>
                    <Heading
                      size="lg"
                      bgGradient="linear(to-r, orange.500, red.500)"
                      bgClip="text"
                    >
                      🍽️ 주문 #{order.orderId}
                    </Heading>

                    <VStack align="start" spacing={2} fontSize="sm">
                      <HStack>
                        <Icon as={FaUser} color="gray.500" />
                        <Text fontWeight="medium">{order.customerName}</Text>
                        <Text color="gray.500">({order.customerEmail})</Text>
                      </HStack>

                      <HStack>
                        <Icon as={FaMapMarkerAlt} color="gray.500" />
                        <Text>{order.deliveryAddress}</Text>
                      </HStack>

                      <HStack>
                        <Icon as={FaClock} color="gray.500" />
                        <Text>주문: {new Date(order.orderDate).toLocaleString("ko-KR")}</Text>
                      </HStack>

                      {order.deliveryDate && (
                        <HStack>
                          <Icon as={FaClock} color="orange.500" />
                          <Text fontWeight="medium">
                            희망 배송: {new Date(order.deliveryDate).toLocaleString("ko-KR")}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </VStack>

                  <VStack align="end" spacing={2}>
                    <Badge
                      colorScheme={statusConfig.colorScheme}
                      fontSize="md"
                      px={4}
                      py={2}
                      rounded="full"
                      fontWeight="bold"
                    >
                      {statusConfig.label}
                    </Badge>
                    <Text fontSize="xl" fontWeight="black" color="green.600">
                      {order.totalPrice.toLocaleString()}원
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {order.itemCount}개 품목
                    </Text>
                  </VStack>
                </HStack>
              </CardHeader>

              <Divider />

              <CardFooter pt={6}>
                {nextStatuses.length > 0 ? (
                  <HStack spacing={3} width="100%">
                    {nextStatuses.map((nextStatus) => {
                      const nextConfig = STATUS_CONFIG[nextStatus];
                      return (
                        <Button
                          key={nextStatus}
                          flex={1}
                          size="lg"
                          rounded="full"
                          colorScheme={nextConfig.colorScheme}
                          onClick={() =>
                            changeOrderStatus({ orderId: order.orderId, status: nextStatus })
                          }
                          isDisabled={isUpdatingStatus}
                        >
                          {nextConfig.label}
                        </Button>
                      );
                    })}
                  </HStack>
                ) : (
                  <Text color="gray.500" textAlign="center" width="100%">
                    이 주문은 완료되었습니다.
                  </Text>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </VStack>
    </VStack>
  );
}
