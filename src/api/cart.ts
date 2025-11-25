import { apiClient } from "./client";
import { getMenuDetails } from "./menu";
import type {
  CartResponse,
  CartItemRequest,
  UpdateQuantityRequest,
  UpdateOptionsRequest,
  CustomizeItemRequest,
} from "./types";

// 헬퍼: pricePerUnit이 없는 경우 dinner detail에서 가격 조회
async function enrichCartResponseWithPrices(cartResponse: CartResponse): Promise<CartResponse> {
  const items = await Promise.all(
    cartResponse.items.map(async (item) => {
      // customization이 있고, pricePerUnit이 없거나 0인 경우
      if (item.customizations.length > 0 &&
          item.customizations.some(c => !c.pricePerUnit || c.pricePerUnit === 0)) {
        try {
          console.log(`Fetching dinner detail for dinnerId: ${item.dinnerId}`);
          const detail = await getMenuDetails(item.dinnerId);

          const updatedCustomizations = item.customizations.map(custom => {
            if (!custom.pricePerUnit || custom.pricePerUnit === 0) {
              const dish = detail.dishes.find(d => d.dishId === custom.dishId);
              console.log(`Found dish ${custom.dishName} with basePrice: ${dish?.basePrice}`);
              return {
                ...custom,
                pricePerUnit: dish?.basePrice || 0,
              };
            }
            return custom;
          });

          return {
            ...item,
            customizations: updatedCustomizations,
          };
        } catch (error) {
          console.error(`Failed to fetch dinner detail for ${item.dinnerName}:`, error);
          return item;
        }
      }
      return item;
    })
  );

  return {
    ...cartResponse,
    items,
  };
}

// 현재 사용자의 장바구니 조회
export const getCart = async (): Promise<CartResponse> => {
  const response = await apiClient.get<CartResponse>("/api/cart");
  console.log("=== Raw Cart API Response ===");
  console.log(JSON.stringify(response.data, null, 2));

  return enrichCartResponseWithPrices(response.data);
};

// 장바구니에 상품 추가
export const addCartItem = async (
  data: CartItemRequest
): Promise<CartResponse> => {
  const response = await apiClient.post<CartResponse>("/api/cart/items", data);
  console.log("=== Add to Cart API Response ===");
  console.log(JSON.stringify(response.data, null, 2));

  return enrichCartResponseWithPrices(response.data);
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

  return enrichCartResponseWithPrices(response.data);
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

  return enrichCartResponseWithPrices(response.data);
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
