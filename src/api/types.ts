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
  phoneNumber: string; // 필수
  address: string; // 필수
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
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
  defaultQuantity?: number; // 백엔드에서 제공하지 않음, 선택사항으로 변경
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
export type CustomizationAction = "ADD" | "REMOVE" | "REPLACE";

export interface Customization {
  action: CustomizationAction;
  dishId: number;
  quantity: number;
}

export interface CustomizationResponse {
  action: CustomizationAction;
  dishName: string;
  quantity: number;
}

export interface CartItemRequest {
  dinnerId: number;
  servingStyleId: number;
  quantity: number; // 1 이상
  customizations?: Customization[]; // 선택 사항
}

export interface CartItem {
  itemId: number; // 백엔드는 itemId 사용
  dinnerId: number;
  dinnerName: string;
  dinnerBasePrice: number; // 디너 기본 가격
  servingStyleId: number;
  servingStyleName: string;
  servingStylePrice: number; // 서빙 스타일 추가 가격
  quantity: number;
  itemTotalPrice: number; // (디너 기본 + 서빙 추가) × 수량
  customizations: CustomizationResponse[]; // 커스터마이징 목록
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
  customizations?: Customization[]; // 기존 커스터마이징은 모두 교체됨
}

export interface CustomizeItemRequest {
  action: CustomizationAction;
  dishId: number;
  quantity: number;
}

// ============= Order Types =============
export type OrderStatus =
  | "CHECKING_STOCK" // 재고 확인 중
  | "RECEIVED"        // 주문 접수 완료
  | "IN_KITCHEN"      // 조리 중
  | "DELIVERING"      // 배달 중
  | "DELIVERED"       // 배달 완료
  | "CANCELLED";      // 취소됨

export interface CheckoutRequest {
  deliveryAddress: string; // 필수
  deliveryDate?: string; // 선택 - ISO 8601 format
}

export interface CheckoutResponse {
  success: true;
  message: string;
  data: number; // orderId
}

export interface OrderItem {
  itemId: number; // 주문 아이템 ID
  dinnerName: string;
  servingStyleName: string;
  quantity: number;
  price: number; // 아이템 총 가격
  customizations: CustomizationResponse[]; // 커스터마이징 목록
}

export interface Order {
  orderId: number;
  orderDate: string; // ISO 8601 (LocalDateTime)
  deliveryDate?: string; // ISO 8601
  deliveryAddress: string;
  status: OrderStatus;
  totalPrice: number;
  itemCount: number; // 주문 아이템 개수
}

export interface OrderDetail {
  orderId: number;
  orderDate: string; // ISO 8601
  deliveryDate?: string; // ISO 8601
  deliveryAddress: string;
  status: OrderStatus;
  totalPrice: number;
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
  customerEmail: string; // 고객 이메일
  orderDate: string; // ISO 8601 (LocalDateTime)
  deliveryDate?: string; // ISO 8601
  deliveryAddress: string;
  status: OrderStatus;
  totalPrice: number;
  itemCount: number; // 주문 아이템 개수
}

export interface InventoryItem {
  dishId: number;
  dishName: string;
  currentStock: number;
  minimumStock?: number;
}

// 진행 중인 주문은 ActiveOrder 배열로 직접 반환
export type ActiveOrdersResponse = ActiveOrder[];
