# DdoganZip Detailed Sequence Diagrams

This document contains detailed sequence diagrams showing interactions between User, GUI, Controller, Service, and Repository layers.

---

## 1. Register

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant AuthController
    participant AuthService
    participant PasswordEncoder
    participant AuthRepository

    User->>GUI: Enter registration info (email, password, name, address, phone)
    GUI->>AuthController: POST /api/auth/register (RegisterRequest)
    AuthController->>AuthService: register(request)

    Note over AuthService: Validate email uniqueness
    AuthService->>AuthRepository: existsByEmail(email)
    AuthRepository-->>AuthService: boolean

    alt Email already exists
        AuthService-->>AuthController: throw CustomException("Email already exists")
        AuthController-->>GUI: 400 Bad Request
        GUI-->>User: Display error message
    else Email is unique
        Note over AuthService: Create new Customer with Cart
        Note over AuthService: Set default memberGrade = NORMAL, orderCount = 0
        AuthService->>PasswordEncoder: encode(password)
        PasswordEncoder-->>AuthService: encodedPassword
        AuthService->>AuthRepository: save(customer)
        AuthRepository-->>AuthService: savedCustomer
        AuthService-->>AuthController: void
        AuthController-->>GUI: 200 OK (ApiResponse: "Registration successful")
        GUI-->>User: Display success message
    end
```

---

## 2. Login

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant AuthController
    participant AuthService
    participant AuthenticationManager
    participant AuthRepository
    participant JwtUtil

    User->>GUI: Enter credentials (email, password)
    GUI->>AuthController: POST /api/auth/login (LoginRequest)
    AuthController->>AuthService: login(request)

    Note over AuthService: Authenticate user credentials
    AuthService->>AuthenticationManager: authenticate(UsernamePasswordAuthenticationToken)

    alt Authentication failed
        AuthenticationManager-->>AuthService: throw AuthenticationException
        AuthService-->>AuthController: throw Exception
        AuthController-->>GUI: 401 Unauthorized
        GUI-->>User: Display login error
    else Authentication successful
        AuthenticationManager-->>AuthService: Authentication

        Note over AuthService: Fetch user role
        AuthService->>AuthRepository: findByEmail(email)
        AuthRepository-->>AuthService: Customer

        Note over AuthService: Generate JWT tokens
        AuthService->>JwtUtil: generateAccessToken(email, role)
        JwtUtil-->>AuthService: accessToken
        AuthService->>JwtUtil: generateRefreshToken(email, role)
        JwtUtil-->>AuthService: refreshToken

        AuthService-->>AuthController: TokenResponse (accessToken, refreshToken, tokenType, expiresIn)
        AuthController-->>GUI: 200 OK (TokenResponse)
        GUI-->>User: Store tokens, redirect to main page
    end
```

---

## 3. Get User Profile (Member Grade Info)

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
        Note over AuthService: Build UserProfile response with memberGrade and orderCount
        AuthService-->>AuthController: UserProfileResponse (id, email, name, address, phone, memberGrade, orderCount)
        AuthController-->>GUI: 200 OK (UserProfileResponse)
        GUI-->>User: Display member grade badge and discount info
    end
```

---

## 4. View Menu

### 4-1. Get Menu List

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant MenuController
    participant MenuService
    participant MenuRepository

    User->>GUI: Navigate to menu page
    GUI->>MenuController: GET /api/menu/list
    MenuController->>MenuService: getMenuList()

    MenuService->>MenuRepository: findAll()
    MenuRepository-->>MenuService: List<Dinner>

    Note over MenuService: Map Dinner entities to MenuListResponse DTOs
    MenuService-->>MenuController: List<MenuListResponse>
    MenuController-->>GUI: 200 OK (List<MenuListResponse>)
    GUI-->>User: Display dinner list (id, name, description, basePrice, imageUrl)
```

