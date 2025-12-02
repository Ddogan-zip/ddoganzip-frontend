# Voice Recognition - Sequence Diagrams

This document contains sequence diagrams for the voice recognition feature that uses Groq API for menu recommendation and cart management.

---

## Overview

The voice recognition feature allows users to:
1. Request menu recommendations via voice commands
2. Add recommended items to cart
3. Proceed to checkout using voice commands

---

# Part 1: Sequence Diagrams (User-System Interaction)

Simple sequence diagrams showing interactions between User and System.

---

## 1-1. Voice Menu Recommendation

```mermaid
sequenceDiagram
    actor User
    participant System

    User->>System: Speak voice command (e.g., "프렌치 디너 주문해줘")
    System->>System: Recognize speech and convert to text
    System->>System: Analyze command with Groq API
    System-->>User: Display recommended menu with details
    User->>System: Confirm menu selection
    System-->>User: Open menu detail modal with serving styles
```

---

## 1-2. Voice Add to Cart

```mermaid
sequenceDiagram
    actor User
    participant System

    User->>System: Select serving style and quantity
    User->>System: Click "Add to Cart" button
    System->>System: Add item to cart
    System-->>User: Display updated cart with new item
    System-->>User: Show success toast notification
```

---

## 1-3. Voice Checkout

```mermaid
sequenceDiagram
    actor User
    participant System

    User->>System: Speak checkout command (e.g., "결제해줘")
    System->>System: Recognize speech and convert to text
    System->>System: Analyze command with Groq API
    System-->>User: Open checkout modal
    User->>System: Enter delivery address and date
    User->>System: Confirm checkout
    System->>System: Create order with member grade discount
    System-->>User: Display order confirmation with order ID
```

---

## 1-4. Complete Voice Order Flow

```mermaid
sequenceDiagram
    actor User
    participant System

    Note over User,System: Voice Menu Recommendation
    User->>System: Speak menu order command
    System-->>User: Display recommended menu

    Note over User,System: Add to Cart
    User->>System: Select options and add to cart
    System-->>User: Update cart display

    Note over User,System: Voice Checkout
    User->>System: Speak checkout command
    System-->>User: Open checkout modal
    User->>System: Confirm order details
    System-->>User: Display order confirmation
```

---

# Part 2: System Sequence Diagrams (Detailed Layer Interaction)

Detailed sequence diagrams showing interactions between User, GUI, Controller, Service, and Repository layers.

---

## 2-1. Voice Command Processing with Groq API

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant VoiceController
    participant VoiceService
    participant GroqAPI
    participant MenuRepository

    User->>GUI: Speak voice command (e.g., "프렌치 디너 주문해줘")
    Note over GUI: Web Speech API captures audio
    GUI->>GUI: Convert speech to text (transcript)

    GUI->>VoiceController: POST /api/voice/process (VoiceCommandRequest)
    VoiceController->>VoiceService: processVoiceCommand(transcript)

    Note over VoiceService: Send transcript to Groq for analysis
    VoiceService->>GroqAPI: analyzeCommand(transcript)
    GroqAPI-->>VoiceService: VoiceCommand (action, dinner_type, serving_style, quantity, reply)

    alt action = "order"
        Note over VoiceService: Find matching menu
        VoiceService->>MenuRepository: findByNameContaining(dinner_type)
        MenuRepository-->>VoiceService: List<Dinner>

        alt Menu found
            VoiceService-->>VoiceController: VoiceCommandResponse (action, dinner, reply)
            VoiceController-->>GUI: 200 OK (VoiceCommandResponse)
            GUI-->>User: Display recommended menu, open detail modal
        else Menu not found
            VoiceService-->>VoiceController: VoiceCommandResponse (action: "unknown", reply: "메뉴를 찾을 수 없습니다")
            VoiceController-->>GUI: 200 OK (VoiceCommandResponse)
            GUI-->>User: Display "menu not found" message
        end

    else action = "checkout"
        VoiceService-->>VoiceController: VoiceCommandResponse (action: "checkout", reply)
        VoiceController-->>GUI: 200 OK (VoiceCommandResponse)
        GUI-->>User: Open checkout modal

    else action = "unknown"
        VoiceService-->>VoiceController: VoiceCommandResponse (action: "unknown", reply)
        VoiceController-->>GUI: 200 OK (VoiceCommandResponse)
        GUI-->>User: Display "please try again" message
    end
