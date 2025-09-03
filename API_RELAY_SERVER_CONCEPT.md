# API Relay Server - 개념 설계 및 기획서

## 1. 프로젝트 개요

### 1.1 목적
- **API Gateway 역할**: 외부 서비스들이 LibreChat의 LLM 기능을 API로 사용할 수 있도록 중계
- **통합 관리**: 모든 API 호출을 Admin Dashboard에서 통합 관리, 모니터링, 제어
- **보안 및 제한**: API 키 기반 인증, 사용량 제한, 권한 관리

### 1.2 핵심 기능
1. **API Key Management**: 발급, 폐기, 권한 설정
2. **Request Relay**: LLM API 요청을 LibreChat으로 중계
3. **Usage Tracking**: API별 사용량 추적 및 통계
4. **Rate Limiting**: API 키별 요청 제한
5. **Cost Management**: 사용량 기반 비용 계산
6. **Security**: 인증, 권한, IP 화이트리스트

## 2. 시스템 아키텍처

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  External Apps  │ ──API──▶ │  API Relay       │ ──────▶ │   LibreChat     │
│  (API Clients)  │         │    Server        │         │   Backend       │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                      │                            │
                                      ▼                            ▼
                            ┌──────────────────┐         ┌─────────────────┐
                            │     MongoDB      │ ◀────── │  LLM Providers  │
                            │   (Shared DB)    │         │ (OpenAI, etc.)  │
                            └──────────────────┘         └─────────────────┘
                                      ▲
                                      │
                            ┌──────────────────┐
                            │  Admin Dashboard │
                            │   (통합 관리)     │
                            └──────────────────┘
```

## 3. 데이터베이스 스키마 설계

### 3.1 API Keys Collection
```javascript
{
  _id: ObjectId,
  key: String,              // 해시된 API 키
  name: String,             // API 키 이름/설명
  userId: ObjectId,         // 소유자 (LibreChat user)
  clientId: String,         // 클라이언트 앱 식별자
  
  // 권한 설정
  permissions: {
    models: [String],       // 사용 가능한 모델 목록
    endpoints: [String],    // 허용된 엔드포인트
    maxTokens: Number,      // 최대 토큰 수
    features: {
      streaming: Boolean,
      functionCalling: Boolean,
      vision: Boolean
    }
  },
  
  // 제한 설정
  limits: {
    requestsPerMinute: Number,
    requestsPerDay: Number,
    tokensPerDay: Number,
    tokensPerMonth: Number,
    costLimit: Number       // 월 비용 제한
  },
  
  // 보안 설정
  security: {
    ipWhitelist: [String],  // 허용된 IP 목록
    domains: [String],      // CORS 허용 도메인
    expiresAt: Date         // 만료일
  },
  
  // 상태 및 메타데이터
  status: String,           // active, suspended, revoked
  createdAt: Date,
  updatedAt: Date,
  lastUsedAt: Date
}
```

### 3.2 API Usage Collection
```javascript
{
  _id: ObjectId,
  apiKeyId: ObjectId,
  timestamp: Date,
  
  // 요청 정보
  request: {
    endpoint: String,       // /v1/chat/completions
    method: String,         // POST
    model: String,          // gpt-4, claude-3
    ip: String,
    userAgent: String,
    headers: Object
  },
  
  // 응답 정보
  response: {
    statusCode: Number,
    duration: Number,       // ms
    error: String
  },
  
  // 사용량
  usage: {
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number,
    cost: Number           // 예상 비용
  },
  
  // 메타데이터
  metadata: {
    conversationId: String,
    messageId: String,
    clientVersion: String
  }
}
```

### 3.3 API Metrics Collection (집계 데이터)
```javascript
{
  _id: ObjectId,
  apiKeyId: ObjectId,
  date: Date,              // 일별 집계
  
  metrics: {
    requests: {
      total: Number,
      successful: Number,
      failed: Number,
      errors: Object       // 에러 타입별 카운트
    },
    
    tokens: {
      prompt: Number,
      completion: Number,
      total: Number
    },
    
    models: {              // 모델별 사용량
      'gpt-4': { requests: Number, tokens: Number },
      'claude-3': { requests: Number, tokens: Number }
    },
    
    performance: {
      avgResponseTime: Number,
      p95ResponseTime: Number,
      p99ResponseTime: Number
    },
    
    cost: {
      estimated: Number,
      billed: Number
    }
  }
}
```

## 4. API 엔드포인트 설계

### 4.1 Client API (외부 서비스용)
```
POST   /v1/chat/completions     # OpenAI 호환 채팅 API
POST   /v1/completions          # 텍스트 완성 API
POST   /v1/embeddings           # 임베딩 API
GET    /v1/models               # 사용 가능한 모델 목록
GET    /v1/usage                # API 키 사용량 조회
```

### 4.2 Management API (Admin Dashboard용)
```
# API Key 관리
GET    /admin/api-keys          # API 키 목록
POST   /admin/api-keys          # API 키 생성
PUT    /admin/api-keys/:id      # API 키 수정
DELETE /admin/api-keys/:id      # API 키 삭제
POST   /admin/api-keys/:id/regenerate  # 키 재생성
POST   /admin/api-keys/:id/suspend     # 키 일시정지