### 4-2. Get Menu Details

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant MenuController
    participant MenuService
    participant MenuRepository

    User->>GUI: Click on a dinner item
    GUI->>MenuController: GET /api/menu/details/{dinnerId}
    MenuController->>MenuService: getMenuDetails(dinnerId)

    Note over MenuService: Fetch dinner with dishes
    MenuService->>MenuRepository: findByIdWithDishes(dinnerId)
    MenuRepository-->>MenuService: Optional<Dinner>

    alt Dinner not found
        MenuService-->>MenuController: throw CustomException("Dinner not found")
        MenuController-->>GUI: 404 Not Found
        GUI-->>User: Display error message
    else Dinner found
        Note over MenuService: Fetch available serving styles
        MenuService->>MenuRepository: findByIdWithStyles(dinnerId)
        MenuRepository-->>MenuService: Optional<Dinner>

        Note over MenuService: Build response with dishes and styles
        MenuService-->>MenuController: MenuDetailResponse
        MenuController-->>GUI: 200 OK (MenuDetailResponse)
        GUI-->>User: Display dinner details (dishes, servingStyles, prices)
    end
```

---

## 5. Manage Cart

### 5-1. Get Cart

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant CartController
    participant CartService
    participant AuthRepository
    participant CartRepository

    User->>GUI: View cart page
    GUI->>CartController: GET /api/cart (Authorization: Bearer token)
    CartController->>CartService: getCart()

    Note over CartService: Get current authenticated customer
    CartService->>AuthRepository: findByEmail(email from SecurityContext)
    AuthRepository-->>CartService: Customer

    CartService->>CartRepository: findByCustomerIdWithItems(customerId)
    CartRepository-->>CartService: Cart (with items, dinner, servingStyle)

    Note over CartService: Calculate item prices and total
    CartService-->>CartController: CartResponse (cartId, items[], totalPrice)
    CartController-->>GUI: 200 OK (CartResponse)
    GUI-->>User: Display cart items and total price
```

### 5-2. Add Item to Cart

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
    participant DishRepository

    User->>GUI: Select dinner, serving style, quantity, and customizations
    GUI->>CartController: POST /api/cart/items (AddToCartRequest)
    CartController->>CartService: addItemToCart(request)

    Note over CartService: Get current customer and cart
    CartService->>AuthRepository: findByEmail(email)
    AuthRepository-->>CartService: Customer
    CartService->>CartRepository: findByCustomerId(customerId)
    CartRepository-->>CartService: Cart

    Note over CartService: Validate dinner and serving style
    CartService->>MenuRepository: findById(dinnerId)
    MenuRepository-->>CartService: Dinner
    CartService->>ServingStyleRepository: findById(servingStyleId)
    ServingStyleRepository-->>CartService: ServingStyle

    Note over CartService: Process customizations if any
    opt Customizations exist
        loop For each customization
            CartService->>DishRepository: findById(dishId)
            DishRepository-->>CartService: Dish
        end
    end

    Note over CartService: Create CartItem and add to cart
    CartService->>CartRepository: save(cart)
    CartRepository-->>CartService: Cart

    CartService-->>CartController: void
    CartController->>CartService: getCart()
    CartService-->>CartController: CartResponse
    CartController-->>GUI: 200 OK (CartResponse)
    GUI-->>User: Display updated cart
```

### 5-3. Update Item Quantity

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant CartController
    participant CartService
    participant AuthRepository
    participant CartItemRepository

    User->>GUI: Change item quantity
    GUI->>CartController: PUT /api/cart/items/{itemId}/quantity (UpdateQuantityRequest)
    CartController->>CartService: updateItemQuantity(itemId, request)

    CartService->>AuthRepository: findByEmail(email)
    AuthRepository-->>CartService: Customer

    CartService->>CartItemRepository: findById(itemId)
    CartItemRepository-->>CartService: CartItem

    Note over CartService: Verify ownership
    alt Unauthorized access
        CartService-->>CartController: throw CustomException("Unauthorized access")
        CartController-->>GUI: 403 Forbidden
    else Authorized
        Note over CartService: Update quantity
        CartService->>CartItemRepository: save(cartItem)
        CartItemRepository-->>CartService: CartItem
        CartService-->>CartController: void
        CartController->>CartService: getCart()
        CartService-->>CartController: CartResponse
        CartController-->>GUI: 200 OK (CartResponse)
        GUI-->>User: Display updated cart
    end
```

