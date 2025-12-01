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

UML 2.0 배치 다이어그램 표기법을 사용하여 시스템의 물리적 배포 구조를 나타냅니다.

## 1. 로컬 개발/테스트 환경 (시연용)

개발 및 시연 시 사용하는 환경입니다.

```mermaid
flowchart TB
    subgraph DevMachine["≪device≫<br/>Developer Machine<br/>━━━━━━━━━━━━━━━━━━━"]
        direction TB

        subgraph BrowserEnv["≪execution environment≫<br/>Web Browser (Chrome/Edge)"]
            subgraph ReactRuntime["≪execution environment≫<br/>React Runtime"]
                app_bundle["≪artifact≫<br/>app.bundle.js"]
                react_app["≪component≫<br/>DDogan-Zip SPA"]
            end
        end

        subgraph NodeEnv["≪execution environment≫<br/>Node.js v18+"]
            subgraph ViteProcess["≪process≫<br/>Vite Dev Server :5173"]
                vite_config["≪artifact≫<br/>vite.config.ts"]
                proxy_module["≪component≫<br/>Proxy Module"]
            end
        end

        subgraph JVMEnv["≪execution environment≫<br/>JVM (Java 17)"]
            subgraph SpringProcess["≪process≫<br/>Spring Boot :8080"]
                spring_jar["≪artifact≫<br/>backend.jar"]

                subgraph Controllers["≪component≫ REST Controllers"]
                    auth_ctrl["AuthController"]
                    menu_ctrl["MenuController"]
                    cart_ctrl["CartController"]
                    order_ctrl["OrderController"]
                    staff_ctrl["StaffController"]
                end
            end
        end

        subgraph DBEnv["≪execution environment≫<br/>Database Server"]
            h2_db[("≪artifact≫<br/>H2 / MySQL<br/>Database")]
        end
    end

    subgraph GroqServer["≪device≫<br/>Groq Cloud Server<br/>━━━━━━━━━━━━━━━━━━━"]
        groq_api["≪component≫<br/>LLM API Service"]
    end

    subgraph BrowserAPI["≪device≫<br/>Browser Built-in APIs"]
        speech_api["≪component≫<br/>Web Speech API"]
    end

    %% Communication paths
    react_app -->|"≪HTTP≫<br/>localhost:5173"| ViteProcess
    proxy_module -->|"≪HTTP≫<br/>localhost:8080<br/>/api/*"| SpringProcess
    proxy_module -->|"≪HTTPS≫<br/>/groq-api/*"| groq_api
    Controllers --> h2_db
    react_app -.->|"≪JavaScript API≫"| speech_api

    %% Styling
    classDef device fill:#e8eaf6,stroke:#3f51b5,stroke-width:3px
    classDef execenv fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef artifact fill:#fff8e1,stroke:#ff8f00,stroke-width:1px
    classDef component fill:#e8f5e9,stroke:#2e7d32,stroke-width:1px
    classDef external fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class DevMachine,GroqServer,BrowserAPI device
    class BrowserEnv,NodeEnv,JVMEnv,DBEnv,ReactRuntime execenv
    class app_bundle,vite_config,spring_jar artifact
    class react_app,proxy_module,groq_api,speech_api,Controllers component
```

### 로컬 환경 노드 명세

| 노드 (Node) | 타입 | 포트 | 배포된 아티팩트 |
|------------|------|------|----------------|
| Developer Machine | ≪device≫ | - | 전체 개발 환경 |
| Web Browser | ≪execution environment≫ | - | app.bundle.js |
| Vite Dev Server | ≪process≫ | 5173 | vite.config.ts |
| Spring Boot | ≪process≫ | 8080 | backend.jar |
| Database | ≪execution environment≫ | 3306 | H2/MySQL |
| Groq Cloud | ≪device≫ | 443 | LLM Service |

### 통신 경로 (Communication Path)

