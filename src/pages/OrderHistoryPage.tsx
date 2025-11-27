import { useQuery } from "@tanstack/react-query";
import { getOrderHistory, getOrderDetails } from "../api/orders";
import type { Order, OrderDetail } from "../api/types";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Alert,
  AlertTitle,
  AlertDescription,
  Card,
  CardHeader,
  CardBody,
  Divider,
  useColorModeValue,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  SimpleGrid,
} from "@chakra-ui/react";
import { FaBox, FaClock, FaMapMarkerAlt, FaShoppingBag, FaCheck } from "react-icons/fa";
import { useState } from "react";

// 상태별 한글 이름과 색상
const STATUS_CONFIG: Record<string, { label: string; colorScheme: string; icon: any }> = {
  CHECKING_STOCK: { label: "재고 확인 중", colorScheme: "yellow", icon: FaClock },
  RECEIVED: { label: "주문 접수", colorScheme: "blue", icon: FaShoppingBag },
  IN_KITCHEN: { label: "조리 중", colorScheme: "purple", icon: FaBox },
  COOKED: { label: "조리 완료", colorScheme: "teal", icon: FaCheck },
  DELIVERING: { label: "배달 중", colorScheme: "orange", icon: FaMapMarkerAlt },
  DELIVERED: { label: "배달 완료", colorScheme: "green", icon: FaCheck },
  CANCELLED: { label: "취소됨", colorScheme: "red", icon: FaBox },
};