### 5-4. Update Item Options (Serving Style)

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant CartController
    participant CartService
    participant AuthRepository
    participant CartItemRepository
    participant ServingStyleRepository
    participant DishRepository

    User->>GUI: Change serving style and/or customizations
    GUI->>CartController: PUT /api/cart/items/{itemId}/options (UpdateOptionsRequest)
    CartController->>CartService: updateItemOptions(itemId, request)

    CartService->>AuthRepository: findByEmail(email)
    AuthRepository-->>CartService: Customer

    CartService->>CartItemRepository: findByIdWithCustomizations(itemId)
    CartItemRepository-->>CartService: CartItem (with customizations)

    Note over CartService: Verify ownership and get new serving style
    CartService->>ServingStyleRepository: findById(servingStyleId)
    ServingStyleRepository-->>CartService: ServingStyle

    Note over CartService: Clear existing customizations and add new ones
    opt New customizations exist
        loop For each customization
            CartService->>DishRepository: findById(dishId)
            DishRepository-->>CartService: Dish
        end
    end

    CartService->>CartItemRepository: save(cartItem)
    CartItemRepository-->>CartService: CartItem

    CartService-->>CartController: void
    CartController->>CartService: getCart()
    CartService-->>CartController: CartResponse
    CartController-->>GUI: 200 OK (CartResponse)
    GUI-->>User: Display updated cart
```

### 5-5. Customize Cart Item (Add/Remove Dish)

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant CartController
    participant CartService
    participant AuthRepository
    participant CartItemRepository
    participant DishRepository

    User->>GUI: Add or remove dish from cart item
    GUI->>CartController: POST /api/cart/items/{itemId}/customize (CustomizeCartItemRequest)
    CartController->>CartService: customizeCartItem(itemId, request)

    CartService->>AuthRepository: findByEmail(email)
    AuthRepository-->>CartService: Customer

    CartService->>CartItemRepository: findByIdWithCustomizations(itemId)
    CartItemRepository-->>CartService: CartItem

    CartService->>DishRepository: findById(dishId)
    DishRepository-->>CartService: Dish

    Note over CartService: Process based on action type
    alt action = "ADD" or "REPLACE"
        Note over CartService: Add or update customization
    else action = "REMOVE"
        Note over CartService: Remove existing customization for dish
    end

    CartService->>CartItemRepository: save(cartItem)
    CartItemRepository-->>CartService: CartItem

    CartService-->>CartController: void
    CartController->>CartService: getCart()
    CartService-->>CartController: CartResponse
    CartController-->>GUI: 200 OK (CartResponse)
    GUI-->>User: Display updated cart with customization
```

### 5-6. Remove Item from Cart

```mermaid
sequenceDiagram
    actor User
    participant GUI
    participant CartController
    participant CartService
    participant AuthRepository
    participant CartItemRepository
    participant CartRepository

    User->>GUI: Click remove item button
    GUI->>CartController: DELETE /api/cart/items/{itemId}
    CartController->>CartService: removeItem(itemId)

    CartService->>AuthRepository: findByEmail(email)
    AuthRepository-->>CartService: Customer

    CartService->>CartItemRepository: findById(itemId)
    CartItemRepository-->>CartService: CartItem

    Note over CartService: Verify ownership and remove item
    CartService->>CartRepository: save(cart)
    CartRepository-->>CartService: Cart

    CartService-->>CartController: void
    CartController->>CartService: getCart()
    CartService-->>CartController: CartResponse
    CartController-->>GUI: 200 OK (CartResponse)
    GUI-->>User: Display updated cart
```

