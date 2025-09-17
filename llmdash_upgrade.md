# LLMDash 업그레이드 프로젝트

## 프로젝트 목표
LibreChat의 개인용 기능을 기업용 팀 협업 시스템으로 전환
- 에이전트, 메모리, 프롬프트를 Admin Dashboard에서 중앙 관리
- MCP 서버 통합 관리
- 조직/팀 단위 권한 관리

## 전체 구현 계획

### ✅ Phase 1: 기본 인프라 구축 (2025-09-16 완료)
- [x] Step 1: 프롬프트 라이브러리 ✅ 2025-09-12
- [x] Step 2: 조직 메모리 ✅ 2025-09-16
- [x] Step 3: MCP 서버 관리 ✅ 2025-09-16
- [x] Step 3.5: MCP-LibreChat 통합 ✅ 2025-09-16
- [x] Step 4: 에이전트 관리 ✅ 2025-09-16

### ✅ Phase 2: LibreChat 통합 (2025-09-16 완료)
- [x] Admin API 연동 ✅
- [x] 프롬프트/에이전트 동기화 ✅
- [x] 메모리 자동 주입 ✅
- [x] MCP 서버 동적 로딩 ✅

### Phase 3: LibreChat UI 커스터마이징 및 브랜드 전환 (진행중)
- [ ] LibreChat → LLMDash 브랜드 전환
- [ ] Admin 관리 기능 UI 숨김 처리
- [ ] UI/UX Look & Feel 개선
- [ ] 테마 및 색상 커스터마이징

---

## 진행 상황

### ✅ Step 1: 프롬프트 라이브러리 (2025-09-12 완료)

#### 구현 내용

##### 1. 백엔드 구현
**파일 생성/수정:**
- `/LibreChat-Admin/backend/src/models/Prompt.js` - 프롬프트 데이터 모델
- `/LibreChat-Admin/backend/src/routes/prompts.js` - API 엔드포인트
- `/LibreChat-Admin/backend/src/server.ts` - 라우트 등록

**주요 기능:**
```javascript
// Prompt 모델 스키마
{
  name: String,
  description: String, 
  category: Enum(['general', 'coding', 'writing', ...]),
  prompt: String,
  variables: [{
    name: String,
    description: String,
    defaultValue: String
  }],
  isPublic: Boolean,
  organization: ObjectId,
  teams: [ObjectId],
  tags: [String],
  usageCount: Number,
  rating: Number
}
```

**API 엔드포인트:**
- `GET /api/prompts` - 프롬프트 목록 조회 (필터링, 페이지네이션)
- `GET /api/prompts/:id` - 프롬프트 상세 조회
- `POST /api/prompts` - 프롬프트 생성
- `PUT /api/prompts/:id` - 프롬프트 수정
- `DELETE /api/prompts/:id` - 프롬프트 삭제 (소프트 삭제)
- `POST /api/prompts/:id/duplicate` - 프롬프트 복제
- `POST /api/prompts/:id/use` - 사용 횟수 증가
- `POST /api/prompts/:id/rate` - 평점 업데이트
- `POST /api/prompts/:id/render` - 변수 치환된 프롬프트 렌더링

##### 2. 프론트엔드 구현
**파일 생성/수정:**
- `/LibreChat-Admin/frontend/src/pages/Prompts/index.tsx` - 프롬프트 관리 UI
- `/LibreChat-Admin/frontend/src/components/Layout/Sidebar.tsx` - 메뉴 추가
- `/LibreChat-Admin/frontend/src/App.tsx` - 라우트 등록

**UI 기능:**
- 프롬프트 목록 (테이블 형태)
- 카테고리별 필터링
- 검색 기능
- Public/Organization/Private 탭 구분
- 프롬프트 생성/편집 다이얼로그
- 변수 관리 시스템 ({{variableName}} 형식)
- 태그 시스템
- 프롬프트 미리보기
- 사용 통계 및 평점 표시

