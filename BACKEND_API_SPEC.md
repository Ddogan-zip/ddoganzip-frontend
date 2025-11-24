# 프론트엔드 연동을 위한 백엔드 API 구현 요청

안녕하세요! 또간집 배달 서비스 프론트엔드가 완성되었습니다.
프론트엔드와 연동하기 위해 아래 API 명세에 맞춰 백엔드를 구현해주세요.

## 📋 기본 설정

### CORS 설정
```javascript
// 프론트엔드 주소 허용
allowedOrigins: [
  "http://localhost:5173",  // Vite 개발 서버
  "http://localhost:3000",
  "https://your-production-domain.com"
]

// 허용할 헤더
allowedHeaders: ["Content-Type", "Authorization"]

// 허용할 메서드
allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]

// credentials 허용
credentials: true
```

### 서버 포트
- 기본 포트: `8080`
- 환경변수로 설정 가능하게 해주세요

---

## 🔐 인증 시스템 (JWT)

### 토큰 구조
```typescript
// Access Token
{
  userId: number,
  email: string,
  role: "USER" | "STAFF",
  exp: number  // 만료 시간
}

// Refresh Token
{
  userId: number,
  exp: number  // 만료 시간 (7일)
}
```

### 인증 헤더
```
Authorization: Bearer {accessToken}
```

### 토큰 만료 시간
- Access Token: 1시간
- Refresh Token: 7일

---

## 📡 API 엔드포인트 상세 명세

### 1. 인증 API (`/api/auth`)

#### POST /api/auth/register
회원가입

