# Level 2: 인증 & 사용자 관리

[< 목차로 돌아가기](./README.md)

---

## 개요

인증, 사용자 관리, JWT 토큰 처리와 관련된 클래스들입니다.

---

## 인증 타입 (API Types)

```mermaid
---
title: Authentication Types
---
classDiagram
    direction LR

    class RegisterRequest {
        +string email
        +string password
        +string name
        +string phoneNumber
        +string address
    }

    class LoginRequest {
        +string email
        +string password
    }

    class TokenResponse {
        +string accessToken
        +string refreshToken
        +string tokenType
    }

    class RefreshRequest {
        +string refreshToken
    }

    class UserProfile {
        +number id
        +string email
        +string name
        +string address
        +string phone
        +MemberGrade memberGrade
        +number orderCount
    }

    class MemberGrade {
        <<enumeration>>
        NORMAL
        BRONZE
        SILVER
        GOLD
        VIP
    }

    UserProfile --> MemberGrade : has
```

---

## 인증 서비스

```mermaid
---
title: Auth Service & Client
---
classDiagram
    direction TB

    class AuthService {
        <<service>>
        +register(data: RegisterRequest) Promise~void~
        +login(data: LoginRequest) Promise~TokenResponse~
        +refreshToken(data: RefreshRequest) Promise~TokenResponse~
        +logout() Promise~void~
        +isAuthenticated() boolean
        +getUserProfile() Promise~UserProfile~
    }

    class ApiClient {
        <<singleton>>
        -AxiosInstance instance
        -string baseURL
        +post(url, data) Promise
        +get(url) Promise
    }

    class TokenStorage {
        <<utility>>
        +getAccessToken() string | null
        +setAccessToken(token: string) void
        +getRefreshToken() string | null
        +setRefreshToken(token: string) void
        +clearTokens() void
    }

    class RequestInterceptor {
        <<interceptor>>
        +addAuthHeader(config) AxiosRequestConfig
    }

    class ResponseInterceptor {
        <<interceptor>>
        +handle401Error(error) Promise
        +refreshAndRetry() Promise
    }

    AuthService --> ApiClient : uses
    ApiClient --> TokenStorage : reads/writes
    ApiClient --> RequestInterceptor : uses
    ApiClient --> ResponseInterceptor : uses
    ResponseInterceptor --> TokenStorage : uses
```

---

## JWT 유틸리티

```mermaid
---
title: JWT Utilities
---
classDiagram
    direction LR

    class JWTPayload {
        +string sub
        +string role
        +number iat
        +number exp
    }

    class JWTUtils {
        <<utility>>
        +decodeJWT(token: string) JWTPayload | null
        +extractUserFromToken(token: string) UserInfo | null
    }

    class UserInfo {
        +string email
        +string name
        +string role
    }

    JWTUtils --> JWTPayload : creates
    JWTUtils --> UserInfo : creates
```

---

## Auth Context (상태 관리)

```mermaid
---
title: Auth Context & Provider
---
classDiagram
    direction TB

    class User {
        +string email
        +string name
        +string role
    }

    class AuthContextType {
        <<interface>>
        +User | null user
        +boolean isAuthenticated
        +boolean isLoading
        +login(data: LoginRequest) Promise~void~
        +register(data: RegisterRequest) Promise~void~
        +logout() void
    }

    class AuthProvider {
        <<React Component>>
        -User | null user
        -boolean isLoading
        +login(data: LoginRequest) Promise~void~
        +register(data: RegisterRequest) Promise~void~
        +logout() void
        -initializeAuth() void
    }

    class UserStorage {
        <<utility>>
        +getUser() User | null
        +setUser(user: User) void
        +clearUser() void
    }

    class useAuth {
        <<hook>>
        +returns AuthContextType
    }

    AuthProvider ..|> AuthContextType : implements
    AuthProvider --> User : manages
    AuthProvider --> UserStorage : uses
    AuthProvider --> AuthService : uses
    AuthProvider --> TokenStorage : uses
    AuthProvider --> JWTUtils : uses
    useAuth --> AuthContextType : returns
```

---

## 인증 관련 페이지

```mermaid
---
title: Auth Pages
---
classDiagram
    direction TB

    class LoginPage {
        <<page>>
        -LoginRequest formData
        -handleSubmit(e: FormEvent) Promise~void~
        -handleChange(e: ChangeEvent) void
        +render() ReactElement
    }

    class RegisterPage {
        <<page>>
        -RegisterRequest formData
        -handleSubmit(e: FormEvent) Promise~void~
        -handleChange(e: ChangeEvent) void
        +render() ReactElement
    }

    class ProtectedRoute {
        <<component>>
        +ReactNode children
        -checkAuthentication() boolean
        +render() ReactElement | Navigate
    }

    class StaffRoute {
        <<component>>
        +ReactNode children
        -checkStaffRole() boolean
        +render() ReactElement | AccessDenied
    }

    LoginPage --> useAuth : uses
    LoginPage --> LoginRequest : creates

    RegisterPage --> useAuth : uses
    RegisterPage --> RegisterRequest : creates

    ProtectedRoute --> useAuth : uses
    StaffRoute --> useAuth : uses
    StaffRoute --> ProtectedRoute : wraps
```

---

## 전체 인증 흐름

```mermaid
---
title: Authentication Flow
---
sequenceDiagram
    participant U as User
    participant LP as LoginPage
    participant AP as AuthProvider
    participant AS as AuthService
    participant TS as TokenStorage
    participant JWT as JWTUtils
    participant API as Backend

    U->>LP: Enter credentials
    LP->>AP: login(email, password)
    AP->>AS: login(LoginRequest)
    AS->>API: POST /auth/login
    API-->>AS: TokenResponse
    AS->>TS: setAccessToken()
    AS->>TS: setRefreshToken()
    AS-->>AP: TokenResponse
    AP->>JWT: extractUserFromToken()
    JWT-->>AP: UserInfo
    AP->>AP: setUser(user)
    AP-->>LP: success
    LP->>U: Redirect to home
```

---

## 회원 등급 설정

```mermaid
---
title: Member Grade Configuration
---
classDiagram
    class MemberGrade {
        <<enumeration>>
        NORMAL
        BRONZE
        SILVER
        GOLD
        VIP
    }

    class MemberGradeConfig {
        <<constant>>
        +string label
        +number discountPercent
        +string colorScheme
    }

    class GradeConfigMap {
        <<Record~MemberGrade, MemberGradeConfig~>>
        NORMAL: 0% discount
        BRONZE: 5% discount
        SILVER: 8% discount
        GOLD: 11% discount
        VIP: 15% discount
    }

    GradeConfigMap --> MemberGrade : keyed by
    GradeConfigMap --> MemberGradeConfig : contains
```