##### 3. 핵심 기능
- **변수 시스템**: 프롬프트에 {{변수명}} 형태로 동적 값 삽입
- **권한 관리**: Public, Organization, Team 레벨 접근 제어
- **버전 관리**: 프롬프트 수정 이력 추적
- **사용 통계**: 사용 횟수, 평점 추적
- **카테고리 분류**: general, coding, writing, analysis 등 8개 카테고리

#### 테스트 완료
- [x] 백엔드 API 동작 확인
- [x] 프론트엔드 UI 렌더링
- [x] CRUD 작업 정상 동작
- [x] 필터링 및 검색 기능

---

### ✅ Step 2: 조직 메모리 (2025-09-16 완료)

#### 구현 완료 내역
1. **Memory 모델 생성** ✅
   - `/LibreChat-Admin/backend/src/models/Memory.js`
   - key-value 저장 구조
   - 다양한 데이터 타입 지원 (string, number, boolean, object, array)
   - 접근 레벨 제어 (public, team, organization, admin)
   - TTL 지원으로 자동 만료 기능
   - 접근 통계 추적 (accessCount, lastAccessed)

2. **메모리 관리 API** ✅
   - `/LibreChat-Admin/backend/src/routes/memory.js`
   - 전체 CRUD 작업 구현
   - 벌크 업데이트 지원
   - 카테고리별 필터링
   - 검색 기능
   - 통계 API

3. **Admin UI** ✅
   - `/LibreChat-Admin/frontend/src/pages/Memory/index.tsx`
   - 직관적인 키-값 에디터
   - JSON 객체/배열 지원
   - 카테고리별 분류
   - 실시간 통계 대시보드
   - 벌크 임포트 기능
   - 태그 기반 분류

4. **LibreChat 통합** ✅
   - `/LibreChat/api/server/services/OrgMemory.js` - 조직 메모리 서비스
   - `/LibreChat/api/server/controllers/agents/client.js` - AgentClient 통합
   - Internal API Key 인증 구현
   - 자동 메모리 컨텍스트 주입
   - 시스템 프롬프트에 조직 지식 포함

#### 테스트 완료
- [x] Memory 모델 CRUD 작업
- [x] 벌크 업서트 기능
- [x] 카테고리 필터링
- [x] 검색 기능
- [x] 통계 수집
- [x] LibreChat API 통합
- [x] Internal API Key 인증
- [x] 조직 메모리 자동 주입
- [x] 11개 샘플 메모리 생성 및 테스트

---

### ✅ Step 3: MCP 서버 관리 (2025-09-16 구현, 2025-09-16 LibreChat 통합 완료)

#### 구현 완료 내역
1. **MCPServer 모델 생성** ✅
   - `/LibreChat-Admin/backend/src/models/MCPServer.js`
   - 다중 연결 타입 지원 (stdio, SSE, WebSocket)
   - 건강 상태 모니터링 및 통계 추적
   - 접근 제어 (public/private, organization/team 기반)
   - 도구 및 리소스 관리
   - 설정 옵션 (timeout, retry, auto-reconnect)

2. **MCP 서버 관리 API** ✅
   - `/LibreChat-Admin/backend/src/routes/mcp-servers.js`
   - 전체 CRUD 작업 구현
   - 연결 테스트 API (`POST /:id/test`)
   - 통계 조회 API (`GET /:id/stats`)
   - 벌크 활성화/비활성화
   - JWT 및 Internal API Key 인증 지원

3. **Admin UI** ✅
   - `/LibreChat-Admin/frontend/src/pages/MCPServers/index.tsx`
   - 종합 대시보드 (총 서버, 활성, 건강, 도구 수)
   - 탭 뷰 (활성/비활성/전체 서버)
   - 서버 생성/편집 다이얼로그
   - 연결 테스트 및 응답 시간 표시
   - 건강 상태 표시기 (healthy/unhealthy/unknown)
   - 벌크 작업 지원

4. **기능 구현** ✅
   - MCP 서버 등록 및 구성
   - stdio/SSE/WebSocket 서버 연결 테스트
   - 자동 상태 업데이트를 통한 건강 모니터링
   - 사용 통계 추적 (연결, 도구 호출)
   - 접근 제어 관리
   - 서버 관리를 위한 벌크 작업

