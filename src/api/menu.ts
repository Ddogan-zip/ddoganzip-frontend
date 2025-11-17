// MenuItem은 메뉴 아이템 '하나'의 타입
export interface MenuItem {
  id: number;
  name: string;
  price: number;
}

// 배열이므로 MenuItem[] 로 지정
const FAKE_MENU_ITEMS: MenuItem[] = [
  { id: 1, name: "페퍼로니 피자", price: 25000 },
  { id: 2, name: "치즈 피자", price: 22000 },
  { id: 3, name: "불고기 피자", price: 28000 },
  { id: 4, name: "콜라", price: 2000 },
  { id: 5, name: "사이다", price: 2000 },
];

// 반환도 배열이므로 Promise<MenuItem[]>
export const getMenuItems = async (): Promise<MenuItem[]> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return FAKE_MENU_ITEMS;
};
