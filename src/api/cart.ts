import { apiClient } from "./client";
import type {
  CartResponse,
  CartItemRequest,
  UpdateQuantityRequest,
  UpdateOptionsRequest,
  CustomizeItemRequest,
} from "./types";

// 현재 사용자의 장바구니 조회
export const getCart = async (): Promise<CartResponse> => {
  const response = await apiClient.get<CartResponse>("/api/cart");
  return response.data;
};

// 장바구니에 상품 추가
export const addCartItem = async (
  data: CartItemRequest
): Promise<CartResponse> => {
  const response = await apiClient.post<CartResponse>("/api/cart/items", data);
  return response.data;
};

// 장바구니 상품 수량 변경
export const updateCartItemQuantity = async (
  itemId: number,
  data: UpdateQuantityRequest
): Promise<CartResponse> => {
  const response = await apiClient.put<CartResponse>(
    `/api/cart/items/${itemId}/quantity`,
    data
  );
  return response.data;
};

// 장바구니 상품 옵션 변경 (서빙 스타일 및 커스터마이징)
export const updateCartItemOptions = async (
  itemId: number,
  data: UpdateOptionsRequest
): Promise<CartResponse> => {
  const response = await apiClient.put<CartResponse>(
    `/api/cart/items/${itemId}/options`,
    data
  );
  return response.data;
};

// 장바구니에서 상품 삭제
export const removeCartItem = async (itemId: number): Promise<CartResponse> => {
  const response = await apiClient.delete<CartResponse>(
    `/api/cart/items/${itemId}`
  );
  return response.data;
};

// 장바구니 아이템 커스터마이징 (개별 요리 추가/제거/변경)
export const customizeCartItem = async (
  itemId: number,
  data: CustomizeItemRequest
): Promise<CartResponse> => {
  const response = await apiClient.post<CartResponse>(
    `/api/cart/items/${itemId}/customize`,
    data
  );
  return response.data;
};