```

---

## 2-2. Voice Menu Recommendation and Selection

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant VoiceController
    participant VoiceService
    participant GroqAPI
    participant MenuController
    participant MenuService
    participant MenuRepository

    User->>GUI: Speak voice command (e.g., "이탈리안 디너 추천해줘")
    Note over GUI: SpeechRecognition.startListening({ continuous: true, language: "ko-KR" })
    GUI->>GUI: Capture finalTranscript

    GUI->>VoiceController: POST /api/voice/process (VoiceCommandRequest)
    VoiceController->>VoiceService: processVoiceCommand(transcript)

    Note over VoiceService: Analyze with Groq API
    VoiceService->>GroqAPI: analyzeCommand(transcript)
    GroqAPI-->>VoiceService: VoiceCommand (action: "order", dinner_type: "이탈리안 디너")

    VoiceService->>MenuRepository: findByNameContaining("이탈리안")
    MenuRepository-->>VoiceService: Dinner

    VoiceService-->>VoiceController: VoiceCommandResponse (dinner, reply: "이탈리안 디너를 추천합니다")
    VoiceController-->>GUI: 200 OK (VoiceCommandResponse)

    Note over GUI: User confirmed recommendation
    GUI->>MenuController: GET /api/menu/details/{dinnerId}
    MenuController->>MenuService: getMenuDetails(dinnerId)

    MenuService->>MenuRepository: findByIdWithDishes(dinnerId)
    MenuRepository-->>MenuService: Dinner (with dishes)
    MenuService->>MenuRepository: findByIdWithStyles(dinnerId)
    MenuRepository-->>MenuService: Dinner (with styles)

    MenuService-->>MenuController: MenuDetailResponse
    MenuController-->>GUI: 200 OK (MenuDetailResponse)
    GUI-->>User: Display menu detail modal (dishes, servingStyles, prices)
```

---

## 2-3. Voice Add to Cart

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant CartController
    participant CartService
    participant AuthRepository
    participant CartRepository
    participant MenuRepository
    participant ServingStyleRepository

    Note over User,GUI: User selects serving style and quantity in modal
    User->>GUI: Select serving style and quantity
    User->>GUI: Click "Add to Cart" button

    GUI->>CartController: POST /api/cart/items (AddToCartRequest)
    Note over GUI: AddToCartRequest: { dinnerId, servingStyleId, quantity, customizations? }
    CartController->>CartService: addItemToCart(request)

    Note over CartService: Get current customer
    CartService->>AuthRepository: findByEmail(email from SecurityContext)
    AuthRepository-->>CartService: Customer

    CartService->>CartRepository: findByCustomerId(customerId)
    CartRepository-->>CartService: Cart

    Note over CartService: Validate dinner and serving style
    CartService->>MenuRepository: findById(dinnerId)
    MenuRepository-->>CartService: Dinner
    CartService->>ServingStyleRepository: findById(servingStyleId)
    ServingStyleRepository-->>CartService: ServingStyle

    Note over CartService: Create CartItem and add to cart
    CartService->>CartRepository: save(cart)
    CartRepository-->>CartService: Cart

    CartService-->>CartController: void
    CartController->>CartService: getCart()
    CartService-->>CartController: CartResponse
    CartController-->>GUI: 200 OK (CartResponse)
    GUI-->>User: Display updated cart, show success toast
```

---

## 2-4. Voice Checkout

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant VoiceController
    participant VoiceService
    participant GroqAPI
    participant OrderController
    participant OrderService
    participant CartRepository
    participant AuthRepository
    participant OrderRepository

    User->>GUI: Speak checkout command (e.g., "결제해줘")
    GUI->>GUI: Capture finalTranscript

    GUI->>VoiceController: POST /api/voice/process (VoiceCommandRequest)
    VoiceController->>VoiceService: processVoiceCommand(transcript)

    VoiceService->>GroqAPI: analyzeCommand(transcript)
    GroqAPI-->>VoiceService: VoiceCommand (action: "checkout", reply: "장바구니를 결제할게요")

    VoiceService-->>VoiceController: VoiceCommandResponse (action: "checkout")
    VoiceController-->>GUI: 200 OK (VoiceCommandResponse)
    GUI-->>User: Open checkout modal

    Note over User,GUI: User enters delivery info
    User->>GUI: Enter delivery address and date
    User->>GUI: Click "Confirm Order" button

    GUI->>OrderController: POST /api/orders/checkout (CheckoutRequest)
    OrderController->>OrderService: checkout(request)

    OrderService->>CartRepository: findByCustomerIdWithItems(customerId)
    CartRepository-->>OrderService: Cart with items

    alt Cart is empty
        OrderService-->>OrderController: throw CustomException("Cart is empty")
        OrderController-->>GUI: 400 Bad Request
        GUI-->>User: Display error "Cart is empty"
    else Cart has items
        Note over OrderService: Calculate originalPrice
        Note over OrderService: Apply memberGrade discount
        Note over OrderService: discountAmount = originalPrice * discountPercent / 100
        Note over OrderService: totalPrice = originalPrice - discountAmount

        OrderService->>OrderRepository: save(order)
        OrderRepository-->>OrderService: savedOrder

        Note over OrderService: upgradeCustomerGrade()
        OrderService->>AuthRepository: save(customer)
        AuthRepository-->>OrderService: Customer

        Note over OrderService: Clear cart items
        OrderService->>CartRepository: clearItems & save
        CartRepository-->>OrderService: Cart

        OrderService-->>OrderController: orderId
        OrderController-->>GUI: 200 OK (orderId)
        GUI-->>User: Display order confirmation with applied discount
    end
```

---