#### 테스트 완료
- [x] MCP 서버 생성 및 목록 조회
- [x] 연결 테스트 (<5ms 응답 시간)
- [x] 건강 체크 업데이트
- [x] 통계 추적 기능
- [x] 벌크 활성화/비활성화
- [x] Admin 대시보드 UI 통합

#### 현재 등록된 MCP 서버
- **File System MCP**: 파일 시스템 작업용 stdio 서버 (14개 도구)
- **GitHub MCP**: GitHub 통합용 stdio 서버 (26개 도구)
- **Web Search MCP**: 웹 검색 기능용 SSE 서버 (비활성)

---

### ✅ Step 3.5: MCP-LibreChat 통합 (2025-09-16 완료)

#### 구현 내용

##### 1. Admin-LibreChat MCP 통합 브리지
**생성 파일:**
- `/LibreChat/api/server/services/AdminMCPIntegration.js` - MCP 통합 서비스
- `/LibreChat/api/server/services/MCPService.js` - MCP 서버 연결 관리

**주요 기능:**
- Admin Dashboard에서 관리하는 MCP 서버를 LibreChat에서 자동 로드
- Internal API Key를 통한 안전한 서비스 간 통신
- 캐싱을 통한 성능 최적화 (1분 캐시)
- stdio, SSE, WebSocket 타입 자동 변환

##### 2. LibreChat 설정 수정
**수정 파일:**
- `/LibreChat/api/server/services/Config/loadCustomConfig.js` - MCP 서버 동적 로드
- `/LibreChat/librechat.yaml` - Agents 엔드포인트 활성화
- `/LibreChat/.env` - 통합 환경 변수 추가

**환경 변수:**
```bash
ENABLE_ADMIN_MCP_INTEGRATION=true
ADMIN_API_URL=http://localhost:5001
INTERNAL_API_KEY=sk-internal-api-key-for-service-communication-2025
```

##### 3. MCP 도구 통합 결과
- ✅ 총 40개 MCP 도구 성공적으로 로드
- ✅ File System MCP: 14개 도구 (파일 읽기/쓰기/편집 등)
- ✅ GitHub MCP: 26개 도구 (레포지토리/이슈/PR 관리 등)
- ✅ LibreChat Agents 엔드포인트에서 사용 가능

##### 4. 버그 수정
- `StdioClientTransport is not defined` 오류 해결
- MCPService.js에 누락된 import 추가

#### 테스트 완료
- [x] Admin Dashboard에서 MCP 서버 등록
- [x] LibreChat 시작 시 MCP 서버 자동 로드
- [x] 40개 MCP 도구 초기화 확인
- [x] Agents 엔드포인트에서 MCP 도구 사용 가능
- [x] 테스트 스크립트 작성 (`test-mcp-integration.js`, `demo-mcp-usage.js`)

#### 사용 가이드 문서
- `MCP_TEST_GUIDE.md` - LibreChat에서 MCP 테스트 방법
- `FILE_OPERATIONS_GUIDE.md` - File System MCP 14개 도구 상세 가이드

---

### ✅ Step 4: 에이전트 관리 시스템 (2025-09-16 완료)

#### 4.5: Admin-LibreChat Agent 통합 (2025-09-16 완료)

##### 구현 내용
1. **AdminAgentIntegration 서비스 생성** ✅
   - `/LibreChat/api/server/services/AdminAgentIntegration.js`
   - Admin Dashboard 에이전트를 LibreChat 형식으로 변환
   - Internal API Key를 통한 서비스 간 통신
   - 캐싱 메커니즘으로 성능 최적화

2. **LibreChat API 라우트 추가** ✅
   - `/LibreChat/api/server/routes/adminAgents.js`
   - `/api/admin-agents` 엔드포인트로 Admin 에이전트 노출
   - JWT 인증 적용
   - LibreChat 사용자가 Admin 에이전트 접근 가능

3. **에이전트 통합 테스트** ✅
   - `/LibreChat/test-admin-agent-integration.js`
   - 2개 Admin 에이전트가 LibreChat에서 사용 가능 확인
   - MCP 도구 자동 매핑 확인
   - 카테고리, 모델, 프롬프트 등 모든 설정 변환 확인

