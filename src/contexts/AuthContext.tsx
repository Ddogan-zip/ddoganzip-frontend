import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import * as authApi from "../api/auth";
import { tokenStorage } from "../api/client";
import { extractUserFromToken } from "../utils/jwt";
import type {
  LoginRequest,
  RegisterRequest,
} from "../api/types";

interface User {
  email: string;
  name: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 사용자 정보 저장소 (localStorage 사용)
const USER_STORAGE_KEY = "user";

const userStorage = {
  getUser: (): User | null => {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },
  setUser: (user: User): void => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },
  clearUser: (): void => {
    localStorage.removeItem(USER_STORAGE_KEY);
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  // 앱 시작시 토큰 및 사용자 정보 확인
  useEffect(() => {
    const initAuth = () => {
      const token = tokenStorage.getAccessToken();
      if (token) {
        // localStorage에서 사용자 정보 불러오기
        const savedUser = userStorage.getUser();
        if (savedUser) {
          setUser(savedUser);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      await authApi.login(data);

      // 토큰에서 사용자 정보 추출 (role 포함)
      const token = tokenStorage.getAccessToken();
      if (token) {
        const userFromToken = extractUserFromToken(token);
        console.log("=== AuthContext Login Debug ===");
        console.log("User from token:", userFromToken);
        console.log("================================");

        if (userFromToken) {
          setUser(userFromToken);
          userStorage.setUser(userFromToken);
        } else {
          // JWT 디코딩 실패 시 기본 정보 사용
          const user = {
            email: data.email,
            name: data.email.split("@")[0],
          };
          setUser(user);
          userStorage.setUser(user);
        }
      }

      toast({
        title: "로그인 성공",
        description: "환영합니다!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "로그인 실패",
        description: error.response?.data?.error?.message || "로그인에 실패했습니다.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setIsLoading(true);
      // 회원가입 API 호출 (토큰을 반환하지 않음)
      await authApi.register(data);

      toast({
        title: "회원가입 성공",
        description: "로그인 중입니다...",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      // 회원가입 후 자동 로그인
      await login({
        email: data.email,
        password: data.password,
      });
    } catch (error: any) {
      toast({
        title: "회원가입 실패",
        description: error.response?.data?.error?.message || "회원가입에 실패했습니다.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("로그아웃 API 호출 실패:", error);
    } finally {
      tokenStorage.clearTokens();
      userStorage.clearUser(); // localStorage에서 사용자 정보 삭제
      setUser(null);
      toast({
        title: "로그아웃",
        description: "로그아웃되었습니다.",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
