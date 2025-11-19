import { apiClient } from "./client";
import type { DinnerMenuItem, DinnerDetail } from "./types";
import { mockMenuItems, getMockMenuDetail } from "./mockData";

// 하위 호환성을 위해 기존 MenuItem 타입 유지
export interface MenuItem {
  id: number;
  name: string;
  price: number;
}

// 모든 디너 메뉴 목록 조회
export const getMenuList = async (): Promise<DinnerMenuItem[]> => {
  try {
    const response = await apiClient.get<DinnerMenuItem[]>("/api/menu/list");
    return response.data;
  } catch (error) {
    console.warn("백엔드 서버에 연결할 수 없습니다. 모의 데이터를 사용합니다.", error);
    // 백엔드가 없을 때 모의 데이터 반환
    return mockMenuItems;
  }
};

// 특정 디너 메뉴 상세 정보 조회
export const getMenuDetails = async (dinnerId: number): Promise<DinnerDetail> => {
  try {
    const response = await apiClient.get<DinnerDetail>(
      `/api/menu/details/${dinnerId}`
    );
    return response.data;
  } catch (error) {
    console.warn("백엔드 서버에 연결할 수 없습니다. 모의 데이터를 사용합니다.", error);
    // 백엔드가 없을 때 모의 데이터 반환
    const mockDetail = getMockMenuDetail(dinnerId);
    if (!mockDetail) {
      throw new Error(`Menu with ID ${dinnerId} not found`);
    }
    return mockDetail;
  }
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
