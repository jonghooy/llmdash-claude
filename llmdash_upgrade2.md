# LLMDash 업그레이드 계획 2 - 메모리 기능 강화 (POC)

## 목표
mem-agent-mcp를 통한 조직/팀/개인 메모리 관리 기능 추가로 차별적 가치 제공 및 사업 가능성 검증

## 1. 현재 상황 분석

### ✅ 완성된 기능
- LLM 통합 제어 (Admin Dashboard)
- 실시간 모니터링 (사용량, 비용, 성능)
- Agent 기능 제어
- 멀티 모델 지원 (GPT, Claude, Gemini)
- API Relay Server (/v1 엔드포인트)

### 🎯 차별화 전략
- **기업 메모리**: 부서별/팀별 지식 관리
- **개인 메모리**: 사용자별 개인화된 컨텍스트
- **지능형 검색**: AI 기반 메모리 탐색 및 활용

## 2. mem-agent-mcp 분석

### 핵심 기능
- **Obsidian 스타일 메모리**: 마크다운 기반 구조화된 지식 관리
- **자동 분류**: 대화를 주제/엔티티별로 자동 정리
- **Wiki 스타일 링킹**: `[[entities/name.md]]` 형태로 상호 참조
- **MCP 프로토콜**: Claude Desktop/Code와 호환

### 지원 플랫폼
- macOS (Metal backend)
- Linux (GPU, vLLM backend)

### 메모리 커넥터
- ChatGPT 대화 내보내기
- Notion 워크스페이스
- GitHub 통합
- Google Docs 연동

## 3. 구현 계획

### Phase 1: 서버 설치 및 기본 설정 (1주)

#### 3.1 mem-agent-mcp 설치
```bash
# 서버에 설치
cd /opt
git clone https://github.com/firstbatchxyz/mem-agent-mcp.git
cd mem-agent-mcp

# 의존성 설치
make check-uv
make install

# 메모리 디렉토리 설정
mkdir -p /opt/llmdash-memory/{business,teams,personal}
```

#### 3.2 메모리 구조 설계
```
/opt/llmdash-memory/
├── business/           # 사업부별 메모리
│   ├── user.md
│   ├── entities/
│   └── conversations/
├── teams/             # 팀별 메모리
│   ├── dev/
│   ├── marketing/
│   └── sales/
└── personal/          # 개인별 메모리
    └── [userId]/
        ├── user.md
        ├── entities/
        └── conversations/
```

#### 3.3 MCP 서버 설정
```bash
# 각 레벨별 MCP 서버 실행
# Business Level (포트 9001)
make run-agent MEMORY_PATH=/opt/llmdash-memory/business PORT=9001

# Team Level (포트 9002-9010)
make run-agent MEMORY_PATH=/opt/llmdash-memory/teams/dev PORT=9002

# Personal Level (포트 9100+)
make run-agent MEMORY_PATH=/opt/llmdash-memory/personal/[userId] PORT=9100
```

### Phase 2: LibreChat 연동 (1주)

#### 2.1 LibreChat MCP 클라이언트 구현
```typescript
// LibreChat/api/server/services/MCPClient.js
class MCPClient {
  constructor(level: 'business' | 'team' | 'personal', userId?: string) {
    this.level = level;
    this.userId = userId;
    this.port = this.getPort(level, userId);
  }

  async searchMemory(query: string) {
    // MCP 프로토콜로 메모리 검색
  }

  async saveConversation(conversation: any) {
    // 대화를 메모리에 저장
  }

  async getRelevantContext(prompt: string) {
    // 프롬프트와 관련된 메모리 컨텍스트 반환
  }
}
```

#### 2.2 Chat 인터페이스 확장
- 메모리 검색 버튼 추가
- 관련 메모리 표시 패널
- 대화 저장 옵션

### Phase 3: Admin Dashboard 통합 (1주)

#### 3.1 메모리 관리 페이지 추가
```typescript
// LibreChat-Admin/frontend/src/pages/MemoryManagement.tsx
- 사업부/팀/개인 메모리 현황
- 메모리 사용량 모니터링
- 메모리 백업/복원 기능
- 권한 관리 (누가 어떤 메모리에 접근 가능한지)
```

#### 3.2 메모리 Analytics
- 메모리 활용도 분석
- 주요 엔티티 추출
- 지식 네트워크 시각화

#### 3.3 자동 분류 및 태깅
- AI 기반 대화 분류
- 자동 엔티티 추출
- 중요도 기반 우선순위

### Phase 4: 고급 기능 (2주)

#### 4.1 지능형 메모리 검색
```typescript
// 의미 기반 검색 (벡터 임베딩)
class SemanticMemorySearch {
  async findSimilarConversations(query: string) {
    // 유사한 대화 찾기
  }

  async suggestRelevantMemories(context: string) {
    // 컨텍스트 기반 메모리 추천
  }
}
```

