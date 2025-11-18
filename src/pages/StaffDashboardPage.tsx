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
      <Box>
        <Heading size="xl" mb={2}>
          주문 대시보드
        </Heading>
        <HStack spacing={2} align="center">
          <Icon as={FaClock} color="green.500" />
          <Text color={useColorModeValue("gray.600", "gray.400")}>
            5초마다 자동으로 새로운 주문을 확인합니다
          </Text>
        </HStack>
      </Box>

      {/* Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Stat>
              <StatLabel>대기 중인 주문</StatLabel>
              <StatNumber color="brand.500">
                {pendingOrders?.length || 0}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Stat>
              <StatLabel>자동 새로고침</StatLabel>
              <StatNumber fontSize="xl">
                <Badge colorScheme="green">활성</Badge>
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Stat>
              <StatLabel>상태</StatLabel>
              <StatNumber fontSize="xl">
                {isPending ? (
                  <Badge colorScheme="yellow">로딩 중</Badge>
                ) : (
                  <Badge colorScheme="green">온라인</Badge>
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
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            transition="all 0.3s"
            _hover={{ shadow: "xl" }}
          >
            <CardHeader>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Heading size="md">주문 #{order.id}</Heading>
                  <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
                    {new Date(order.createdAt).toLocaleString("ko-KR")}
                  </Text>
                </VStack>
                <Badge colorScheme="yellow" fontSize="md" px={3} py={1}>
                  대기중
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

            <CardFooter>
              <HStack spacing={3} width="100%">
                <Button
                  leftIcon={<FaCheckCircle />}
                  colorScheme="green"
                  flex={1}
                  size="lg"
                  onClick={() =>
                    changeOrderStatus({ orderId: order.id, status: "accepted" })
                  }
                  isDisabled={isUpdatingStatus}
                >
                  수락
                </Button>
                <Button
                  leftIcon={<FaTimesCircle />}
                  colorScheme="red"
                  variant="outline"
                  flex={1}
                  size="lg"
                  onClick={() =>
                    changeOrderStatus({ orderId: order.id, status: "rejected" })
                  }
                  isDisabled={isUpdatingStatus}
                >
                  거절
                </Button>
              </HStack>
            </CardFooter>
          </Card>
        ))}
      </VStack>
    </VStack>
  );
}
