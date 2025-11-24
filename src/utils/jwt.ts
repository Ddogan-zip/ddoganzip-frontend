/**
 * JWT 토큰 디코딩 유틸리티
 */

interface JWTPayload {
  sub: string; // email
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT 토큰에서 페이로드를 추출합니다
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT는 header.payload.signature 형태
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // payload는 두 번째 부분
    const payload = parts[1];

    // Base64 URL 디코딩
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("JWT decode error:", error);
    return null;
  }
}

/**
 * JWT 토큰에서 사용자 정보를 추출합니다
 */
export function extractUserFromToken(token: string): {
  email: string;
  name: string;
  role?: string;
} | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.sub) {
    return null;
  }

  return {
    email: payload.sub,
    name: payload.sub.split("@")[0],
    role: payload.role,
  };
}
