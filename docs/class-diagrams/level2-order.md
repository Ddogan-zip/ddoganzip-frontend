# Level 2: 주문 처리

[< 목차로 돌아가기](./README.md)

---

## 개요

주문 생성, 주문 상태 관리, 주문 내역 조회와 관련된 클래스들입니다.

---

## 주문 상태 Enum

```mermaid
---
title: Order Status Enum
---
classDiagram
    direction LR

    class OrderStatus {
        <<enumeration>>
        CHECKING_STOCK
        RECEIVED
        IN_KITCHEN
        COOKED
        DELIVERING
        DELIVERED
        DRIVER_RETURNED
        CANCELLED
    }

    class StatusFlow {
        <<workflow>>
        CHECKING_STOCK → RECEIVED
        RECEIVED → IN_KITCHEN
        IN_KITCHEN → COOKED
        COOKED → DELIVERING
        DELIVERING → DELIVERED
        DELIVERED → DRIVER_RETURNED
        ANY → CANCELLED
    }

    StatusFlow --> OrderStatus : transitions
```

---

## 주문 타입

```mermaid
---
title: Order Types
---
classDiagram
    direction TB

    class CheckoutRequest {
        +string deliveryAddress
        +string deliveryDate
    }

    class CheckoutResponse {
        +boolean success
        +string message
        +number data
    }

    class BaseDish {
        +number dishId
        +string dishName
        +number quantity
    }

    class OrderItem {
        +number itemId
        +number dinnerId
        +string dinnerName
        +string servingStyleName
        +number quantity
        +number price
        +BaseDish[] baseDishes
        +CustomizationResponse[] customizations
    }

    class Order {
        +number orderId
        +string orderDate
        +string deliveryDate
        +string deliveredAt
        +string deliveryAddress
        +OrderStatus status
        +number originalPrice
        +MemberGrade appliedGrade
        +number discountPercent
        +number discountAmount
        +number totalPrice
        +number itemCount
        +OrderItem[] items
    }

    class OrderDetail {
        +number orderId
        +string orderDate
        +string deliveryDate
        +string deliveredAt
        +string deliveryAddress
        +OrderStatus status
        +number originalPrice
        +MemberGrade appliedGrade
        +number discountPercent
        +number discountAmount
        +number totalPrice
        +number itemCount
        +OrderItem[] items
    }

    OrderItem *-- BaseDish : 1..*
    OrderItem *-- CustomizationResponse : 0..*
    Order --> OrderStatus : has
    Order --> MemberGrade : has
    Order *-- OrderItem : 0..*
    OrderDetail --|> Order : extends (items required)
```

---

## 주문 서비스

```mermaid
---
title: Orders Service
---
classDiagram
    direction TB

    class OrdersService {
        <<service>>
        +checkout(data: CheckoutRequest) Promise~number~
        +getOrderHistory() Promise~Order[]~
        +getOrderDetails(orderId: number) Promise~OrderDetail~
    }

    class ApiClient {
        <<singleton>>
    }

    OrdersService --> ApiClient : uses
    OrdersService --> CheckoutRequest : accepts
    OrdersService --> Order : returns
    OrdersService --> OrderDetail : returns
```

---

## 주문 내역 페이지

```mermaid
---
title: OrderHistoryPage
---
classDiagram
    direction TB

    class OrderHistoryPage {
        <<page>>
        -number | null selectedOrderId
        -boolean isModalOpen
        +handleOrderClick(orderId: number) void
        +getStatusConfig(status: OrderStatus) StatusConfig
        +renderOrderCards() ReactElement
        +renderDetailModal() ReactElement
    }

    class useQuery_OrderHistory {
        <<React Query>>
        +data: Order[]
        +isLoading: boolean
        +refetchInterval: 10000ms
    }

    class useQuery_OrderDetail {
        <<React Query>>
        +data: OrderDetail
        +enabled: boolean
    }

    class StatusConfig {
        +string label
        +string colorScheme
        +ReactElement icon
    }

    OrderHistoryPage --> useQuery_OrderHistory : uses
    OrderHistoryPage --> useQuery_OrderDetail : uses
    OrderHistoryPage --> StatusConfig : uses
```

---

## 주문 상태 설정

