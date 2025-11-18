// 공통 타입 정의 - 백엔드 API 명세에 맞춤

// ============= Common Response Types =============
export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============= Auth Types =============
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number; // 밀리초
}

export interface RefreshRequest {
  refreshToken: string;
}

// ============= Menu Types =============
export interface Dish {
  dishId: number;
  name: string;
  description: string;
  basePrice: number;
  defaultQuantity: number;
}

export interface ServingStyle {
  styleId: number;
  name: string; // "Simple", "Grand", "Deluxe"
  additionalPrice: number;
  description: string;
}

export interface DinnerMenuItem {
  dinnerId: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
}

export interface DinnerDetail {
  dinnerId: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  dishes: Dish[];
  availableStyles: ServingStyle[];
}

// ============= Cart Types =============
export interface CartItemRequest {
  dinnerId: number;
  servingStyleId: number;
  quantity: number; // 1 이상
}

export interface CartItem {
  cartItemId: number;
  dinnerId: number;
  dinnerName: string;
  servingStyleId: number;
  servingStyleName: string;
  quantity: number;
  dinnerBasePrice: number; // 디너 기본 가격
  servingStylePrice: number; // 서빙 스타일 추가 가격
  itemTotalPrice: number; // (디너 기본 + 서빙 추가) × 수량
}

export interface CartResponse {
  cartId: number;
  items: CartItem[];
  totalPrice: number; // 전체 합계
}

export interface UpdateQuantityRequest {
  quantity: number; // 1 이상
}

export interface UpdateOptionsRequest {
  servingStyleId: number;
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
  deliveryDate: string; // ISO 8601 format: "2025-11-19T12:00:00"
}

export interface CheckoutResponse {
  success: true;
  message: string;
  data: number; // orderId
}

export interface OrderItem {
  orderItemId: number;
  dinnerName: string;
  servingStyleName: string;
  quantity: number;
  price: number; // 아이템 총 가격
}

export interface Order {
  orderId: number;
  orderDate: string; // ISO 8601
  deliveryDate: string;
  deliveryAddress: string;
  status: OrderStatus;
  totalPrice: number;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
}

// 주문 내역은 Order 배열로 직접 반환
export type OrderHistoryResponse = Order[];

// ============= Staff Types =============
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface ActiveOrder {
  orderId: number;
  customerName: string;
  deliveryAddress: string;
  deliveryDate: string;
  status: OrderStatus;
  totalPrice: number;
  orderDate: string;
}

// 진행 중인 주문은 ActiveOrder 배열로 직접 반환
export type ActiveOrdersResponse = ActiveOrder[];
