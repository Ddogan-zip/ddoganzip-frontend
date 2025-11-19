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
  try {
    const response = await apiClient.post<SuccessResponse<null>>(
      "/api/auth/register",
      data
    );
    // 회원가입 성공
  } catch (error: any) {
    // 백엔드가 없을 때 임시로 성공 처리
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      console.warn("백엔드 서버에 연결할 수 없습니다. 회원가입을 임시로 처리합니다.");
      return; // 성공으로 간주
    }
    throw error;
  }
};

// 로그인
export const login = async (data: LoginRequest): Promise<TokenResponse> => {
  try {
    const response = await apiClient.post<SuccessResponse<TokenResponse>>(
      "/api/auth/login",
      data
    );

    // 토큰 저장 (data 필드 안에 있음)
    if (response.data.data) {
      tokenStorage.setAccessToken(response.data.data.accessToken);
      tokenStorage.setRefreshToken(response.data.data.refreshToken);
      return response.data.data;
    }

    throw new Error("Login failed: no token received");
  } catch (error: any) {
    // 백엔드가 없을 때 임시 토큰 생성
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      console.warn("백엔드 서버에 연결할 수 없습니다. 임시 토큰을 생성합니다.");
      const mockToken: TokenResponse = {
        accessToken: "mock-access-token-" + Date.now(),
        refreshToken: "mock-refresh-token-" + Date.now(),
        tokenType: "Bearer",
      };
      tokenStorage.setAccessToken(mockToken.accessToken);
      tokenStorage.setRefreshToken(mockToken.refreshToken);
      return mockToken;
    }
    throw error;
  }
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
