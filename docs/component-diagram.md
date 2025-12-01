# 컴포넌트 다이어그램 (Component Diagram)

## 프론트엔드 서브시스템 구조

프론트엔드는 **하나의 서브시스템**이며, 그 안에 여러 **패키지(Package)**들이 존재합니다.

```mermaid
flowchart TB
    subgraph Frontend["🖥️ Frontend Subsystem (React + TypeScript)"]
        direction TB

        subgraph Entry["📦 Entry Point"]
            Main["main.tsx<br/>━━━━━━━━━<br/>• React Router 설정<br/>• QueryClient Provider<br/>• AuthProvider<br/>• ChakraProvider"]
        end

        subgraph Pages["📦 Pages Package"]
            direction LR
            subgraph PublicPages["Public Pages"]
                Home["🏠 Home"]
                Login["🔑 LoginPage"]
                Register["📝 RegisterPage"]
                MenuBrowse["📋 MenuBrowsePage"]
                About["ℹ️ About"]
            end
            subgraph ProtectedPages["Protected Pages"]
                MenuOrder["🛒 MenuOrderPage"]
                OrderHistory["📜 OrderHistoryPage"]
            end
            subgraph StaffPages["Staff Pages"]
                StaffDashboard["👨‍💼 StaffDashboardPage"]
            end
        end

        subgraph Components["📦 Components Package"]
            direction LR
            Layout["🎨 Layout<br/>(Navbar, Theme)"]
            ProtectedRoute["🔒 ProtectedRoute"]
            StaffRoute["👮 StaffRoute"]
            VoiceModal["🎤 VoiceOrderModal"]
        end

        subgraph Contexts["📦 Contexts Package"]
            AuthContext["🔐 AuthContext<br/>━━━━━━━━━<br/>• user state<br/>• isAuthenticated<br/>• login/logout"]
        end

        subgraph API["📦 API Services Package"]
            direction TB
            subgraph Core["Core"]
                Client["⚙️ client.ts<br/>(Axios + Interceptors)"]
                Types["📝 types.ts"]
            end
            subgraph Services["Domain Services"]
                AuthAPI["🔑 auth.ts"]
                MenuAPI["🍽️ menu.ts"]
                CartAPI["🛒 cart.ts"]
                OrdersAPI["📦 orders.ts"]
                StaffAPI["👨‍💼 staff.ts"]
                GroqAPI["🤖 groqService.ts"]
            end
        end

        subgraph Utils["📦 Utils Package"]
            JWT["🔧 jwt.ts<br/>(Token Decode)"]
        end

        subgraph StateManagement["📦 State Management"]
            ReactQuery["⚡ React Query<br/>━━━━━━━━━<br/>• Server State Cache<br/>• Auto Refetch<br/>• Mutations"]
        end
    end

    subgraph External["🌐 External Systems"]
        Backend["🖧 Spring Boot Backend<br/>(REST API)"]
        GroqCloud["🤖 Groq Cloud<br/>(AI/LLM)"]
        SpeechAPI["🎙️ Web Speech API"]
    end

    %% Entry Point Connections
    Main --> Pages
    Main --> Components
    Main --> Contexts
    Main --> StateManagement

    %% Pages using Components
    Pages --> Layout
    ProtectedPages --> ProtectedRoute
    StaffPages --> StaffRoute
    MenuOrder --> VoiceModal

    %% Components using Contexts
    Layout --> AuthContext
    ProtectedRoute --> AuthContext
    StaffRoute --> AuthContext
    VoiceModal --> GroqAPI

    %% Pages using API Services
    Login --> AuthAPI
    Register --> AuthAPI
    MenuBrowse --> MenuAPI
    MenuOrder --> MenuAPI
    MenuOrder --> CartAPI
    OrderHistory --> OrdersAPI
    StaffDashboard --> StaffAPI

    %% API Services using Core
    AuthAPI --> Client
    MenuAPI --> Client
    CartAPI --> Client
    OrdersAPI --> Client
    StaffAPI --> Client

    %% Context using Utils & API
    AuthContext --> JWT
    AuthContext --> AuthAPI

    %% State Management connections
    Pages --> ReactQuery
    ReactQuery --> API

    %% External connections
    Client --> Backend
    GroqAPI --> GroqCloud
    VoiceModal --> SpeechAPI

    %% Styling
    classDef subsystem fill:#e1f5fe,stroke:#01579b,stroke-width:3px
    classDef package fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef component fill:#e8f5e9,stroke:#2e7d32,stroke-width:1px
    classDef external fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef entry fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    class Frontend subsystem
    class Pages,Components,Contexts,API,Utils,StateManagement package
    class External external
    class Entry entry
```

---

## 패키지별 상세 설명

### 1. Entry Point (main.tsx)
애플리케이션 진입점으로, 모든 Provider들을 설정하고 라우팅을 구성합니다.

### 2. Pages Package
화면 단위 컴포넌트들로, 3가지 접근 레벨로 구분됩니다:
- **Public**: 인증 없이 접근 가능
- **Protected**: 로그인 필요
- **Staff**: STAFF 권한 필요