export default function OrderHistoryPage() {
  const cardBg = useColorModeValue("white", "gray.800");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // 주문 내역 조회
  const { data: orders, isPending: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["order-history"],
    queryFn: getOrderHistory,
    refetchInterval: 10000, // 10초마다 자동 새로고침
  });

  // 선택된 주문 상세 조회
  const { data: orderDetail, isPending: isLoadingDetail } = useQuery<OrderDetail>({
    queryKey: ["order-detail", selectedOrderId],
    queryFn: () => getOrderDetails(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  const handleOrderClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    onOpen();
  };

  return (
    <VStack spacing={8} align="stretch">
      {/* Header */}
      <Box
        bgGradient={useColorModeValue(
          "linear(to-r, blue.50, purple.50)",
          "linear(to-r, gray.800, gray.700)"
        )}
        p={8}
        rounded="2xl"
        shadow="xl"
      >
        <Heading
          size="2xl"
          mb={3}
          bgGradient="linear(to-r, blue.500, purple.500)"
          bgClip="text"
        >
          📦 내 주문 내역
        </Heading>
        <Text
          color={useColorModeValue("gray.700", "gray.300")}
          fontSize="lg"
        >
          주문 상태를 실시간으로 확인하세요
        </Text>
      </Box>

      {/* Loading State */}
      {isLoadingOrders && (
        <Box textAlign="center" py={8}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text mt={4} color={useColorModeValue("gray.600", "gray.400")}>
            주문 내역을 불러오는 중...
          </Text>
        </Box>
      )}

      {/* Empty State */}
      {!isLoadingOrders && orders && orders.length === 0 && (
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          minH="300px"
          rounded="lg"
        >
          <Icon as={FaBox} boxSize={16} color="brand.500" mb={4} />
          <AlertTitle fontSize="2xl" mb={2}>
            주문 내역이 없습니다
          </AlertTitle>
          <AlertDescription maxW="sm" fontSize="lg">
            첫 주문을 시작해보세요!
          </AlertDescription>
        </Alert>
      )}

      {/* Orders List */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {orders?.map((order) => {
          const statusConfig = STATUS_CONFIG[order.status];

          // 백엔드가 이미 커스터마이징 가격을 포함하므로 그대로 사용
          return (
            <Card
              key={order.orderId}
              bg={cardBg}
              shadow="lg"
              borderWidth="2px"
              borderColor={`${statusConfig.colorScheme}.400`}
              rounded="2xl"
              cursor="pointer"
              transition="all 0.3s"
              _hover={{
                shadow: "2xl",
                transform: "translateY(-4px)",
                borderColor: `${statusConfig.colorScheme}.500`,
              }}
              onClick={() => handleOrderClick(order.orderId)}
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
                  <VStack align="start" spacing={2}>
                    <Heading size="md">주문 #{order.orderId}</Heading>
                    <HStack>
                      <Icon as={FaClock} color="gray.500" boxSize={4} />
                      <Text fontSize="sm" color="gray.600">
                        {new Date(order.orderDate).toLocaleString("ko-KR")}
                      </Text>
                    </HStack>
                  </VStack>
                  <Badge
                    colorScheme={statusConfig.colorScheme}
                    fontSize="md"
                    px={3}
                    py={1}
                    rounded="full"
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Icon as={statusConfig.icon} />
                    {statusConfig.label}
                  </Badge>
                </HStack>
              </CardHeader>

              <Divider />

              <CardBody>
                <VStack align="stretch" spacing={3}>
                  {order.deliveryAddress && (
                    <HStack>
                      <Icon as={FaMapMarkerAlt} color="gray.500" />
                      <Text fontSize="sm">{order.deliveryAddress}</Text>
                    </HStack>
                  )}

                  {order.deliveryDate && (
                    <HStack>
                      <Icon as={FaClock} color="orange.500" />
                      <Text fontSize="sm" fontWeight="medium">
                        희망 배송: {new Date(order.deliveryDate).toLocaleString("ko-KR")}
                      </Text>
                    </HStack>
                  )}

                  {order.deliveredAt && (
                    <HStack>
                      <Icon as={FaCheck} color="green.500" />
                      <Text fontSize="sm" fontWeight="bold" color="green.600">
                        배달 완료: {new Date(order.deliveredAt).toLocaleString("ko-KR")}
                      </Text>
                    </HStack>
                  )}

                  <Divider />

                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">
                      {order.itemCount}개 품목
                    </Text>
                    <Text fontSize="xl" fontWeight="black" color="green.600">
                      {order.totalPrice.toLocaleString()}원
                    </Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          );
        })}
      </SimpleGrid>

      {/* Order Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            주문 상세 #{selectedOrderId}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {isLoadingDetail && (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="brand.500" />
              </Box>
            )}

            {orderDetail && (
              <VStack align="stretch" spacing={4}>
                {/* Status */}
                <Box textAlign="center" py={4}>
                  <Badge
                    colorScheme={STATUS_CONFIG[orderDetail.status].colorScheme}
                    fontSize="xl"
                    px={6}
                    py={3}
                    rounded="full"
                  >
                    {STATUS_CONFIG[orderDetail.status].label}
                  </Badge>
                </Box>

                {/* Order Info */}
                <Box p={4} bg="gray.50" rounded="md">
                  <VStack align="stretch" spacing={2}>
                    <HStack>
                      <Icon as={FaClock} color="gray.500" />
                      <Text fontSize="sm">
                        주문 시간: {new Date(orderDetail.orderDate).toLocaleString("ko-KR")}
                      </Text>
                    </HStack>

                    {orderDetail.deliveryDate && (
                      <HStack>
                        <Icon as={FaClock} color="orange.500" />
                        <Text fontSize="sm" fontWeight="medium">
                          희망 배송: {new Date(orderDetail.deliveryDate).toLocaleString("ko-KR")}
                        </Text>
                      </HStack>
                    )}

                    {orderDetail.deliveredAt && (
                      <HStack>
                        <Icon as={FaCheck} color="green.500" />
                        <Text fontSize="sm" fontWeight="bold" color="green.600">
                          배달 완료: {new Date(orderDetail.deliveredAt).toLocaleString("ko-KR")}
                        </Text>
                      </HStack>
                    )}

                    {orderDetail.deliveryAddress && (
                      <HStack>
                        <Icon as={FaMapMarkerAlt} color="gray.500" />
                        <Text fontSize="sm">{orderDetail.deliveryAddress}</Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>

                {/* Order Items */}
                <Box>
                  <Heading size="sm" mb={3}>
                    주문 내역
                  </Heading>
                  <VStack align="stretch" spacing={3}>
                    {orderDetail.items.map((item) => {
                      return (
                        <Box key={item.itemId} p={4} bg="white" border="1px" borderColor="gray.200" rounded="md">
                          <VStack align="stretch" spacing={2}>
                            <HStack justify="space-between">
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold">{item.dinnerName}</Text>
                                <Text fontSize="sm" color="gray.600">
                                  {item.servingStyleName} 스타일
                                </Text>
                              </VStack>
                              <Text fontWeight="bold">x{item.quantity}</Text>
                            </HStack>

                            {item.customizations && item.customizations.length > 0 && (
                              <Box pl={4} borderLeft="2px" borderColor="brand.500">
                                <Text fontSize="sm" color="gray.600" mb={1}>
                                  커스터마이징:
                                </Text>
                                <VStack align="stretch" spacing={1}>
                                  {item.customizations.map((custom, idx) => {
                                    const customItemTotal = (custom.quantity || 0) * (custom.pricePerUnit || 0);
                                    return (
                                      <HStack key={idx} justify="space-between">
                                        <Text fontSize="sm">
                                          • {custom.action === "ADD" ? "+" : "-"} {custom.dishName} x{custom.quantity}
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="bold"
                                          color={custom.action === "ADD" ? "green.600" : "red.600"}
                                        >
                                          {custom.action === "ADD" ? "+" : "-"}
                                          {customItemTotal.toLocaleString()}원
                                        </Text>
                                      </HStack>
                                    );
                                  })}
                                </VStack>
                              </Box>
                            )}

                            <HStack justify="space-between">
                              <Text fontSize="sm" color="gray.600">
                                품목 금액
                              </Text>
                              <Text fontWeight="bold">{item.price.toLocaleString()}원</Text>
                            </HStack>
                          </VStack>
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>

                {/* Total */}
                <Divider />
                <HStack justify="space-between" p={4} bg="green.50" rounded="md">
                  <Text fontSize="lg" fontWeight="bold">
                    총 금액
                  </Text>
                  <Text fontSize="2xl" fontWeight="black" color="green.600">
                    {orderDetail.totalPrice.toLocaleString()}원
                  </Text>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
