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

---

# 환경별 배치 다이어그램 (Deployment Diagram)

## 1. 로컬 개발/테스트 환경 (시연용)

개발 및 시연 시 사용하는 환경입니다. Vite 개발 서버가 프록시 역할을 수행합니다.

```mermaid
flowchart TB
    subgraph LocalMachine["🖥️ 로컬 개발 환경 (localhost)"]
        subgraph Browser["🌐 브라우저"]
            ReactApp["⚛️ React Application<br/>━━━━━━━━━━━━━<br/>• 사용자 인터페이스<br/>• 상태 관리<br/>• API 호출"]
        end

        subgraph ViteServer["📦 Vite Dev Server (:5173)"]
            direction TB
            StaticServe["정적 파일 서빙<br/>(HMR 지원)"]
            Proxy["🔀 Proxy 설정"]

            subgraph ProxyRules["프록시 규칙"]
                ApiProxy["/api/* → :8080"]
                GroqProxy["/groq-api/* → api.groq.com"]
            end
        end

        subgraph SpringBoot["🍃 Spring Boot (:8080)"]
            direction TB
            AuthController["🔑 Auth API"]
            MenuController["🍽️ Menu API"]
            CartController["🛒 Cart API"]
            OrderController["📦 Order API"]
            StaffController["👨‍💼 Staff API"]

            subgraph DB["💾 H2 / MySQL"]
                Database[(Database)]
            end
        end
    end

    subgraph ExternalCloud["☁️ 외부 클라우드 서비스"]
        GroqAPI["🤖 Groq Cloud API<br/>(LLM 서비스)"]
        SpeechAPI["🎙️ Web Speech API<br/>(브라우저 내장)"]
    end

    %% Connections
    ReactApp -->|"HTTP :5173"| ViteServer
    ViteServer -->|"serves"| ReactApp

    Proxy --> ApiProxy
    Proxy --> GroqProxy

    ApiProxy -->|"HTTP :8080"| SpringBoot
    GroqProxy -->|"HTTPS"| GroqAPI

    AuthController --> Database
    MenuController --> Database
    CartController --> Database
    OrderController --> Database
    StaffController --> Database

    ReactApp -.->|"Web Speech API"| SpeechAPI

    %% Styling
    classDef browser fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef vite fill:#646cff20,stroke:#646cff,stroke-width:2px
    classDef spring fill:#6db33f20,stroke:#6db33f,stroke-width:2px
    classDef external fill:#fff3e0,stroke:#ff6f00,stroke-width:2px
    classDef db fill:#fce4ec,stroke:#c2185b,stroke-width:1px

    class Browser browser
    class ViteServer vite
    class SpringBoot spring
    class ExternalCloud external
    class DB db
```

### 로컬 환경 특징

| 구성요소 | 포트 | 역할 |
|---------|------|------|
| Vite Dev Server | 5173 | 프론트엔드 서빙 + 프록시 |
| Spring Boot | 8080 | 백엔드 API 서버 |
| Groq API | 외부 | AI 음성 주문 (프록시 경유) |

**핵심 포인트:**
- Vite 프록시가 CORS 문제 해결
- Groq API 키가 프론트엔드에 있지만, 프록시를 통해 요청하므로 **개발 환경에서는** 동작
- 모든 것이 localhost에서 실행

---

## 2. AWS 프로덕션 환경 (이상적인 구조)

실제 서비스 배포 시 권장되는 아키텍처입니다.

```mermaid
flowchart TB
    subgraph Users["👥 사용자"]
        UserBrowser["🌐 사용자 브라우저"]
    end

    subgraph AWS["☁️ AWS Cloud"]
        subgraph CDN["🌍 CloudFront (CDN)"]
            CF["글로벌 캐싱<br/>HTTPS 제공"]
        end

        subgraph S3Bucket["📦 S3 Bucket"]
            StaticFiles["정적 파일<br/>━━━━━━━━━━<br/>• index.html<br/>• bundle.js<br/>• styles.css<br/>• assets/"]
        end

        subgraph VPC["🔒 VPC (Private Network)"]
            subgraph PublicSubnet["Public Subnet"]
                ALB["⚖️ Application<br/>Load Balancer"]
            end

            subgraph PrivateSubnet["Private Subnet"]
                subgraph ECS["🐳 ECS / EC2"]
                    SpringBoot2["🍃 Spring Boot<br/>━━━━━━━━━━━━━<br/>• Auth API<br/>• Menu API<br/>• Cart API<br/>• Order API<br/>• Staff API<br/>• 🆕 AI Proxy API"]
                end

                subgraph RDS["💾 RDS"]
                    MySQL[(MySQL<br/>Database)]
                end
            end
        end

        subgraph Secrets["🔐 AWS Secrets Manager"]
            APIKeys["• DB 비밀번호<br/>• Groq API Key<br/>• JWT Secret"]
        end
    end

    subgraph ExternalServices["🌐 외부 서비스"]
        GroqCloud["🤖 Groq Cloud<br/>(AI/LLM)"]
    end

    %% User flow
    UserBrowser -->|"HTTPS"| CF
    CF -->|"정적 파일"| S3Bucket
    CF -->|"/api/*"| ALB

    ALB --> SpringBoot2
    SpringBoot2 --> MySQL
    SpringBoot2 -->|"API Key from Secrets"| Secrets
    SpringBoot2 -->|"서버에서 호출"| GroqCloud

    %% Styling
    classDef user fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef cdn fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef s3 fill:#fff3e0,stroke:#ff6f00,stroke-width:2px
    classDef compute fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef db fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef secrets fill:#fff8e1,stroke:#f9a825,stroke-width:2px
    classDef external fill:#eceff1,stroke:#546e7a,stroke-width:2px

    class Users user
    class CDN cdn
    class S3Bucket s3
    class ECS compute
    class RDS db
    class Secrets secrets
    class ExternalServices external
```

