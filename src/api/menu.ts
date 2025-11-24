import { apiClient } from "./client";
import type { DinnerMenuItem, DinnerDetail } from "./types";
import { mockMenuItems } from "./mockData";

// 하위 호환성을 위해 기존 MenuItem 타입 유지
export interface MenuItem {
  id: number;
  name: string;
  price: number;
}

// 백엔드 응답 타입 (id로 반환됨)
interface BackendDinnerMenuItem {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
}

// 모든 디너 메뉴 목록 조회
export const getMenuList = async (): Promise<DinnerMenuItem[]> => {
  try {
    const response = await apiClient.get<BackendDinnerMenuItem[]>("/api/menu/list");
    // 백엔드 응답의 "id"를 "dinnerId"로 매핑
    return response.data.map((item) => ({
      dinnerId: item.id,
      name: item.name,
      description: item.description,
      basePrice: item.basePrice,
      imageUrl: item.imageUrl,
    }));
  } catch (error) {
    console.warn("백엔드 서버에 연결할 수 없습니다. 모의 데이터를 사용합니다.", error);
    // 백엔드가 없을 때 모의 데이터 반환
    return mockMenuItems;
  }
};

// 백엔드 응답 타입 (id, styleId 등으로 반환됨)
interface BackendDinnerDetail {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  dishes: Array<{
    id: number;
    name: string;
    description: string;
    basePrice: number;
  }>;
  availableStyles: Array<{
    id: number;
    name: string;
    additionalPrice: number;
    description: string;
  }>;
}

// 특정 디너 메뉴 상세 정보 조회
export const getMenuDetails = async (dinnerId: number): Promise<DinnerDetail> => {
  const response = await apiClient.get<BackendDinnerDetail>(
    `/api/menu/details/${dinnerId}`
  );

  // 백엔드 응답을 프론트엔드 타입으로 매핑
  const data = response.data;
  return {
    dinnerId: data.id,
    name: data.name,
    description: data.description,
    basePrice: data.basePrice,
    imageUrl: data.imageUrl,
    dishes: data.dishes.map((dish) => ({
      dishId: dish.id,
      name: dish.name,
      description: dish.description,
      basePrice: dish.basePrice,
    })),
    availableStyles: data.availableStyles.map((style) => ({
      styleId: style.id,
      name: style.name,
      additionalPrice: style.additionalPrice,
      description: style.description,
    })),
  };
};

// 하위 호환성을 위해 기존 함수 유지 (getMenuList를 래핑)
export const getMenuItems = async (): Promise<MenuItem[]> => {
  const dinnerMenuItems = await getMenuList();
  // DinnerMenuItem을 기존 MenuItem 형식으로 변환
  return dinnerMenuItems.map((item) => ({
    id: item.dinnerId,
    name: item.name,
    price: item.basePrice,
  }));
};
