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

  // 디버깅: JWT 페이로드 전체 출력
  console.log("=== JWT Payload Debug ===");
  console.log("Full payload:", JSON.stringify(payload, null, 2));
  console.log("Role field:", payload.role);
  console.log("========================");

  // role 필드를 여러 가능한 이름으로 확인
  let role: string | undefined = undefined;

  // 1. 직접 role 필드 확인
  if (payload.role) {
    role = payload.role;
  }

  // 2. authorities 배열 확인 (Spring Security)
  else if ((payload as any).authorities && Array.isArray((payload as any).authorities)) {
    const authorities = (payload as any).authorities;
    if (authorities.length > 0) {
      // "ROLE_STAFF" 형태에서 "STAFF" 추출
      role = authorities[0].replace(/^ROLE_/, "");
    }
  }

  // 3. roles 배열 확인
  else if ((payload as any).roles && Array.isArray((payload as any).roles)) {
    const roles = (payload as any).roles;
    if (roles.length > 0) {
      role = roles[0];
    }
  }

  console.log("Extracted role:", role);

  return {
    email: payload.sub,
    name: payload.sub.split("@")[0],
    role: role,
  };
}
