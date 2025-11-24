import { apiClient, tokenStorage } from "./client";
import type {
  RegisterRequest,
  LoginRequest,
  TokenResponse,
  RefreshRequest,
  SuccessResponse,
} from "./types";

// 회원가입
export const register = async (data: RegisterRequest): Promise<void> => {
  await apiClient.post<SuccessResponse<null>>(
    "/api/auth/register",
    data
  );
  // 회원가입은 토큰을 반환하지 않음. 별도로 로그인 필요
};

// 로그인
export const login = async (data: LoginRequest): Promise<TokenResponse> => {
  const response = await apiClient.post<SuccessResponse<TokenResponse>>(
    "/api/auth/login",
    data
  );

  // 디버깅: 실제 응답 구조 확인
  console.log("=== Login Response ===");
  console.log("Full response:", response);
  console.log("response.data:", response.data);
  console.log("response.data.data:", response.data.data);

  // 토큰 저장 (data 필드 안에 있음)
  if (response.data.data) {
    tokenStorage.setAccessToken(response.data.data.accessToken);
    tokenStorage.setRefreshToken(response.data.data.refreshToken);
    return response.data.data;
  }

  // 응답 구조가 다를 수 있으므로 에러에 포함
  throw new Error(`Login failed: no token received. Response: ${JSON.stringify(response.data)}`);
};

// 토큰 갱신
export const refreshToken = async (
  data: RefreshRequest
): Promise<TokenResponse> => {
  const response = await apiClient.post<SuccessResponse<TokenResponse>>(
    "/api/auth/refresh",
    data
  );

  // 새 토큰 저장
  if (response.data.data) {
    tokenStorage.setAccessToken(response.data.data.accessToken);
    tokenStorage.setRefreshToken(response.data.data.refreshToken);
    return response.data.data;
  }

  throw new Error("Token refresh failed");
};

// 로그아웃
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post("/api/auth/logout");
  } finally {
    // 로컬 토큰 삭제
    tokenStorage.clearTokens();
  }
};

// 현재 로그인 상태 확인
export const isAuthenticated = (): boolean => {
  return !!tokenStorage.getAccessToken();
};