---

## 6. Checkout (with Member Grade Discount)

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
        Note over OrderService: Set appliedGrade, discountPercent, discountAmount, originalPrice, totalPrice
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

## 7. View Order

### 7-1. User - Get Order History (with Discount Info)

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
    GUI-->>User: Display order history with discount information (orderId, date, status, originalPrice, appliedGrade, discountPercent, discountAmount, totalPrice, itemCount)
```

### 7-2. User - Get Order Details (with Discount Info)

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
    OrderRepository-->>OrderService: Order (with items, dinner, servingStyle, discount info)

    alt Unauthorized access (order belongs to another customer)
        OrderService-->>OrderController: throw CustomException("Unauthorized access")
        OrderController-->>GUI: 403 Forbidden
    else Authorized
        Note over OrderService: Fetch base dishes for each order item
        loop For each OrderItem
            OrderService->>MenuRepository: findByIdWithDishes(dinnerId)
            MenuRepository-->>OrderService: Dinner (with dishes)
        end

        Note over OrderService: Build detailed response with discount breakdown
        Note over OrderService: Include originalPrice, appliedGrade, discountPercent, discountAmount, totalPrice
        OrderService-->>OrderController: OrderDetailResponse
        OrderController-->>GUI: 200 OK (OrderDetailResponse)
        GUI-->>User: Display order details with discount breakdown (items, customizations, status, originalPrice, discount, totalPrice)
    end
```

### 7-3. Staff - Get Active Orders

```mermaid
sequenceDiagram
    actor Staff
    participant GUI
    participant StaffController
    participant StaffService
    participant OrderRepository

    Staff->>GUI: Navigate to active orders dashboard
    GUI->>StaffController: GET /api/staff/orders/active
    StaffController->>StaffService: getActiveOrders()

    Note over StaffService: Fetch orders excluding DRIVER_RETURNED status
    StaffService->>OrderRepository: findActiveOrders([DRIVER_RETURNED])
    OrderRepository-->>StaffService: List<Order>

    Note over StaffService: Map to ActiveOrdersResponse DTOs
    StaffService-->>StaffController: List<ActiveOrdersResponse>
    StaffController-->>GUI: 200 OK (List<ActiveOrdersResponse>)
    GUI-->>Staff: Display active orders (customerName, status, deliveryDate, totalPrice)
```

---

## 8. Manage Status (Staff Only)

### 8-1. Update Order Status

```mermaid
sequenceDiagram
    actor Staff
    participant GUI
    participant StaffController
    participant StaffService
    participant OrderRepository
    participant StaffAvailabilityRepository
    participant MenuRepository
    participant DishRepository

    Staff->>GUI: Select new status for order
    GUI->>StaffController: PUT /api/staff/orders/{orderId}/status (UpdateOrderStatusRequest)
    StaffController->>StaffService: updateOrderStatus(orderId, request)

    StaffService->>OrderRepository: findById(orderId)
    OrderRepository-->>StaffService: Order

    StaffService->>StaffAvailabilityRepository: getStaffAvailability()
    StaffAvailabilityRepository-->>StaffService: StaffAvailability

    Note over StaffService: Process based on new status

    alt newStatus = RECEIVED
        Note over StaffService: Deduct inventory for order
        loop For each OrderItem
            StaffService->>MenuRepository: findByIdWithDishes(dinnerId)
            MenuRepository-->>StaffService: Dinner
            loop For each Dish (excluding DECORATION)
                StaffService->>DishRepository: findById(dishId)
                DishRepository-->>StaffService: Dish
                StaffService->>DishRepository: save(dish with updated stock)
            end
        end
    else newStatus = IN_KITCHEN
        alt No available cooks
            StaffService-->>StaffController: throw CustomException("No available cook")
            StaffController-->>GUI: 400 Bad Request
            GUI-->>Staff: Display error
        else Cooks available
            Note over StaffService: Assign cook (decrement availableCooks)
            StaffService->>StaffAvailabilityRepository: save(sa)
        end
    else newStatus = COOKED
        Note over StaffService: Cook finished (increment availableCooks)
        StaffService->>StaffAvailabilityRepository: save(sa)
    else newStatus = DELIVERING
        alt No available drivers
            StaffService-->>StaffController: throw CustomException("No available driver")
            StaffController-->>GUI: 400 Bad Request
            GUI-->>Staff: Display error
        else Drivers available
            Note over StaffService: Assign driver (decrement availableDrivers)
            StaffService->>StaffAvailabilityRepository: save(sa)
        end
    else newStatus = DELIVERED
        Note over StaffService: Set deliveredAt timestamp
    end

    StaffService->>OrderRepository: save(order)
    OrderRepository-->>StaffService: Order

    StaffService-->>StaffController: void
    StaffController-->>GUI: 200 OK (ApiResponse: "Order status updated")
    GUI-->>Staff: Display success, refresh order list
```

