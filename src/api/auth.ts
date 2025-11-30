import { apiClient, tokenStorage } from "./client";
import type {
  RegisterRequest,
  LoginRequest,
  TokenResponse,
  RefreshRequest,
  SuccessResponse,
  UserProfile,
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
  const response = await apiClient.post<TokenResponse>(
    "/api/auth/login",
    data
  );

  // 백엔드가 TokenResponse를 직접 반환 (SuccessResponse 래퍼 없음)
  if (response.data && response.data.accessToken && response.data.refreshToken) {
    tokenStorage.setAccessToken(response.data.accessToken);
    tokenStorage.setRefreshToken(response.data.refreshToken);
    return response.data;
  }

  throw new Error("Login failed: no token received");
};

// 토큰 갱신
export const refreshToken = async (
  data: RefreshRequest
): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>(
    "/api/auth/refresh",
    data
  );

  // 백엔드가 TokenResponse를 직접 반환
  if (response.data && response.data.accessToken && response.data.refreshToken) {
    tokenStorage.setAccessToken(response.data.accessToken);
    tokenStorage.setRefreshToken(response.data.refreshToken);
    return response.data;
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

// 현재 사용자 프로필 조회 (회원 등급 정보 포함)
export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>("/api/auth/me");
  return response.data;
};