# 사용량 및 통계
GET    /admin/usage             # 전체 사용량 통계
GET    /admin/usage/:apiKeyId   # 특정 API 키 사용량
GET    /admin/metrics           # 실시간 메트릭
GET    /admin/costs             # 비용 분석

# 모니터링
GET    /admin/logs              # API 호출 로그
GET    /admin/alerts            # 알림 및 경고
POST   /admin/alerts            # 알림 규칙 설정
```

## 5. 핵심 기능 상세

### 5.1 인증 및 권한
- **Bearer Token 인증**: `Authorization: Bearer API_KEY`
- **HMAC 서명 검증**: 추가 보안을 위한 요청 서명
- **Rate Limiting**: Token Bucket 알고리즘
- **IP 화이트리스팅**: 특정 IP만 허용

### 5.2 요청 중계 (Request Relay)
```javascript
// 요청 흐름
1. API 키 검증
2. 권한 및 제한 확인
3. 요청 변환 (필요시)
4. LibreChat 백엔드로 전달
5. 응답 스트리밍/반환
6. 사용량 기록
7. 비용 계산
```

### 5.3 사용량 추적
- **실시간 카운팅**: Redis 기반 실시간 카운터
- **배치 집계**: 일/주/월 단위 집계
- **알림**: 한도 초과시 실시간 알림
- **자동 차단**: 한도 초과시 자동 차단

### 5.4 모델 라우팅
```javascript
// 모델별 라우팅 규칙
{
  "gpt-4": "openai",
  "gpt-3.5-turbo": "openai",
  "claude-3-opus": "anthropic",
  "claude-3-sonnet": "anthropic",
  "gemini-pro": "google",
  "llama-3": "local"
}
```

## 6. 보안 고려사항

### 6.1 API 키 보안
- **해싱**: bcrypt/argon2로 API 키 해싱
- **키 포맷**: `lc_prod_xxxxxxxxxxxxx` (환경별 prefix)
- **자동 만료**: 설정된 기간 후 자동 만료
- **키 로테이션**: 주기적 키 갱신 권장

### 6.2 데이터 보안
- **TLS/SSL**: 모든 통신 암호화
- **PII 마스킹**: 민감 정보 자동 마스킹
- **감사 로그**: 모든 API 호출 기록
- **데이터 보존**: GDPR 준수 보존 정책

## 7. 성능 최적화

### 7.1 캐싱 전략
- **Redis 캐싱**: API 키 정보, 권한, 제한 캐싱
- **Response 캐싱**: 동일 요청 캐싱 (선택적)
- **Model 정보 캐싱**: 모델 목록 캐싱

### 7.2 확장성
- **수평 확장**: 무상태 설계로 쉬운 확장
- **로드 밸런싱**: 다중 인스턴스 지원
- **Queue 시스템**: 대량 요청 처리용 큐
- **WebSocket**: 스트리밍 응답 지원

## 8. Admin Dashboard 통합

### 8.1 대시보드 기능
- **API Key 관리 UI**: 생성, 수정, 삭제
- **실시간 모니터링**: 요청량, 응답시간, 에러율
- **사용량 차트**: 시계열 그래프, 모델별 분석
- **비용 관리**: 예상 비용, 청구 관리
- **알림 설정**: 한도 초과, 에러 알림

### 8.2 통합 포인트
```javascript
// Admin Dashboard에 추가할 메뉴
- API Keys
  - List & Manage
  - Create New
  - Usage Analytics