#### 4.2 메모리 커넥터 확장
- Slack 워크스페이스 연동
- Microsoft Teams 통합
- Confluence 동기화
- Jira 이슈 연결

#### 4.3 협업 기능
- 팀 메모리 공유
- 메모리 댓글 및 주석
- 버전 관리 (git 기반)

## 4. 기술적 구현 상세

### 4.1 시스템 아키텍처
```
LLMDash Platform
├── LibreChat (Chat Interface)
│   ├── MCP Client Integration
│   └── Memory Context Provider
├── Admin Dashboard
│   ├── Memory Management UI
│   └── Analytics & Monitoring
├── MCP Memory Servers
│   ├── Business Level (9001)
│   ├── Team Levels (9002-9010)
│   └── Personal Levels (9100+)
└── Memory Storage
    ├── Structured Files (Markdown)
    ├── Vector Database (Embeddings)
    └── Metadata Index
```

### 4.2 데이터 모델
```typescript
interface MemoryLevel {
  id: string;
  type: 'business' | 'team' | 'personal';
  name: string;
  description: string;
  users: string[];
  permissions: Permission[];
  mcpPort: number;
  storagePath: string;
}

interface MemoryEntity {
  name: string;
  type: 'person' | 'project' | 'concept' | 'process';
  description: string;
  relationships: string[];
  lastUpdated: Date;
  importance: number;
}

interface Conversation {
  id: string;
  timestamp: Date;
  participants: string[];
  entities: string[];
  summary: string;
  tags: string[];
  memoryLevel: string;
}
```

### 4.3 권한 관리
```typescript
enum MemoryPermission {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

interface MemoryAccess {
  userId: string;
  memoryLevelId: string;
  permission: MemoryPermission;
  grantedBy: string;
  grantedAt: Date;
}
```

## 5. POC 성공 지표

### 5.1 기술적 지표
- [ ] MCP 서버 안정성 (99% 업타임)
- [ ] 메모리 검색 응답 시간 (<2초)
- [ ] 동시 사용자 처리 (50명 이상)
- [ ] 메모리 정확도 (90% 이상 관련성)

### 5.2 사업적 지표
- [ ] 사용자 참여도 증가 (메모리 기능 사용률 70% 이상)
- [ ] 대화 품질 개선 (컨텍스트 활용도 측정)
- [ ] 지식 재사용률 (저장된 메모리 재참조 빈도)
- [ ] 고객 만족도 (피드백 점수 4.5/5 이상)

### 5.3 차별화 요소 검증
- [ ] 기존 ChatGPT/Claude 대비 컨텍스트 유지 능력
- [ ] 팀 협업에서의 지식 공유 효과
- [ ] 기업 도메인 지식 활용 정도

## 6. 구현 일정

### Week 1: 기반 설치
- [ ] mem-agent-mcp 서버 설치 및 설정
- [ ] 기본 메모리 구조 구축
- [ ] MCP 서버 다중 인스턴스 실행

### Week 2: LibreChat 연동
- [ ] MCP 클라이언트 구현
- [ ] Chat 인터페이스에 메모리 기능 통합
- [ ] 기본 메모리 저장/검색 기능

### Week 3: Admin 통합
- [ ] Admin Dashboard에 메모리 관리 페이지 추가
- [ ] 사용자 권한 관리 구현
- [ ] 메모리 사용량 모니터링

### Week 4: 고급 기능
- [ ] 지능형 검색 및 추천
- [ ] 자동 분류 및 태깅
- [ ] 협업 기능 기본 틀

### Week 5: 최적화 및 테스트
- [ ] 성능 최적화
- [ ] 사용자 테스트 진행
- [ ] 피드백 수집 및 개선

## 7. 리스크 및 대응 방안

### 7.1 기술적 리스크
- **GPU 자원 부족**: CPU 백엔드 옵션 준비
- **메모리 동기화 문제**: 파일 락 및 트랜잭션 처리
- **MCP 프로토콜 호환성**: 테스트 환경에서 충분한 검증

### 7.2 사업적 리스크
- **사용자 채택률 저조**: 간단한 UX와 명확한 가치 제안
- **개인정보 우려**: 엄격한 권한 관리 및 암호화
- **확장성 문제**: 클라우드 기반 확장 계획 수립

## 8. 예상 투자 비용

### 8.1 개발 비용
- 개발 시간: 5주 (1인 기준)
- 서버 증설: GPU 서버 추가 (월 $200)
- 스토리지: 메모리 저장용 SSD 확장 ($500)

### 8.2 운영 비용
- MCP 서버 리소스: 월 $100
- 백업 스토리지: 월 $50
- 모니터링 도구: 월 $30

**총 초기 투자**: ~$1,000
**월 운영비**: ~$380

## 9. 성공 시나리오

### 9.1 단기 목표 (3개월)
- 5개 이상 기업/팀에서 POC 진행
- 메모리 기능 활용도 70% 이상
- 사용자 만족도 4.5/5 이상