### AWS 환경 구성요소

| 구성요소 | AWS 서비스 | 역할 | 비용 |
|---------|-----------|------|------|
| 프론트엔드 호스팅 | S3 + CloudFront | 정적 파일 서빙, CDN | 💰 저렴 |
| 백엔드 서버 | ECS Fargate / EC2 | API 서버 | 💰💰 중간 |
| 데이터베이스 | RDS MySQL | 영구 데이터 저장 | 💰💰 중간 |
| 로드밸런서 | ALB | 트래픽 분산, HTTPS | 💰 저렴 |
| 비밀 관리 | Secrets Manager | API 키, 비밀번호 | 💰 저렴 |

### 프로덕션 환경의 핵심 차이점

```mermaid
flowchart LR
    subgraph Local["🖥️ 로컬 (개발)"]
        L1["브라우저"] --> L2["Vite (:5173)"]
        L2 --> L3["Spring Boot (:8080)"]
        L2 -->|"⚠️ API 키 노출 위험"| L4["Groq API"]
    end

    subgraph Prod["☁️ AWS (프로덕션)"]
        P1["브라우저"] --> P2["CloudFront"]
        P2 --> P3["S3 (정적파일)"]
        P2 --> P4["ALB → Spring Boot"]
        P4 -->|"✅ API 키 서버에만"| P5["Groq API"]
    end

    classDef warning fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef safe fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px

    class L4 warning
    class P5 safe
```

---

## 3. 환경별 비교표

| 항목 | 로컬 개발 환경 | AWS 프로덕션 환경 |
|------|---------------|------------------|
| **프론트엔드 서버** | Vite Dev Server (:5173) | S3 + CloudFront (서버리스) |
| **백엔드 서버** | Spring Boot (:8080) | ECS/EC2 + ALB |
| **데이터베이스** | H2 (in-memory) / 로컬 MySQL | RDS MySQL |
| **AI API 호출** | Vite 프록시 경유 | Spring Boot에서 직접 호출 |
| **API 키 위치** | 프론트엔드 환경변수 (⚠️) | Secrets Manager (✅) |
| **HTTPS** | ❌ HTTP | ✅ HTTPS (ACM 인증서) |
| **확장성** | 단일 머신 | Auto Scaling 가능 |
| **비용** | 💰 무료 | 💰💰💰 유료 |

---

## 4. 프로덕션 배포 시 필요한 변경사항

현재 코드를 AWS에 배포하려면 다음 수정이 필요합니다:

### 4.1 Groq API 호출을 백엔드로 이동

```
현재 (보안 취약):
┌──────────┐    ┌──────────┐
│ Frontend │───▶│ Groq API │  ← API 키 노출!
└──────────┘    └──────────┘

수정 후 (안전):
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Frontend │───▶│ Backend  │───▶│ Groq API │
└──────────┘    └──────────┘    └──────────┘
                     ↑
              API 키는 여기만!
```

### 4.2 환경 변수 분리

```bash
# 로컬 (.env.local)
VITE_API_BASE_URL=http://localhost:8080
VITE_GROQ_API_KEY=sk-xxxxx  # 개발용만!

# 프로덕션 (.env.production)
VITE_API_BASE_URL=https://api.ddoganzip.com
# GROQ_API_KEY는 프론트에 없음! 백엔드에서 관리
```

### 4.3 백엔드에 AI 프록시 엔드포인트 추가

```java
// Spring Boot Controller (추가 필요)
@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Value("${groq.api.key}")  // Secrets Manager에서 주입
    private String groqApiKey;

    @PostMapping("/chat")
    public AIResponse chat(@RequestBody ChatRequest request) {
        // Groq API 호출 (API 키는 서버에만 존재)
    }
}
```

---

## 5. 시연 환경 체크리스트

로컬에서 시연할 때 확인사항:

- [ ] Spring Boot 서버 실행 (`./gradlew bootRun` on :8080)
- [ ] Vite Dev Server 실행 (`npm run dev` on :5173)
- [ ] `.env` 파일에 `VITE_GROQ_API_KEY` 설정
- [ ] 데이터베이스 연결 확인
- [ ] 브라우저에서 `http://localhost:5173` 접속