4. **통합 결과** ✅
   - Admin Dashboard에서 생성한 에이전트가 LibreChat Agents 엔드포인트에서 사용 가능
   - MCP 도구 (File System, GitHub) 자동 연결
   - 코드 실행, 파일 접근, 웹 검색 등 능력 매핑 완료

##### 인증 문제 해결 (2025-09-16)

**문제 상황:**
- Admin Dashboard Agent 페이지에서 지속적인 401 Unauthorized 오류
- `/api/agents`, `/api/prompts`, `/api/mcp-servers` 엔드포인트 접근 실패

**원인 분석:**
1. JWT 토큰 검증 누락 - agents 라우트에서 토큰을 검증하지 않고 통과시킴
2. axios 인스턴스 미사용 - 각 페이지에서 plain axios 사용으로 인터셉터 미적용
3. 토큰 이름 불일치 - `admin_token` vs `adminToken` 혼용

**해결 방법:**
1. **JWT 검증 추가** ✅
   ```javascript
   // /LibreChat-Admin/backend/src/routes/agents.js
   const jwt = require('jsonwebtoken');
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   ```

2. **axios 인스턴스 사용** ✅
   ```typescript
   // /LibreChat-Admin/frontend/src/pages/Agents/index.tsx
   import api from '../../utils/axios';  // plain axios 대신
   await api.get('/api/agents');  // 자동 토큰 포함
   ```

3. **토큰 이름 통일** ✅
   ```typescript
   // /LibreChat-Admin/frontend/src/utils/axios.ts
   const token = localStorage.getItem('admin_token') ||
                localStorage.getItem('adminToken');
   ```

**결과:**
- ✅ 모든 API 호출 정상 작동
- ✅ 인증 토큰 자동 포함
- ✅ 401 오류 해결

### ✅ Step 4: 에이전트 관리 시스템 (2025-09-16 완료)

#### 구현 완료 내역

##### 1. Agent 모델 생성 ✅
**파일 생성:**
- `/LibreChat-Admin/backend/src/models/Agent.js` - 에이전트 데이터 모델

**스키마 구조:**
- 기본 정보: name, description, avatar
- 타입 및 카테고리: assistant, specialist, workflow, custom
- 모델 설정: model, temperature, maxTokens
- 프롬프트: systemPrompt, instructions
- 연결 리소스: prompts[], mcpServers[], tools[]
- 능력 설정: codeExecution, fileAccess, webSearch, imageGeneration, dataAnalysis
- 접근 제어: isPublic, isActive, organization, teams
- 사용 통계: usageCount, totalTokens, rating, avgResponseTime

##### 2. API 엔드포인트 구현 ✅
**파일 생성:**
- `/LibreChat-Admin/backend/src/routes/agents.js` - API 라우트

**구현된 엔드포인트:**
- `GET /api/agents` - 에이전트 목록 조회
- `GET /api/agents/:id` - 에이전트 상세 조회
- `POST /api/agents` - 에이전트 생성
- `PUT /api/agents/:id` - 에이전트 수정
- `DELETE /api/agents/:id` - 에이전트 비활성화
- `POST /api/agents/:id/duplicate` - 에이전트 복제
- `POST /api/agents/:id/test` - 에이전트 테스트
- `POST /api/agents/:id/usage` - 사용 통계 업데이트
- `POST /api/agents/:id/rate` - 평점 업데이트
- `GET /api/agents/:id/stats` - 통계 조회
- `GET /api/agents/popular/list` - 인기 에이전트 조회

##### 3. Admin UI 구현 ✅
**파일 생성:**
- `/LibreChat-Admin/frontend/src/pages/Agents/index.tsx` - 에이전트 관리 UI

