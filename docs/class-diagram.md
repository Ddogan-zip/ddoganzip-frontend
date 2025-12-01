# DDogan Zip Frontend - Class Diagram (Updated)

이 문서는 DDogan Zip Frontend 애플리케이션의 클래스 다이어그램을 Mermaid 형식으로 제공합니다.
음성 주문 시스템 (Groq AI)이 추가된 최신 버전입니다.

## Mermaid Live Editor에서 보기

아래 다이어그램을 [Mermaid Live Editor (Playground)](https://mermaid.live/)에 붙여넣어 시각화할 수 있습니다.

---

## 1. 전체 아키텍처 개요

```mermaid
---
title: 또간집 프론트엔드 전체 아키텍처
---
classDiagram
    direction TB

    class PresentationLayer {
        <<layer>>
        Pages
        Components
    }

    class ContextLayer {
        <<layer>>
        AuthContext
        Providers
    }

    class ServiceLayer {
        <<layer>>
        API Services
        Groq Service
    }

    class DataLayer {
        <<layer>>
        Types
        Interfaces
    }

    PresentationLayer --> ContextLayer : uses
    ContextLayer --> ServiceLayer : uses
    ServiceLayer --> DataLayer : uses
```

---

## 2. 인증 및 회원 타입

```mermaid
---
title: 인증 및 회원 관련 타입
---
classDiagram
    direction TB

    class MemberGrade {
        <<enumeration>>
        NORMAL
        BRONZE
        SILVER
        GOLD
        VIP
    }

    class MemberGradeConfig {
        <<constant>>
        +string label
        +number discountPercent
        +string colorScheme
    }

    class RegisterRequest {
        <<interface>>
        +string email
        +string password
        +string name
        +string phoneNumber
        +string address
    }

    class LoginRequest {
        <<interface>>
        +string email
        +string password
    }

    class TokenResponse {
        <<interface>>
        +string accessToken
        +string refreshToken
        +string tokenType
    }

    class UserProfile {
        <<interface>>
        +number id
        +string email
        +string name
        +string address
        +string phone
        +MemberGrade memberGrade
        +number orderCount
    }

    class User {
        <<interface>>
        +string email
        +string name
        +string role
    }

    MemberGrade ..> MemberGradeConfig : maps to
    UserProfile --> MemberGrade : has
```

---

## 3. 메뉴 및 요리 타입

```mermaid
---
title: 메뉴 및 요리 타입 계층
---
classDiagram
    direction TB

    class DinnerMenuItem {
        <<interface>>
        +number dinnerId
        +string name
        +string description
        +number basePrice
        +string imageUrl
    }

    class DinnerDetail {
        <<interface>>
        +number dinnerId
        +string name
        +string description
        +number basePrice
        +string imageUrl
        +Dish[] dishes
        +ServingStyle[] availableStyles
    }

    class Dish {
        <<interface>>
        +number dishId
        +string name
        +string description
        +number basePrice
        +number defaultQuantity
    }

    class ServingStyle {
        <<interface>>
        +number styleId
        +string name
        +number additionalPrice
        +string description
    }

    DinnerMenuItem <|-- DinnerDetail : extends
    DinnerDetail "1" *-- "*" Dish : contains
    DinnerDetail "1" *-- "*" ServingStyle : has
```

---

## 4. 장바구니 및 커스터마이징 타입

```mermaid
---
title: 장바구니 관련 타입
---
classDiagram
    direction TB

    class CustomizationAction {
        <<enumeration>>
        ADD
        REMOVE
        REPLACE
    }

    class Customization {
        <<interface>>
        +CustomizationAction action
        +number dishId
        +number quantity
    }

    class CustomizationResponse {
        <<interface>>
        +CustomizationAction action
        +number dishId
        +string dishName
        +number quantity
        +number pricePerUnit
    }

    class CartItemRequest {
        <<interface>>
        +number dinnerId
        +number servingStyleId
        +number quantity
        +Customization[] customizations
    }

    class CartItem {
        <<interface>>
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
        <<interface>>
        +number cartId
        +CartItem[] items
        +number totalPrice
    }

    Customization --> CustomizationAction
    CustomizationResponse --> CustomizationAction
    CartItemRequest "1" *-- "*" Customization
    CartItem "1" *-- "*" CustomizationResponse
    CartResponse "1" *-- "*" CartItem
```

---

## 5. 주문 관련 타입

```mermaid
---
title: 주문 상태 및 주문 타입
---
classDiagram
    direction TB

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

    class CheckoutRequest {
        <<interface>>
        +string deliveryAddress
        +string deliveryDate
    }

    class BaseDish {
        <<interface>>
        +number dishId
        +string dishName
        +number quantity
    }

    class OrderItem {
        <<interface>>
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
        <<interface>>
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
        <<interface>>
        +OrderItem[] items
    }

    Order --> OrderStatus
    Order --> MemberGrade
    Order "1" *-- "*" OrderItem
    OrderItem "1" *-- "*" BaseDish
    OrderItem "1" *-- "*" CustomizationResponse
    Order <|-- OrderDetail : extends
```

---

## 6. 직원 관련 타입

```mermaid
---
title: 직원 대시보드 타입
---
classDiagram
    direction TB

    class ActiveOrder {
        <<interface>>
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
        <<interface>>
        +number dishId
        +string dishName
        +number currentStock
        +number minimumStock
    }

    class StaffAvailabilityResponse {
        <<interface>>
        +number availableCooks
        +number totalCooks
        +number availableDrivers
        +number totalDrivers
        +boolean canStartCooking
        +boolean canStartDelivery
    }

    class UpdateOrderStatusRequest {
        <<interface>>
        +OrderStatus status
    }

    ActiveOrder --> OrderStatus
    ActiveOrder "1" *-- "*" OrderItem
    UpdateOrderStatusRequest --> OrderStatus
```

---

## 7. API 서비스 계층

```mermaid
---
title: API 클라이언트 및 서비스
---
classDiagram
    direction TB

    class ApiClient {
        <<singleton>>
        -string baseURL
        -object headers
        +get~T~(url) Promise~T~
        +post~T~(url, data) Promise~T~
        +put~T~(url, data) Promise~T~
        +delete~T~(url) Promise~T~
        -addAuthToken(config) void
        -handleTokenRefresh(error) Promise
    }

    class TokenStorage {
        <<utility>>
        +getAccessToken() string
        +setAccessToken(token) void
        +getRefreshToken() string
        +setRefreshToken(token) void
        +clearTokens() void
    }

    class AuthAPI {
        <<service>>
        +register(data) Promise~void~
        +login(data) Promise~TokenResponse~
        +refreshToken(data) Promise~TokenResponse~
        +logout() Promise~void~
        +isAuthenticated() boolean
        +getUserProfile() Promise~UserProfile~
    }

    class MenuAPI {
        <<service>>
        +getMenuList() Promise~DinnerMenuItem[]~
        +getMenuDetails(id) Promise~DinnerDetail~
    }

    class CartAPI {
        <<service>>
        +getCart() Promise~CartResponse~
        +addCartItem(data) Promise~CartResponse~
        +updateCartItemQuantity(id, data) Promise~CartResponse~
        +removeCartItem(id) Promise~CartResponse~
        +customizeCartItem(id, data) Promise~CartResponse~
    }

    class OrdersAPI {
        <<service>>
        +checkout(data) Promise~number~
        +getOrderHistory() Promise~Order[]~
        +getOrderDetails(id) Promise~OrderDetail~
    }

    class StaffAPI {
        <<service>>
        +getActiveOrders() Promise~ActiveOrder[]~
        +updateOrderStatus(id, data) Promise~Order~
        +getInventory() Promise~InventoryItem[]~
        +getStaffAvailability() Promise~StaffAvailabilityResponse~
        +driverReturn(id) Promise~void~
    }

    ApiClient --> TokenStorage : uses
    AuthAPI --> ApiClient
    MenuAPI --> ApiClient
    CartAPI --> ApiClient
    OrdersAPI --> ApiClient
    StaffAPI --> ApiClient
```

---

## 8. Groq AI 음성 주문 서비스

```mermaid
---
title: Groq AI 음성 주문 서비스
---
classDiagram
    direction TB

    class ChatMessage {
        <<interface>>
        +string role
        +string content
    }

    class OrderState {
        <<interface>>
        +string dinnerName
        +number dinnerId
        +string servingStyle
        +number servingStyleId
        +number quantity
        +VoiceCustomization[] customizations
        +string deliveryDate
        +boolean isConfirmed
    }

    class VoiceCustomization {
        <<interface>>
        +string dishName
        +number dishId
        +number quantity
        +string action
    }

    class AIResponse {
        <<interface>>
        +string message
        +OrderState orderState
        +string action
    }

    class GroqService {
        <<service>>
        -string GROQ_API_KEY
        -string GROQ_API_URL
        +createSystemPrompt(name, items, details) string
        +chatWithAI(messages, name, items, details) Promise~AIResponse~
        +getInitialGreeting(name) string
        +speakText(text, onEnd) void
        +stopSpeaking() void
    }

    OrderState "1" *-- "*" VoiceCustomization
    AIResponse *-- OrderState
    GroqService --> ChatMessage : uses
    GroqService --> AIResponse : returns
```

---

## 9. Context 및 상태 관리

```mermaid
---
title: 인증 Context
---
classDiagram
    direction TB

    class AuthContextType {
        <<interface>>
        +User user
        +boolean isAuthenticated
        +boolean isLoading
        +login(data) Promise~void~
        +register(data) Promise~void~
        +logout() void
    }

    class AuthProvider {
        <<component>>
        -User user
        -boolean isLoading
        -initAuth() void
        -handleLogin(data) Promise~void~
        -handleRegister(data) Promise~void~
        -handleLogout() void
        +render() ReactNode
    }

    class useAuth {
        <<hook>>
        +call() AuthContextType
    }

    AuthContextType --> User
    AuthProvider ..|> AuthContextType : provides
    useAuth --> AuthContextType : returns
    AuthProvider --> AuthAPI : uses
    AuthProvider --> TokenStorage : uses
```

---

## 10. 컴포넌트 계층

```mermaid
---
title: 라우트 보호 및 음성 주문 컴포넌트
---
classDiagram
    direction TB

    class ProtectedRoute {
        <<component>>
        +ReactNode children
        -useAuth() AuthContextType
        +render() ReactNode
    }

    class StaffRoute {
        <<component>>
        +ReactNode children
        -useAuth() AuthContextType
        +render() ReactNode
    }

    class VoiceOrderModalProps {
        <<interface>>
        +boolean isOpen
        +function onClose
        +string customerName
        +DinnerMenuItem[] menuItems
        +Map menuDetails
        +function onOrderComplete
    }

    class ConversationItem {
        <<interface>>
        +string role
        +string content
        +Date timestamp
    }

    class VoiceOrderModal {
        <<component>>
        +VoiceOrderModalProps props
        -ConversationItem[] conversation
        -ChatMessage[] chatHistory
        -OrderState orderState
        -boolean isProcessing
        -boolean isSpeaking
        -boolean isMuted
        -boolean isListeningActive
        -startListening() void
        -stopListening() void
        -processUserInput(text) Promise~void~
        -handleOrderConfirm(state) void
        -toggleMicrophone() void
        -toggleMute() void
        +render() ReactNode
    }

    ProtectedRoute --> useAuth
    StaffRoute --> ProtectedRoute : wraps
    StaffRoute --> useAuth
    VoiceOrderModal --> VoiceOrderModalProps
    VoiceOrderModal --> ConversationItem
    VoiceOrderModal --> GroqService
```

---

## 11. 페이지 컴포넌트

```mermaid
---
title: 페이지 컴포넌트 구조
---
classDiagram
    direction TB

    class Layout {
        <<component>>
        -useLocation() Location
        -useAuth() AuthContextType
        -isActive(path) boolean
        +render() ReactNode
    }

    class LoginPage {
        <<component>>
        -LoginRequest formData
        -useAuth() AuthContextType
        -handleSubmit() Promise~void~
        +render() ReactNode
    }

    class RegisterPage {
        <<component>>
        -RegisterRequest formData
        -useAuth() AuthContextType
        -handleSubmit() Promise~void~
        +render() ReactNode
    }

    class MenuBrowsePage {
        <<component>>
        -number selectedDinnerId
        -DinnerMenuItem[] menuList
        -DinnerDetail menuDetail
        +render() ReactNode
    }

    Layout --> useAuth
    LoginPage --> useAuth
    RegisterPage --> useAuth
    MenuBrowsePage --> MenuAPI
```

```mermaid
---
title: MenuOrderPage 상세 구조
---
classDiagram
    direction TB

    class MenuOrderPage {
        <<component>>
        -DinnerMenuItem[] menuItems
        -CartResponse cartData
        -UserProfile userProfile
        -Map menuDetailsCache
        -DinnerDetail selectedDinner
        -string selectedStyleId
        -number quantity
        -Map customizations
        -string deliveryAddress
        -string deliveryDate
        -boolean isProcessing
        -boolean isDetailOpen
        -boolean isCheckoutOpen
        -boolean isVoiceOrderOpen
        +handleMenuClick(dinner) Promise~void~
        +handleVoiceOrderOpen() Promise~void~
        +handleVoiceOrderComplete(order, date) void
        +handleAddToCart() void
        +handleCheckout() void
        +handleConfirmCheckout() void
        +render() ReactNode
    }

    MenuOrderPage --> MenuAPI : queries
    MenuOrderPage --> CartAPI : mutations
    MenuOrderPage --> OrdersAPI : checkout
    MenuOrderPage --> VoiceOrderModal : contains
    MenuOrderPage --> useAuth
```

```mermaid
---
title: 주문 내역 및 직원 페이지
---
classDiagram
    direction TB

    class OrderHistoryPage {
        <<component>>
        -Order[] orders
        -OrderDetail orderDetail
        -number selectedOrderId
        -boolean isDetailOpen
        +render() ReactNode
    }

    class StaffDashboardPage {
        <<component>>
        -ActiveOrder[] activeOrders
        -InventoryItem[] inventory
        -StaffAvailabilityResponse availability
        -number selectedOrderId
        +handleStatusChange(id, status) void
        +handleDriverReturn(id) void
        +render() ReactNode
    }

    OrderHistoryPage --> OrdersAPI
    StaffDashboardPage --> StaffAPI
    StaffDashboardPage --> OrdersAPI
```

---

## 12. 전체 모듈 의존성

```mermaid
---
title: 모듈 간 의존성 관계
---
flowchart TB
    subgraph External["External Libraries"]
        ReactQuery["@tanstack/react-query"]
        ChakraUI["@chakra-ui/react"]
        SpeechRec["react-speech-recognition"]
        Axios["axios"]
    end

    subgraph DataLayer["Data Layer"]
        Types["types.ts"]
    end

    subgraph ServiceLayer["Service Layer"]
        ApiClient["client.ts"]
        AuthAPI["auth.ts"]
        MenuAPI["menu.ts"]
        CartAPI["cart.ts"]
        OrdersAPI["orders.ts"]
        StaffAPI["staff.ts"]
        GroqSvc["groqService.ts"]
    end

    subgraph ContextLayer["Context Layer"]
        AuthCtx["AuthContext.tsx"]
    end

    subgraph ComponentLayer["Component Layer"]
        ProtRoute["ProtectedRoute.tsx"]
        StaffRt["StaffRoute.tsx"]
        VoiceModal["VoiceOrderModal.tsx"]
    end

    subgraph PageLayer["Page Layer"]
        Layout["Layout"]
        LoginPg["LoginPage"]
        RegPg["RegisterPage"]
        MenuBrw["MenuBrowsePage"]
        MenuOrd["MenuOrderPage"]
        OrderHist["OrderHistoryPage"]
        StaffDash["StaffDashboardPage"]
    end

    ApiClient --> Axios
    ApiClient --> Types
    AuthAPI --> ApiClient
    MenuAPI --> ApiClient
    CartAPI --> ApiClient
    OrdersAPI --> ApiClient
    StaffAPI --> ApiClient
    GroqSvc --> Types

    AuthCtx --> AuthAPI

    ProtRoute --> AuthCtx
    StaffRt --> ProtRoute
    VoiceModal --> GroqSvc
    VoiceModal --> SpeechRec
    VoiceModal --> ChakraUI

    Layout --> AuthCtx
    LoginPg --> AuthCtx
    RegPg --> AuthCtx
    MenuBrw --> MenuAPI
    MenuBrw --> ReactQuery

    MenuOrd --> MenuAPI
    MenuOrd --> CartAPI
    MenuOrd --> OrdersAPI
    MenuOrd --> AuthCtx
    MenuOrd --> VoiceModal
    MenuOrd --> ReactQuery
    MenuOrd --> ChakraUI

    OrderHist --> OrdersAPI
    OrderHist --> ReactQuery

    StaffDash --> StaffAPI
    StaffDash --> ReactQuery
```

---

## 13. 음성 주문 데이터 흐름

```mermaid
---
title: 음성 주문 시퀀스 다이어그램
---
sequenceDiagram
    autonumber
    participant U as 사용자
    participant V as VoiceOrderModal
    participant SR as SpeechRecognition
    participant G as GroqService
    participant TTS as Web Speech TTS
    participant C as CartAPI
    participant B as Backend

    U->>V: 음성 주문 버튼 클릭
    V->>TTS: 인사말 재생
    TTS-->>U: "안녕하세요, OOO 고객님..."

    loop 대화 진행
        U->>SR: 음성 입력
        SR->>V: transcript 전달
        V->>G: chatWithAI(messages)
        G->>G: Groq LLM API 호출
        G-->>V: AIResponse 반환
        V->>V: orderState 업데이트
        V->>TTS: 응답 메시지 재생
        TTS-->>U: AI 응답 음성
    end

    U->>SR: "맞아요" (주문 확인)
    SR->>V: 확인 메시지
    V->>G: chatWithAI (confirm)
    G-->>V: action: "confirm"
    V->>C: addCartItem(orderRequest)
    C->>B: POST /api/cart/items
    B-->>C: CartResponse
    C-->>V: 성공
    V-->>U: 주문 완료 토스트
```

---

## 사용법

### Mermaid Live Editor
1. https://mermaid.live 접속
2. 위 코드 블록 중 원하는 다이어그램 복사
3. Editor에 붙여넣기
4. 실시간 렌더링 확인 및 PNG/SVG 다운로드

### GitHub
GitHub은 Markdown 파일의 Mermaid 코드 블록을 자동으로 렌더링합니다.

### VS Code
"Markdown Preview Mermaid Support" 또는 "Mermaid Markdown Syntax Highlighting" 확장 설치 후 미리보기 (Ctrl+Shift+V)
