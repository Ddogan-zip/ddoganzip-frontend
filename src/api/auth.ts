import { apiClient, tokenStorage } from "./client";
import type {
  RegisterRequest,
  LoginRequest,
  TokenResponse,
  RefreshRequest,
} from "./types";

// 회원가입
export const register = async (
  data: RegisterRequest
): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>(
    "/api/auth/register",
    data
  );

  // 토큰 저장
  tokenStorage.setAccessToken(response.data.accessToken);
  tokenStorage.setRefreshToken(response.data.refreshToken);

  return response.data;
};

// 로그인
export const login = async (data: LoginRequest): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>("/api/auth/login", data);

  // 토큰 저장
  tokenStorage.setAccessToken(response.data.accessToken);
  tokenStorage.setRefreshToken(response.data.refreshToken);

  return response.data;
};

// 토큰 갱신
export const refreshToken = async (
  data: RefreshRequest
): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>(
    "/api/auth/refresh",
    data
  );

  // 새 토큰 저장
  tokenStorage.setAccessToken(response.data.accessToken);
  if (response.data.refreshToken) {
    tokenStorage.setRefreshToken(response.data.refreshToken);
  }

  return response.data;
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