**UI 기능:**
- 통계 대시보드 (총 에이전트, 활성, MCP 도구 사용, 총 사용량)
- 탭 뷰 (전체/활성/공개/도구 포함)
- 에이전트 테이블 (이름, 타입, 카테고리, 모델, 도구, 사용량, 평점, 상태)
- 생성/편집 다이얼로그
- MCP 서버 연결 인터페이스
- 프롬프트 템플릿 연결
- 능력 설정 체크박스
- 태그 시스템
- 온도 슬라이더
- 복제 및 테스트 기능

##### 4. MCP 통합 ✅
- MCP 서버 자동 연결
- 도구 자동 추가 (서버 선택 시)
- 40개 MCP 도구 사용 가능:
  - File System MCP: 14개 도구
  - GitHub MCP: 26개 도구

#### 테스트 완료
- [x] Agent 모델 CRUD 작업
- [x] MCP 서버 연결 (2개 서버)
- [x] 에이전트 테스트 API
- [x] UI 렌더링 및 상호작용
- [x] 3개 에이전트 생성 및 테스트

#### 생성된 에이전트
1. **Coding Assistant** - 코딩 전문 에이전트
2. **Full-Stack Developer AI** - 풀스택 개발 에이전트
3. **Data Analyst AI** - 데이터 분석 에이전트

#### 테스트 문서
- `test-agents.js` - 에이전트 관리 테스트
- `test-agent-complete.js` - 전체 기능 테스트
- `AGENT_TEST_RESULTS.md` - 테스트 결과 문서

---

## 기술 스택
- **백엔드**: Node.js + Express + TypeScript + MongoDB
- **프론트엔드**: React + TypeScript + MUI + Vite
- **인증**: JWT
- **프로세스 관리**: PM2
- **프록시**: Nginx

## 현재 실행 중인 서비스
- Admin Backend: http://localhost:5001
- Admin Frontend: http://localhost:3091
- MongoDB: mongodb://localhost:27017/LibreChat

## 다음 작업
1. Step 5: 권한 및 배포 시스템 구축
2. 워크플로우 자동화 구현
3. 사용 분석 대시보드 구축
4. Production 환경 최적화

## 이슈 및 해결
1. **costAnalysis 모듈 의존성 문제**
   - LibreChat 모델 경로 문제로 임시 주석 처리
   - 추후 독립적인 모델로 재구현 필요

2. **Auth Middleware 타입 문제**
   - TypeScript와 JavaScript 혼용으로 인한 이슈
   - prompts.js에 간단한 미들웨어 구현으로 해결

3. **✅ 조직 메모리 통합 문제 (2025-09-16 해결)**
   
   ### 문제 상황
   - Admin Dashboard에서 설정한 메모리가 LibreChat 채팅에서 반영되지 않음
   - "팀 개발 규칙" 메모리를 설정했으나 LLM이 일반적인 답변만 제공
   
   ### 디버깅 과정
   
   #### 1차 시도: EditController 통합 (실패)
   - **가정**: `/api/edit/openAI` 엔드포인트가 채팅 요청 처리
   - **작업**:
     - `/LibreChat/api/server/controllers/EditController.js`에 로깅 추가
     - `/LibreChat/api/app/clients/OpenAIClient.js`의 `buildMessages`에 OrgMemory 통합
   - **결과**: EditController가 호출되지 않음 확인
   
   #### 2차 분석: 실제 채팅 플로우 파악
   - **발견사항**:
     - 실제 엔드포인트: `/api/agents/chat/openAI` (EditController 아님)
     - SSE (Server-Sent Events) 기반 스트리밍 응답
     - 처리 컨트롤러: `AgentController`
     - 클라이언트 클래스: `AgentClient`
   
   #### 3차 시도: AgentClient 통합 (진행 중)
   - **작업**:
     - `/LibreChat/api/server/controllers/agents/client.js`에 OrgMemory import
     - `buildMessages` 메서드에서 시스템 프롬프트에 메모리 컨텍스트 추가
     - 디버깅 로그 추가
   
   ### 해결 과정

   #### 4차 시도: Internal API Key 인증 구현 (성공!)
   - **문제 원인 발견**:
     - server.ts에서 memory 라우트에 authMiddleware 중복 적용
     - Internal API Key 인증 로직이 실행되지 않음

   - **해결 방법**:
     1. server.ts에서 memory 라우트의 authMiddleware 제거
     2. memory.js에서 Internal API Key 우선 확인 로직 추가
     3. OrgMemory.js의 타입 에러 수정 (number/object value 처리)
     4. 로깅 개선으로 디버깅 용이성 향상

   - **결과**:
     - ✅ Internal API Key 인증 성공
     - ✅ 11개 조직 메모리 자동 로드
     - ✅ AI 대화에 조직 컨텍스트 포함
   
   ### 관련 파일
   - `/LibreChat-Admin/backend/src/routes/memory.js` - 메모리 API
   - `/LibreChat/api/server/services/OrgMemory.js` - 메모리 페칭 서비스
   - `/LibreChat/api/server/controllers/agents/client.js` - 채팅 클라이언트 (수정됨)
   - `/LibreChat/ecosystem.config.js` - PM2 환경 변수 설정
   
   ### 환경 변수 설정
   ```bash
   # LibreChat/.env
   ENABLE_ORG_MEMORY=true
   INTERNAL_API_KEY=sk-internal-api-key-for-service-communication-2025
   ADMIN_API_URL=http://localhost:5001

   # LibreChat-Admin/backend/.env
   INTERNAL_API_KEY=sk-internal-api-key-for-service-communication-2025
   ```

   ### 현재 메모리 데이터 (11개)
   - **팀 개발 규칙**: TypeScript 사용, 한글 커밋, PR 리뷰, 테스트 커버리지
   - **회사 정보**: LLMDash AI 엔터프라이즈 솔루션
   - **기술 스택**: React/TypeScript/Node.js/MongoDB
   - **팀 미팅**: 매주 월요일 오전 10시
   - **기타**: API 엔드포인트, 모델 설정, 시스템 프롬프트 등

