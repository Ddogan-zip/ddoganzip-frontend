// orders.ts
import type { MenuItem } from "./menu";

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: number;
  items: CartItem[]; // 장바구니는 배열
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
}

// --- 가짜 데이터베이스 ---
const ordersDB: Order[] = []; // ← const 로 변경 (prefer-const 해결)
let nextOrderId = 1;
// ----------------------

// MenuOrderPage에서 submitOrder(cart)로 CartItem[]을 넘기므로 시그니처 유지
export const placeOrder = async (
  cart: CartItem[]
): Promise<{ success: boolean }> => {
  console.log("--- 서버로 주문 전송 ---");
  console.log(cart);
  console.log("----------------------");

  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!Array.isArray(cart) || cart.length === 0) {
    throw new Error("장바구니가 비어 있습니다.");
  }

  const newOrder: Order = {
    id: nextOrderId++,
    items: cart.map((it) => ({ ...it })), // 방어적 복사
    status: "pending",
    createdAt: Date.now(),
  };
  ordersDB.push(newOrder);

  return { success: true };
};

// 'pending' 주문 목록
export const getPendingOrders = async (): Promise<Order[]> => {
  console.log("대기 중인 주문 목록을 서버에서 가져옵니다...");
  await new Promise((resolve) => setTimeout(resolve, 500));
  return ordersDB.filter((o) => o.status === "pending");
};

// 주문 상태 변경
export const updateOrderStatus = async ({
  orderId,
  status,
}: {
  orderId: number;
  status: "accepted" | "rejected";
}): Promise<Order> => {
  console.log(`서버에서 주문 #${orderId}의 상태를 ${status}로 변경합니다.`);
  await new Promise((resolve) => setTimeout(resolve, 500));

  const order = ordersDB.find((o) => o.id === orderId);
  if (!order) throw new Error("주문을 찾을 수 없습니다.");
  order.status = status;
  return order;
};
