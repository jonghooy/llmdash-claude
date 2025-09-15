# LLMDash 업그레이드 프로젝트

## 프로젝트 목표
LibreChat의 개인용 기능을 기업용 팀 협업 시스템으로 전환
- 에이전트, 메모리, 프롬프트를 Admin Dashboard에서 중앙 관리
- MCP 서버 통합 관리
- 조직/팀 단위 권한 관리

## 전체 구현 계획

### Phase 1: 기본 인프라 구축
- [x] Step 1: 프롬프트 라이브러리 (2-3시간) ✅ 2025-09-12 완료
- [x] Step 2: 조직 메모리 (3-4시간) ✅ 2025-09-16 완료
- [x] Step 3: MCP 서버 관리 (4-5시간) ✅ 2025-09-16 완료
- [x] Step 3.5: MCP-LibreChat 통합 ✅ 2025-09-16 완료
- [ ] Step 4: 에이전트 관리 (1일)
- [ ] Step 5: 권한 및 배포 시스템 (1일)

### Phase 2: LibreChat 통합
- [x] Admin API 연동 ✅
- [ ] 프롬프트/에이전트 동기화
- [x] 메모리 자동 주입 ✅
- [x] MCP 서버 동적 로딩 ✅

### Phase 3: 고급 기능
- [ ] 워크플로우 자동화
- [ ] 사용 분석 및 최적화
- [ ] 보안 강화

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

### 🤖 Step 4: 에이전트 관리 (계획)

#### 목표
- LibreChat의 에이전트를 Admin에서 생성/관리
- 프롬프트 템플릿과 MCP 도구 연결
- 팀별 에이전트 할당

#### 구현 계획
1. **Agent 모델**
   - name, instructions, tools
   - 프롬프트 템플릿 연결
   - MCP 도구 선택

2. **에이전트 관리 UI**
   - 에이전트 빌더
   - 도구 선택 인터페이스
   - 테스트 환경

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
1. Step 4: 에이전트 관리 시스템 구현
2. LibreChat와 프롬프트 연동 테스트
3. 권한 및 배포 시스템 구축
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

## 참고 사항
- 각 Step은 독립적으로 동작 가능하도록 설계
- 점진적 개선 방식으로 즉시 사용 가능
- 프로덕션 배포 시 PM2 ecosystem 설정 필요