```mermaid
---
title: Status Configuration
---
classDiagram
    direction TB

    class StatusConfig {
        <<constant>>
        +string label
        +string colorScheme
        +IconType icon
    }

    class StatusConfigMap {
        <<Record~OrderStatus, StatusConfig~>>
    }

    class CHECKING_STOCK_Config {
        label: "재고 확인 중"
        colorScheme: "yellow"
        icon: TimeIcon
    }

    class RECEIVED_Config {
        label: "주문 접수"
        colorScheme: "blue"
        icon: CheckIcon
    }

    class IN_KITCHEN_Config {
        label: "조리 중"
        colorScheme: "orange"
        icon: SpinnerIcon
    }

    class COOKED_Config {
        label: "조리 완료"
        colorScheme: "green"
        icon: CheckCircleIcon
    }

    class DELIVERING_Config {
        label: "배달 중"
        colorScheme: "purple"
        icon: ArrowForwardIcon
    }

    class DELIVERED_Config {
        label: "배달 완료"
        colorScheme: "green"
        icon: CheckCircleIcon
    }

    class CANCELLED_Config {
        label: "주문 취소"
        colorScheme: "red"
        icon: CloseIcon
    }

    StatusConfigMap --> StatusConfig
    StatusConfigMap --> CHECKING_STOCK_Config
    StatusConfigMap --> RECEIVED_Config
    StatusConfigMap --> IN_KITCHEN_Config
    StatusConfigMap --> COOKED_Config
    StatusConfigMap --> DELIVERING_Config
    StatusConfigMap --> DELIVERED_Config
    StatusConfigMap --> CANCELLED_Config
```

---

## 주문 생성 흐름

```mermaid
---
title: Checkout Flow
---
sequenceDiagram
    participant U as User
    participant MO as MenuOrderPage
    participant CS as CartService
    participant OS as OrdersService
    participant API as Backend

    U->>MO: Click Checkout
    MO->>MO: Open Checkout Modal
    U->>MO: Enter delivery info
    U->>MO: Confirm order
    MO->>OS: checkout(CheckoutRequest)
    OS->>API: POST /orders/checkout
    API-->>OS: orderId
    OS-->>MO: orderId
    MO->>CS: invalidate cart query
    MO->>MO: Show success toast
    MO->>U: Navigate to order history
```

---

## 할인 계산

```mermaid
---
title: Discount Calculation
---
classDiagram
    direction LR

    class MemberGrade {
        <<enumeration>>
        NORMAL
        BRONZE
        SILVER
        GOLD
        VIP
    }

    class DiscountCalculation {
        <<logic>>
        +originalPrice: number
        +appliedGrade: MemberGrade
        +discountPercent: number
        +discountAmount: number
        +totalPrice: number
    }

    class DiscountFormula {
        <<formula>>
        discountPercent = GRADE_CONFIG[grade].discountPercent
        discountAmount = originalPrice × discountPercent / 100
        totalPrice = originalPrice - discountAmount
    }

    DiscountCalculation --> MemberGrade : uses
    DiscountCalculation --> DiscountFormula : applies
```

---

## 주문 상세 정보 구조

```mermaid
---
title: OrderDetail Structure
---
classDiagram
    direction TB

    class OrderDetail {
        +number orderId
        +string orderDate
        +string deliveryDate
        +string deliveredAt
        +string deliveryAddress
        +OrderStatus status
        +number originalPrice
        +MemberGrade appliedGrade
        +number discountPercent
        +number discountAmount
        +number totalPrice
        +number itemCount
        +OrderItem[] items
    }

    class OrderItem {
        +number itemId
        +number dinnerId
        +string dinnerName
        +string servingStyleName
        +number quantity
        +number price
        +BaseDish[] baseDishes
        +CustomizationResponse[] customizations
    }

    class BaseDish {
        +number dishId
        +string dishName
        +number quantity
    }

    class CustomizationResponse {
        +CustomizationAction action
        +number dishId
        +number quantity
        +string dishName
        +number pricePerUnit
    }

    OrderDetail *-- OrderItem : 1..*
    OrderItem *-- BaseDish : 1..*
    OrderItem *-- CustomizationResponse : 0..*
```