### 3. Components Package
재사용 가능한 UI 컴포넌트들:
- `Layout`: 공통 레이아웃 (Navbar, Theme Toggle)
- `ProtectedRoute`: 인증 가드
- `StaffRoute`: 권한 가드
- `VoiceOrderModal`: AI 음성 주문 모달

### 4. Contexts Package
React Context 기반 전역 상태 관리

### 5. API Services Package
백엔드 통신 계층:
- **Core**: Axios 클라이언트, 타입 정의
- **Domain Services**: 도메인별 API 호출

### 6. Utils Package
공통 유틸리티 함수들

### 7. State Management (React Query)
서버 상태 캐싱 및 동기화

---

## 간소화된 계층 다이어그램

```mermaid
flowchart TB
    subgraph Frontend["🖥️ DDogan-Zip Frontend Subsystem"]
        direction TB

        UI["🎨 UI Layer<br/>━━━━━━━━━━━━━━<br/>Pages + Components"]

        State["📊 State Layer<br/>━━━━━━━━━━━━━━<br/>Contexts + React Query"]

        Service["⚙️ Service Layer<br/>━━━━━━━━━━━━━━<br/>API Services"]

        Infra["🔧 Infrastructure Layer<br/>━━━━━━━━━━━━━━<br/>Axios Client + Utils"]
    end

    External["🌐 External<br/>━━━━━━━━━━<br/>Backend API<br/>Groq AI<br/>Web Speech"]

    UI --> State
    State --> Service
    Service --> Infra
    Infra --> External

    classDef layer fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef external fill:#ffebee,stroke:#c62828,stroke-width:2px

    class UI,State,Service,Infra layer
    class External external
```

---

## UML 표기법 컴포넌트 다이어그램

```mermaid
flowchart LR
    subgraph Frontend["≪subsystem≫<br/>Frontend Application"]
        direction TB

        subgraph pkg_pages["≪package≫ pages"]
            c_home["≪component≫<br/>Home"]
            c_menu["≪component≫<br/>MenuOrderPage"]
            c_staff["≪component≫<br/>StaffDashboard"]
        end

        subgraph pkg_components["≪package≫ components"]
            c_layout["≪component≫<br/>Layout"]
            c_guard["≪component≫<br/>RouteGuards"]
            c_voice["≪component≫<br/>VoiceModal"]
        end

        subgraph pkg_services["≪package≫ api"]
            c_auth["≪component≫<br/>AuthService"]
            c_menuapi["≪component≫<br/>MenuService"]
            c_cart["≪component≫<br/>CartService"]
            c_order["≪component≫<br/>OrderService"]
            c_groq["≪component≫<br/>GroqService"]
        end

        subgraph pkg_state["≪package≫ state"]
            c_authctx["≪component≫<br/>AuthContext"]
            c_query["≪component≫<br/>QueryClient"]
        end
    end

    subgraph External["≪external≫"]
        ext_backend["Spring Boot<br/>Backend"]
        ext_groq["Groq AI"]
    end

    %% Provided interfaces (lollipop)
    c_authctx -- "«provides»" --> IAuth(("IAuth"))
    c_query -- "«provides»" --> ICache(("ICache"))

    %% Required interfaces
    pkg_pages -- "«uses»" --> IAuth
    pkg_pages -- "«uses»" --> ICache

    %% Dependencies
    pkg_services --> ext_backend
    c_groq --> ext_groq

    classDef subsystem fill:#e8eaf6,stroke:#3f51b5,stroke-width:3px
    classDef package fill:#fff8e1,stroke:#ff8f00,stroke-width:2px
    classDef component fill:#e0f2f1,stroke:#00796b,stroke-width:1px
    classDef interface fill:#fff,stroke:#333,stroke-width:1px
    classDef external fill:#ffebee,stroke:#d32f2f,stroke-width:2px

    class Frontend subsystem
    class pkg_pages,pkg_components,pkg_services,pkg_state package
    class External external
```

---

## 의존성 요약

| From | To | 관계 |
|------|-----|------|
| Pages | Components | uses |
| Pages | API Services | uses |
| Pages | Contexts | uses |
| Components | Contexts | uses |
| Contexts | API Services | uses |
| Contexts | Utils | uses |
| API Services | Client | uses |
| Client | Backend | HTTP |
| GroqService | Groq Cloud | HTTP |
| VoiceModal | Web Speech API | uses |

---

## 결론

**프론트엔드는 단일 서브시스템(Subsystem)**이며, 내부에 다음 패키지들을 포함합니다:

1. **pages** - 9개의 페이지 컴포넌트
2. **components** - 4개의 재사용 컴포넌트
3. **contexts** - 1개의 인증 컨텍스트
4. **api** - 8개의 서비스 모듈
5. **utils** - 유틸리티 함수들

이 구조는 **계층형 아키텍처(Layered Architecture)**를 따르며, 각 계층은 바로 아래 계층에만 의존합니다.
