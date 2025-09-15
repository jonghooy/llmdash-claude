# 조직 메모리 기능 디버깅 과정 및 해결 방법

## 문제 상황
LibreChat이 Admin Dashboard에 저장된 조직 메모리(팀 규칙, 회사 정보 등)를 가져오지 못하는 문제 발생

## 디버깅 과정

### 1단계: 현황 파악
**시간**: 2025-09-16 00:00 ~ 00:20

#### 확인 사항:
- Admin Dashboard에 12개의 메모리가 저장되어 있음 ✅
- JWT 토큰으로는 메모리 API 접근 가능 ✅
- Internal API Key로는 접근 불가 ❌

#### 발견한 문제:
```bash
# API 테스트 결과
curl -X GET http://localhost:5001/api/memory \
  -H "x-api-key: sk-internal-api-key-for-service-communication-2025"
# 응답: {"error":"No token provided"}
```

### 2단계: 코드 분석
**시간**: 2025-09-16 00:20 ~ 00:30

#### 파일 구조 확인:
```
LibreChat-Admin/backend/
├── src/
│   ├── routes/memory.js         # 메모리 API 라우트
│   ├── middleware/auth.ts       # 인증 미들웨어
│   └── server.ts                # 서버 설정
└── LibreChat/api/server/services/
    └── OrgMemory.js             # 조직 메모리 서비스
```

#### 발견한 문제점:
1. `server.ts`에서 memory 라우트에 이미 authMiddleware 적용
2. `memory.js` 내부의 authMiddleware가 실행되지 않음
3. Internal API Key 인증 로직이 작동하지 않음

### 3단계: 문제 원인 분석
**시간**: 2025-09-16 00:30 ~ 00:40

#### 근본 원인:
```typescript
// server.ts - 문제가 된 코드
app.use('/api/memory', authMiddleware, memoryRoutes); // 중복 인증!
```

- server.ts에서 authMiddleware를 먼저 적용
- authMiddleware는 JWT 토큰만 확인
- memory.js 내부의 Internal API Key 확인 로직에 도달하지 못함

### 4단계: 해결 방법 적용
**시간**: 2025-09-16 00:40 ~ 00:50

#### 수정 내용:

##### 1. server.ts 수정
```typescript
// 수정 전
app.use('/api/memory', authMiddleware, memoryRoutes);

// 수정 후
app.use('/api/memory', memoryRoutes);  // Auth handled in route file
```

##### 2. memory.js의 authMiddleware 수정
```javascript
const authMiddleware = (req, res, next) => {
  // Internal API Key 확인 우선
  const apiKey = req.headers['x-api-key'] || req.headers['X-API-Key'];
  const internalApiKey = process.env.INTERNAL_API_KEY;

  if (apiKey && internalApiKey && apiKey === internalApiKey) {
    console.log('[Auth] Internal API key authentication successful');
    req.userId = 'internal-service';
    req.userRole = 'admin';
    return next();
  }

  // JWT 토큰 확인
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  // ... JWT 검증 로직
};
```

##### 3. OrgMemory.js 타입 에러 수정
```javascript
// 수정 전 (에러 발생)
value: memory.value?.substring(0, 50) + '...'

// 수정 후 (타입 체크 추가)
const valuePreview = typeof memory.value === 'string'
  ? memory.value.substring(0, 50) + '...'
  : JSON.stringify(memory.value).substring(0, 50) + '...';
```

##### 4. 로깅 개선
```javascript
// 템플릿 리터럴로 변경하여 undefined 출력 방지
logger.info(`[OrgMemory] API URL: ${ADMIN_API_URL}/api/memory`);
logger.info(`[OrgMemory] Using internal API key: ${!!INTERNAL_API_KEY}`);
logger.info(`[OrgMemory] Keywords: ${JSON.stringify(keywords)}`);
```

### 5단계: 환경 변수 설정
**시간**: 2025-09-16 00:50

