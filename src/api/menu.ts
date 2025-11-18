import { apiClient } from "./client";
import type { DinnerMenuItem, DinnerDetail } from "./types";

// 하위 호환성을 위해 기존 MenuItem 타입 유지
export interface MenuItem {
  id: number;
  name: string;
  price: number;
}

// 모든 디너 메뉴 목록 조회
export const getMenuList = async (): Promise<DinnerMenuItem[]> => {
  const response = await apiClient.get<DinnerMenuItem[]>("/api/menu/list");
  return response.data;
};

// 특정 디너 메뉴 상세 정보 조회
export const getMenuDetails = async (dinnerId: number): Promise<DinnerDetail> => {
  const response = await apiClient.get<DinnerDetail>(
    `/api/menu/details/${dinnerId}`
  );
  return response.data;
};

// 하위 호환성을 위해 기존 함수 유지 (getMenuList를 래핑)
export const getMenuItems = async (): Promise<MenuItem[]> => {
  const dinnerMenuItems = await getMenuList();
  // DinnerMenuItem을 기존 MenuItem 형식으로 변환
  return dinnerMenuItems.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.basePrice,
  }));
};
