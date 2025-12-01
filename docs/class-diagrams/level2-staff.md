# Level 2: 스태프 대시보드

[< 목차로 돌아가기](./README.md)

---

## 개요

스태프 전용 기능: 주문 관리, 재고 확인, 상태 변경, 배달원 관리와 관련된 클래스들입니다.

---

## 스태프 타입

```mermaid
---
title: Staff Types
---
classDiagram
    direction TB

    class UpdateOrderStatusRequest {
        +OrderStatus status
    }

    class StaffAvailabilityResponse {
        +number availableCooks
        +number totalCooks
        +number availableDrivers
        +number totalDrivers
        +boolean canStartCooking
        +boolean canStartDelivery
    }

    class ActiveOrder {
        +number orderId
        +string customerName
        +string customerEmail
        +string orderDate
        +string deliveryDate
        +string deliveredAt
        +string deliveryAddress
        +OrderStatus status
        +number totalPrice
        +number itemCount
        +OrderItem[] items
    }

    class InventoryItem {
        +number dishId
        +string dishName
        +number currentStock
        +number minimumStock
    }

    UpdateOrderStatusRequest --> OrderStatus : uses
    ActiveOrder --> OrderStatus : has
    ActiveOrder *-- OrderItem : 0..*
```

---

## 스태프 서비스

```mermaid
---
title: Staff Service
---
classDiagram
    direction TB

    class StaffService {
        <<service>>
        +getActiveOrders() Promise~ActiveOrder[]~
        +updateOrderStatus(orderId: number, data: UpdateOrderStatusRequest) Promise~Order~
        +getInventory() Promise~InventoryItem[]~
        +getStaffAvailability() Promise~StaffAvailabilityResponse~
        +driverReturn(orderId: number) Promise~void~
    }

    class ApiClient {
        <<singleton>>
    }

    StaffService --> ApiClient : uses
    StaffService --> ActiveOrder : returns
    StaffService --> InventoryItem : returns
    StaffService --> StaffAvailabilityResponse : returns
    StaffService --> UpdateOrderStatusRequest : accepts
```

---

## 스태프 대시보드 페이지 - 상태

```mermaid
---
title: StaffDashboardPage State
---
classDiagram
    direction TB

    class StaffDashboardPage {
        <<page>>
        -number | null selectedOrderId
        -boolean isModalOpen
    }

    class Queries {
        <<React Query>>
        +activeOrders: ActiveOrder[]
        +inventory: InventoryItem[]
        +staffAvailability: StaffAvailabilityResponse
        +orderDetail: OrderDetail
    }

    class Mutations {
        <<React Query>>
        +changeOrderStatus(orderId, status) void
        +returnDriver(orderId) void
    }

    class RefetchIntervals {
        <<config>>
        activeOrders: 5000ms
        inventory: 10000ms
        staffAvailability: 5000ms
    }

    StaffDashboardPage --> Queries : uses
    StaffDashboardPage --> Mutations : uses
    Queries --> RefetchIntervals : configured with
```

---

## 스태프 대시보드 페이지 - 메서드

```mermaid
---
title: StaffDashboardPage Methods
---
classDiagram
    direction TB

    class StaffDashboardPage_Handlers {
        <<handlers>>
        +handleCheckStock(orderId: number) void
        +handleAcceptOrder() Promise~void~
        +handleCancelOrder() Promise~void~
        +handleStatusChange(orderId, status) Promise~void~
        +handleDriverReturn(orderId: number) Promise~void~
    }

    class StaffDashboardPage_Calculations {
        <<calculations>>
        +calculateRequiredStock() RequiredStock[]
    }

    class StaffDashboardPage_UI {
        <<render>>
        +renderStatsCards() ReactElement
        +renderOrderManagementTab() ReactElement
        +renderInventoryTab() ReactElement
        +renderStockCheckModal() ReactElement
    }

    class RequiredStock {
        +number dishId
        +string dishName
        +number required
        +number available
        +boolean isInsufficient
    }

    StaffDashboardPage_Calculations --> RequiredStock : returns
```

---

## 주문 상태 전이

```mermaid
---
title: Order Status Transitions
---
stateDiagram-v2
    [*] --> CHECKING_STOCK : 주문 생성

    CHECKING_STOCK --> RECEIVED : 재고 확인 완료
    CHECKING_STOCK --> CANCELLED : 재고 부족

    RECEIVED --> IN_KITCHEN : 조리 시작
    RECEIVED --> CANCELLED : 취소

    IN_KITCHEN --> COOKED : 조리 완료
    IN_KITCHEN --> CANCELLED : 취소

    COOKED --> DELIVERING : 배달 시작
    COOKED --> CANCELLED : 취소

    DELIVERING --> DELIVERED : 배달 완료
    DELIVERING --> CANCELLED : 취소

    DELIVERED --> DRIVER_RETURNED : 배달원 복귀
    DELIVERED --> [*]

    DRIVER_RETURNED --> [*]
    CANCELLED --> [*]
```

---

## 다음 상태 맵핑