### 9.2 중기 목표 (6개월)
- 메모리 기능을 핵심 차별화 요소로 마케팅
- Enterprise 플랜 출시 (메모리 용량 및 고급 기능)
- 외부 툴 연동 확대 (Slack, Teams, Notion 등)

### 9.3 장기 비전 (1년)
- AI-powered Knowledge Management Platform으로 포지셔닝
- 산업별 특화 메모리 템플릿 제공
- 메모리 기반 AI 컨설팅 서비스 확장

## 10. 차별화 포인트

### 10.1 기존 솔루션 대비 장점
| 기능 | ChatGPT Enterprise | Claude Pro | LLMDash + Memory |
|------|------------------|------------|------------------|
| 개인 메모리 | ❌ | ❌ | ✅ |
| 팀 메모리 공유 | 제한적 | ❌ | ✅ |
| 크로스 플랫폼 | ❌ | ❌ | ✅ |
| 온프레미스 | ❌ | ❌ | ✅ |
| 커스텀 통합 | 제한적 | 제한적 | ✅ |

### 10.2 핵심 가치 제안
1. **"잊지 않는 AI"**: 모든 대화와 지식을 기억하고 활용
2. **"팀의 두뇌"**: 팀 전체의 지식과 경험을 AI가 학습
3. **"자동 지식 정리"**: 산발적인 대화를 구조화된 지식으로 변환
4. **"상황 인식 AI"**: 과거 맥락을 이해하고 더 정확한 답변 제공

이 계획을 통해 LLMDash는 단순한 LLM 프록시에서 **지능형 조직 메모리 플랫폼**으로 진화할 수 있습니다.

---

## 구현 진행 상황 (2025-09-19)

### ✅ Phase 1 완료: Memory Enterprise MCP 통합

#### 1. 초기 시도: SSE 프로토콜
- Memory Enterprise의 SSE (Server-Sent Events) 지원 확인
- JSON-RPC over SSE 프로토콜 테스트 (`/mcp/jsonrpc-sse/stream/{session_id}`)
- LibreChat의 MCP SSE 지원 구현 시도
- 지속적인 "MCP error -32000: Connection closed" 오류 발생

#### 2. 프로토콜 전환: stdio
- SSE 연결 문제로 인해 stdio 프로토콜로 전환
- `/home/jonghooy/work/rag-mcp/src/mcp/stdio_server.py` 사용
- mem-agent-mcp는 삭제되어 사용 불가 확인

#### 3. stdio 서버 수정 사항
```python
# notifications 처리 추가
elif method.startswith("notifications/"):
    return None  # 응답 불필요

# ping 응답 수정
elif method == "ping":
    result = {}  # {"pong": True}에서 변경

# None 응답 처리
if response is not None:
    sys.stdout.write(json.dumps(response) + "\n")
    sys.stdout.flush()
```

#### 4. 최종 설정 (librechat.yaml)
```yaml
memory_enterprise:
  type: stdio
  command: /root/.cache/pypoetry/virtualenvs/memory-agent-enterprise-zNJ23Lqb-py3.12/bin/python
  args:
    - "-u"
    - "/home/jonghooy/work/rag-mcp/src/mcp/stdio_server.py"
  env:
    PYTHONPATH: "/home/jonghooy/work/rag-mcp"
    TENANT_ID: "default"
    USER_ID: "librechat"
    PYTHONUNBUFFERED: "1"
```

### 📊 통합 결과
- ✅ Memory Enterprise 성공적으로 연결됨
- ✅ 3개 메모리 도구 활성화:
  - `memory_search`: 의미 기반 메모리 검색
  - `memory_create`: 새로운 메모리 생성
  - `memory_list`: 메모리 목록 조회
- ✅ 전체 MCP 도구 수: 40개 → 43개로 증가

### 🔍 발견된 이슈 및 해결
1. **MongoDB 필드 불일치**: `type` vs `connectionType` → 두 필드 모두 추가
2. **MCPService.js SSE 미구현**: MCPManager가 실제 사용되는 모듈임을 확인
3. **notifications/initialized 처리**: stdio 서버에서 무시하도록 수정
4. **ping/pong 응답 형식**: 빈 객체 반환으로 수정

### 📁 수정된 주요 파일
- `/home/jonghooy/work/rag-mcp/src/mcp/stdio_server.py`
- `/home/jonghooy/work/llmdash-claude/LibreChat/librechat.yaml`
- `/home/jonghooy/work/llmdash-claude/LibreChat/packages/api/src/mcp/connection.ts` (SSE 시도)

### 🎯 다음 단계
- [ ] LibreChat UI에서 메모리 도구 테스트
- [ ] 메모리 저장 및 검색 기능 검증
- [ ] 사용자별 메모리 분리 구현
- [ ] 팀/조직 레벨 메모리 구조 설계

---
*최종 업데이트: 2025-09-19 14:45 KST*