### 8-2. Check Inventory

```mermaid
sequenceDiagram
    actor Staff
    participant GUI
    participant StaffController
    participant StaffService
    participant DishRepository

    Staff->>GUI: Navigate to inventory page
    GUI->>StaffController: GET /api/staff/inventory
    StaffController->>StaffService: getInventory()

    StaffService->>DishRepository: findAll()
    DishRepository-->>StaffService: List<Dish>

    Note over StaffService: Filter out DECORATION category
    Note over StaffService: Check for low stock warnings

    StaffService-->>StaffController: List<InventoryItemResponse>
    StaffController-->>GUI: 200 OK (List<InventoryItemResponse>)
    GUI-->>Staff: Display inventory (dishName, currentStock, minimumStock, lowStockWarning)
```

### 8-3. Check Order Inventory (Can Fulfill Order)

```mermaid
sequenceDiagram
    actor Staff
    participant GUI
    participant StaffController
    participant StaffService
    participant OrderRepository
    participant MenuRepository
    participant DishRepository

    Staff->>GUI: Click "Check Inventory" for an order
    GUI->>StaffController: GET /api/staff/orders/{orderId}/inventory-check
    StaffController->>StaffService: checkOrderInventory(orderId)

    StaffService->>OrderRepository: findById(orderId)
    OrderRepository-->>StaffService: Order

    Note over StaffService: Calculate required dishes and quantities
    loop For each OrderItem
        StaffService->>MenuRepository: findByIdWithDishes(dinnerId)
        MenuRepository-->>StaffService: Dinner (with DinnerDish quantities)
    end

    Note over StaffService: Compare with current stock
    loop For each required Dish (excluding DECORATION)
        StaffService->>DishRepository: findById(dishId)
        DishRepository-->>StaffService: Dish
        Note over StaffService: Check if currentStock >= requiredQuantity
    end

    StaffService-->>StaffController: OrderInventoryCheckResponse (isSufficient, requiredItems[])
    StaffController-->>GUI: 200 OK (OrderInventoryCheckResponse)
    GUI-->>Staff: Display inventory check result (sufficient/shortage per dish)
```

### 8-4. Driver Return

