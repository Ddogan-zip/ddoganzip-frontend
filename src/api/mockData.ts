import type { DinnerMenuItem, DinnerDetail, ServingStyle, Dish } from "./types";

// 서빙 스타일 데이터
export const mockServingStyles: ServingStyle[] = [
  {
    styleId: 1,
    name: "Simple",
    additionalPrice: 0,
    description: "플라스틱 접시와 플라스틱 컵, 종이 냅킨이 플라스틱 쟁반에 제공",
  },
  {
    styleId: 2,
    name: "Grand",
    additionalPrice: 15000,
    description: "도자기 접시와 도자기 컵, 흰색 면 냅킨이 나무 쟁반에 제공",
  },
  {
    styleId: 3,
    name: "Deluxe",
    additionalPrice: 30000,
    description: "꽃병, 도자기 접시와 도자기 컵, 린넨 냅킨이 나무 쟁반에 제공",
  },
];

// 요리 품목 데이터
export const mockDishes: Record<number, Dish[]> = {
  1: [ // Valentine Dinner
    { dishId: 1, name: "Steak", description: "프리미엄 스테이크", basePrice: 25000, defaultQuantity: 1 },
    { dishId: 2, name: "Wine", description: "레드 와인", basePrice: 8000, defaultQuantity: 1 },
    { dishId: 11, name: "Heart Decoration", description: "하트 장식", basePrice: 2000, defaultQuantity: 1 },
    { dishId: 12, name: "Cupid Decoration", description: "큐피드 장식", basePrice: 3000, defaultQuantity: 1 },
    { dishId: 13, name: "Napkin", description: "냅킨", basePrice: 500, defaultQuantity: 1 },
  ],
  2: [ // French Dinner
    { dishId: 3, name: "Coffee", description: "아메리카노", basePrice: 3000, defaultQuantity: 1 },
    { dishId: 2, name: "Wine", description: "레드 와인", basePrice: 8000, defaultQuantity: 1 },
    { dishId: 4, name: "Salad", description: "신선한 샐러드", basePrice: 5000, defaultQuantity: 1 },
    { dishId: 1, name: "Steak", description: "프리미엄 스테이크", basePrice: 25000, defaultQuantity: 1 },
  ],
  3: [ // English Dinner
    { dishId: 5, name: "Scrambled Eggs", description: "에그 스크램블", basePrice: 4000, defaultQuantity: 1 },
    { dishId: 6, name: "Bacon", description: "베이컨", basePrice: 5000, defaultQuantity: 1 },
    { dishId: 7, name: "Bread", description: "식빵", basePrice: 2000, defaultQuantity: 1 },
    { dishId: 1, name: "Steak", description: "프리미엄 스테이크", basePrice: 25000, defaultQuantity: 1 },
  ],
  4: [ // Champagne Feast Dinner
    { dishId: 8, name: "Champagne", description: "샴페인 (병)", basePrice: 50000, defaultQuantity: 1 },
    { dishId: 9, name: "Baguette", description: "바게트빵", basePrice: 3000, defaultQuantity: 4 },
    { dishId: 10, name: "Coffee Pot", description: "커피 포트 (6잔)", basePrice: 10000, defaultQuantity: 1 },
    { dishId: 2, name: "Wine", description: "레드 와인", basePrice: 8000, defaultQuantity: 1 },
    { dishId: 1, name: "Steak", description: "프리미엄 스테이크", basePrice: 25000, defaultQuantity: 2 },
  ],
};

// 백엔드 API 명세에 맞춘 모의 데이터
export const mockMenuItems: DinnerMenuItem[] = [
  {
    dinnerId: 1,
    name: "Valentine Dinner",
    description: "작은 하트 모양과 큐피드가 장식된 접시에 냅킨과 함께 와인과 스테이크가 제공",
    basePrice: 45000,
    imageUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400",
  },
  {
    dinnerId: 2,
    name: "French Dinner",
    description: "커피 한잔, 와인 한잔, 샐러드, 스테이크 제공",
    basePrice: 48000,
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
  },
  {
    dinnerId: 3,
    name: "English Dinner",
    description: "에그 스크램블, 베이컨, 빵, 스테이크가 제공",
    basePrice: 42000,
    imageUrl: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400",
  },
  {
    dinnerId: 4,
    name: "Champagne Feast Dinner",
    description: "항상 2인 식사이고, 샴페인 1병, 4개의 바게트빵, 커피 포트, 와인, 스테이크 제공",
    basePrice: 120000,
    imageUrl: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400",
  },
];

// 메뉴 상세 정보 생성 함수
export const getMockMenuDetail = (dinnerId: number): DinnerDetail | null => {
  const menuItem = mockMenuItems.find(item => item.dinnerId === dinnerId);
  if (!menuItem) return null;

  // 샴페인 축제 디너는 Simple 스타일 제외
  const availableStyles = dinnerId === 4
    ? mockServingStyles.filter(style => style.styleId !== 1)
    : mockServingStyles;

  return {
    ...menuItem,
    dishes: mockDishes[dinnerId] || [],
    availableStyles,
  };
};