#### 필요한 환경 변수:
```bash
# LibreChat/.env
ENABLE_ORG_MEMORY=true
INTERNAL_API_KEY=sk-internal-api-key-for-service-communication-2025
ADMIN_API_URL=http://localhost:5001

# LibreChat-Admin/backend/.env
INTERNAL_API_KEY=sk-internal-api-key-for-service-communication-2025
```

### 6단계: 서비스 재시작
```bash
# Admin 백엔드 재시작
pm2 restart admin-backend --update-env

# LibreChat 백엔드 재시작
pm2 restart librechat-backend --update-env
```

## 테스트 결과

### API 테스트
```bash
# Internal API Key로 메모리 가져오기 성공
curl -X GET http://localhost:5001/api/memory \
  -H "x-api-key: sk-internal-api-key-for-service-communication-2025"
# 응답: 11개의 메모리 데이터 반환 ✅
```

### 메모리 데이터 확인
```javascript
// 조직 메모리 컨텍스트 생성 성공
=== Organization Knowledge Base ===
[team_dev_rules]: 팀 개발 규칙: 1. 모든 코드는 TypeScript로 작성한다...
[company_info]: LLMDash는 AI 기반 엔터프라이즈 솔루션을 제공하는 회사입니다...
[tech_stack]: Frontend: React, TypeScript, Tailwind CSS...
=== End of Organization Knowledge ===
```

## 문제 해결 요약

### 핵심 해결 포인트:
1. **중복 인증 제거**: server.ts에서 memory 라우트의 authMiddleware 제거
2. **Internal API Key 우선 처리**: JWT 토큰 확인 전에 API Key 확인
3. **타입 안전성 확보**: 숫자형 value 처리 추가
4. **로깅 개선**: undefined 방지를 위한 템플릿 리터럴 사용

### 현재 상태:
- ✅ Admin Dashboard API: Internal API Key 인증 작동
- ✅ LibreChat OrgMemory: 메모리 데이터 가져오기 성공
- ✅ 조직 컨텍스트: AI 대화에 자동 포함
- ✅ 11개 메모리 항목 활성화

## 향후 개선 사항

1. **메모리 검색 최적화**: 키워드 기반 관련 메모리만 가져오기
2. **캐싱 구현**: 메모리 데이터 캐싱으로 성능 향상
3. **권한 세분화**: 팀별, 역할별 메모리 접근 권한 관리
4. **메모리 버전 관리**: 메모리 변경 이력 추적

## 테스트 스크립트

### test-org-memory.js
```javascript
// 조직 메모리 통합 테스트
const OrgMemory = require('./LibreChat/api/server/services/OrgMemory');

// 메모리 가져오기 테스트
const memories = await OrgMemory.fetchOrgMemories();
console.log('Memories:', memories);

// 시스템 메시지 생성 테스트
const context = await OrgMemory.getOrgMemoryContext(req);
console.log('Context:', context);
```

### test-memory-debug.js
```javascript
// Admin API 직접 테스트
const response = await axios.get('http://localhost:5001/api/memory', {
  headers: {
    'X-API-Key': process.env.INTERNAL_API_KEY
  }
});
console.log('Admin memories:', response.data.memories);
```

## 트러블슈팅 가이드

### 문제: "No token provided" 에러
**해결**:
1. INTERNAL_API_KEY 환경 변수 확인
2. server.ts에서 중복 authMiddleware 제거 확인
3. PM2 재시작 시 --update-env 옵션 사용

### 문제: "memory.value.substring is not a function" 에러
**해결**:
1. value가 string이 아닌 경우(number, object, array) 처리 추가
2. JSON.stringify() 사용하여 문자열로 변환

### 문제: 메모리가 AI 응답에 반영되지 않음
**해결**:
1. ENABLE_ORG_MEMORY=true 설정 확인
2. LibreChat 백엔드 재시작
3. Admin API 접근 가능 여부 확인

---

작성일: 2025-09-16
작성자: Claude & LLMDash Team