---

## 2025-09-16 Admin Dashboard UI 개선 및 Cost Analysis 수정

### Admin UI 통일 작업 완료
모든 Admin Dashboard 페이지에 일관된 UI 패턴 적용:

#### 1. PageContainer 패턴 적용
모든 페이지를 PageContainer 컴포넌트로 감싸 일관된 레이아웃 제공:
- **통일된 여백**: `padding: 4` (32px)
- **일관된 간격**: `gap: 3` (24px)
- **반응형 크기**: 모든 페이지 동일 적용

#### 2. 탭 UI 스타일 통일
모든 탭 기반 페이지에 동일한 스타일 적용:
- Dashboard, Cost & Usage, Organization, System Config, Model Settings
- 탭 호버 시 `transform` 애니메이션 제거 (커서 변경 이슈 해결)
- Paper 컴포넌트와 borderRadius, boxShadow 통일

#### 3. 적용 페이지
- `/pages/Dashboard/DynamicDashboard.tsx`
- `/pages/CostUsage/index.tsx`
- `/pages/Organization/index.tsx`
- `/pages/SystemConfiguration.tsx`
- `/pages/Settings.tsx`
- `/pages/Prompts/index.tsx`
- `/pages/Memory/index.tsx`
- `/pages/MCPServers/index.tsx`
- `/pages/Agents/index.tsx`

### Cost Analysis 버그 수정

#### 1. Invalid Time Value 에러 해결
**문제**: Date 포맷팅 시 "RangeError: Invalid time value" 발생
**해결**: 날짜 유효성 검증 추가
```typescript
const date = new Date(tx.date);
return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'MMM dd, HH:mm');
```

#### 2. MongoDB 스키마 매핑 수정
**문제**: 실제 MongoDB 필드명과 코드의 불일치
**원인**: transactions 컬렉션의 실제 구조
- `rawAmount`: 토큰 수 (이전: promptTokens, completionTokens)
- `rate`: 백만 토큰당 가격
- `tokenType`: 'prompt' 또는 'completion'

#### 3. 비용 계산 공식 수정
**문제**: 비용이 1000배 과다 계산 ($2277 대신 $2.28)
**해결**: 올바른 계산 공식 적용
```javascript
const tokens = Math.abs(transaction.rawAmount || 0);
const rate = transaction.rate || 0; // 백만 토큰당 가격
const cost = (tokens / 1000000) * rate;
```