**요청 본문:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "address": "서울시 강남구",
  "phone": "010-1234-5678"
}
```

**응답 (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**에러 처리:**
- 400: 이메일 중복, 필수 필드 누락
- 500: 서버 오류

---

#### POST /api/auth/login
로그인

**요청 본문:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답 (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**에러 처리:**
- 401: 이메일 또는 비밀번호 불일치
- 500: 서버 오류

---

#### POST /api/auth/refresh
토큰 갱신

**요청 본문:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**응답 (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**에러 처리:**
- 401: 유효하지 않은 토큰
- 500: 서버 오류

---

#### POST /api/auth/logout
로그아웃 (인증 필요)

**헤더:**
```
Authorization: Bearer {accessToken}
```

**응답 (200):**
```json
{
  "message": "로그아웃 성공"
}
```

**에러 처리:**
- 401: 인증 실패
- 500: 서버 오류

---

### 2. 메뉴 API (`/api/menu`)

#### GET /api/menu/list
모든 디너 메뉴 목록 조회 (인증 불필요)

**응답 (200):**
```json
[
  {
    "id": 1,
    "name": "프리미엄 스테이크 디너",
    "description": "최상급 한우 스테이크와 사이드 메뉴",
    "basePrice": 45000,
    "imageUrl": "https://example.com/steak.jpg"
  },
  {
    "id": 2,
    "name": "시푸드 파스타 세트",
    "description": "신선한 해산물이 가득한 파스타",
    "basePrice": 32000,
    "imageUrl": "https://example.com/pasta.jpg"
  }
]
```

---

#### GET /api/menu/details/:dinnerId
특정 디너 메뉴 상세 정보 조회 (인증 불필요)

**URL 파라미터:**
- `dinnerId`: 메뉴 ID (숫자)

**응답 (200):**
```json
{
  "id": 1,
  "name": "프리미엄 스테이크 디너",
  "description": "최상급 한우 스테이크와 사이드 메뉴",
  "basePrice": 45000,
  "imageUrl": "https://example.com/steak.jpg",
  "dishes": [
    {
      "id": 1,
      "name": "한우 안심 스테이크",
      "description": "200g 프리미엄 안심",
      "basePrice": 35000
    },
    {
      "id": 2,
      "name": "그릴드 야채",
      "description": "신선한 계절 야채",
      "basePrice": 5000
    },
    {
      "id": 3,
      "name": "마늘빵",
      "description": "수제 마늘빵",
      "basePrice": 3000
    }
  ],
  "availableStyles": [
    {
      "id": 1,
      "name": "심플",
      "additionalPrice": 0,
      "description": "기본 구성"
    },
    {
      "id": 2,
      "name": "프리미엄",
      "additionalPrice": 10000,
      "description": "와인과 디저트 포함"
    },
    {
      "id": 3,
      "name": "패밀리",
      "additionalPrice": 15000,
      "description": "2인분 + 사이드 메뉴 추가"
    }
  ]
}
```

**에러 처리:**
- 404: 메뉴를 찾을 수 없음
- 500: 서버 오류

---

### 3. 장바구니 API (`/api/cart`) - 모두 인증 필요

#### GET /api/cart
현재 사용자의 장바구니 조회

**헤더:**
```
Authorization: Bearer {accessToken}
```

**응답 (200):**
```json
{
  "cartId": 1,
  "items": [
    {
      "id": 1,
      "dinnerId": 1,
      "dinnerName": "프리미엄 스테이크 디너",
      "servingStyleId": 2,
      "servingStyleName": "프리미엄",
      "quantity": 2,
      "customizations": [
        {
          "action": "ADD",
          "dishId": 4,
          "quantity": 1
        },
        {
          "action": "REMOVE",
          "dishId": 3,
          "quantity": 1
        }
      ],
      "unitPrice": 55000,
      "totalPrice": 110000
    }
  ],
  "totalPrice": 110000
}
```

---

#### POST /api/cart/items
장바구니에 상품 추가

**헤더:**
```
Authorization: Bearer {accessToken}
```

**요청 본문:**
```json
{
  "dinnerId": 1,
  "servingStyleId": 2,
  "quantity": 2,
  "customizations": [
    {
      "action": "ADD",
      "dishId": 4,
      "quantity": 1
    }
  ]
}
```

**응답 (200):**
```json
{
  "cartId": 1,
  "items": [...],
  "totalPrice": 110000
}
```

**에러 처리:**
- 400: 잘못된 요청 데이터
- 401: 인증 실패
- 404: 메뉴를 찾을 수 없음
- 500: 서버 오류

---

#### PUT /api/cart/items/:itemId/quantity
장바구니 상품 수량 변경

**URL 파라미터:**
- `itemId`: 장바구니 아이템 ID

**헤더:**
```
Authorization: Bearer {accessToken}
```

**요청 본문:**
```json
{
  "quantity": 3
}
```

**응답 (200):**
```json
{
  "cartId": 1,
  "items": [...],
  "totalPrice": 165000
}
```

---

#### PUT /api/cart/items/:itemId/options
장바구니 상품 옵션 변경 (서빙 스타일 및 커스터마이징)

**URL 파라미터:**
- `itemId`: 장바구니 아이템 ID

**헤더:**
```
Authorization: Bearer {accessToken}
```

**요청 본문:**
```json
{
  "servingStyleId": 3,
  "customizations": [
    {
      "action": "REPLACE",
      "dishId": 5,
      "quantity": 1
    }
  ]
}
```

**응답 (200):**
```json
{
  "cartId": 1,
  "items": [...],
  "totalPrice": 180000
}
```

---

#### DELETE /api/cart/items/:itemId
장바구니에서 상품 삭제

**URL 파라미터:**
- `itemId`: 장바구니 아이템 ID

**헤더:**
```
Authorization: Bearer {accessToken}
```

**응답 (200):**
```json
{
  "cartId": 1,
  "items": [],
  "totalPrice": 0
}
```

---

### 4. 주문 API (`/api/orders`) - 모두 인증 필요

#### POST /api/orders/checkout
장바구니의 모든 상품을 주문으로 전환

**헤더:**
```
Authorization: Bearer {accessToken}
```

**요청 본문:**
```json
{
  "deliveryAddress": "서울시 강남구 테헤란로 123",
  "deliveryDate": "2025-11-20T18:00:00Z"
}
```

**응답 (200):**
```json
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "dinnerId": 1,
      "dinnerName": "프리미엄 스테이크 디너",
      "servingStyleId": 2,
      "servingStyleName": "프리미엄",
      "quantity": 2,
      "customizations": [...],
      "unitPrice": 55000,
      "totalPrice": 110000
    }
  ],
  "status": "CHECKING_STOCK",
  "deliveryAddress": "서울시 강남구 테헤란로 123",
  "deliveryDate": "2025-11-20T18:00:00Z",
  "totalPrice": 110000,
  "createdAt": "2025-11-18T10:00:00Z",
  "updatedAt": "2025-11-18T10:00:00Z"
}
```

**에러 처리:**
- 400: 장바구니가 비어있음, 잘못된 배송 정보
- 401: 인증 실패
- 500: 서버 오류

---

#### GET /api/orders/history
현재 사용자의 모든 주문 내역 조회

**헤더:**
```
Authorization: Bearer {accessToken}
```

**응답 (200):**
```json
{
  "orders": [
    {
      "id": 1,
      "userId": 1,
      "items": [...],
      "status": "DELIVERED",
      "deliveryAddress": "서울시 강남구 테헤란로 123",
      "deliveryDate": "2025-11-20T18:00:00Z",
      "totalPrice": 110000,
      "createdAt": "2025-11-18T10:00:00Z",
      "updatedAt": "2025-11-20T19:00:00Z"
    },
    {
      "id": 2,
      "userId": 1,
      "items": [...],
      "status": "IN_KITCHEN",
      "deliveryAddress": "서울시 강남구 테헤란로 123",
      "deliveryDate": "2025-11-21T19:00:00Z",
      "totalPrice": 85000,
      "createdAt": "2025-11-19T15:00:00Z",
      "updatedAt": "2025-11-19T15:30:00Z"
    }
  ]
}
```

---

#### GET /api/orders/:orderId
특정 주문의 상세 정보 조회

**URL 파라미터:**
- `orderId`: 주문 ID

**헤더:**
```
Authorization: Bearer {accessToken}
```

**응답 (200):**
```json
{
  "id": 1,
  "userId": 1,
  "items": [...],
  "status": "DELIVERED",
  "deliveryAddress": "서울시 강남구 테헤란로 123",
  "deliveryDate": "2025-11-20T18:00:00Z",
  "totalPrice": 110000,
  "createdAt": "2025-11-18T10:00:00Z",
  "updatedAt": "2025-11-20T19:00:00Z"
}
```

**에러 처리:**
- 401: 인증 실패
- 403: 권한 없음 (다른 사용자의 주문)
- 404: 주문을 찾을 수 없음
- 500: 서버 오류

---

### 5. 직원용 API (`/api/staff`) - STAFF 권한 필요

#### GET /api/staff/orders/active
배달 완료되지 않은 모든 주문 조회

**헤더:**
```
Authorization: Bearer {accessToken}
```

**권한:** STAFF

**응답 (200):**
```json
{
  "orders": [
    {
      "id": 1,
      "userId": 1,
      "items": [...],
      "status": "CHECKING_STOCK",
      "deliveryAddress": "서울시 강남구 테헤란로 123",
      "deliveryDate": "2025-11-20T18:00:00Z",
      "totalPrice": 110000,
      "createdAt": "2025-11-18T10:00:00Z",
      "updatedAt": "2025-11-18T10:00:00Z"
    },
    {
      "id": 2,
      "userId": 2,
      "items": [...],
      "status": "IN_KITCHEN",
      "deliveryAddress": "서울시 서초구 강남대로 456",
      "deliveryDate": "2025-11-20T19:00:00Z",
      "totalPrice": 85000,
      "createdAt": "2025-11-18T11:00:00Z",
      "updatedAt": "2025-11-18T11:30:00Z"
    }
  ]
}
```

**에러 처리:**
- 401: 인증 실패
- 403: 권한 없음 (STAFF가 아님)
- 500: 서버 오류

---

#### PUT /api/staff/orders/:orderId/status
주문 상태 변경

**URL 파라미터:**
- `orderId`: 주문 ID

**헤더:**
```
Authorization: Bearer {accessToken}
```

**권한:** STAFF

**요청 본문:**
```json
{
  "status": "RECEIVED"
}
```

**주문 상태 값:**
- `CHECKING_STOCK`: 재고 확인 중
- `RECEIVED`: 주문 접수
- `IN_KITCHEN`: 조리 중
- `DELIVERING`: 배달 중
- `DELIVERED`: 배달 완료

**응답 (200):**
```json
{
  "id": 1,
  "userId": 1,
  "items": [...],
  "status": "RECEIVED",
  "deliveryAddress": "서울시 강남구 테헤란로 123",
  "deliveryDate": "2025-11-20T18:00:00Z",
  "totalPrice": 110000,
  "createdAt": "2025-11-18T10:00:00Z",
  "updatedAt": "2025-11-18T10:05:00Z"
}
```

**에러 처리:**
- 400: 잘못된 상태 값
- 401: 인증 실패
- 403: 권한 없음
- 404: 주문을 찾을 수 없음
- 500: 서버 오류

---

## 🗄️ 데이터베이스 스키마 제안

### Users 테이블
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role VARCHAR(20) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Dinners 테이블
```sql
CREATE TABLE dinners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Dishes 테이블
```sql
CREATE TABLE dishes (
  id SERIAL PRIMARY KEY,
  dinner_id INTEGER REFERENCES dinners(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ServingStyles 테이블
```sql
CREATE TABLE serving_styles (
  id SERIAL PRIMARY KEY,
  dinner_id INTEGER REFERENCES dinners(id),
  name VARCHAR(100) NOT NULL,
  additional_price INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Carts 테이블
```sql
CREATE TABLE carts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### CartItems 테이블
```sql
CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER REFERENCES carts(id),
  dinner_id INTEGER REFERENCES dinners(id),
  serving_style_id INTEGER REFERENCES serving_styles(id),
  quantity INTEGER NOT NULL,
  customizations JSONB,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Orders 테이블
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  status VARCHAR(50) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_date TIMESTAMP NOT NULL,
  total_price INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### OrderItems 테이블
```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  dinner_id INTEGER REFERENCES dinners(id),
  dinner_name VARCHAR(255) NOT NULL,
  serving_style_id INTEGER,
  serving_style_name VARCHAR(100),
  quantity INTEGER NOT NULL,
  customizations JSONB,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL
);
```

---

## ✅ 테스트 데이터

최소한 다음 테스트 데이터를 시드해주세요:

### 디너 메뉴
1. 프리미엄 스테이크 디너 (45,000원)
2. 시푸드 파스타 세트 (32,000원)
3. 한우 갈비 정식 (55,000원)
4. 삼겹살 구이 세트 (28,000원)
5. 연어 스시 모듬 (38,000원)

### 테스트 계정
```json
{
  "email": "user@test.com",
  "password": "test1234",
  "name": "테스트 사용자",
  "address": "서울시 강남구 테헤란로 123",
  "phone": "010-1234-5678",
  "role": "USER"
}

{
  "email": "staff@test.com",
  "password": "staff1234",
  "name": "직원 계정",
  "address": "서울시 강남구 테헤란로 456",
  "phone": "010-9876-5432",
  "role": "STAFF"
}
```

---

## 🔧 추가 요청사항

### 1. 에러 응답 형식
모든 에러는 다음 형식으로 통일해주세요:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자에게 표시할 메시지",
    "details": "상세 오류 정보 (선택사항)"
  }
}
```

### 2. 로깅
- 모든 API 요청/응답 로깅
- 에러 발생 시 스택 트레이스 로깅
- 인증 실패 로깅

### 3. 보안
- 비밀번호는 bcrypt로 해싱 (salt rounds: 10)
- SQL Injection 방지
- XSS 방지
- CSRF 토큰 (필요시)

### 4. 성능
- 데이터베이스 인덱스 추가 (user_id, order_id, dinner_id 등)
- 페이지네이션 (주문 내역 조회 시)

---

## 📝 완료 후 확인사항

다음 항목들이 정상 작동하는지 테스트해주세요:

1. [ ] CORS 설정이 올바르게 적용되었는지
2. [ ] 회원가입 및 로그인이 정상 작동하는지
3. [ ] JWT 토큰 갱신이 정상 작동하는지
4. [ ] 메뉴 목록 조회가 정상 작동하는지
5. [ ] 장바구니 추가/수정/삭제가 정상 작동하는지
6. [ ] 주문 생성 및 조회가 정상 작동하는지
7. [ ] 직원 권한으로 주문 상태 변경이 가능한지
8. [ ] 에러 처리가 올바르게 되는지

---

## 🚀 시작하기

1. 위 API 명세에 맞춰 백엔드를 구현해주세요
2. 테스트 데이터를 시드해주세요
3. Postman 또는 curl로 기본 테스트를 진행해주세요
4. 프론트엔드 연동 테스트를 위해 서버를 8080 포트로 실행해주세요

질문이나 불분명한 부분이 있으면 알려주세요!
