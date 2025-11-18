import type { DinnerMenuItem } from "./types";

// 백엔드 API 명세에 맞춘 모의 데이터
export const mockMenuItems: DinnerMenuItem[] = [
  {
    dinnerId: 1,
    name: "Valentine Dinner",
    description: "작은 하트 모양과 큐피드가 장식된 접시에 냅킨과 함께 와인과 스테이크가 제공",
    basePrice: 45000,
    imageUrl: "https://example.com/valentine.jpg",
  },
  {
    dinnerId: 2,
    name: "French Dinner",
    description: "커피 한잔, 와인 한잔, 샐러드, 스테이크 제공",
    basePrice: 48000,
    imageUrl: "https://example.com/french.jpg",
  },
  {
    dinnerId: 3,
    name: "English Dinner",
    description: "에그 스크램블, 베이컨, 빵, 스테이크가 제공",
    basePrice: 42000,
    imageUrl: "https://example.com/english.jpg",
  },
  {
    dinnerId: 4,
    name: "Champagne Feast Dinner",
    description: "항상 2인 식사이고, 샴페인 1병, 4개의 바게트빵, 커피 포트, 와인, 스테이크 제공",
    basePrice: 120000,
    imageUrl: "https://example.com/champagne.jpg",
  },
];