#### 4. 차트 데이터 필드 수정
**문제**: Daily Cost Trend와 Cost by Model 차트 미표시
**원인**: dataKey 불일치
**해결**:
- AreaChart: `dataKey="cost"` (이전: "totalCost")
- BarChart: `dataKey="cost"` (이전: "totalCost")

#### 5. $NaN 표시 문제 해결
**문제**: 파이 차트와 테이블에서 $NaN 값 표시
**해결**: 올바른 필드명 매핑
- Pie chart: `dataKey="cost"` (이전: "totalCost")
- Model Cost Breakdown: `conversationCount` (이전: "transactions")
- 비용 포맷팅 함수 안전성 강화

### 수정된 파일
Backend:
- `/LibreChat-Admin/backend/src/routes/costAnalysisSimple.js`

Frontend:
- `/LibreChat-Admin/frontend/src/pages/CostAnalysis.tsx`
- `/LibreChat-Admin/frontend/src/pages/CostUsage/index.tsx`
- 기타 모든 Admin Dashboard 페이지 파일

### 테스트 완료
- [x] 모든 페이지 UI 일관성 확인
- [x] 탭 호버 커서 이슈 해결
- [x] Cost Analysis 날짜 포맷팅 정상 동작
- [x] 비용 계산 정확도 검증
- [x] 모든 차트 정상 표시
- [x] $NaN 이슈 해결

---

## Phase 3: LibreChat UI 커스터마이징 (2025-09-16 시작)

### 구현 계획

#### 1. 브랜드 전환 (LibreChat → LLMDash)
**수정 파일:**
- `/LibreChat/client/index.html` - 타이틀, 메타 설명, 파비콘
- `/LibreChat/client/src/components/Chat/Footer.tsx` - Footer 브랜드 링크
- `/LibreChat/client/src/components/Auth/AuthLayout.tsx` - 로그인 페이지 브랜딩
- `/LibreChat/librechat.yaml` - 사이트 설정

**변경 내용:**
- 모든 "LibreChat" 텍스트를 "LLMDash"로 변경
- 제품 설명 및 링크 업데이트
- 로고 및 파비콘 교체 (필요시)

#### 2. Admin 관리 기능 UI 숨김
**제거할 기능들:**
- Side Panel의 Prompts 탭 (Admin Dashboard로 이동)
- Side Panel의 Memory Viewer (Admin Dashboard로 이동)
- Agent Builder (Admin Dashboard로 이동)
- Parameters 고급 설정 (Admin Dashboard로 이동)
- Chat Input의 Prompt Selector (Admin에서 중앙 관리)

**수정 파일:**
- `/LibreChat/client/src/hooks/Nav/useSideNavLinks.ts` - 사이드 패널 링크 제거
- `/LibreChat/client/src/components/Chat/Input/ChatForm.tsx` - Prompt Selector 제거

#### 3. UI/UX Look & Feel 개선
**계획된 변경사항:**
- 색상 팔레트 커스터마이징
- 버튼 및 입력 필드 스타일 통일
- Navigation 패널 디자인 개선
- Chat 영역 레이아웃 최적화
- 다크/라이트 테마 조정

#### 4. 환경 변수 설정
```bash
# LibreChat/.env 추가
SITE_NAME=LLMDash
APP_TITLE=LLMDash
CUSTOM_FOOTER=LLMDash © 2025 - Enterprise AI Chat Platform
```

### 예상 완료 시간
- 브랜드 전환: 30분
- 기능 숨김: 1시간
- UI 개선: 1-2시간
- 테스트 및 배포: 30분

---

## 2025-09-17 PostCSS 컴파일 문제 해결

### 문제 상황
- LibreChat 프론트엔드 빌드 시 PostCSS 컴파일 문제 발생
- `postcss.config.js` 파일 삭제로 인한 Tailwind CSS 처리 불가
- UI 스타일링 깨짐 현상 발생

### 해결 과정

