# Member Grade Discount - Sequence Diagrams

This document contains sequence diagrams for the member grade discount feature.

---

## 1. Get User Profile (Member Grade Info)

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant AuthController
    participant AuthService
    participant AuthRepository

    User->>GUI: Navigate to cart/checkout page
    GUI->>AuthController: GET /api/auth/me (Authorization: Bearer token)
    AuthController->>AuthService: getUserProfile()

    Note over AuthService: Get current authenticated user from SecurityContext
    AuthService->>AuthRepository: findByEmail(email)
    AuthRepository-->>AuthService: Customer

    alt Customer not found
        AuthService-->>AuthController: throw CustomException("Customer not found")
        AuthController-->>GUI: 404 Not Found
        GUI-->>User: Display error message
    else Customer found
        Note over AuthService: Build UserProfile response
        AuthService-->>AuthController: UserProfileResponse (id, email, name, address, phone, memberGrade, orderCount)
        AuthController-->>GUI: 200 OK (UserProfileResponse)
        GUI-->>User: Display member grade badge and discount info
    end
```

### Request
- **Method:** GET
- **Endpoint:** `/api/auth/me`
- **Headers:** `Authorization: Bearer {accessToken}`
- **Body:** None

### Response
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "address": "123 Main St",
  "phone": "010-1234-5678",
  "memberGrade": "SILVER",
  "orderCount": 12
}
```

---

## 2. Checkout with Member Grade Discount

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant OrderController
    participant OrderService
    participant AuthRepository
    participant CartRepository
    participant OrderRepository

    User->>GUI: Enter delivery address and date, click checkout
    GUI->>OrderController: POST /api/orders/checkout (CheckoutRequest)
    OrderController->>OrderService: checkout(request)

    Note over OrderService: Get current customer with member grade
    OrderService->>AuthRepository: findByEmail(email)
    AuthRepository-->>OrderService: Customer (with memberGrade, orderCount)

    OrderService->>CartRepository: findByCustomerIdWithItems(customerId)
    CartRepository-->>OrderService: Cart (with items)

    alt Cart is empty
        OrderService-->>OrderController: throw CustomException("Cart is empty")
        OrderController-->>GUI: 400 Bad Request
        GUI-->>User: Display error "Cart is empty"
    else Cart has items
        Note over OrderService: Calculate originalPrice from cart items
        Note over OrderService: Apply memberGrade discount
        Note over OrderService: discountPercent = customer.memberGrade.getDiscountPercent()
        Note over OrderService: discountAmount = originalPrice * discountPercent / 100
        Note over OrderService: totalPrice = originalPrice - discountAmount

        Note over OrderService: Create Order with discount info
        Note over OrderService: Set appliedGrade, discountPercent, discountAmount
        Note over OrderService: Set status to CHECKING_STOCK

        OrderService->>OrderRepository: save(order)
        OrderRepository-->>OrderService: savedOrder

        Note over OrderService: Upgrade customer grade if eligible
        OrderService->>OrderService: upgradeCustomerGrade(customer)
        Note over OrderService: customer.orderCount++
        Note over OrderService: Check if orderCount meets next grade threshold
        Note over OrderService: Update memberGrade if upgraded

        OrderService->>AuthRepository: save(customer)
        AuthRepository-->>OrderService: Customer

        Note over OrderService: Clear customer's cart
        OrderService->>CartRepository: save(cart with cleared items)
        CartRepository-->>OrderService: Cart

        OrderService-->>OrderController: orderId
        OrderController-->>GUI: 200 OK (ApiResponse: orderId)
        GUI-->>User: Display order confirmation with applied discount
    end
```

---

## 3. View Order History with Discount Info

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant OrderController
    participant OrderService
    participant AuthRepository
    participant OrderRepository

    User->>GUI: Navigate to order history page
    GUI->>OrderController: GET /api/orders/history
    OrderController->>OrderService: getOrderHistory()

    OrderService->>AuthRepository: findByEmail(email)
    AuthRepository-->>OrderService: Customer

    OrderService->>OrderRepository: findByCustomerIdOrderByOrderDateDesc(customerId)
    OrderRepository-->>OrderService: List<Order>

    Note over OrderService: Map orders to OrderHistoryResponse DTOs
    Note over OrderService: Include originalPrice, appliedGrade, discountPercent, discountAmount, totalPrice
    OrderService-->>OrderController: List<OrderHistoryResponse>
    OrderController-->>GUI: 200 OK (List<OrderHistoryResponse>)
    GUI-->>User: Display order history with discount information
```