| From | To | 프로토콜 | 설명 |
|------|-----|---------|------|
| Browser | Vite | ≪HTTP≫ | HMR, 정적 파일 요청 |
| Vite Proxy | Spring Boot | ≪HTTP≫ | /api/* 프록시 |
| Vite Proxy | Groq Cloud | ≪HTTPS≫ | /groq-api/* 프록시 |
| Spring Boot | Database | ≪JDBC≫ | 데이터 영속화 |

---

## 2. AWS 프로덕션 환경 (이상적인 구조)

실제 서비스 배포 시 권장되는 아키텍처입니다.

```mermaid
flowchart TB
    subgraph ClientDevice["≪device≫<br/>Client Device<br/>━━━━━━━━━━━━━━━━━━━"]
        subgraph ClientBrowser["≪execution environment≫<br/>Web Browser"]
            client_app["≪component≫<br/>DDogan-Zip SPA"]
        end
    end

    subgraph AWSCloud["≪device≫<br/>AWS Cloud Infrastructure<br/>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"]
        direction TB

        subgraph EdgeLocation["≪execution environment≫<br/>CloudFront Edge Location"]
            cdn["≪component≫<br/>CDN Distribution<br/>+ SSL/TLS Termination"]
        end

        subgraph S3Service["≪execution environment≫<br/>S3 Bucket"]
            static_files["≪artifact≫<br/>index.html<br/>bundle.js<br/>styles.css<br/>assets/*"]
        end

        subgraph VPCNetwork["≪execution environment≫<br/>VPC (10.0.0.0/16)"]

            subgraph PublicSubnet["Public Subnet (10.0.1.0/24)"]
                alb["≪component≫<br/>Application<br/>Load Balancer"]
            end

            subgraph PrivateSubnet["Private Subnet (10.0.2.0/24)"]

                subgraph ECSCluster["≪execution environment≫<br/>ECS Cluster / EC2"]
                    subgraph Container["≪execution environment≫<br/>Docker Container"]
                        subgraph JVM["≪execution environment≫<br/>JVM (Java 17)"]
                            spring_app["≪artifact≫<br/>backend.jar"]
                            api_components["≪component≫<br/>REST APIs<br/>+ AI Proxy API"]
                        end
                    end
                end

                subgraph RDSInstance["≪execution environment≫<br/>RDS Instance"]
                    mysql_db[("≪artifact≫<br/>MySQL 8.0<br/>Database")]
                end
            end
        end

        subgraph SecretsManager["≪execution environment≫<br/>Secrets Manager"]
            secrets["≪artifact≫<br/>• DB Password<br/>• Groq API Key<br/>• JWT Secret"]
        end
    end

    subgraph GroqCloud["≪device≫<br/>Groq Cloud<br/>━━━━━━━━━━━━━━━━━━━"]
        groq_llm["≪component≫<br/>LLM API<br/>(llama-3.3-70b)"]
    end

    %% Communication paths
    client_app -->|"≪HTTPS≫<br/>443"| cdn
    cdn -->|"≪HTTP≫<br/>Origin Request"| static_files
    cdn -->|"≪HTTPS≫<br/>/api/*"| alb
    alb -->|"≪HTTP≫<br/>Target Group"| Container
    api_components -->|"≪JDBC≫<br/>3306"| mysql_db
    api_components -->|"≪IAM Role≫"| secrets
    api_components -->|"≪HTTPS≫<br/>Server-side Call"| groq_llm

    %% Styling
    classDef device fill:#e8eaf6,stroke:#3f51b5,stroke-width:3px
    classDef execenv fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef artifact fill:#fff8e1,stroke:#ff8f00,stroke-width:1px
    classDef component fill:#e8f5e9,stroke:#2e7d32,stroke-width:1px
    classDef network fill:#fafafa,stroke:#9e9e9e,stroke-width:2px,stroke-dasharray: 5 5

    class ClientDevice,AWSCloud,GroqCloud device
    class EdgeLocation,S3Service,VPCNetwork,ECSCluster,RDSInstance,SecretsManager,Container,JVM,ClientBrowser execenv
    class static_files,spring_app,mysql_db,secrets artifact
    class cdn,alb,api_components,client_app,groq_llm component
    class PublicSubnet,PrivateSubnet network
```

### AWS 환경 노드 명세

| 노드 (Node) | AWS 서비스 | 타입 | 역할 |
|------------|-----------|------|------|
| CloudFront Edge | CloudFront | ≪execution environment≫ | CDN, HTTPS, 캐싱 |
| S3 Bucket | S3 | ≪execution environment≫ | 정적 파일 호스팅 |
| ALB | Application Load Balancer | ≪component≫ | 로드밸런싱, 라우팅 |
| ECS Cluster | ECS Fargate / EC2 | ≪execution environment≫ | 컨테이너 오케스트레이션 |
| Docker Container | - | ≪execution environment≫ | 애플리케이션 격리 |
| RDS Instance | RDS MySQL | ≪execution environment≫ | 관계형 데이터베이스 |
| Secrets Manager | Secrets Manager | ≪execution environment≫ | 비밀 정보 관리 |

### 배포 아티팩트 (Deployment Artifact)

| 아티팩트 | 위치 | 설명 |
|---------|------|------|
| index.html, bundle.js | S3 Bucket | 프론트엔드 정적 파일 |
| backend.jar | Docker Container | Spring Boot 애플리케이션 |
| MySQL Database | RDS Instance | 영구 데이터 저장소 |

---

## 3. 환경별 비교 다이어그램

```mermaid
flowchart LR
    subgraph Local["≪device≫ Local Development"]
        direction TB
        L_Browser["≪execution environment≫<br/>Browser"]
        L_Vite["≪process≫<br/>Vite :5173"]
        L_Spring["≪process≫<br/>Spring Boot :8080"]
        L_Groq["≪component≫<br/>Groq API"]

        L_Browser -->|"≪HTTP≫"| L_Vite
        L_Vite -->|"≪HTTP≫"| L_Spring
        L_Vite -->|"⚠️ ≪HTTPS≫<br/>API Key in Frontend"| L_Groq
    end

    subgraph Production["≪device≫ AWS Production"]
        direction TB
        P_Browser["≪execution environment≫<br/>Browser"]
        P_CDN["≪component≫<br/>CloudFront"]
        P_S3["≪artifact≫<br/>S3"]
        P_Spring["≪process≫<br/>Spring Boot"]
        P_Groq["≪component≫<br/>Groq API"]

        P_Browser -->|"≪HTTPS≫"| P_CDN
        P_CDN --> P_S3
        P_CDN -->|"≪HTTPS≫"| P_Spring
        P_Spring -->|"✅ ≪HTTPS≫<br/>API Key in Server"| P_Groq
    end

    classDef warning fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef safe fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef device fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px

    class L_Groq warning
    class P_Groq safe
    class Local,Production device
```

## 4. 환경별 비교표

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

## 5. 프로덕션 배포 시 필요한 변경사항

현재 코드를 AWS에 배포하려면 다음 수정이 필요합니다:

### 5.1 Groq API 호출을 백엔드로 이동

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

### 5.2 환경 변수 분리

```bash
# 로컬 (.env.local)
VITE_API_BASE_URL=http://localhost:8080
VITE_GROQ_API_KEY=sk-xxxxx  # 개발용만!

# 프로덕션 (.env.production)
VITE_API_BASE_URL=https://api.ddoganzip.com
# GROQ_API_KEY는 프론트에 없음! 백엔드에서 관리
```

### 5.3 백엔드에 AI 프록시 엔드포인트 추가

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

## 6. 시연 환경 체크리스트

로컬에서 시연할 때 확인사항:

- [ ] Spring Boot 서버 실행 (`./gradlew bootRun` on :8080)
- [ ] Vite Dev Server 실행 (`npm run dev` on :5173)
- [ ] `.env` 파일에 `VITE_GROQ_API_KEY` 설정
- [ ] 데이터베이스 연결 확인
- [ ] 브라우저에서 `http://localhost:5173` 접속