## 2-5. Complete Voice Order Flow (End-to-End)

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant VoiceController
    participant VoiceService
    participant GroqAPI
    participant MenuController
    participant MenuService
    participant CartController
    participant CartService
    participant OrderController
    participant OrderService
    participant MenuRepository
    participant CartRepository
    participant OrderRepository
    participant AuthRepository

    Note over User,GUI: Step 1: Voice Command Recognition
    User->>GUI: Speak "프렌치 디너 주문해줘"
    GUI->>GUI: Web Speech API captures audio
    GUI->>GUI: Convert to text (finalTranscript)

    Note over GUI,GroqAPI: Step 2: Groq API Analysis
    GUI->>VoiceController: POST /api/voice/process
    VoiceController->>VoiceService: processVoiceCommand(transcript)
    VoiceService->>GroqAPI: analyzeCommand(transcript)
    GroqAPI-->>VoiceService: VoiceCommand (action: "order", dinner_type: "프렌치 디너")

    Note over VoiceService,MenuRepository: Step 3: Menu Search
    VoiceService->>MenuRepository: findByNameContaining("프렌치")
    MenuRepository-->>VoiceService: Dinner
    VoiceService-->>VoiceController: VoiceCommandResponse
    VoiceController-->>GUI: 200 OK

    Note over GUI,MenuService: Step 4: Get Menu Details
    GUI->>MenuController: GET /api/menu/details/{dinnerId}
    MenuController->>MenuService: getMenuDetails(dinnerId)
    MenuService->>MenuRepository: findByIdWithDishes(dinnerId)
    MenuRepository-->>MenuService: Dinner with dishes
    MenuService-->>MenuController: MenuDetailResponse
    MenuController-->>GUI: 200 OK
    GUI-->>User: Display menu detail modal

    Note over User,CartService: Step 5: Add to Cart
    User->>GUI: Select serving style, click "Add to Cart"
    GUI->>CartController: POST /api/cart/items
    CartController->>CartService: addItemToCart(request)
    CartService->>CartRepository: save(cart)
    CartRepository-->>CartService: Cart
    CartService-->>CartController: CartResponse
    CartController-->>GUI: 200 OK
    GUI-->>User: Show success toast, update cart display

    Note over User,GroqAPI: Step 6: Voice Checkout Command
    User->>GUI: Speak "결제해줘"
    GUI->>VoiceController: POST /api/voice/process
    VoiceController->>VoiceService: processVoiceCommand(transcript)
    VoiceService->>GroqAPI: analyzeCommand(transcript)
    GroqAPI-->>VoiceService: VoiceCommand (action: "checkout")
    VoiceService-->>VoiceController: VoiceCommandResponse
    VoiceController-->>GUI: 200 OK
    GUI-->>User: Open checkout modal

    Note over User,OrderService: Step 7: Complete Order
    User->>GUI: Enter delivery info, confirm
    GUI->>OrderController: POST /api/orders/checkout
    OrderController->>OrderService: checkout(request)
    OrderService->>CartRepository: findByCustomerIdWithItems()
    CartRepository-->>OrderService: Cart with items
    OrderService->>OrderRepository: save(order)
    OrderRepository-->>OrderService: savedOrder
    OrderService->>AuthRepository: save(customer)
    OrderService->>CartRepository: clearItems & save
    OrderService-->>OrderController: orderId
    OrderController-->>GUI: 200 OK (orderId)
    GUI-->>User: Display order confirmation
```

---

# Appendix

## Voice Command Types

| Action | Trigger Keywords | Description |
|--------|-----------------|-------------|
| order | "주문", "추천", "시켜줘" | Request menu recommendation |
| checkout | "결제", "체크아웃", "주문완료" | Proceed to checkout |
| cancel | "취소", "삭제" | Cancel current action |
| unknown | (unrecognized) | Unrecognized command |

## VoiceCommand Interface

```typescript
interface VoiceCommand {
  action: "order" | "cancel" | "checkout" | "unknown";
  dinner_type?: string;      // Recommended dinner name
  serving_style?: string;    // Suggested serving style
  quantity?: number;         // Suggested quantity
  reply: string;             // Response message to display
}
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/voice/process | Process voice command with Groq API |
| GET | /api/menu/list | Get all menu items |
| GET | /api/menu/details/{id} | Get menu details with dishes and styles |
| POST | /api/cart/items | Add item to cart |
| GET | /api/cart | Get current cart |
| POST | /api/orders/checkout | Create order from cart |

## Technology Stack

| Component | Technology |
|-----------|------------|
| Speech Recognition | Web Speech API (react-speech-recognition) |
| Voice Command Analysis | Groq API (LLM) |
| Frontend | React + TypeScript |
| State Management | React Query |
| Backend | Spring Boot |

## Error Handling

| Error Case | User Feedback |
|-----------|---------------|
| Browser doesn't support speech | Display alert: "Chrome 브라우저를 사용해주세요" |
| Menu not found | Toast: "{menu_name} 메뉴를 찾을 수 없습니다" |
| Cart is empty | Toast: "장바구니가 비어있습니다" |
| Voice command unrecognized | Toast: "다시 말씀해주세요" |
| Network error | Toast with error message |
