// Groq API를 사용한 음성 주문 AI 서비스
import type { DinnerMenuItem, DinnerDetail } from "./types";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// 대화 메시지 타입
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// 주문 상태
export interface OrderState {
  dinnerName?: string;
  dinnerId?: number;
  servingStyle?: string;
  servingStyleId?: number;
  quantity: number;
  customizations: Array<{
    dishName: string;
    dishId: number;
    quantity: number;
    action: "ADD" | "REMOVE";
  }>;
  deliveryDate?: string;
  isConfirmed: boolean;
}

// AI 응답 타입
export interface AIResponse {
  message: string;
  orderState: OrderState;
  action: "continue" | "confirm" | "cancel" | "add_more";
}

// 시스템 프롬프트 생성
export const createSystemPrompt = (
  customerName: string,
  menuItems: DinnerMenuItem[],
  menuDetails?: Map<number, DinnerDetail>
): string => {
  const menuList = menuItems
    .map((item) => {
      const details = menuDetails?.get(item.dinnerId);
      let menuInfo = `- ${item.name}: ${item.basePrice.toLocaleString()}원 (${item.description})`;

      if (details) {
        const dishes = details.dishes
          .map((d) => `${d.name} ${d.defaultQuantity}개`)
          .join(", ");
        const styles = details.availableStyles
          .map((s) => `${s.name}(+${s.additionalPrice.toLocaleString()}원)`)
          .join(", ");
        menuInfo += `\n  구성: ${dishes}\n  서빙 스타일: ${styles}`;
      }
      return menuInfo;
    })
    .join("\n");

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
  };

  return `당신은 고급 디너 배달 서비스 "도간집"의 AI 주문 어시스턴트입니다.
고객님의 이름은 ${customerName}입니다.

## 메뉴 정보
${menuList}

## 대화 규칙
1. 항상 친근하고 정중하게 대화합니다.
2. 고객이 디너 추천을 요청하면, 기념일이나 상황을 먼저 물어보고 적절한 메뉴를 추천합니다.
3. 디너를 선택하면 서빙 스타일(Simple, Grand, Deluxe)을 추천합니다.
4. 구성 품목의 수량 변경 요청을 처리합니다 (예: "바케트빵을 6개로", "샴페인을 2병으로").
5. 주문 내용을 확인한 후, 추가 요청 사항이 있는지 물어봅니다.
6. 최종 확인 후 배송 날짜를 안내합니다.

## 날짜 정보
- 오늘: ${formatDate(today)}
- 내일: ${formatDate(tomorrow)}
- 모레: ${formatDate(dayAfterTomorrow)}

## 응답 형식
반드시 다음 JSON 형식으로만 응답하세요:
{
  "message": "고객에게 보낼 메시지",
  "orderState": {
    "dinnerName": "선택된 디너 이름 또는 null",
    "dinnerId": 디너 ID 숫자 또는 null,
    "servingStyle": "선택된 서빙 스타일 이름 또는 null",
    "servingStyleId": 서빙 스타일 ID 숫자 또는 null,
    "quantity": 수량(기본 1),
    "customizations": [{"dishName": "품목명", "dishId": 품목ID, "quantity": 변경할수량, "action": "ADD 또는 REMOVE"}],
    "deliveryDate": "YYYY-MM-DD 형식 또는 null",
    "isConfirmed": false
  },
  "action": "continue 또는 confirm 또는 cancel 또는 add_more"
}

## action 설명
- continue: 대화를 계속 진행
- confirm: 주문 확정 (고객이 "맞아요", "네", "주문할게요" 등으로 확인)
- cancel: 주문 취소
- add_more: 추가 주문 필요 (고객이 더 추가하고 싶다고 함)

## 서빙 스타일 매핑
- Simple/심플/간단: styleId 1
- Grand/그랜드/화려: styleId 2
- Deluxe/디럭스/고급: styleId 3

## 중요
- 반드시 유효한 JSON만 응답하세요. 다른 텍스트를 포함하지 마세요.
- 디너 이름과 ID는 메뉴 정보에서 정확히 매칭하세요.
- 고객이 "내일"이라고 하면 ${formatDate(tomorrow)}, "모레"라고 하면 ${formatDate(dayAfterTomorrow)}로 배송 날짜를 설정하세요.`;
};

// Groq API 호출
export const chatWithAI = async (
  messages: ChatMessage[],
  customerName: string,
  menuItems: DinnerMenuItem[],
  menuDetails?: Map<number, DinnerDetail>
): Promise<AIResponse> => {
  const systemPrompt = createSystemPrompt(customerName, menuItems, menuDetails);

  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Groq API 호출 실패");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("AI 응답이 비어있습니다");
    }

    // JSON 파싱
    try {
      // JSON 블록 추출 (마크다운 코드 블록 처리)
      let jsonStr = content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else {
        // 일반 JSON 객체 추출
        const plainJsonMatch = content.match(/\{[\s\S]*\}/);
        if (plainJsonMatch) {
          jsonStr = plainJsonMatch[0];
        }
      }

      const parsed = JSON.parse(jsonStr);
      return {
        message: parsed.message || "죄송합니다. 다시 말씀해주세요.",
        orderState: {
          dinnerName: parsed.orderState?.dinnerName || undefined,
          dinnerId: parsed.orderState?.dinnerId || undefined,
          servingStyle: parsed.orderState?.servingStyle || undefined,
          servingStyleId: parsed.orderState?.servingStyleId || undefined,
          quantity: parsed.orderState?.quantity || 1,
          customizations: parsed.orderState?.customizations || [],
          deliveryDate: parsed.orderState?.deliveryDate || undefined,
          isConfirmed: parsed.orderState?.isConfirmed || false,
        },
        action: parsed.action || "continue",
      };
    } catch (parseError) {
      console.error("JSON 파싱 실패:", content);
      return {
        message: content,
        orderState: {
          quantity: 1,
          customizations: [],
          isConfirmed: false,
        },
        action: "continue",
      };
    }
  } catch (error) {
    console.error("Groq API 오류:", error);
    throw error;
  }
};

// 초기 인사 메시지 생성
export const getInitialGreeting = (customerName: string): string => {
  return `안녕하세요, ${customerName} 고객님! 어떤 디너를 주문하시겠습니까?`;
};

// 텍스트를 음성으로 변환 (Web Speech API)
export const speakText = (text: string, onEnd?: () => void): void => {
  // 기존 음성 중지
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // 한국어 음성 선택
  const voices = window.speechSynthesis.getVoices();
  const koreanVoice = voices.find((voice) => voice.lang.includes("ko"));
  if (koreanVoice) {
    utterance.voice = koreanVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
  }

  window.speechSynthesis.speak(utterance);
};

// 음성 합성 중지
export const stopSpeaking = (): void => {
  window.speechSynthesis.cancel();
};
