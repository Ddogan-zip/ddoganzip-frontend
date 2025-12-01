# Level 2: 메뉴 & 장바구니

[< 목차로 돌아가기](./README.md)

---

## 개요

메뉴 조회, 커스터마이징, 장바구니 관리와 관련된 클래스들입니다.

---

## 메뉴 타입

```mermaid
---
title: Menu Types
---
classDiagram
    direction TB

    class DinnerMenuItem {
        +number dinnerId
        +string name
        +string description
        +number basePrice
        +string imageUrl
    }

    class DinnerDetail {
        +number dinnerId
        +string name
        +string description
        +number basePrice
        +string imageUrl
        +Dish[] dishes
        +ServingStyle[] availableStyles
    }

    class Dish {
        +number dishId
        +string name
        +string description
        +number basePrice
        +number defaultQuantity
    }

    class ServingStyle {
        +number styleId
        +string name
        +number additionalPrice
        +string description
    }

    DinnerDetail --|> DinnerMenuItem : extends
    DinnerDetail *-- Dish : contains 1..*
    DinnerDetail *-- ServingStyle : contains 1..*
```

---

## 커스터마이징 타입

```mermaid
---
title: Customization Types
---
classDiagram
    direction LR

    class CustomizationAction {
        <<enumeration>>
        ADD
        REMOVE
        REPLACE
    }

    class Customization {
        +CustomizationAction action
        +number dishId
        +number quantity
    }

    class CustomizationResponse {
        +CustomizationAction action
        +number dishId
        +number quantity
        +string dishName
        +number pricePerUnit
    }

    Customization --> CustomizationAction : uses
    CustomizationResponse --|> Customization : extends
    CustomizationResponse --> CustomizationAction : uses
```

---

## 장바구니 타입

```mermaid
---
title: Cart Types
---
classDiagram
    direction TB

    class CartItemRequest {
        +number dinnerId
        +number servingStyleId
        +number quantity
        +Customization[] customizations
    }

    class CartItem {
        +number itemId
        +number dinnerId
        +string dinnerName
        +number dinnerBasePrice
        +number servingStyleId
        +string servingStyleName
        +number servingStylePrice
        +number quantity
        +number itemTotalPrice
        +CustomizationResponse[] customizations
    }

    class CartResponse {
        +number cartId
        +CartItem[] items
        +number totalPrice
    }

    class UpdateQuantityRequest {
        +number quantity
    }

    class UpdateOptionsRequest {
        +number servingStyleId
        +Customization[] customizations
    }

    class CustomizeItemRequest {
        +CustomizationAction action
        +number dishId
        +number quantity
    }

    CartItemRequest o-- Customization : 0..*
    CartItem *-- CustomizationResponse : 0..*
    CartResponse *-- CartItem : 0..*
    UpdateOptionsRequest o-- Customization : 0..*
    CustomizeItemRequest --> CustomizationAction : uses
```

---

## 메뉴 & 장바구니 서비스

```mermaid
---
title: Menu & Cart Services
---
classDiagram
    direction TB

    class MenuService {
        <<service>>
        +getMenuList() Promise~DinnerMenuItem[]~
        +getMenuDetails(dinnerId: number) Promise~DinnerDetail~
    }

    class CartService {
        <<service>>
        +getCart() Promise~CartResponse~
        +addCartItem(data: CartItemRequest) Promise~CartResponse~
        +updateCartItemQuantity(itemId: number, data: UpdateQuantityRequest) Promise~CartResponse~
        +updateCartItemOptions(itemId: number, data: UpdateOptionsRequest) Promise~CartResponse~
        +removeCartItem(itemId: number) Promise~CartResponse~
        +customizeCartItem(itemId: number, data: CustomizeItemRequest) Promise~CartResponse~
    }

    class ApiClient {
        <<singleton>>
    }

    MenuService --> ApiClient : uses
    MenuService --> DinnerMenuItem : returns
    MenuService --> DinnerDetail : returns

    CartService --> ApiClient : uses
    CartService --> CartItemRequest : accepts
    CartService --> CartResponse : returns
    CartService --> UpdateQuantityRequest : accepts
    CartService --> UpdateOptionsRequest : accepts
```

---

## 메뉴 브라우즈 페이지

```mermaid
---
title: MenuBrowsePage
---
classDiagram
    direction TB

    class MenuBrowsePage {
        <<page>>
        -number | null selectedDinnerId
        -boolean isModalOpen
        -DinnerMenuItem[] menuList
        -DinnerDetail | undefined menuDetail
        +handleMenuClick(dinnerId: number) void
        +handleOrderClick(dinnerId: number) void
        +renderMenuGrid() ReactElement
        +renderDetailModal() ReactElement
    }

    class useQuery_MenuList {
        <<React Query>>
        +data: DinnerMenuItem[]
        +isLoading: boolean
        +error: Error
    }

    class useQuery_MenuDetail {
        <<React Query>>
        +data: DinnerDetail
        +isLoading: boolean
        +enabled: boolean
    }

    MenuBrowsePage --> useQuery_MenuList : uses
    MenuBrowsePage --> useQuery_MenuDetail : uses
    MenuBrowsePage --> MenuService : via query
```

