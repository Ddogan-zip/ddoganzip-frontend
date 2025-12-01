# DDogan Zip Frontend - Class Diagrams

이 문서는 DDogan Zip Frontend 애플리케이션의 클래스 다이어그램을 계층적으로 제공합니다.

> **Tip**: [Mermaid Live Editor](https://mermaid.live/)에 코드를 붙여넣으면 시각화할 수 있습니다.

---

## 다이어그램 구조

| Level | 파일 | 설명 |
|-------|------|------|
| **L1** | 이 파일 | 고수준 아키텍처 - 패키지 간 관계 |
| **L2** | [level2-auth.md](./level2-auth.md) | 인증 & 사용자 관리 |
| **L2** | [level2-menu-cart.md](./level2-menu-cart.md) | 메뉴 & 장바구니 |
| **L2** | [level2-order.md](./level2-order.md) | 주문 처리 |
| **L2** | [level2-staff.md](./level2-staff.md) | 스태프 대시보드 |

---

## Level 1: 고수준 아키텍처

전체 애플리케이션의 패키지 구조와 주요 의존성을 보여줍니다.

```mermaid
---
title: DDogan Zip Frontend - High-Level Architecture
---
classDiagram
    direction TB

    namespace Presentation {
        class Pages {
            <<package>>
            HomePage
            LoginPage
            RegisterPage
            MenuBrowsePage
            MenuOrderPage
            OrderHistoryPage
            StaffDashboardPage
        }

        class Components {
            <<package>>
            Layout
            ProtectedRoute
            StaffRoute
            ColorModeToggle
        }
    }

    namespace State_Management {
        class AuthContext {
            <<package>>
            AuthProvider
            useAuth hook
            User state
        }

        class ReactQuery {
            <<external>>
            useQuery
            useMutation
            QueryClient
        }
    }

    namespace API_Layer {
        class Services {
            <<package>>
            AuthService
            MenuService
            CartService
            OrdersService
            StaffService
            VoiceService
        }

        class ApiClient {
            <<singleton>>
            Axios instance
            Interceptors
            TokenStorage
        }

        class Types {
            <<package>>
            Request DTOs
            Response DTOs
            Enums
        }
    }

    namespace Utilities {
        class JWTUtils {
            <<utility>>
            decodeJWT
            extractUserFromToken
        }
    }

    %% Package Dependencies
    Pages --> Components : uses
    Pages --> AuthContext : uses
    Pages --> ReactQuery : uses
    Pages --> Services : calls

    Components --> AuthContext : uses

    AuthContext --> Services : uses
    AuthContext --> JWTUtils : uses
    AuthContext --> ApiClient : uses

    Services --> ApiClient : uses
    Services --> Types : uses

    ReactQuery --> Services : wraps
```

---

## Level 1: 데이터 흐름

사용자 인터랙션부터 백엔드 API까지의 데이터 흐름입니다.

```mermaid
---
title: Application Data Flow
---
flowchart LR
    subgraph User["User Interface"]
        P[Pages]
        C[Components]
    end

    subgraph State["State Layer"]
        AC[AuthContext]
        RQ[React Query Cache]
    end

    subgraph API["API Layer"]
        S[Services]
        CL[ApiClient]
    end

    subgraph Backend["Backend"]
        REST[REST API]
    end

    P <--> C
    P <--> AC
    P <--> RQ

    AC <--> S
    RQ <--> S

    S <--> CL
    CL <--> REST
```

---

## Level 1: 페이지 라우팅 & 접근 제어

```mermaid
---
title: Page Routing & Access Control
---
classDiagram
    direction LR

    class Router {
        <<React Router>>
    }

    class Layout {
        <<wrapper>>
        Navigation
        UserMenu
        Outlet
    }

    class PublicPages {
        <<no auth required>>
        HomePage
        LoginPage
        RegisterPage
        MenuBrowsePage
    }

    class ProtectedPages {
        <<auth required>>
        MenuOrderPage
        OrderHistoryPage
    }

    class StaffPages {
        <<staff role required>>
        StaffDashboardPage
    }

    class ProtectedRoute {
        <<guard>>
        +checkAuth() boolean
    }

    class StaffRoute {
        <<guard>>
        +checkStaffRole() boolean
    }

    Router --> Layout
    Layout --> PublicPages
    Layout --> ProtectedRoute
    Layout --> StaffRoute

    ProtectedRoute --> ProtectedPages
    StaffRoute --> StaffPages
    StaffRoute --|> ProtectedRoute : extends
```

---

## Level 1: 주요 기능별 모듈

```mermaid
---
title: Feature Modules Overview
---
classDiagram
    direction TB

    class AuthModule {
        <<feature>>
        로그인/회원가입
        JWT 토큰 관리
        사용자 프로필
        역할 기반 접근제어
    }

    class MenuModule {
        <<feature>>
        메뉴 목록 조회
        메뉴 상세 보기
        서빙 스타일 선택
        요리 커스터마이징
    }

    class CartModule {
        <<feature>>
        장바구니 관리
        수량 조절
        옵션 변경
        가격 계산
    }

    class OrderModule {
        <<feature>>
        주문 생성
        주문 내역 조회
        주문 상세 보기
        회원 등급 할인
    }

    class StaffModule {
        <<feature>>
        주문 관리
        재고 확인
        상태 변경
        배달원 관리
    }

    class VoiceModule {
        <<feature>>
        음성 인식
        명령 처리
        자동 주문
    }

    AuthModule <-- MenuModule : requires auth for order
    AuthModule <-- CartModule : requires auth
    AuthModule <-- OrderModule : requires auth
    AuthModule <-- StaffModule : requires staff role

    MenuModule --> CartModule : add to cart
    CartModule --> OrderModule : checkout
    OrderModule --> StaffModule : staff processes
    VoiceModule --> MenuModule : voice order
    VoiceModule --> CartModule : voice add
```

---

## 상세 다이어그램 (Level 2)

각 도메인의 상세한 클래스 구조는 아래 링크에서 확인하세요:

- **[인증 & 사용자](./level2-auth.md)** - 로그인, 회원가입, JWT, 사용자 프로필
- **[메뉴 & 장바구니](./level2-menu-cart.md)** - 메뉴 조회, 커스터마이징, 장바구니
- **[주문](./level2-order.md)** - 주문 생성, 상태 관리, 할인 적용
- **[스태프](./level2-staff.md)** - 주문 처리, 재고 관리, 배달 관리
