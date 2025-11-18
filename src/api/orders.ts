import { apiClient } from "./client";
import type { MenuItem } from "./menu";
import type { CheckoutRequest, Order, OrderHistoryResponse } from "./types";

// 하위 호환성을 위해 기존 CartItem 타입 유지
export interface CartItem extends MenuItem {
  quantity: number;
}

// 장바구니 상품을 주문으로 전환 (체크아웃)
export const checkout = async (data: CheckoutRequest): Promise<Order> => {
  const response = await apiClient.post<Order>("/api/orders/checkout", data);
  return response.data;
};

// 현재 사용자의 주문 내역 조회
export const getOrderHistory = async (): Promise<Order[]> => {
  const response = await apiClient.get<OrderHistoryResponse>(
    "/api/orders/history"
  );
  return response.data.orders;
};

// 특정 주문 상세 정보 조회
export const getOrderDetails = async (orderId: number): Promise<Order> => {
  const response = await apiClient.get<Order>(`/api/orders/${orderId}`);
  return response.data;
};

// ============= 하위 호환성을 위한 레거시 함수들 =============

// 레거시: 기존 Order 타입 (하위 호환성)
export interface LegacyOrder {
  id: number;
  items: CartItem[];
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
}

// 레거시: placeOrder 함수 (checkout으로 래핑)
export const placeOrder = async (
  cart: CartItem[]
): Promise<{ success: boolean }> => {
  console.log("--- 서버로 주문 전송 ---");
  console.log(cart);
  console.log("----------------------");

  if (!Array.isArray(cart) || cart.length === 0) {
    throw new Error("장바구니가 비어 있습니다.");
  }

  try {
    // 기본값으로 체크아웃 요청
    await checkout({
      deliveryAddress: "기본 배송지", // 실제로는 사용자 입력 필요
      deliveryDate: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("주문 실패:", error);
    return { success: false };
  }
};

// 레거시: getPendingOrders 함수
export const getPendingOrders = async (): Promise<LegacyOrder[]> => {
  console.log("대기 중인 주문 목록을 서버에서 가져옵니다...");
  const orders = await getOrderHistory();

  // 새 Order 타입을 레거시 Order 타입으로 변환
  return orders
    .filter((o) => o.status === "CHECKING_STOCK" || o.status === "RECEIVED")
    .map((o) => ({
      id: o.id,
      items: [], // 레거시 형식에 맞게 변환 필요
      status: "pending" as const,
      createdAt: new Date(o.createdAt).getTime(),
    }));
};

// 레거시: updateOrderStatus 함수 (staff API로 이동 권장)
export const updateOrderStatus = async ({
  orderId,
  status,
}: {
  orderId: number;
  status: "accepted" | "rejected";
}): Promise<LegacyOrder> => {
  console.log(`서버에서 주문 #${orderId}의 상태를 ${status}로 변경합니다.`);
  // 실제로는 staff API를 사용해야 함
  throw new Error("이 함수는 더 이상 지원되지 않습니다. staff.ts의 updateOrderStatus를 사용하세요.");
};