#### 1. 문제 진단 및 현재 상태 확인 ✅
- postcss.config.js 파일이 삭제된 상태 확인
- Tailwind CSS 설정 파일의 구문 오류 발견
- vite.config.ts에서 PostCSS 설정 누락 확인

#### 2. PostCSS 설정 파일 복원 및 수정 ✅
**생성 파일:**
- `/LibreChat/client/postcss.config.js` - PostCSS 설정 복원

**설정 내용:**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### 3. Vite 설정 수정 ✅
**수정 파일:**
- `/LibreChat/client/vite.config.ts` - CSS 설정 추가

**추가 내용:**
```typescript
css: {
  postcss: {
    plugins: [
      tailwindcss,
      autoprefixer,
    ],
  },
},
```

#### 4. Tailwind CSS 설정 수정 ✅
**수정 파일:**
- `/LibreChat/client/tailwind.config.cjs` - 구문 오류 수정

**수정 내용:**
- `[switch-unchecked]` → `'switch-unchecked'` (올바른 객체 키 형식)

#### 5. 관련 의존성 패키지 설치 ✅
**설치 패키지:**
- `uuid` - LibreChat 백엔드 필수 의존성
- `fs-extra` - 빌드 스크립트 의존성
- `module-alias` - 백엔드 모듈 경로 해결

**설치 명령:**
```bash
# 클라이언트 의존성
cd LibreChat/client && npm ci

# 루트 의존성
cd LibreChat && npm ci
```

#### 6. 빌드 테스트 및 검증 ✅
**빌드 결과:**
- ✅ 프론트엔드 빌드 성공 (13.32초)
- ✅ CSS 파일 정상 생성 (241.99 kB)
- ✅ PostCSS → Tailwind CSS → Autoprefixer 파이프라인 정상 작동
- ✅ 총 7,423개 모듈 변환 완료

#### 7. 서비스 재시작 및 전체 시스템 확인 ✅
**PM2 서비스 상태:**
- ✅ LibreChat 백엔드 4개 클러스터 프로세스 정상 실행
- ✅ 포트 3080에서 API 서비스 정상 응답 (200 OK)
- ✅ 웹사이트 접근 가능 (https://www.llmdash.com/chat/)
- ✅ API 엔드포인트 정상 작동 확인

### 해결 결과

#### 기술적 성과
1. **PostCSS 파이프라인 정상화**: Tailwind CSS + Autoprefixer 정상 처리
2. **빌드 프로세스 안정화**: 13초 내 빌드 완료, 오류 없음
3. **의존성 문제 해결**: 누락된 패키지 설치로 완전한 빌드 환경 구축
4. **서비스 정상화**: 백엔드/프론트엔드 모든 서비스 정상 작동

#### 파일별 수정 요약
```
수정된 파일:
├── LibreChat/client/postcss.config.js (생성)
├── LibreChat/client/vite.config.ts (CSS 설정 추가)
├── LibreChat/client/tailwind.config.cjs (구문 오류 수정)
├── LibreChat/client/package.json (의존성 추가)
└── LibreChat/package.json (의존성 추가)
```

#### 빌드 통계
- **변환 모듈**: 7,423개
- **빌드 시간**: 13.32초
- **CSS 크기**: 241.99 kB (gzip: 37.35 kB)
- **총 에셋**: 4.47 MB → 894.48 kB (gzip)

### 후속 작업
- [x] UI 스타일링 정상화 확인
- [x] Tailwind CSS 클래스 적용 테스트
- [x] 다크/라이트 테마 정상 작동 검증
- [x] 반응형 디자인 정상 작동 확인

### 기술 노트
- PostCSS는 Vite 빌드 시스템에서 CSS 처리를 담당하는 핵심 컴포넌트
- Tailwind CSS는 PostCSS 플러그인으로 동작하며, 설정 파일 없이는 처리 불가
- Autoprefixer는 브라우저 호환성을 위한 CSS 벤더 프리픽스 자동 추가

---

## 참고 사항
- 각 Step은 독립적으로 동작 가능하도록 설계
- 점진적 개선 방식으로 즉시 사용 가능
- 프로덕션 배포 시 PM2 ecosystem 설정 필요