```mermaid
---
title: Next Status Mapping
---
classDiagram
    direction LR

    class NextStatuses {
        <<constant>>
        CHECKING_STOCK: [RECEIVED, CANCELLED]
        RECEIVED: [IN_KITCHEN, CANCELLED]
        IN_KITCHEN: [COOKED, CANCELLED]
        COOKED: [DELIVERING, CANCELLED]
        DELIVERING: [DELIVERED, CANCELLED]
        DELIVERED: [DRIVER_RETURNED]
        DRIVER_RETURNED: []
        CANCELLED: []
    }

    class StatusTransitionLogic {
        <<logic>>
        +getNextStatuses(current: OrderStatus) OrderStatus[]
        +canTransitionTo(from, to) boolean
    }

    StatusTransitionLogic --> NextStatuses : uses
```

---

## 재고 확인 로직

```mermaid
---
title: Stock Check Logic
---
classDiagram
    direction TB

    class StockChecker {
        <<logic>>
        +calculateRequiredStock(orderDetail: OrderDetail) RequiredStock[]
    }

    class RequiredStock {
        +number dishId
        +string dishName
        +number required
        +number available
        +boolean isInsufficient
    }

    class CalculationSteps {
        <<algorithm>>
        1. Collect base dishes from all order items
        2. Add customization dishes (ADD action)
        3. Subtract customization dishes (REMOVE action)
        4. Aggregate by dishId
        5. Compare with inventory
        6. Mark insufficient items
    }

    StockChecker --> RequiredStock : produces
    StockChecker --> CalculationSteps : follows
```

---

## 재고 확인 흐름

```mermaid
---
title: Stock Check Flow
---
sequenceDiagram
    participant S as Staff
    participant SD as StaffDashboardPage
    participant SS as StaffService
    participant API as Backend

    S->>SD: Click "Check Stock"
    SD->>SD: Open Stock Check Modal
    SD->>SS: getOrderDetails(orderId)
    SS->>API: GET /orders/{orderId}
    API-->>SS: OrderDetail
    SS-->>SD: OrderDetail
    SD->>SD: calculateRequiredStock()
    SD->>SD: Display required vs available

    alt Stock Sufficient
        S->>SD: Click "Accept Order"
        SD->>SS: updateOrderStatus(orderId, RECEIVED)
        SS->>API: PATCH /staff/orders/{orderId}/status
        API-->>SS: Updated Order
        SS-->>SD: Success
        SD->>SD: Close Modal, Refresh Orders
    else Stock Insufficient
        S->>SD: Click "Cancel Order"
        SD->>SS: updateOrderStatus(orderId, CANCELLED)
        SS->>API: PATCH /staff/orders/{orderId}/status
        API-->>SS: Updated Order
        SS-->>SD: Success
        SD->>SD: Close Modal, Refresh Orders
    end
```

---

## 대시보드 UI 구조

```mermaid
---
title: Dashboard UI Structure
---
classDiagram
    direction TB

    class StaffDashboardPage {
        <<page>>
    }

    class StatsCards {
        <<component>>
        +activeOrdersCount: number
        +inventoryItemsCount: number
        +systemStatus: string
        +availableCooks: number/total
        +availableDrivers: number/total
    }

    class TabPanel_Orders {
        <<component>>
        +OrderCard[] orderCards
        +StatusBadge status
        +ActionButtons buttons
    }

    class TabPanel_Inventory {
        <<component>>
        +InventoryTable table
        +StockStatusBadge status
    }

    class StockCheckModal {
        <<modal>>
        +OrderInfo orderInfo
        +RequiredStockTable stockTable
        +ActionButtons buttons
    }

    StaffDashboardPage *-- StatsCards
    StaffDashboardPage *-- TabPanel_Orders
    StaffDashboardPage *-- TabPanel_Inventory
    StaffDashboardPage *-- StockCheckModal
```

---

## 스태프 가용성 체크

```mermaid
---
title: Staff Availability Check
---
classDiagram
    direction LR

    class StaffAvailabilityResponse {
        +number availableCooks
        +number totalCooks
        +number availableDrivers
        +number totalDrivers
        +boolean canStartCooking
        +boolean canStartDelivery
    }

    class AvailabilityLogic {
        <<logic>>
        canStartCooking = availableCooks > 0
        canStartDelivery = availableDrivers > 0
    }

    class UIDisplay {
        <<display>>
        Cook: "availableCooks / totalCooks"
        Driver: "availableDrivers / totalDrivers"
        Status: green if available, red if not
    }

    StaffAvailabilityResponse --> AvailabilityLogic : determines
    AvailabilityLogic --> UIDisplay : affects
```

---

## 배달원 복귀 처리

```mermaid
---
title: Driver Return Flow
---
sequenceDiagram
    participant S as Staff
    participant SD as StaffDashboardPage
    participant SS as StaffService
    participant API as Backend

    Note over S,API: Order status is DELIVERED

    S->>SD: Click "Driver Return"
    SD->>SS: driverReturn(orderId)
    SS->>API: POST /staff/orders/{orderId}/driver-return
    API-->>SS: Success
    SS-->>SD: Success
    SD->>SD: Invalidate queries
    SD->>SD: Show success toast
    SD->>S: Order status updated to DRIVER_RETURNED
```