- API Monitoring
  - Real-time Dashboard
  - Request Logs
  - Error Analysis
- API Settings
  - Rate Limits
  - Model Access
  - Security Rules
```

## 9. 구현 로드맵

### Phase 1: MVP (2주)
- [ ] 기본 API 중계 기능
- [ ] API 키 생성/검증
- [ ] 기본 사용량 추적
- [ ] OpenAI 호환 API

### Phase 2: 관리 기능 (2주)
- [ ] Admin Dashboard 통합
- [ ] 상세 사용량 통계
- [ ] Rate Limiting
- [ ] 비용 계산

### Phase 3: 고급 기능 (2주)
- [ ] 멀티 모델 라우팅
- [ ] 응답 스트리밍
- [ ] 웹훅 지원
- [ ] 고급 보안 기능

### Phase 4: 최적화 (1주)
- [ ] 성능 최적화
- [ ] 캐싱 구현
- [ ] 모니터링 강화
- [ ] 문서화

## 10. 기술 스택

### 10.1 Backend
- **Framework**: Node.js + Express/Fastify
- **Language**: TypeScript
- **Database**: MongoDB (shared with LibreChat)
- **Cache**: Redis
- **Queue**: Bull/BullMQ

### 10.2 인프라
- **Container**: Docker
- **Orchestration**: Kubernetes (optional)
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + ELK Stack

## 11. 예상 시나리오

### 11.1 외부 서비스 통합
```javascript
// 외부 앱에서 사용 예시
const response = await fetch('https://api.librechat.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer lc_prod_xxxxxxxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    stream: true
  })
});
```

### 11.2 Admin에서 모니터링
- 실시간 요청 수 확인
- API 키별 사용량 분석
- 비정상 패턴 감지
- 자동 제한/차단

## 12. 검토 사항

### 12.1 기술적 검토
- [ ] LibreChat 백엔드와의 통합 방식
- [ ] 인증 토큰 관리 방식
- [ ] 스트리밍 응답 처리
- [ ] 에러 핸들링 전략

### 12.2 비즈니스 검토
- [ ] 과금 모델 설계
- [ ] SLA 정의
- [ ] 사용 약관
- [ ] 개인정보 처리 방침

### 12.3 운영 검토
- [ ] 모니터링 전략
- [ ] 백업/복구 계획
- [ ] 장애 대응 프로세스
- [ ] 확장 계획

---

## 다음 단계

이 개념 설계를 검토하시고, 다음 사항을 결정해주세요:

1. **우선순위**: 어떤 기능을 먼저 구현할 것인가?
2. **통합 방식**: LibreChat과 직접 통합 vs 독립 서비스?
3. **인증 방식**: 단순 API 키 vs OAuth 2.0?
4. **과금 모델**: 사용량 기반 vs 구독 기반?
5. **모델 지원**: 어떤 LLM 모델을 지원할 것인가?

검토 후 구현을 시작하시겠습니까?