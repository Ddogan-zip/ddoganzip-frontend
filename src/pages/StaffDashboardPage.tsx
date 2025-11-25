import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActiveOrders, updateOrderStatus, getInventory } from "../api/staff";
import { getOrderDetails } from "../api/orders";
import type { ActiveOrder, OrderStatus, InventoryItem, OrderDetail } from "../api/types";
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { FaBox, FaClock, FaUser, FaMapMarkerAlt, FaWarehouse, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { useState } from "react";

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

interface RequiredStock {
  dishId: number;
  dishName: string;
  required: number;
  available: number;
  isInsufficient: boolean;
}

export default function StaffDashboardPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // 주문 관리
  const { data: activeOrders, isPending: isLoadingOrders } = useQuery<ActiveOrder[]>({
    queryKey: ["active-orders"],
    queryFn: getActiveOrders,
    refetchInterval: 5000,
  });

  // 재고 관리
  const { data: inventory, isPending: isLoadingInventory } = useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: getInventory,
    refetchInterval: 10000,
  });

  // 선택된 주문 상세 정보
  const { data: orderDetail, isPending: isLoadingOrderDetail } = useQuery<OrderDetail>({
    queryKey: ["order-detail", selectedOrderId],
    queryFn: () => getOrderDetails(selectedOrderId!),
    enabled: !!selectedOrderId && isOpen,
  });

  const { mutate: changeOrderStatus, isPending: isUpdatingStatus } = useMutation({
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
      onClose(); // 모달 닫기
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

  // 필요한 재고 계산
  const calculateRequiredStock = (): RequiredStock[] => {
    if (!orderDetail || !inventory) return [];

    const requiredMap = new Map<string, { quantity: number }>();

    // 모든 주문 아이템 처리
    orderDetail.items.forEach((item) => {
      // 1. 기본 구성 품목의 재고 계산
      item.baseDishes.forEach((baseDish) => {
        const existing = requiredMap.get(baseDish.dishName) || { quantity: 0 };
        // 기본 수량 × 주문 수량
        const baseRequired = baseDish.quantity * item.quantity;
        requiredMap.set(baseDish.dishName, {
          quantity: existing.quantity + baseRequired,
        });
      });

      // 2. 커스터마이징에서 필요한 재고 계산
      item.customizations.forEach((custom) => {
        const existing = requiredMap.get(custom.dishName) || { quantity: 0 };
        // item.quantity를 곱해서 실제 필요한 수량 계산
        let actualRequired = 0;
        if (custom.action === "ADD") {
          // ADD: 추가 수량
          actualRequired = custom.quantity * item.quantity;
        } else if (custom.action === "REMOVE") {
          // REMOVE: 제거 수량 (음수로 처리)
          actualRequired = -(custom.quantity * item.quantity);
        }

        requiredMap.set(custom.dishName, {
          quantity: existing.quantity + actualRequired,
        });
      });
    });

    // 현재 재고와 비교 (dishName으로 매칭)
    const result: RequiredStock[] = [];
    requiredMap.forEach((value, dishName) => {
      // 0개 이하는 제외 (제거만 있는 경우)
      if (value.quantity <= 0) return;

      const inventoryItem = inventory.find((inv) => inv.dishName === dishName);
      const available = inventoryItem?.currentStock || 0;
      result.push({
        dishId: inventoryItem?.dishId || 0,
        dishName,
        required: value.quantity,
        available,
        isInsufficient: available < value.quantity,
      });
    });

    return result.sort((a, b) => (b.isInsufficient ? 1 : 0) - (a.isInsufficient ? 1 : 0));
  };

  const requiredStock = calculateRequiredStock();
  const hasInsufficientStock = requiredStock.some((s) => s.isInsufficient);

  const handleCheckStock = (orderId: number) => {
    setSelectedOrderId(orderId);
    onOpen();
  };

  const handleAcceptOrder = () => {
    if (selectedOrderId) {
      changeOrderStatus({ orderId: selectedOrderId, status: "RECEIVED" });
    }
  };

  const handleCancelOrder = () => {
    if (selectedOrderId) {
      changeOrderStatus({ orderId: selectedOrderId, status: "CANCELLED" });
    }
  };

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
            자동으로 최신 정보를 확인합니다
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
                📦 재고 아이템
              </StatLabel>
              <StatNumber
                fontSize="4xl"
                fontWeight="black"
                bgGradient="linear(to-r, green.500, teal.500)"
                bgClip="text"
              >
                {inventory?.length || 0}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card
          bg={cardBg}
          shadow="xl"
          borderWidth="2px"
          borderColor={isLoadingOrders ? "yellow.400" : "green.400"}
          rounded="2xl"
        >
          <CardBody>
            <Stat>
              <StatLabel fontSize="md" fontWeight="medium">
                📡 시스템 상태
              </StatLabel>
              <StatNumber fontSize="2xl" mt={2}>
                {isLoadingOrders ? (
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

      {/* Update Status Indicator */}
      {isUpdatingStatus && (
        <Alert status="info" variant="subtle">
          <AlertIcon />
          <AlertTitle>처리 중</AlertTitle>
          <AlertDescription>주문 상태를 업데이트하는 중...</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs colorScheme="brand" variant="enclosed">
        <TabList>
          <Tab fontSize="lg" fontWeight="semibold">
            📋 주문 관리
          </Tab>
          <Tab fontSize="lg" fontWeight="semibold">
            📦 재고 관리
          </Tab>
        </TabList>

        <TabPanels>
          {/* 주문 관리 탭 */}
          <TabPanel px={0}>
            {/* Loading State */}
            {isLoadingOrders && (
              <Box textAlign="center" py={8}>
                <Spinner size="xl" color="brand.500" thickness="4px" />
                <Text mt={4} color={useColorModeValue("gray.600", "gray.400")}>
                  주문 목록을 불러오는 중...
                </Text>
              </Box>
            )}

            {/* Empty State */}
            {!isLoadingOrders && activeOrders && activeOrders.length === 0 && (
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

                // 커스터마이징 가격 계산 (items가 있는 경우)
                const customizationPrice = order.items?.reduce((sum, item) => {
                  const itemCustomPrice = item.customizations.reduce((customSum, custom) => {
                    const customTotal = (custom.quantity || 0) * (custom.pricePerUnit || 0) * (item.quantity || 1);
                    return custom.action === "ADD" ? customSum + customTotal : customSum - customTotal;
                  }, 0);
                  return sum + itemCustomPrice;
                }, 0) || 0;

                const finalTotalPrice = order.totalPrice + customizationPrice;

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
                            {finalTotalPrice.toLocaleString()}원
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
                        <VStack width="100%" spacing={3}>
                          {order.status === "CHECKING_STOCK" && (
                            <Button
                              width="100%"
                              size="lg"
                              rounded="full"
                              colorScheme="purple"
                              variant="solid"
                              leftIcon={<Icon as={FaWarehouse} />}
                              onClick={() => handleCheckStock(order.orderId)}
                              boxShadow="lg"
                            >
                              📦 재고 확인 및 주문 처리
                            </Button>
                          )}
                          {order.status !== "CHECKING_STOCK" && (
                            <HStack width="100%" spacing={3}>
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
                          )}
                        </VStack>
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
          </TabPanel>

          {/* 재고 관리 탭 */}
          <TabPanel px={0}>
            {/* Loading State */}
            {isLoadingInventory && (
              <Box textAlign="center" py={8}>
                <Spinner size="xl" color="brand.500" thickness="4px" />
                <Text mt={4} color={useColorModeValue("gray.600", "gray.400")}>
                  재고 목록을 불러오는 중...
                </Text>
              </Box>
            )}

            {/* Inventory Table */}
            {!isLoadingInventory && inventory && (
              <Card bg={cardBg} shadow="xl" rounded="2xl">
                <CardHeader>
                  <HStack>
                    <Icon as={FaWarehouse} color="green.500" boxSize={6} />
                    <Heading size="md">재고 현황</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>품목 ID</Th>
                          <Th>품목명</Th>
                          <Th isNumeric>현재 재고</Th>
                          <Th isNumeric>최소 재고</Th>
                          <Th>상태</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {inventory.map((item) => {
                          const isLowStock =
                            item.minimumStock && item.currentStock <= item.minimumStock;

                          return (
                            <Tr key={item.dishId}>
                              <Td>{item.dishId}</Td>
                              <Td fontWeight="medium">{item.dishName}</Td>
                              <Td
                                isNumeric
                                fontWeight="bold"
                                color={isLowStock ? "red.500" : "green.600"}
                              >
                                {item.currentStock}
                              </Td>
                              <Td isNumeric>{item.minimumStock || "-"}</Td>
                              <Td>
                                {isLowStock ? (
                                  <Badge colorScheme="red" fontSize="sm">
                                    ⚠️ 재고 부족
                                  </Badge>
                                ) : (
                                  <Badge colorScheme="green" fontSize="sm">
                                    ✓ 정상
                                  </Badge>
                                )}
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>

                  {inventory.length === 0 && (
                    <Alert status="info" mt={4}>
                      <AlertIcon />
                      재고 정보가 없습니다.
                    </Alert>
                  )}
                </CardBody>
              </Card>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* 재고 확인 모달 */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={FaWarehouse} color="purple.500" />
              <Text>주문 #{selectedOrderId} - 재고 확인</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {isLoadingOrderDetail && (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="brand.500" />
                <Text mt={4}>주문 정보를 불러오는 중...</Text>
              </Box>
            )}

            {!isLoadingOrderDetail && orderDetail && (
              <VStack spacing={6} align="stretch">
                {/* 주문 정보 */}
                <Card bg={useColorModeValue("gray.50", "gray.700")} variant="outline">
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      <HStack>
                        <Icon as={FaUser} color="gray.500" />
                        <Text fontWeight="bold">고객:</Text>
                        <Text>{activeOrders?.find((o) => o.orderId === selectedOrderId)?.customerName}</Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaMapMarkerAlt} color="gray.500" />
                        <Text fontWeight="bold">배송지:</Text>
                        <Text>{orderDetail.deliveryAddress}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="bold">총액:</Text>
                        <Text fontSize="lg" color="green.600" fontWeight="black">
                          {(() => {
                            // 모든 아이템의 커스터마이징 가격 합산
                            const totalCustomPrice = orderDetail.items.reduce((sum, item) => {
                              const itemCustomPrice = item.customizations.reduce((customSum, custom) => {
                                const customTotal = (custom.quantity || 0) * (custom.pricePerUnit || 0) * (item.quantity || 1);
                                return custom.action === "ADD" ? customSum + customTotal : customSum - customTotal;
                              }, 0);
                              return sum + itemCustomPrice;
                            }, 0);
                            const finalTotal = (orderDetail.totalPrice || 0) + totalCustomPrice;
                            return finalTotal.toLocaleString();
                          })()}원
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* 재고 부족 경고 */}
                {hasInsufficientStock && (
                  <Alert status="error" variant="left-accent">
                    <AlertIcon as={FaExclamationTriangle} />
                    <VStack align="start" spacing={1}>
                      <AlertTitle>재고 부족!</AlertTitle>
                      <AlertDescription>
                        일부 품목의 재고가 부족합니다. 주문을 취소하거나 고객에게 연락하세요.
                      </AlertDescription>
                    </VStack>
                  </Alert>
                )}

                {/* 재고 비교 테이블 */}
                <Card variant="outline">
                  <CardHeader pb={3}>
                    <Heading size="sm">필요 재고 vs 현재 재고</Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    {requiredStock.length > 0 ? (
                      <TableContainer>
                        <Table size="sm" variant="simple">
                          <Thead>
                            <Tr>
                              <Th>품목</Th>
                              <Th isNumeric>필요 수량</Th>
                              <Th isNumeric>현재 재고</Th>
                              <Th>상태</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {requiredStock.map((stock) => (
                              <Tr
                                key={stock.dishId}
                                bg={stock.isInsufficient ? "red.50" : "transparent"}
                              >
                                <Td fontWeight="medium">{stock.dishName}</Td>
                                <Td isNumeric fontWeight="bold" color="blue.600">
                                  {stock.required}
                                </Td>
                                <Td
                                  isNumeric
                                  fontWeight="bold"
                                  color={stock.isInsufficient ? "red.600" : "green.600"}
                                >
                                  {stock.available}
                                </Td>
                                <Td>
                                  {stock.isInsufficient ? (
                                    <Badge colorScheme="red" fontSize="xs">
                                      <HStack spacing={1}>
                                        <Icon as={FaExclamationTriangle} boxSize={3} />
                                        <Text>부족 ({stock.available - stock.required})</Text>
                                      </HStack>
                                    </Badge>
                                  ) : (
                                    <Badge colorScheme="green" fontSize="xs">
                                      <HStack spacing={1}>
                                        <Icon as={FaCheckCircle} boxSize={3} />
                                        <Text>충분</Text>
                                      </HStack>
                                    </Badge>
                                  )}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert status="info">
                        <AlertIcon />
                        이 주문에는 추가 재고가 필요하지 않습니다.
                      </Alert>
                    )}
                  </CardBody>
                </Card>

                {/* 주문 아이템 목록 */}
                <Card variant="outline">
                  <CardHeader pb={3}>
                    <Heading size="sm">주문 상세 내역</Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack align="stretch" spacing={3}>
                      {orderDetail.items.map((item, idx) => {
                        // 커스터마이징 가격 계산
                        const itemCustomPrice = item.customizations.reduce((customSum, custom) => {
                          const customTotal = (custom.quantity || 0) * (custom.pricePerUnit || 0) * (item.quantity || 1);
                          return custom.action === "ADD" ? customSum + customTotal : customSum - customTotal;
                        }, 0);
                        const itemTotalWithCustom = (item.price || 0) + itemCustomPrice;

                        return (
                          <Box
                            key={idx}
                            p={3}
                            bg={useColorModeValue("gray.50", "gray.700")}
                            rounded="md"
                          >
                            <HStack justify="space-between" mb={2}>
                              <Text fontWeight="bold">{item.dinnerName}</Text>
                              <Text color="green.600" fontWeight="bold">
                                {itemTotalWithCustom.toLocaleString()}원
                              </Text>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              스타일: {item.servingStyleName} × {item.quantity}
                            </Text>

                            {/* 기본 구성 품목 */}
                            {item.baseDishes && item.baseDishes.length > 0 && (
                              <VStack align="stretch" mt={2} pl={4} spacing={1}>
                                <Text fontSize="xs" fontWeight="bold" color="gray.600">
                                  기본 구성:
                                </Text>
                                {item.baseDishes.map((baseDish, bIdx) => (
                                  <Text key={bIdx} fontSize="sm" color="gray.500">
                                    • {baseDish.dishName} × {baseDish.quantity}
                                  </Text>
                                ))}
                              </VStack>
                            )}

                            {/* 커스터마이징 */}
                            {item.customizations.length > 0 && (
                              <VStack align="stretch" mt={2} pl={4} spacing={1}>
                                <Text fontSize="xs" fontWeight="bold" color="gray.600">
                                  커스터마이징:
                                </Text>
                                {item.customizations.map((custom, cIdx) => {
                                  const customTotal = (custom.quantity || 0) * (custom.pricePerUnit || 0) * (item.quantity || 1);
                                  return (
                                    <HStack key={cIdx} justify="space-between">
                                      <Text fontSize="sm" color="gray.500">
                                        {custom.action === "ADD" ? "+" : "-"} {custom.dishName} × {custom.quantity}
                                      </Text>
                                      <Text
                                        fontSize="sm"
                                        fontWeight="medium"
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
                          </Box>
                        );
                      })}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <HStack width="100%" spacing={3}>
              <Button
                flex={1}
                size="lg"
                colorScheme="red"
                onClick={handleCancelOrder}
                isDisabled={isUpdatingStatus}
              >
                취소
              </Button>
              <Button
                flex={1}
                size="lg"
                colorScheme="blue"
                onClick={handleAcceptOrder}
                isDisabled={isUpdatingStatus || hasInsufficientStock}
                leftIcon={hasInsufficientStock ? undefined : <Icon as={FaCheckCircle} />}
              >
                {hasInsufficientStock ? "재고 부족 - 접수 불가" : "주문 접수"}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
