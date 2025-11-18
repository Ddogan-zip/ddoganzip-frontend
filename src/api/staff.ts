import { apiClient } from "./client";
import type {
  Order,
  ActiveOrdersResponse,
  UpdateOrderStatusRequest,
} from "./types";

// 배달 완료되지 않은 모든 주문 조회 (직원 전용)
export const getActiveOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get<ActiveOrdersResponse>(
    "/api/staff/orders/active"
  );
  return response.data.orders;
};

// 주문 상태 변경 (직원 전용)
export const updateOrderStatus = async (
  orderId: number,
  data: UpdateOrderStatusRequest
): Promise<Order> => {
  const response = await apiClient.put<Order>(
    `/api/staff/orders/${orderId}/status`,
    data
  );
  return response.data;
};