### OrderHistoryResponse Fields
| Field | Type | Description |
|-------|------|-------------|
| orderId | number | Order ID |
| orderDate | string | Order creation timestamp (ISO 8601) |
| deliveryDate | string? | Requested delivery timestamp |
| deliveredAt | string? | Actual delivery timestamp |
| deliveryAddress | string | Delivery address |
| status | string | Order status |
| originalPrice | number | Price before discount |
| appliedGrade | string | Member grade applied at checkout |
| discountPercent | number | Discount percentage (0-15) |
| discountAmount | number | Discount amount in KRW |
| totalPrice | number | Final price after discount |
| itemCount | number | Number of items in order |

---

## 4. View Order Details with Discount Info

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant OrderController
    participant OrderService
    participant AuthRepository
    participant OrderRepository
    participant MenuRepository

    User->>GUI: Click on an order to view details
    GUI->>OrderController: GET /api/orders/{orderId}
    OrderController->>OrderService: getOrderDetails(orderId)

    OrderService->>AuthRepository: findByEmail(email)
    AuthRepository-->>OrderService: Customer

    OrderService->>OrderRepository: findByIdWithDetails(orderId)
    OrderRepository-->>OrderService: Order (with items, discount info)

    alt Unauthorized access
        OrderService-->>OrderController: throw CustomException("Unauthorized access")
        OrderController-->>GUI: 403 Forbidden
    else Authorized
        loop For each OrderItem
            OrderService->>MenuRepository: findByIdWithDishes(dinnerId)
            MenuRepository-->>OrderService: Dinner (with dishes)
        end

        Note over OrderService: Build response with discount breakdown
        OrderService-->>OrderController: OrderDetailResponse
        OrderController-->>GUI: 200 OK (OrderDetailResponse)
        GUI-->>User: Display order details with discount breakdown
    end
```

---

## Member Grade System

### Grade Thresholds
| Grade | Discount | Required Orders |
|-------|----------|-----------------|
| NORMAL | 0% | 0 |
| BRONZE | 5% | 5 |
| SILVER | 8% | 10 |
| GOLD | 11% | 15 |
| VIP | 15% | 20 |

### Grade Upgrade Logic
```mermaid
flowchart TD
    A[Order Completed] --> B[Increment orderCount]
    B --> C{orderCount >= 20?}
    C -->|Yes| D[Upgrade to VIP]
    C -->|No| E{orderCount >= 15?}
    E -->|Yes| F[Upgrade to GOLD]
    E -->|No| G{orderCount >= 10?}
    G -->|Yes| H[Upgrade to SILVER]
    G -->|No| I{orderCount >= 5?}
    I -->|Yes| J[Upgrade to BRONZE]
    I -->|No| K[Stay NORMAL]
```

---

## Discount Calculation Example

```
Customer: john@example.com
Current Grade: SILVER (8% discount)
Order Count: 12

Cart Items:
- French Dinner (48,000 KRW) + Grand Style (15,000 KRW) x 2 = 126,000 KRW

Calculation:
- originalPrice: 126,000 KRW
- discountPercent: 8%
- discountAmount: 126,000 × 0.08 = 10,080 KRW
- totalPrice: 126,000 - 10,080 = 115,920 KRW

After Order:
- orderCount: 13 (still SILVER, need 15 for GOLD)
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/auth/me | Get current user profile with member grade |
| POST | /api/orders/checkout | Create order with automatic discount |
| GET | /api/orders/history | Get order history with discount info |
| GET | /api/orders/{orderId} | Get order details with discount breakdown |

---

## Entity Changes

### Customer Entity
```java
@Entity
public class Customer {
    // ... existing fields ...

    @Enumerated(EnumType.STRING)
    private MemberGrade memberGrade = MemberGrade.NORMAL;

    private Integer orderCount = 0;
}
```

### Order Entity
```java
@Entity
public class Order {
    // ... existing fields ...

    private Integer originalPrice;

    @Enumerated(EnumType.STRING)
    private MemberGrade appliedGrade;

    private Integer discountPercent;
    private Integer discountAmount;
    private Integer totalPrice;
}
```

### MemberGrade Enum
```java
public enum MemberGrade {
    NORMAL(0, 0),
    BRONZE(5, 5),
    SILVER(8, 10),
    GOLD(11, 15),
    VIP(15, 20);

    private final int discountPercent;
    private final int requiredOrders;

    public static MemberGrade calculateGrade(int orderCount) {
        for (MemberGrade grade : values()) {
            if (orderCount < grade.requiredOrders) {
                return values()[grade.ordinal() - 1];
            }
        }
        return VIP;
    }

    public int calculateDiscount(int originalPrice) {
        return originalPrice * discountPercent / 100;
    }
}
```