---

## 메뉴 주문 페이지

```mermaid
---
title: MenuOrderPage - State & Methods
---
classDiagram
    direction TB

    class MenuOrderPage {
        <<page>>
        -DinnerDetail | null selectedDinner
        -string selectedStyleId
        -number quantity
        -Map~number, Customization~ customizations
        -string deliveryAddress
        -string deliveryDate
        -VoiceCommand | null voiceResult
        -boolean isProcessing
    }

    class MenuOrderPage_Methods {
        <<methods>>
        +handleMenuClick(dinner: DinnerDetail) void
        +handleAddToCart() Promise~void~
        +handleCustomizationQuantityChange(dishId, currentQty, defaultQty) void
        +handleCheckout() void
        +handleConfirmCheckout() Promise~void~
        +processVoiceInput(transcript: string) Promise~void~
        +calculateItemPrice() number
    }

    class MenuOrderPage_UI {
        <<render methods>>
        +renderVoiceSection() ReactElement
        +renderCartSection() ReactElement
        +renderMenuList() ReactElement
        +renderDetailModal() ReactElement
        +renderCheckoutModal() ReactElement
    }

    MenuOrderPage --> MenuOrderPage_Methods
    MenuOrderPage --> MenuOrderPage_UI
```

---

## 메뉴 주문 페이지 - 의존성

```mermaid
---
title: MenuOrderPage Dependencies
---
classDiagram
    direction TB

    class MenuOrderPage {
        <<page>>
    }

    class useQuery_MenuItems {
        <<React Query>>
        +data: DinnerMenuItem[]
    }

    class useQuery_Cart {
        <<React Query>>
        +data: CartResponse
    }

    class useQuery_UserProfile {
        <<React Query>>
        +data: UserProfile
    }

    class useMutation_AddToCart {
        <<React Query>>
        +mutate(CartItemRequest) void
    }

    class useMutation_UpdateQuantity {
        <<React Query>>
        +mutate(itemId, UpdateQuantityRequest) void
    }

    class useMutation_RemoveItem {
        <<React Query>>
        +mutate(itemId) void
    }

    class useMutation_Checkout {
        <<React Query>>
        +mutate(CheckoutRequest) void
    }

    class useSpeechRecognition {
        <<react-speech-recognition>>
        +transcript: string
        +listening: boolean
        +startListening() void
        +stopListening() void
    }

    MenuOrderPage --> useQuery_MenuItems
    MenuOrderPage --> useQuery_Cart
    MenuOrderPage --> useQuery_UserProfile
    MenuOrderPage --> useMutation_AddToCart
    MenuOrderPage --> useMutation_UpdateQuantity
    MenuOrderPage --> useMutation_RemoveItem
    MenuOrderPage --> useMutation_Checkout
    MenuOrderPage --> useSpeechRecognition
```

---

## 음성 인식

```mermaid
---
title: Voice Recognition
---
classDiagram
    direction LR

    class VoiceAction {
        <<enumeration>>
        order
        cancel
        checkout
        unknown
    }

    class VoiceCommand {
        +VoiceAction action
        +string dinner_type
        +string serving_style
        +number quantity
        +string reply
    }

    class VoiceService {
        <<service>>
        +processVoiceCommand(transcript: string) Promise~VoiceCommand~
    }

    VoiceCommand --> VoiceAction : uses
    VoiceService --> VoiceCommand : returns
```

---

## 가격 계산 로직

```mermaid
---
title: Price Calculation Flow
---
flowchart TB
    subgraph Input["입력"]
        BP[Dinner basePrice]
        SS[ServingStyle additionalPrice]
        QTY[Quantity]
        CUST[Customizations]
    end

    subgraph Calculation["계산"]
        ITEM_BASE["itemBase = basePrice + stylePrice"]
        CUST_PRICE["custPrice = SUM(action × dishPrice × qty)"]
        ITEM_TOTAL["itemTotal = (itemBase + custPrice) × quantity"]
    end

    subgraph Discount["할인"]
        GRADE[MemberGrade]
        DISC["discountAmount = itemTotal × discountPercent"]
        FINAL["finalPrice = itemTotal - discountAmount"]
    end

    BP --> ITEM_BASE
    SS --> ITEM_BASE
    ITEM_BASE --> ITEM_TOTAL
    CUST --> CUST_PRICE
    CUST_PRICE --> ITEM_TOTAL
    QTY --> ITEM_TOTAL
    ITEM_TOTAL --> DISC
    GRADE --> DISC
    DISC --> FINAL
```
