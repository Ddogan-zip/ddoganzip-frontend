// 공통 타입 정의

// ============= Auth Types =============
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  address: string;
  phone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface RefreshRequest {
  refreshToken: string;
}

// ============= Menu Types =============
export interface Dish {
  id: number;
  name: string;
  description?: string;
  basePrice: number;
}

export interface ServingStyle {
  id: number;
  name: string;
  additionalPrice: number;
  description?: string;
}

export interface DinnerMenuItem {
  id: number;
  name: string;
  description?: string;
  basePrice: number;
  imageUrl?: string;
}

export interface DinnerDetail {
  id: number;
  name: string;
  description?: string;
  dishes: Dish[];
  availableStyles: ServingStyle[];
  basePrice: number;
  imageUrl?: string;
}

// ============= Cart Types =============
export type CustomizationAction = "ADD" | "REMOVE" | "REPLACE";

export interface Customization {
  action: CustomizationAction;
  dishId: number;
  quantity: number;
}

export interface CartItemRequest {
  dinnerId: number;
  servingStyleId: number;
  quantity: number;
  customizations?: Customization[];
}

export interface CartItem {
  id: number;
  dinnerId: number;
  dinnerName: string;
  servingStyleId: number;
  servingStyleName: string;
  quantity: number;
  customizations: Customization[];
  unitPrice: number;
  totalPrice: number;
}

export interface CartResponse {
  cartId: number;
  items: CartItem[];
  totalPrice: number;
}

export interface UpdateQuantityRequest {
  quantity: number;
}

export interface UpdateOptionsRequest {
  servingStyleId: number;
  customizations?: Customization[];
}

// ============= Order Types =============
export type OrderStatus =
  | "CHECKING_STOCK"
  | "RECEIVED"
  | "IN_KITCHEN"
  | "DELIVERING"
  | "DELIVERED";

export interface CheckoutRequest {
  deliveryAddress: string;
  deliveryDate: string; // ISO 8601 format
}

export interface OrderItem {
  dinnerId: number;
  dinnerName: string;
  servingStyleId: number;
  servingStyleName: string;
  quantity: number;
  customizations: Customization[];
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  userId: number;
  items: OrderItem[];
  status: OrderStatus;
  deliveryAddress: string;
  deliveryDate: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderHistoryResponse {
  orders: Order[];
}

// ============= Staff Types =============
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface ActiveOrdersResponse {
  orders: Order[];
}