```mermaid
sequenceDiagram
    actor Staff
    participant GUI
    participant StaffController
    participant StaffService
    participant OrderRepository
    participant StaffAvailabilityRepository

    Staff->>GUI: Click "Driver Returned" for delivered order
    GUI->>StaffController: POST /api/staff/orders/{orderId}/driver-return
    StaffController->>StaffService: driverReturn(orderId)

    StaffService->>OrderRepository: findById(orderId)
    OrderRepository-->>StaffService: Order

    alt Order status is not DELIVERED
        StaffService-->>StaffController: throw CustomException("Driver can only return from DELIVERED orders")
        StaffController-->>GUI: 400 Bad Request
        GUI-->>Staff: Display error
    else Order status is DELIVERED
        Note over StaffService: Update order status to DRIVER_RETURNED
        StaffService->>OrderRepository: save(order)
        OrderRepository-->>StaffService: Order

        Note over StaffService: Increment available drivers
        StaffService->>StaffAvailabilityRepository: getStaffAvailability()
        StaffAvailabilityRepository-->>StaffService: StaffAvailability
        StaffService->>StaffAvailabilityRepository: save(sa)
        StaffAvailabilityRepository-->>StaffService: StaffAvailability

        StaffService-->>StaffController: void
        StaffController-->>GUI: 200 OK (ApiResponse: "Driver returned")
        GUI-->>Staff: Display success, driver now available
    end
```

### 8-5. Get Staff Availability

```mermaid
sequenceDiagram
    actor Staff
    participant GUI
    participant StaffController
    participant StaffService
    participant StaffAvailabilityRepository

    Staff->>GUI: View staff availability panel
    GUI->>StaffController: GET /api/staff/availability
    StaffController->>StaffService: getStaffAvailability()

    StaffService->>StaffAvailabilityRepository: getStaffAvailability()
    StaffAvailabilityRepository-->>StaffService: StaffAvailability

    Note over StaffService: Build response with availability status
    StaffService-->>StaffController: StaffAvailabilityResponse
    StaffController-->>GUI: 200 OK (StaffAvailabilityResponse)
    GUI-->>Staff: Display availability (availableCooks/totalCooks, availableDrivers/totalDrivers, canStartCooking, canStartDelivery)
```

---

## Order Status Workflow Summary

