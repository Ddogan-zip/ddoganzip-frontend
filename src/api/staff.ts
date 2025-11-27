import { apiClient } from "./client";
import type {
  Order,
  ActiveOrder,
  ActiveOrdersResponse,
  UpdateOrderStatusRequest,
  InventoryItem,
  StaffAvailabilityResponse,
} from "./types";

// 배달 완료되지 않은 모든 주문 조회 (직원 전용)
export const getActiveOrders = async (): Promise<ActiveOrder[]> => {
  const response = await apiClient.get<ActiveOrdersResponse>(
    "/api/staff/orders/active"
  );
  return response.data; // 배열 직접 반환
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

// 재고 목록 조회 (직원 전용)
export const getInventory = async (): Promise<InventoryItem[]> => {
  const response = await apiClient.get<InventoryItem[]>("/api/staff/inventory");
  return response.data;
};

// 직원 가용성 조회 (직원 전용)
export const getStaffAvailability = async (): Promise<StaffAvailabilityResponse> => {
  const response = await apiClient.get<StaffAvailabilityResponse>("/api/staff/availability");
  return response.data;
};

// 배달 직원 복귀 (직원 전용)
export const driverReturn = async (): Promise<void> => {
  await apiClient.post("/api/staff/drivers/return");
};
