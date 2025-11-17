// 음성인식 팀의 API가 반환해 줄 데이터의 타입을 미리 정의합니다.
export interface VoiceCommand {
  action: "order" | "cancel" | "checkout" | "unknown";
  dinner_type?: string;
  serving_style?: string;
  quantity?: number;
  reply: string;
}

// 음성 텍스트를 받아 분석된 JSON 결과를 반환하는 가짜 API 함수입니다.
export const processVoiceCommand = async (
  transcript: string
): Promise<VoiceCommand> => {
  console.log(`음성인식 API로 전송: "${transcript}"`);
  // 0.5초의 네트워크 딜레이를 흉내 냅니다.
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 이 부분의 | 를 || 로 수정했습니다!
  if (transcript.includes("결제") || transcript.includes("체크아웃")) {
    return {
      action: "checkout",
      reply: "장바구니를 결제할게요.",
    };
  }

  // 간단한 분석 로직 (실제로는 음성인식 팀의 서버가 처리)
  if (transcript.includes("주문")) {
    return {
      action: "order",
      dinner_type: "페퍼로니 피자", // 실제 메뉴 이름으로 수정
      serving_style: "simple", // 예시 데이터
      quantity: 1, // 예시 데이터
      reply: `네, ${transcript} 요청을 접수했습니다!`,
    };
  }

  return {
    action: "unknown",
    reply: "죄송합니다. 잘 이해하지 못했어요. 다시 말씀해주세요.",
  };
};