```mermaid
stateDiagram-v2
    [*] --> CHECKING_STOCK: Order Created
    CHECKING_STOCK --> RECEIVED: Inventory Verified & Deducted
    RECEIVED --> IN_KITCHEN: Cook Assigned
    IN_KITCHEN --> COOKED: Cooking Complete, Cook Released
    COOKED --> DELIVERING: Driver Assigned
    DELIVERING --> DELIVERED: Delivery Complete
    DELIVERED --> DRIVER_RETURNED: Driver Returned to Base
    DRIVER_RETURNED --> [*]
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

### Discount Calculation Example
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

## Appendix: Key Method Mappings

| Layer | Class | Method | Purpose |
|-------|-------|--------|---------|
| Controller | AuthController | register() | Handle user registration |
| Controller | AuthController | login() | Handle user login |
| Controller | AuthController | getUserProfile() | Get current user profile with member grade |
| Controller | MenuController | getMenuList() | Get all dinners |
| Controller | MenuController | getMenuDetails() | Get dinner details |
| Controller | CartController | getCart() | Get user's cart |
| Controller | CartController | addItemToCart() | Add item to cart |
| Controller | CartController | updateItemQuantity() | Update cart item quantity |
| Controller | CartController | updateItemOptions() | Update serving style |
| Controller | CartController | customizeCartItem() | Add/remove dishes |
| Controller | CartController | removeItem() | Remove cart item |
| Controller | OrderController | checkout() | Create order from cart with discount |
| Controller | OrderController | getOrderHistory() | Get user's orders with discount info |
| Controller | OrderController | getOrderDetails() | Get order details with discount breakdown |
| Controller | StaffController | getActiveOrders() | Get all active orders |
| Controller | StaffController | updateOrderStatus() | Update order status |
| Controller | StaffController | getInventory() | Get inventory list |
| Controller | StaffController | checkOrderInventory() | Check order fulfillment |
| Controller | StaffController | getStaffAvailability() | Get cook/driver availability |
| Controller | StaffController | driverReturn() | Mark driver as returned |
| Service | AuthService | register() | Create new customer with default grade |
| Service | AuthService | login() | Authenticate and generate tokens |
| Service | AuthService | getUserProfile() | Fetch user profile with member grade |
| Service | MenuService | getMenuList() | Fetch all dinners |
| Service | MenuService | getMenuDetails() | Fetch dinner with dishes and styles |
| Service | CartService | getCart() | Fetch cart with items |
| Service | CartService | addItemToCart() | Create and add CartItem |
| Service | CartService | updateItemQuantity() | Update CartItem quantity |
| Service | CartService | updateItemOptions() | Update CartItem options |
| Service | CartService | customizeCartItem() | Handle customization actions |
| Service | CartService | removeItem() | Remove CartItem from cart |
| Service | OrderService | checkout() | Create Order with discount calculation |
| Service | OrderService | upgradeCustomerGrade() | Check and upgrade member grade |
| Service | OrderService | getOrderHistory() | Fetch customer orders with discount info |
| Service | OrderService | getOrderDetails() | Fetch order with discount breakdown |
| Service | StaffService | getActiveOrders() | Fetch non-completed orders |
| Service | StaffService | updateOrderStatus() | Handle status transitions |
| Service | StaffService | getInventory() | Fetch all dishes stock |
| Service | StaffService | checkOrderInventory() | Verify order can be fulfilled |
| Service | StaffService | getStaffAvailability() | Get staff counts |
| Service | StaffService | driverReturn() | Handle driver return |
| Repository | AuthRepository | findByEmail() | Find customer by email |
| Repository | AuthRepository | existsByEmail() | Check email exists |
| Repository | MenuRepository | findAll() | Get all dinners |
| Repository | MenuRepository | findByIdWithDishes() | Get dinner with dishes |
| Repository | MenuRepository | findByIdWithStyles() | Get dinner with styles |
| Repository | CartRepository | findByCustomerId() | Find cart by customer |
| Repository | CartRepository | findByCustomerIdWithItems() | Find cart with items |
| Repository | CartItemRepository | findById() | Find cart item |
| Repository | CartItemRepository | findByIdWithCustomizations() | Find with customizations |
| Repository | OrderRepository | findByCustomerIdOrderByOrderDateDesc() | Customer orders |
| Repository | OrderRepository | findByIdWithDetails() | Order with items |
| Repository | OrderRepository | findActiveOrders() | Active orders for staff |
| Repository | DishRepository | findAll() | Get all dishes |
| Repository | DishRepository | findById() | Find dish by id |
| Repository | StaffAvailabilityRepository | getStaffAvailability() | Get singleton availability |

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new customer |
| POST | /api/auth/login | Login and get tokens |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Logout user |
| GET | /api/auth/me | Get current user profile with member grade |
| GET | /api/menu/list | Get all dinner menus |
| GET | /api/menu/details/{dinnerId} | Get dinner details |
| GET | /api/cart | Get user's cart |
| POST | /api/cart/items | Add item to cart |
| PUT | /api/cart/items/{itemId}/quantity | Update item quantity |
| PUT | /api/cart/items/{itemId}/options | Update item options |
| POST | /api/cart/items/{itemId}/customize | Customize item |
| DELETE | /api/cart/items/{itemId} | Remove item from cart |
| POST | /api/orders/checkout | Create order with discount |
| GET | /api/orders/history | Get order history with discount info |
| GET | /api/orders/{orderId} | Get order details with discount breakdown |
| GET | /api/staff/orders/active | Get active orders (Staff) |
| PUT | /api/staff/orders/{orderId}/status | Update order status (Staff) |
| GET | /api/staff/inventory | Get inventory (Staff) |
| GET | /api/staff/orders/{orderId}/inventory-check | Check order inventory (Staff) |
| GET | /api/staff/availability | Get staff availability (Staff) |
| POST | /api/staff/orders/{orderId}/driver-return | Mark driver returned (Staff) |

---

## Entity Changes for Member Grade

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
