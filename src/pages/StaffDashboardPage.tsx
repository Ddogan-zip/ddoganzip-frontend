// StaffDashboardPage.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order } from "../api/orders"; // ← 타입은 type 으로!
import { getPendingOrders, updateOrderStatus } from "../api/orders";

export default function StaffDashboardPage() {
  const queryClient = useQueryClient();

  // pending 주문 목록 가져오기: 반환 타입은 Order[] 임
  const { data: pendingOrders, isPending } = useQuery<Order[]>({
    queryKey: ["pending-orders"],
    queryFn: getPendingOrders,
    refetchInterval: 5000,
  });

  // 상태 변경 mutation
  const { mutate: changeOrderStatus, isPending: isUpdatingStatus } =
    useMutation({
      mutationFn: updateOrderStatus,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["pending-orders"] });
      },
    });

  return (
    <div>
      <h1>주문 대시보드 (직원용)</h1>
      <p>5초마다 자동으로 새로운 주문을 확인합니다.</p>

      {isPending && <span>주문 목록을 불러오는 중...</span>}
      {isUpdatingStatus && (
        <p>
          <strong>주문 상태를 업데이트하는 중...</strong>
        </p>
      )}

      <div style={{ marginTop: "20px" }}>
        {pendingOrders && pendingOrders.length === 0 && (
          <p>대기 중인 주문이 없습니다.</p>
        )}

        {pendingOrders?.map((order: Order) => (
          <div
            key={order.id}
            style={{
              border: "1px solid black",
              margin: "10px",
              padding: "10px",
            }}
          >
            <h3>주문 번호: {order.id}</h3>
            <ul>
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.name} x {item.quantity}
                </li>
              ))}
            </ul>

            <button
              onClick={() =>
                changeOrderStatus({ orderId: order.id, status: "accepted" })
              }
            >
              수락
            </button>
            <button
              onClick={() =>
                changeOrderStatus({ orderId: order.id, status: "rejected" })
              }
              style={{ marginLeft: "8px" }}
            >
              거절
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
