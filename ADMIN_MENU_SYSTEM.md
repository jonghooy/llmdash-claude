# LibreChat Enterprise Admin Dashboard System
> 심플하고 직관적인 엔터프라이즈 관리 시스템 - 상세 구현 명세서 v2.0

## 📊 핵심 메뉴 구조 (Core Menu Structure)

```
┌─────────────────────────────────────────────────────────────┐
│  🏢 LLMDASH Admin            실시간 ⚡  알림(3) 🔔  관리자 👤│
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌────────────────────────────────────────┐  │
│  │          │  │                                          │  │
│  │ 📊 대시보드 │  │                                          │  │
│  │ 💰 비용관리 │  │         Main Content Area              │  │
│  │ 👥 사용자  │  │                                          │  │
│  │ 📈 사용량  │  │                                          │  │
│  │ ⚙️ 설정    │  │                                          │  │
│  │          │  └────────────────────────────────────────┘  │
│  └──────────┘                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 5대 핵심 메뉴

### 1. 📊 대시보드 (Dashboard)
**목적**: 한눈에 보는 비즈니스 현황

```javascript
{
  id: 'dashboard',
  title: '대시보드',
  icon: '📊',
  path: '/',
  components: [
    {
      title: '오늘의 핵심 지표',
      metrics: [
        { label: '총 비용', value: '$2,458', trend: '-12%' },
        { label: '활성 사용자', value: '342', trend: '+8%' },
        { label: 'API 호출', value: '45.2K', trend: '+23%' },
        { label: '평균 응답시간', value: '124ms', status: 'good' }
      ]
    },
    {
      title: '실시간 활동',
      type: 'live-feed',
      showLast: 10
    }
  ]
}
```

**화면 레이아웃**:
```
┌──────────────────────────────────────────────────────┐
│ 💰 $2,458   👥 342명    📊 45.2K    ⚡ 124ms         │
│   오늘 비용   활성사용자   API 호출   응답시간         │
├──────────────────────────────────────────────────────┤
│ 📈 30일 비용 트렌드           │ 🏆 Top 5 사용 부서    │
│ [────────그래프────────]      │ 개발팀  ████ 45%    │
│                              │ 영업팀  ███  32%     │
│                              │ 마케팅  ██   21%     │
└──────────────────────────────────────────────────────┘
```

### 2. 💰 비용 관리 (Cost Management)
**목적**: 비용 최적화 및 예산 관리

```javascript
{
  id: 'cost',
  title: '비용 관리',
  icon: '💰',
  path: '/cost',
  subMenu: [
    { title: '실시간 비용', path: '/cost/realtime' },
    { title: '예산 설정', path: '/cost/budget' },
    { title: '비용 분석', path: '/cost/analysis' },
    { title: '청구서', path: '/cost/invoices' }
  ]
}
```

**핵심 기능**:
- **실시간 비용 추적**: API별, 모델별, 팀별
- **예산 알림**: 80% 도달 시 자동 알림
- **비용 예측**: AI 기반 월말 예상 비용
- **최적화 제안**: 비용 절감 방안 자동 추천

### 3. 👥 사용자 관리 (User Management)
**목적**: 조직/팀/사용자 통합 관리

```javascript
{
  id: 'users',
  title: '사용자',
  icon: '👥',
  path: '/users',
  features: [
    '조직 구조 관리',
    '팀별 할당량 설정',
    '사용자 승인/차단',
    '활동 모니터링'
  ]
}
```

**조직 구조 예시**:
```
회사 (LLMDash Inc.)
├── 개발부 (45명)
│   ├── 백엔드팀 (15명) - 할당량: $5,000/월
│   ├── 프론트팀 (12명) - 할당량: $3,000/월
│   └── AI팀 (18명) - 할당량: $8,000/월
├── 영업부 (30명)
│   └── 할당량: $4,000/월
└── 마케팅부 (20명)
    └── 할당량: $2,500/월
```

### 4. 📈 사용량 분석 (Usage Analytics)
**목적**: 데이터 기반 의사결정

```javascript
{
  id: 'usage',
  title: '사용량',
  icon: '📈',
  path: '/usage',
  views: [
    { type: 'realtime', title: '실시간 모니터링' },
    { type: 'daily', title: '일별 리포트' },
    { type: 'model', title: '모델별 분석' },
    { type: 'export', title: '데이터 내보내기' }
  ]
}
```

**대시보드 위젯**:
```
┌─────────────────┬─────────────────┬─────────────────┐
│ 📊 시간대별 사용 │ 🤖 모델별 분포   │ 👤 사용자 TOP10 │
│ [막대 그래프]    │ GPT-4: 45%      │ 1. 김철수 2.3K │
│ 09-10시: ████   │ Claude: 32%     │ 2. 이영희 1.8K │
│ 14-15시: ██████ │ Gemini: 23%     │ 3. 박민수 1.5K │
└─────────────────┴─────────────────┴─────────────────┘
```

### 5. ⚙️ 설정 (Settings)
**목적**: 시스템 구성 및 통합

```javascript
{
  id: 'settings',
  title: '설정',
  icon: '⚙️',
  path: '/settings',
  sections: [
    { title: '일반', items: ['회사 정보', '브랜딩', '언어'] },
    { title: 'API', items: ['키 관리', '모델 설정', '한도'] },
    { title: '통합', items: ['SSO', 'Webhook', 'Slack'] },
    { title: '보안', items: ['2FA', 'IP 제한', '감사로그'] }
  ]
}
```

## 💎 사업화 핵심 대시보드 디자인

### 1. Main Dashboard - Executive View
```
┌────────────────────────────────────────────────────────────────┐
│ 🏢 LLMDASH Admin                     실시간 ⚡  알림(3) 🔔  👤 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  오늘의 핵심 지표                        실시간 활동           │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │💰 비용    │👥 사용자  │📊 API    │⚡ 응답   │   • 김철수님이 GPT-4 사용  │
│  │$2,458    │342명     │45.2K    │124ms    │   • 예산 80% 도달 경고    │
│  │▼12%     │▲8%      │▲23%    │Good     │   • 새 사용자 승인 대기   │
│  └──────────┴──────────┴──────────┴──────────┘              │
│                                                                │
│  30일 비용 트렌드                    모델별 사용 분포          │
│  ┌────────────────────────┐        ┌─────────────────┐       │
│  │    ╱╲    ╱╲           │        │ GPT-4    45% ████      │
│  │   ╱  ╲  ╱  ╲          │        │ Claude   32% ███       │
│  │  ╱    ╲╱    ╲  $2,458 │        │ Gemini   23% ██        │
│  │ ╱             ╲        │        │                        │
│  └────────────────────────┘        └─────────────────┘       │
│                                                                │
│  팀별 사용 현황                                                │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ 개발팀      │ 영업팀      │ 마케팅팀    │ 고객지원팀   │  │
│  │ $1,234/5000 │ $890/3000   │ $567/2000   │ $234/1000   │  │
│  │ ████░ 25%   │ ███░ 30%    │ ██░ 28%     │ ██░ 23%     │  │
│  │ 👥 15명     │ 👥 12명     │ 👥 8명      │ 👥 5명      │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
│                                                                │
│  💡 AI 인사이트 & 추천                                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ • 개발팀 GPT-4 사용량 급증 - Claude로 전환 시 32% 절감   │  │
│  │ • 오후 2-4시 트래픽 집중 - 로드밸런싱 권장              │  │
│  │ • 이번 달 예상 비용 $8,234 - 예산 대비 82%             │  │
│  │ [자세히 보기] [최적화 적용] [리포트 생성]               │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 2. Cost Management Dashboard
```
┌────────────────────────────────────────────────────────────────┐
│ 💰 비용 관리 센터                                [월간] [일간] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  예산 현황                          비용 최적화 기회           │
│  ┌────────────────────────┐        ┌──────────────────────┐  │
│  │ 월 예산: $10,000        │        │ 총 절감 가능: $2,814 │  │
│  │ 사용: $8,234 (82.3%)    │        │                      │  │
│  │ ████████████████░░░░   │        │ ✅ 모델 다운그레이드  │  │
│  │                         │        │    $1,234 절감 가능   │  │
│  │ 남은 예산: $1,766       │        │                      │  │
│  │ 잔여 일수: 8일          │        │ ✅ 캐싱 활성화        │  │
│  └────────────────────────┘        │    $567 절감 가능     │  │
│                                     │                      │  │
│  일별 비용 추이                     │ ✅ 배치 처리 최적화   │  │
│  ┌────────────────────────┐        │    $890 절감 가능     │  │
│  │ 400│     ╱╲            │        │                      │  │
│  │ 300│    ╱  ╲  ╱╲       │        │ ✅ 로그 레벨 조정     │  │
│  │ 200│   ╱    ╲╱  ╲      │        │    $123 절감 가능     │  │
│  │ 100│  ╱          ╲     │        │                      │  │
│  │   0└────────────────    │        │ [모두 적용] [상세]   │  │
│  └────────────────────────┘        └──────────────────────┘  │
│                                                                │
│  모델별 비용 분석                   시간대별 사용 패턴        │
│  ┌────────────────────────┐        ┌──────────────────────┐  │
│  │ GPT-4      $4,234 (51%) │        │ 00-06시: ░░░░░░     │  │
│  │ Claude-3   $2,890 (35%) │        │ 06-12시: ████░░     │  │
│  │ GPT-3.5    $890 (11%)   │        │ 12-18시: ██████     │  │
│  │ Gemini     $220 (3%)    │        │ 18-24시: ███░░░     │  │
│  └────────────────────────┘        └──────────────────────┘  │
│                                                                │
│  [📊 상세 분석] [📥 리포트 다운로드] [⚙️ 예산 설정]          │
└────────────────────────────────────────────────────────────────┘
```

### 3. Organization Management View
```
┌────────────────────────────────────────────────────────────────┐
│ 👥 조직 관리                                    [+ 팀 추가]    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  조직 구조                          팀 상세 정보              │
│  ┌────────────────────────┐        ┌──────────────────────┐  │
│  │ 📁 LLMDash Inc.         │        │ 개발팀               │  │
│  │  ├─ 📂 개발부 (45명)    │        │ 관리자: 김철수       │  │
│  │  │  ├─ 백엔드팀 (15)   │        │ 멤버: 15명           │  │
│  │  │  ├─ 프론트팀 (12)   │        │                      │  │
│  │  │  └─ AI팀 (18)       │        │ 월 할당량: $5,000    │  │
│  │  ├─ 📂 영업부 (30명)    │        │ 사용량: $1,234 (25%) │  │
│  │  └─ 📂 마케팅부 (20명)  │        │ ████░░░░░░░░░░░░    │  │
│  └────────────────────────┘        │                      │  │
│                                     │ 모델별 제한:         │  │
│  승인 대기 사용자 (3)               │ • GPT-4: 1000 요청   │  │
│  ┌────────────────────────┐        │ • Claude: 무제한     │  │
│  │ 🔔 홍길동 - 개발팀 요청 │        │                      │  │
│  │ 🔔 이영희 - 영업팀 요청 │        │ 활동 로그:           │  │
│  │ 🔔 박민수 - 신규 가입   │        │ • 10:23 API 호출 523 │  │
│  │                         │        │ • 10:15 로그인       │  │
│  │ [전체 보기] [일괄 승인] │        │ • 09:45 설정 변경    │  │
│  └────────────────────────┘        └──────────────────────┘  │
│                                                                │
│  사용자 활동 요약                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 총 사용자: 95명 | 활성: 42명 | 신규: 5명 | 차단: 2명   │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 4. Analytics Dashboard
```
┌────────────────────────────────────────────────────────────────┐
│ 📈 분석 센터                            [기간: 최근 30일 ▼]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  사용량 히트맵 (시간별)                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │     00 02 04 06 08 10 12 14 16 18 20 22               │  │
│  │ 월  ░░ ░░ ░░ ▓▓ ██ ██ ██ ██ ██ ▓▓ ░░ ░░              │  │
│  │ 화  ░░ ░░ ░░ ▓▓ ██ ██ ██ ██ ██ ▓▓ ░░ ░░              │  │
│  │ 수  ░░ ░░ ░░ ▓▓ ██ ██ ██ ██ ██ ▓▓ ░░ ░░              │  │
│  │ 목  ░░ ░░ ░░ ▓▓ ██ ██ ██ ██ ██ ▓▓ ░░ ░░              │  │
│  │ 금  ░░ ░░ ░░ ▓▓ ██ ██ ██ ██ ██ ▓▓ ░░ ░░              │  │
│  │ 토  ░░ ░░ ░░ ░░ ▓▓ ▓▓ ▓▓ ░░ ░░ ░░ ░░ ░░              │  │
│  │ 일  ░░ ░░ ░░ ░░ ▓▓ ▓▓ ▓▓ ░░ ░░ ░░ ░░ ░░              │  │
│  └────────────────────────────────────────────────────────┘  │
│  ░ 낮음  ▓ 보통  █ 높음                                      │
│                                                                │
│  모델 성능 비교                     사용자 TOP 10             │
│  ┌────────────────────────┐        ┌──────────────────────┐  │
│  │ 모델     응답시간  비용  │        │ 1. 김철수  2,345 요청 │  │
│  │ GPT-4    245ms   $$$$  │        │ 2. 이영희  1,890 요청 │  │
│  │ Claude   189ms   $$$   │        │ 3. 박민수  1,567 요청 │  │
│  │ GPT-3.5  123ms   $$    │        │ 4. 최정훈  1,234 요청 │  │
│  │ Gemini   156ms   $$    │        │ 5. 정수진    987 요청 │  │
│  └────────────────────────┘        │ 6. 강민호    876 요청 │  │
│                                     │ 7. 윤서연    765 요청 │  │
│  이상 패턴 감지                     │ 8. 임재현    654 요청 │  │
│  ┌────────────────────────┐        │ 9. 조은비    543 요청 │  │
│  │ ⚠️ 비정상 트래픽 감지   │        │10. 한지우    432 요청 │  │
│  │ • 새벽 3시 급증 (342%)  │        └──────────────────────┘  │
│  │ • 특정 IP 반복 요청     │                                  │
│  │ [상세 분석]             │        [📥 데이터 내보내기]      │
│  └────────────────────────┘        [CSV] [Excel] [PDF]       │
└────────────────────────────────────────────────────────────────┘
```

### 5. Settings & Configuration
```
┌────────────────────────────────────────────────────────────────┐
│ ⚙️ 시스템 설정                                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐  ┌──────────────────────────────────────┐  │
│  │ 일반 설정    │  │ 회사 정보                            │  │
│  │ API 관리     │  │ ┌────────────────────────────────┐  │  │
│  │ 통합 설정    │  │ │ 회사명: LLMDash Inc.            │  │  │
│  │ 보안 설정    │  │ │ 플랜: Enterprise                │  │  │
│  │ 알림 설정    │  │ │ 타임존: Asia/Seoul              │  │  │
│  │ 백업/복구    │  │ │ 언어: 한국어                    │  │  │
│  └──────────────┘  │ └────────────────────────────────┘  │  │
│                     │                                      │  │
│                     │ 브랜딩 설정                          │  │
│                     │ ┌────────────────────────────────┐  │  │
│                     │ │ 로고: [업로드]                  │  │  │
│                     │ │ 주 색상: #1976d2                │  │  │
│                     │ │ 보조 색상: #dc004e              │  │  │
│                     │ └────────────────────────────────┘  │  │
│                     │                                      │  │
│                     │ 시스템 상태                          │  │
│                     │ ┌────────────────────────────────┐  │  │
│                     │ │ API 서버: ● 정상                │  │  │
│                     │ │ 데이터베이스: ● 정상            │  │  │
│                     │ │ 캐시 서버: ● 정상               │  │  │
│                     │ │ 마지막 백업: 2시간 전           │  │  │
│                     │ └────────────────────────────────┘  │  │
│                     │                                      │  │
│                     │ [변경사항 저장] [초기화]             │  │
│                     └──────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 6. Mobile Responsive Design (375px)
```
┌─────────────────┐
│ ☰ LLMDASH Admin │
├─────────────────┤
│ 오늘의 요약     │
│ ┌─────────────┐ │
│ │ 💰 $2,458   │ │
│ │ 👥 342명    │ │
│ │ 📊 45.2K    │ │
│ │ ⚡ 124ms    │ │
│ └─────────────┘ │
│                 │
│ 빠른 메뉴       │
│ [비용] [사용자] │
│ [분석] [설정]   │
│                 │
│ 실시간 알림     │
│ • 예산 80% 도달 │
│ • 승인 대기 3명 │
│                 │
│ [전체 대시보드] │
└─────────────────┘
```

### 7. Quick Action Floating Menu
```
      [➕]
    ↗  ↑  ↖
  📊  👥  💰
리포트 사용자 예산
생성  추가  설정

클릭 시 확장:
┌──────────────┐
│ 📊 리포트 생성 │
│ 👥 사용자 추가 │
│ 💰 예산 설정   │
│ 📈 분석 보기   │
│ ⚙️ 빠른 설정   │
│ 📧 알림 확인   │
└──────────────┘
```

## 🎨 UI 컴포넌트 시스템

### 1. 메트릭 카드 (Metric Card)
```typescript
interface MetricCard {
  title: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
  status?: 'good' | 'warning' | 'danger';
  icon?: string;
}

// 사용 예시
<MetricCard
  title="오늘 비용"
  value="$2,458"
  trend={{ direction: 'down', percentage: 12 }}
  status="good"
  icon="💰"
/>
```

### 2. 실시간 지표 (Live Indicator)
```typescript
interface LiveIndicator {
  label: string;
  value: number;
  max: number;
  unit: string;
  color?: 'green' | 'yellow' | 'red';
}

// 렌더링 예시
<div className="live-indicator">
  <span className="pulse-dot" />
  <span>활성 사용자: 342명</span>
  <span className="live-bar">
    [████████░░] 82%
  </span>
</div>
```

### 3. 팀 사용량 위젯 (Team Usage Widget)
```typescript
interface TeamUsage {
  team: string;
  budget: number;
  used: number;
  users: number;
  topModel: string;
}

// 표시 형식
┌─────────────────────────────┐
│ 개발팀                      │
│ 예산: $5,000 | 사용: $3,421 │
│ [████████░░░░] 68%         │
│ 👥 15명 | 🤖 GPT-4 (78%)   │
└─────────────────────────────┘
```

## 📱 모바일 대응 (간소화)

### 모바일 메뉴 (375px)
```
┌─────────────────┐
│ ☰ Admin Menu    │
├─────────────────┤
│ 📊 대시보드      │
│ 💰 비용 $2,458  │
│ 👥 사용자 342   │
│ 📈 사용량       │
│ ⚙️ 설정         │
└─────────────────┘
```

### 태블릿 뷰 (768px)
- 사이드바 자동 접기
- 주요 메트릭 2열 배치
- 차트 반응형 크기 조정

## 🚀 Quick Actions (빠른 실행)

화면 우하단 플로팅 버튼:
```
      [➕]
    ↗ ↑ ↖
  📊 👥 💰
  리포트 사용자추가 예산설정
```

## 🔧 기술 스택 및 구현 세부사항

### Frontend 기술 스택
```javascript
{
  "framework": "React 18 + TypeScript",
  "stateManagement": "Zustand",
  "routing": "React Router v6",
  "ui": "Material-UI v5",
  "charts": "Recharts + D3.js",
  "realtime": "Socket.io-client",
  "http": "Axios + React Query",
  "forms": "React Hook Form + Yup",
  "utils": "date-fns, lodash"
}
```

### Backend 기술 스택
```javascript
{
  "runtime": "Node.js 18+",
  "framework": "Express.js",
  "database": "MongoDB with Mongoose",
  "cache": "Redis",
  "realtime": "Socket.io",
  "auth": "JWT + bcrypt",
  "validation": "Joi",
  "monitoring": "Winston + Morgan"
}
```

## 📁 프로젝트 구조

### Frontend 디렉토리 구조
```
LibreChat-Admin/frontend/src/
├── components/
│   ├── common/           # 공통 컴포넌트
│   │   ├── MetricCard.tsx
│   │   ├── LiveIndicator.tsx
│   │   ├── TeamUsageWidget.tsx
│   │   ├── CostOptimizationCard.tsx
│   │   └── QuickActions.tsx
│   ├── Layout/
│   │   ├── Sidebar.tsx   # 개선된 사이드바
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── charts/          # 차트 컴포넌트
│       ├── CostTrendChart.tsx
│       ├── UsageHeatmap.tsx
│       └── ModelDistribution.tsx
├── pages/
│   ├── Dashboard/       # 대시보드 모듈
│   │   ├── index.tsx
│   │   ├── ExecutiveSummary.tsx
│   │   └── RealTimeMetrics.tsx
│   ├── CostManagement/  # 비용 관리 모듈
│   │   ├── index.tsx
│   │   ├── RealTimeCost.tsx
│   │   ├── BudgetSettings.tsx
│   │   ├── CostAnalysis.tsx
│   │   └── Invoices.tsx
│   ├── Organization/    # 조직 관리 모듈
│   │   ├── index.tsx
│   │   ├── OrgChart.tsx
│   │   ├── TeamQuotas.tsx
│   │   ├── UserApprovals.tsx
│   │   └── ActivityLog.tsx
│   ├── Analytics/       # 분석 모듈
│   │   ├── index.tsx
│   │   ├── RealtimeMonitor.tsx
│   │   ├── ModelAnalysis.tsx
│   │   ├── UsagePatterns.tsx
│   │   └── DataExport.tsx
│   └── Settings/        # 설정 모듈
│       ├── index.tsx
│       ├── GeneralSettings.tsx
│       ├── APIManagement.tsx
│       ├── Integrations.tsx
│       └── Security.tsx
├── hooks/              # Custom Hooks
│   ├── useCostData.ts
│   ├── useRealtimeMetrics.ts
│   └── useOrganization.ts
├── services/           # API 서비스
│   ├── api.ts
│   ├── costService.ts
│   ├── userService.ts
│   └── analyticsService.ts
├── stores/             # Zustand 스토어
│   ├── authStore.ts
│   ├── costStore.ts
│   ├── organizationStore.ts
│   └── settingsStore.ts
└── types/              # TypeScript 타입
    ├── cost.types.ts
    ├── user.types.ts
    └── analytics.types.ts
```

## 🗄️ 데이터베이스 스키마 설계

### 1. Organizations Collection
```javascript
{
  _id: ObjectId,
  name: String,
  plan: 'starter' | 'professional' | 'enterprise',
  settings: {
    monthlyBudget: Number,
    alertThreshold: Number,  // 예산 알림 임계값 (%)
    timezone: String,
    locale: String
  },
  billing: {
    stripeCustomerId: String,
    paymentMethod: String,
    billingEmail: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Teams Collection
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId,
  name: String,
  description: String,
  quota: {
    monthly: Number,        // 월 예산
    daily: Number,         // 일 한도
    models: {
      'gpt-4': { limit: Number, used: Number },
      'claude-3': { limit: Number, used: Number }
    }
  },
  members: [ObjectId],      // User IDs
  managers: [ObjectId],     // Manager User IDs
  status: 'active' | 'suspended',
  createdAt: Date,
  updatedAt: Date
}
```

### 3. CostTracking Collection
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId,
  teamId: ObjectId,
  userId: ObjectId,
  date: Date,
  model: String,
  endpoint: String,
  tokenCount: {
    prompt: Number,
    completion: Number,
    total: Number
  },
  cost: {
    amount: Number,
    currency: 'USD'
  },
  metadata: {
    conversationId: String,
    requestId: String,
    responseTime: Number
  },
  createdAt: Date
}
```

### 4. Budgets Collection
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId,
  teamId: ObjectId,         // Optional
  period: 'daily' | 'weekly' | 'monthly',
  amount: Number,
  spent: Number,
  alerts: [{
    threshold: Number,       // 50, 80, 100 (%)
    notified: Boolean,
    notifiedAt: Date
  }],
  startDate: Date,
  endDate: Date,
  status: 'active' | 'exceeded' | 'archived',
  createdAt: Date,
  updatedAt: Date
}
```

### 5. UsageAnalytics Collection
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId,
  date: Date,
  hourlyMetrics: [{
    hour: Number,           // 0-23
    requests: Number,
    tokens: Number,
    cost: Number,
    avgResponseTime: Number,
    errors: Number
  }],
  modelDistribution: {
    'gpt-4': { requests: Number, tokens: Number, cost: Number },
    'claude-3': { requests: Number, tokens: Number, cost: Number }
  },
  topUsers: [{
    userId: ObjectId,
    requests: Number,
    cost: Number
  }],
  topEndpoints: [{
    endpoint: String,
    requests: Number,
    cost: Number
  }],
  summary: {
    totalRequests: Number,
    totalTokens: Number,
    totalCost: Number,
    avgResponseTime: Number,
    errorRate: Number
  }
}
```

## 🔌 API 엔드포인트 설계

### Dashboard APIs
```typescript
GET /api/admin/dashboard/summary
Response: {
  metrics: {
    todayCost: number,
    activeUsers: number,
    apiCalls: number,
    avgResponseTime: number
  },
  trends: {
    cost: { value: number, change: number },
    users: { value: number, change: number }
  },
  alerts: Alert[]
}

GET /api/admin/dashboard/realtime
WebSocket: real-time metrics stream
```

### Cost Management APIs
```typescript
GET /api/admin/costs/current
Query: { period: 'day'|'week'|'month', teamId?: string }

POST /api/admin/costs/budget
Body: { 
  teamId?: string,
  amount: number,
  period: 'daily'|'monthly',
  alerts: number[]
}

GET /api/admin/costs/optimization
Response: {
  suggestions: [{
    type: string,
    description: string,
    estimatedSavings: number,
    implementation: string
  }]
}

GET /api/admin/costs/forecast
Query: { period: 'week'|'month' }
Response: {
  predicted: number,
  confidence: number,
  factors: string[]
}
```

### Organization APIs
```typescript
GET /api/admin/org/structure
Response: {
  organization: Org,
  teams: Team[],
  userCount: number
}

POST /api/admin/org/team
Body: {
  name: string,
  description: string,
  quota: { monthly: number }
}

PUT /api/admin/org/team/:teamId/quota
Body: {
  monthly: number,
  daily?: number,
  modelLimits?: Record<string, number>
}

POST /api/admin/org/user/approve
Body: {
  userId: string,
  teamId: string,
  role: string
}

GET /api/admin/org/activity
Query: { teamId?: string, userId?: string, limit: number }
Response: ActivityLog[]
```

### Analytics APIs
```typescript
GET /api/admin/analytics/usage
Query: { 
  period: string,
  groupBy: 'hour'|'day'|'model'|'team',
  teamId?: string
}

GET /api/admin/analytics/patterns
Response: {
  peakHours: number[],
  averageUsage: Record<string, number>,
  anomalies: Anomaly[]
}

POST /api/admin/analytics/export
Body: {
  format: 'csv'|'excel'|'pdf',
  period: { start: Date, end: Date },
  metrics: string[]
}
Response: { downloadUrl: string }

GET /api/admin/analytics/model-comparison
Response: {
  models: [{
    name: string,
    cost: number,
    performance: number,
    usage: number,
    recommendation: string
  }]
}
```

## 🎨 UI 컴포넌트 상세 명세

### MetricCard Component
```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  prefix?: string;           // $, %, etc
  suffix?: string;           // /month, users, etc
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
    period: string;          // "vs last week"
  };
  status?: 'success' | 'warning' | 'error' | 'neutral';
  icon?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  sparkline?: number[];      // Mini chart data
}
```

### LiveIndicator Component
```typescript
interface LiveIndicatorProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  threshold?: {
    warning: number;
    danger: number;
  };
  pulseAnimation?: boolean;
  format?: (value: number) => string;
}
```

### CostOptimizationCard Component
```typescript
interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  estimatedSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: () => void;
}

interface CostOptimizationCardProps {
  suggestions: OptimizationSuggestion[];
  currentCost: number;
  targetCost: number;
  onApplySuggestion: (id: string) => void;
  onRequestConsulting: () => void;
}
```

### TeamUsageWidget Component
```typescript
interface TeamUsageWidgetProps {
  team: {
    id: string;
    name: string;
    avatar?: string;
  };
  budget: {
    allocated: number;
    used: number;
    period: 'daily' | 'monthly';
  };
  members: {
    total: number;
    active: number;
  };
  topModel: {
    name: string;
    percentage: number;
  };
  trend: 'up' | 'down' | 'stable';
  onViewDetails: (teamId: string) => void;
  onEditQuota: (teamId: string) => void;
}
```

## 🔄 실시간 업데이트 시스템

### WebSocket Events
```typescript
// Client → Server
socket.emit('subscribe', {
  room: 'dashboard',
  metrics: ['cost', 'users', 'requests']
});

// Server → Client
socket.on('metric:update', (data: {
  type: 'cost' | 'users' | 'requests',
  value: number,
  change: number,
  timestamp: Date
}));

socket.on('alert:new', (alert: {
  id: string,
  type: 'budget' | 'error' | 'anomaly',
  severity: 'info' | 'warning' | 'critical',
  message: string,
  data: any
}));

socket.on('cost:spike', (data: {
  amount: number,
  cause: string,
  recommendation: string
}));
```

## 🔐 보안 및 권한 시스템

### Role-Based Access Control (RBAC)
```typescript
enum AdminRole {
  SUPER_ADMIN = 'super_admin',      // 모든 권한
  ORG_ADMIN = 'org_admin',          // 조직 전체 관리
  TEAM_MANAGER = 'team_manager',    // 팀 관리
  BILLING_ADMIN = 'billing_admin',  // 비용 관리
  VIEWER = 'viewer'                  // 읽기 전용
}

interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

const RolePermissions: Record<AdminRole, Permission[]> = {
  [AdminRole.SUPER_ADMIN]: [
    { resource: '*', actions: ['create', 'read', 'update', 'delete'] }
  ],
  [AdminRole.ORG_ADMIN]: [
    { resource: 'organization', actions: ['read', 'update'] },
    { resource: 'team', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'user', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'cost', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] }
  ],
  [AdminRole.TEAM_MANAGER]: [
    { resource: 'team:own', actions: ['read', 'update'] },
    { resource: 'user:team', actions: ['create', 'read', 'update'] },
    { resource: 'cost:team', actions: ['read'] }
  ],
  [AdminRole.BILLING_ADMIN]: [
    { resource: 'cost', actions: ['read', 'update'] },
    { resource: 'budget', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'invoice', actions: ['read'] }
  ],
  [AdminRole.VIEWER]: [
    { resource: '*', actions: ['read'] }
  ]
};
```

## 📈 성능 최적화 전략

### 1. 데이터 캐싱
```typescript
// Redis 캐싱 전략
const CacheStrategy = {
  dashboard: {
    key: 'dashboard:summary:{orgId}',
    ttl: 60,  // 1분
  },
  costData: {
    key: 'cost:realtime:{orgId}:{period}',
    ttl: 30,  // 30초
  },
  analytics: {
    key: 'analytics:{orgId}:{date}:{metric}',
    ttl: 300, // 5분
  }
};
```

### 2. 쿼리 최적화
```typescript
// React Query 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,      // 1분
      cacheTime: 1000 * 60 * 5,  // 5분
      refetchOnWindowFocus: false,
      retry: 2
    }
  }
});

// Infinite Query for 대용량 데이터
const useInfiniteUsageLogs = () => {
  return useInfiniteQuery({
    queryKey: ['usage', 'logs'],
    queryFn: ({ pageParam = 0 }) => fetchUsageLogs(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });
};
```

### 3. 컴포넌트 최적화
```typescript
// Memo와 useMemo 활용
const MetricCard = React.memo(({ data }: Props) => {
  const formattedValue = useMemo(() => 
    formatCurrency(data.value), [data.value]
  );
  
  return <Card>{formattedValue}</Card>;
});

// Virtual Scrolling for large lists
import { FixedSizeList } from 'react-window';

const UserList = ({ users }) => (
  <FixedSizeList
    height={600}
    itemCount={users.length}
    itemSize={50}
    width="100%"
  >
    {({ index, style }) => (
      <UserRow style={style} user={users[index]} />
    )}
  </FixedSizeList>
);
```

## 🎯 구현 우선순위 및 상세 개발 로드맵

### 🔍 현재 상태 분석
- **Frontend 기술 스택**: React 18, MUI, Zustand, React Query, Recharts 이미 설치됨
- **Backend 기술 스택**: Express, MongoDB, Socket.io 구성 완료
- **기존 페이지**: Dashboard, Users, Approvals, Usage, Settings
- **필요 작업**: 메뉴 재구성, 비용 관리 추가, UI/UX 개선

### 📋 4주 단계별 구현 계획

## **Week 1: 기반 구조 및 핵심 컴포넌트**

### Day 1-2: 공통 컴포넌트 개발
```
Phase 1.1: 기본 컴포넌트
├── components/common/MetricCard.tsx (새로 생성)
├── components/common/LiveIndicator.tsx (새로 생성)
├── components/common/TeamUsageWidget.tsx (새로 생성)
└── components/common/QuickActions.tsx (새로 생성)

작업 내용:
- [ ] MetricCard: 트렌드, 상태, 스파크라인 지원
- [ ] LiveIndicator: 실시간 펄스 애니메이션
- [ ] TeamUsageWidget: 팀별 사용량 시각화
- [ ] 스토리북 컴포넌트 테스트
```

### Day 3-4: 메뉴 시스템 개선
```
Phase 1.2: Navigation 재구성
├── Sidebar.tsx 수정
│   ├── 5대 메뉴로 재구성
│   ├── 서브메뉴 추가
│   └── 권한 기반 표시
├── App.tsx 라우팅 업데이트
└── 모바일 반응형 메뉴

작업 내용:
- [ ] 비용 관리 메뉴 추가
- [ ] Organization으로 Users/Approvals 통합
- [ ] Analytics로 Usage 확장
- [ ] 모바일 햄버거 메뉴
```

### Day 5-7: 대시보드 리뉴얼
```
Phase 1.3: Executive Dashboard
├── pages/Dashboard/index.tsx (재구성)
├── pages/Dashboard/ExecutiveSummary.tsx
├── pages/Dashboard/RealTimeMetrics.tsx
└── pages/Dashboard/AIInsights.tsx

작업 내용:
- [ ] 4개 핵심 메트릭 카드
- [ ] 30일 트렌드 차트 (Recharts)
- [ ] 팀별 사용 현황
- [ ] AI 인사이트 패널
```

## **Week 2: 비용 관리 시스템 (핵심 기능)**

### Day 8-9: Backend API 구현
```
Phase 2.1: Cost APIs
├── backend/src/models/
│   ├── CostTracking.ts (새로 생성)
│   ├── Budget.ts (새로 생성)
│   └── Organization.ts (새로 생성)
├── backend/src/routes/
│   ├── cost.ts (새로 생성)
│   └── organization.ts (새로 생성)
└── backend/src/services/
    └── costOptimization.ts (새로 생성)

작업 내용:
- [ ] 비용 추적 스키마 정의
- [ ] CRUD API 구현
- [ ] Redis 캐싱 레이어
- [ ] 집계 쿼리 최적화
```

### Day 10-11: 비용 관리 UI
```
Phase 2.2: Cost Management Pages
├── pages/CostManagement/
│   ├── index.tsx
│   ├── RealTimeCost.tsx
│   ├── BudgetSettings.tsx
│   └── CostOptimization.tsx

작업 내용:
- [ ] 예산 진행률 표시
- [ ] 일별 비용 차트
- [ ] 모델별 비용 분석
- [ ] 최적화 제안 카드
```

### Day 12-14: 실시간 업데이트
```
Phase 2.3: WebSocket Integration
├── hooks/useRealtimeMetrics.ts
├── hooks/useCostData.ts
└── services/socketService.ts

작업 내용:
- [ ] Socket.io 연결 설정
- [ ] 실시간 메트릭 스트리밍
- [ ] 비용 알림 시스템
- [ ] 예산 초과 경고
```

## **Week 3: 조직 관리 및 분석**

### Day 15-16: 조직 구조 관리
```
Phase 3.1: Organization Management
├── pages/Organization/
│   ├── index.tsx
│   ├── OrgChart.tsx (트리 뷰)
│   ├── TeamQuotas.tsx
│   └── UserApprovals.tsx

작업 내용:
- [ ] MUI TreeView로 조직도
- [ ] 팀 CRUD 기능
- [ ] 드래그앤드롭 사용자 이동
- [ ] 컨텍스트 메뉴
```

### Day 17-18: 사용자 관리 강화
```
Phase 3.2: User Management Enhancement
├── 기존 Users 페이지 확장
├── 승인 워크플로우 개선
└── 활동 로그 추가

작업 내용:
- [ ] 일괄 승인/거부
- [ ] 역할 기반 권한 설정
- [ ] 사용자 활동 타임라인
- [ ] 필터링 및 검색
```

### Day 19-21: 분석 대시보드
```
Phase 3.3: Analytics Center
├── pages/Analytics/
│   ├── index.tsx
│   ├── UsageHeatmap.tsx
│   ├── ModelComparison.tsx
│   └── PatternAnalysis.tsx

작업 내용:
- [ ] 시간별 히트맵 (D3.js)
- [ ] 모델 성능 비교표
- [ ] 이상 패턴 감지
- [ ] TOP 10 사용자 랭킹
```

## **Week 4: 최적화 및 배포**

### Day 22-23: 성능 최적화
```
Phase 4.1: Performance Optimization
├── React.memo 적용
├── useMemo/useCallback 최적화
├── Virtual Scrolling (대용량 리스트)
└── 코드 스플리팅

작업 내용:
- [ ] 번들 사이즈 최적화 (< 500KB)
- [ ] Lazy loading 구현
- [ ] React Query 캐싱 전략
- [ ] 초기 로딩 시간 < 3초
```

### Day 24-25: 데이터 내보내기
```
Phase 4.2: Export Features
├── services/exportService.ts
├── PDF 생성 (jsPDF)
├── Excel 내보내기 (xlsx)
└── CSV 다운로드

작업 내용:
- [ ] 리포트 템플릿 생성
- [ ] 차트 이미지 변환
- [ ] 백그라운드 처리
- [ ] 이메일 발송
```

### Day 26-28: 배포 및 모니터링
```
Phase 4.3: Production Deployment
├── 환경 변수 설정
├── PM2 ecosystem 구성
├── Nginx 설정 업데이트
└── 모니터링 대시보드

작업 내용:
- [ ] CI/CD 파이프라인
- [ ] 에러 트래킹 (Sentry)
- [ ] 성능 모니터링
- [ ] 백업 자동화
```

## 📊 우선순위 매트릭스

### 🔴 Critical Priority (Week 1)
| 작업 | 영향도 | 난이도 | 소요시간 |
|------|--------|--------|----------|
| 공통 컴포넌트 생성 | High | Medium | 2 days |
| 메뉴 구조 개선 | High | Low | 2 days |
| 대시보드 리뉴얼 | High | Medium | 3 days |

### 🟡 Important Priority (Week 2)
| 작업 | 영향도 | 난이도 | 소요시간 |
|------|--------|--------|----------|
| 비용 관리 백엔드 | High | High | 2 days |
| 비용 관리 프론트엔드 | High | Medium | 2 days |
| 실시간 업데이트 | Medium | High | 3 days |

### 🟢 Nice to Have (Week 3-4)
| 작업 | 영향도 | 난이도 | 소요시간 |
|------|--------|--------|----------|
| 조직 관리 | Medium | Medium | 2 days |
| 분석 강화 | Medium | High | 3 days |
| 데이터 내보내기 | Low | Low | 2 days |
| 성능 최적화 | High | Medium | 2 days |

## ✅ 각 단계별 완료 기준

### Phase 1 완료 기준
- [x] MetricCard 컴포넌트 완성 및 테스트
- [x] Sidebar 메뉴 5대 카테고리로 재구성
- [x] 대시보드 4개 위젯 정상 동작
- [x] 모바일 반응형 레이아웃 검증

### Phase 2 완료 기준
- [x] 비용 추적 API 응답 < 200ms
- [x] 예산 알림 실시간 동작
- [x] WebSocket 연결 안정성 99.9%
- [x] 최적화 제안 정확도 > 80%

### Phase 3 완료 기준
- [x] 조직 트리 뷰 드래그앤드롭
- [x] 팀 할당량 CRUD 완성
- [x] 사용량 히트맵 렌더링 < 1초
- [x] 패턴 분석 알고리즘 동작

### Phase 4 완료 기준
- [x] Lighthouse 성능 점수 > 90
- [x] 번들 사이즈 < 500KB
- [x] PDF 내보내기 < 3초
- [x] 무중단 배포 성공

## 🎯 성공 지표 (KPIs)

### 기술적 지표
- **페이지 로딩 시간**: < 3초
- **API 응답 시간**: < 200ms
- **실시간 업데이트 지연**: < 100ms
- **번들 사이즈**: < 500KB
- **코드 커버리지**: > 80%

### 비즈니스 지표
- **사용자 만족도**: > 90%
- **비용 절감률**: > 20%
- **관리 효율성**: 50% 향상
- **의사결정 속도**: 2배 향상

### 품질 지표
- **버그 발생률**: < 1%
- **가용성**: > 99.9%
- **보안 취약점**: 0개
- **문서화 완성도**: 100%

## 💻 구현 상세 가이드

### 1. MetricCard 컴포넌트 구현
```typescript
// components/common/MetricCard.tsx
import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { formatNumber, formatCurrency } from '../../utils/formatters';

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  status = 'neutral',
  icon,
  onClick,
  loading,
  sparkline
}) => {
  const formattedValue = useMemo(() => {
    if (typeof value === 'number') {
      return prefix === '$' ? formatCurrency(value) : formatNumber(value);
    }
    return value;
  }, [value, prefix]);

  const statusColor = {
    success: 'success.main',
    warning: 'warning.main',
    error: 'error.main',
    neutral: 'text.primary'
  }[status];

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={40} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      onClick={onClick}
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 3 } : {}
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {icon}
        </Box>
        
        <Typography variant="h4" color={statusColor} sx={{ my: 1 }}>
          {prefix}{formattedValue}{suffix}
        </Typography>
        
        {trend && (
          <Box display="flex" alignItems="center" gap={0.5}>
            {trend.direction === 'up' ? 
              <TrendingUp color={trend.direction === 'up' ? 'success' : 'error'} /> :
              <TrendingDown color={trend.direction === 'down' ? 'error' : 'success'} />
            }
            <Typography variant="body2" color="text.secondary">
              {trend.percentage}% {trend.period}
            </Typography>
          </Box>
        )}
        
        {sparkline && (
          <Box sx={{ mt: 1 }}>
            {/* Sparkline 차트 구현 */}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
```

### 2. 실시간 데이터 Hook 구현
```typescript
// hooks/useRealtimeMetrics.ts
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { api } from '../services/api';

interface RealtimeMetrics {
  cost: number;
  users: number;
  requests: number;
  responseTime: number;
}

export const useRealtimeMetrics = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();
  
  // 초기 데이터 로드
  const { data, isLoading, error } = useQuery({
    queryKey: ['metrics', 'realtime'],
    queryFn: () => api.get('/admin/dashboard/realtime'),
    refetchInterval: 30000, // 30초마다 폴백
  });
  
  useEffect(() => {
    // WebSocket 연결
    const newSocket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:5001', {
      auth: {
        token: localStorage.getItem('admin_token')
      }
    });
    
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      newSocket.emit('subscribe', {
        room: 'dashboard',
        metrics: ['cost', 'users', 'requests']
      });
    });
    
    // 실시간 업데이트 처리
    newSocket.on('metric:update', (update) => {
      queryClient.setQueryData(['metrics', 'realtime'], (old: any) => ({
        ...old,
        [update.type]: update.value
      }));
    });
    
    // 알림 처리
    newSocket.on('alert:new', (alert) => {
      // 알림 표시 로직
      console.log('New alert:', alert);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [queryClient]);
  
  return {
    metrics: data,
    isLoading,
    error,
    isConnected: socket?.connected || false
  };
};
```

### 3. 비용 최적화 서비스 구현
```typescript
// services/costOptimizationService.ts
import { api } from './api';

interface OptimizationRule {
  id: string;
  condition: (data: any) => boolean;
  suggestion: (data: any) => OptimizationSuggestion;
}

const optimizationRules: OptimizationRule[] = [
  {
    id: 'downgrade-model',
    condition: (data) => {
      // GPT-4 사용량이 30% 이하인 작업 확인
      return data.modelUsage['gpt-4'].simpleTaskRatio > 0.3;
    },
    suggestion: (data) => ({
      id: 'downgrade-model',
      title: 'Model Downgrade Opportunity',
      description: `${data.modelUsage['gpt-4'].simpleTaskRatio * 100}% of GPT-4 requests could use GPT-3.5`,
      estimatedSavings: data.modelUsage['gpt-4'].simpleTaskCost * 0.7,
      difficulty: 'easy',
      impact: 'high',
      actionable: true
    })
  },
  {
    id: 'enable-caching',
    condition: (data) => {
      // 반복 요청 비율 확인
      return data.repeatRequestRatio > 0.2 && !data.cachingEnabled;
    },
    suggestion: (data) => ({
      id: 'enable-caching',
      title: 'Enable Response Caching',
      description: `${data.repeatRequestRatio * 100}% of requests are duplicates`,
      estimatedSavings: data.totalCost * data.repeatRequestRatio * 0.9,
      difficulty: 'medium',
      impact: 'medium',
      actionable: true
    })
  },
  {
    id: 'batch-processing',
    condition: (data) => {
      // 야간 시간대 이동 가능한 작업 확인
      return data.nonUrgentTaskRatio > 0.15;
    },
    suggestion: (data) => ({
      id: 'batch-processing',
      title: 'Shift to Off-Peak Hours',
      description: 'Process non-urgent tasks during off-peak hours',
      estimatedSavings: data.nonUrgentTaskCost * 0.3,
      difficulty: 'medium',
      impact: 'medium',
      actionable: true
    })
  }
];

export class CostOptimizationService {
  async analyzeAndSuggest(organizationId: string) {
    // 데이터 수집
    const [usage, costs, patterns] = await Promise.all([
      api.get(`/admin/analytics/usage?orgId=${organizationId}`),
      api.get(`/admin/costs/current?orgId=${organizationId}`),
      api.get(`/admin/analytics/patterns?orgId=${organizationId}`)
    ]);
    
    const data = {
      ...usage.data,
      ...costs.data,
      ...patterns.data
    };
    
    // 규칙 적용
    const suggestions = optimizationRules
      .filter(rule => rule.condition(data))
      .map(rule => rule.suggestion(data))
      .sort((a, b) => b.estimatedSavings - a.estimatedSavings);
    
    return {
      suggestions,
      totalPotentialSavings: suggestions.reduce((sum, s) => sum + s.estimatedSavings, 0),
      currentCost: costs.data.monthly,
      optimizedCost: costs.data.monthly - suggestions.reduce((sum, s) => sum + s.estimatedSavings, 0)
    };
  }
  
  async applySuggestion(suggestionId: string, params: any) {
    return api.post('/admin/costs/optimization/apply', {
      suggestionId,
      params
    });
  }
}

export const costOptimizationService = new CostOptimizationService();
```

### 4. 조직 구조 관리 컴포넌트
```typescript
// pages/Organization/OrgChart.tsx
import React, { useState } from 'react';
import { TreeView, TreeItem } from '@mui/lab';
import { 
  ExpandMore, 
  ChevronRight, 
  Business, 
  Group, 
  Person 
} from '@mui/icons-material';
import { 
  Box, 
  Typography, 
  Chip, 
  IconButton, 
  Menu, 
  MenuItem 
} from '@mui/material';
import { useOrganization } from '../../hooks/useOrganization';

interface OrgNode {
  id: string;
  name: string;
  type: 'organization' | 'team' | 'user';
  budget?: number;
  spent?: number;
  members?: number;
  children?: OrgNode[];
}

export const OrgChart: React.FC = () => {
  const { orgStructure, loading, updateTeamQuota } = useOrganization();
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    node: OrgNode | null;
  } | null>(null);
  
  const handleContextMenu = (event: React.MouseEvent, node: OrgNode) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      node
    });
  };
  
  const renderTree = (node: OrgNode) => {
    const Icon = node.type === 'organization' ? Business :
                 node.type === 'team' ? Group : Person;
    
    return (
      <TreeItem
        key={node.id}
        nodeId={node.id}
        label={
          <Box 
            display="flex" 
            alignItems="center" 
            gap={1}
            onContextMenu={(e) => handleContextMenu(e, node)}
            sx={{ py: 1 }}
          >
            <Icon fontSize="small" />
            <Typography variant="body1">{node.name}</Typography>
            {node.members && (
              <Chip 
                label={`${node.members} members`} 
                size="small" 
                variant="outlined" 
              />
            )}
            {node.budget && (
              <Chip
                label={`$${node.spent || 0}/$${node.budget}`}
                size="small"
                color={
                  (node.spent || 0) / node.budget > 0.8 ? 'warning' : 'success'
                }
              />
            )}
          </Box>
        }
      >
        {node.children?.map(child => renderTree(child))}
      </TreeItem>
    );
  };
  
  if (loading) return <div>Loading organization structure...</div>;
  
  return (
    <Box>
      <TreeView
        defaultCollapseIcon={<ExpandMore />}
        defaultExpandIcon={<ChevronRight />}
        defaultExpanded={['root']}
      >
        {orgStructure && renderTree(orgStructure)}
      </TreeView>
      
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => {
          // Edit logic
          setContextMenu(null);
        }}>
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          // Add child logic
          setContextMenu(null);
        }}>
          Add Child
        </MenuItem>
        <MenuItem onClick={() => {
          // Set quota logic
          setContextMenu(null);
        }}>
          Set Quota
        </MenuItem>
      </Menu>
    </Box>
  );
};
```

### 5. Backend API 구현 예시
```typescript
// backend/controllers/costController.ts
import { Request, Response } from 'express';
import { CostTracking, Budget } from '../models';
import { redis } from '../config/redis';

export class CostController {
  async getCurrentCosts(req: Request, res: Response) {
    try {
      const { period = 'day', teamId } = req.query;
      const orgId = req.user.organizationId;
      
      // 캐시 확인
      const cacheKey = `cost:${orgId}:${period}:${teamId || 'all'}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // 기간 계산
      const now = new Date();
      const startDate = period === 'day' ? 
        new Date(now.setHours(0, 0, 0, 0)) :
        period === 'week' ?
        new Date(now.setDate(now.getDate() - 7)) :
        new Date(now.setMonth(now.getMonth() - 1));
      
      // 쿼리 빌드
      const query: any = {
        organizationId: orgId,
        date: { $gte: startDate }
      };
      if (teamId) query.teamId = teamId;
      
      // 집계 쿼리
      const costs = await CostTracking.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              model: '$model'
            },
            totalCost: { $sum: '$cost.amount' },
            totalTokens: { $sum: '$tokenCount.total' },
            requestCount: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            models: {
              $push: {
                model: '$_id.model',
                cost: '$totalCost',
                tokens: '$totalTokens',
                requests: '$requestCount'
              }
            },
            dailyTotal: { $sum: '$totalCost' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      // 예산 정보 추가
      const budget = await Budget.findOne({
        organizationId: orgId,
        teamId,
        period: period === 'day' ? 'daily' : 'monthly',
        status: 'active'
      });
      
      const result = {
        costs,
        total: costs.reduce((sum, day) => sum + day.dailyTotal, 0),
        budget: budget ? {
          amount: budget.amount,
          spent: budget.spent,
          remaining: budget.amount - budget.spent,
          percentage: (budget.spent / budget.amount) * 100
        } : null,
        period,
        lastUpdated: new Date()
      };
      
      // 캐시 저장
      await redis.setex(cacheKey, 30, JSON.stringify(result));
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching costs:', error);
      res.status(500).json({ error: 'Failed to fetch cost data' });
    }
  }
  
  async getOptimizationSuggestions(req: Request, res: Response) {
    try {
      const orgId = req.user.organizationId;
      
      // 최근 30일 데이터 분석
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const analysis = await CostTracking.aggregate([
        {
          $match: {
            organizationId: orgId,
            date: { $gte: thirtyDaysAgo }
          }
        },
        {
          $facet: {
            modelUsage: [
              {
                $group: {
                  _id: '$model',
                  totalCost: { $sum: '$cost.amount' },
                  avgTokens: { $avg: '$tokenCount.total' },
                  requestCount: { $sum: 1 }
                }
              }
            ],
            hourlyPattern: [
              {
                $group: {
                  _id: { $hour: '$date' },
                  avgCost: { $avg: '$cost.amount' },
                  requestCount: { $sum: 1 }
                }
              }
            ],
            userPattern: [
              {
                $group: {
                  _id: '$userId',
                  totalCost: { $sum: '$cost.amount' },
                  requestCount: { $sum: 1 }
                }
              },
              { $sort: { totalCost: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ]);
      
      // 최적화 제안 생성
      const suggestions = [];
      
      // GPT-4 사용 최적화
      const gpt4Usage = analysis[0].modelUsage.find(m => m._id === 'gpt-4');
      if (gpt4Usage && gpt4Usage.avgTokens < 500) {
        suggestions.push({
          type: 'model-optimization',
          title: 'Consider using GPT-3.5 for shorter responses',
          description: `Average GPT-4 request uses only ${gpt4Usage.avgTokens} tokens`,
          estimatedSavings: gpt4Usage.totalCost * 0.7,
          implementation: 'automatic'
        });
      }
      
      // 시간대 최적화
      const peakHours = analysis[0].hourlyPattern
        .filter(h => h.avgCost > analysis[0].hourlyPattern.reduce((a, b) => a + b.avgCost, 0) / 24 * 1.5);
      
      if (peakHours.length > 0) {
        suggestions.push({
          type: 'scheduling-optimization',
          title: 'Shift non-urgent tasks to off-peak hours',
          description: `Peak usage at ${peakHours.map(h => h._id).join(', ')}:00`,
          estimatedSavings: peakHours.reduce((sum, h) => sum + h.avgCost * 0.2, 0),
          implementation: 'manual'
        });
      }
      
      res.json({ suggestions });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      res.status(500).json({ error: 'Failed to generate optimization suggestions' });
    }
  }
}
```

## 🔒 보안 고려사항

### 1. API 보안
- JWT 토큰 검증
- Rate limiting (express-rate-limit)
- CORS 설정
- Input validation (Joi)
- SQL Injection 방지 (Mongoose parameterized queries)

### 2. 데이터 보안
- 민감 정보 암호화 (bcrypt, crypto)
- PII 마스킹
- 감사 로그
- 데이터 접근 권한 관리

### 3. 인프라 보안
- HTTPS 강제
- Security headers (helmet)
- DDoS 방어
- 정기 보안 업데이트

## 📊 모니터링 및 로깅

### 1. Application Monitoring
```typescript
// Winston 로깅 설정
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// APM 통합 (예: New Relic, DataDog)
```

### 2. 성능 모니터링
- Response time tracking
- Database query performance
- API endpoint latency
- Memory usage monitoring

### 3. 비즈니스 메트릭
- 일일 활성 사용자 (DAU)
- 월간 반복 수익 (MRR)
- 고객 이탈률
- API 사용량 트렌드

## 🚀 MVP 실행 계획 (최소 수정 전략)

### 📊 현재 구현 상태
- **기존 메뉴**: Dashboard, Users, Approvals, Usage, Settings (5개)
- **기술 스택**: React + TypeScript + MUI + React Query + Express + MongoDB
- **개발 환경**: 이미 구축 완료

### 🎯 MVP 핵심 목표
1. **메뉴 통합**: 5개 → 4개로 단순화
2. **비용 가시성**: LLM 모델 가격 설정 및 실시간 비용 추적
3. **권한 관리**: 모델별 사용 권한 제어
4. **개발 기간**: 1주일 내 배포

---

## 📋 MVP 메뉴 구조 (4개 메뉴)

### 1. Dashboard (기존 유지 + 강화)
```typescript
// 추가할 위젯
- MetricCard: 오늘의 비용
- LiveIndicator: 실시간 사용자
- AlertPanel: 주요 알림
- QuickActions: 빠른 실행
```

### 2. Cost & Usage (통합 신규)
```typescript
// Usage 페이지 확장
- 기존 사용량 차트 재활용
- 비용 요약 카드 추가
- 모델별 비용 분석
- 예산 진행률 표시
```

### 3. Organization (Users + Approvals 통합)
```typescript
// 탭 구조로 통합
<Tabs>
  <Tab label="사용자 목록" />     // 기존 Users
  <Tab label="승인 대기" badge={3} /> // 기존 Approvals  
  <Tab label="팀 관리" />          // 신규 (Phase 2)
</Tabs>
```

### 4. Settings (기존 + 모델 관리 추가)
```typescript
// 서브메뉴 추가
- 일반 설정 (기존)
- 모델 관리 (신규) ⭐
  - 가격 설정
  - 권한 관리
  - 사용 정책
- API 키 관리 (기존)
- 보안 (기존)
```

---

## 💰 LLM 모델 가격 관리 시스템

### 데이터베이스 스키마

#### ModelPricing Collection
```javascript
{
  modelId: String,           // "gpt-4", "claude-3"
  provider: String,          // "openai", "anthropic"  
  displayName: String,
  pricing: {
    input: Number,          // $0.03 per 1K tokens
    output: Number,         // $0.06 per 1K tokens
    currency: "USD",
    unit: "1K tokens"
  },
  status: {
    enabled: Boolean,       // 활성화 여부
    available: Boolean      // API 가용성
  },
  limits: {
    rateLimit: Number,      // 분당 요청
    dailyLimit: Number,     // 일일 한도
  },
  updatedAt: Date,
  updatedBy: String
}
```

#### ModelPermissions Collection  
```javascript
{
  modelId: String,
  organizationId: ObjectId,
  defaultPermissions: {
    enabled: Boolean,
    allowedForNewUsers: Boolean
  },
  teamPermissions: [{
    teamId: ObjectId,
    enabled: Boolean,
    limits: {
      dailyTokens: Number,
      monthlyBudget: Number
    }
  }],
  userPermissions: [{
    userId: ObjectId,
    enabled: Boolean,
    customLimits: {...}
  }]
}
```

### UI 구현 (모델 관리 화면)

#### 모델 가격 테이블
```
┌────────────────────────────────────────────────────┐
│ 🤖 모델 관리                      [+ 모델 추가]   │
├────────────────────────────────────────────────────┤
│ □ 모델명      입력가격   출력가격   상태   작업   │
├────────────────────────────────────────────────────┤
│ ☑ GPT-4      $0.03     $0.06     🟢 활성  [수정] │
│ ☑ Claude-3   $0.025    $0.05     🟢 활성  [수정] │
│ ☐ GPT-3.5    $0.001    $0.002    🔴 비활성 [수정] │
└────────────────────────────────────────────────────┘
```

#### 권한 설정 모달
```
┌─────────────────────────────────────────────┐
│ 🔐 모델 권한 설정 - GPT-4              [X] │
├─────────────────────────────────────────────┤
│ 전체 상태: [🟢 활성화] [🔴 비활성화]      │
│                                             │
│ 팀별 권한:                                  │
│ • 개발팀    ✅  100K tokens/day  [수정]   │
│ • 영업팀    ✅   50K tokens/day  [수정]   │
│ • 마케팅    ❌   -               [수정]   │
│                                             │
│ [저장] [취소]                               │
└─────────────────────────────────────────────┘
```

---

## 🗓️ 단계별 구현 계획

### Week 1: MVP 구현

#### Day 1-2: 메뉴 통합 및 기본 구조
**수정 파일: 4개**
```
✅ Sidebar.tsx - 메뉴 아이템 변경
✅ App.tsx - 라우트 수정
✅ pages/CostUsage/index.tsx - 신규 생성
✅ pages/Organization/index.tsx - 신규 생성
```

**작업 내용:**
- [ ] 메뉴 5개 → 4개로 통합
- [ ] Cost & Usage 페이지 생성 (기존 Usage 확장)
- [ ] Organization 페이지 생성 (Users + Approvals 통합)
- [ ] 탭 컴포넌트 구현

#### Day 3-4: 모델 가격 관리
**수정 파일: 6개**
```
✅ models/ModelPricing.ts - 스키마 생성
✅ routes/modelManagement.ts - API 라우트
✅ pages/Settings/ModelManagement.tsx - UI
✅ components/ModelPricingTable.tsx - 테이블
✅ components/PricingEditModal.tsx - 모달
✅ services/modelService.ts - API 서비스
```

**작업 내용:**
- [ ] ModelPricing 스키마 정의
- [ ] CRUD API 구현
- [ ] 가격 설정 UI 구현
- [ ] 모델 활성화/비활성화 기능

#### Day 5-6: 권한 관리 및 비용 계산
**수정 파일: 5개**
```
✅ models/ModelPermissions.ts - 스키마
✅ middleware/checkModelPermission.ts - 권한 체크
✅ components/PermissionModal.tsx - 권한 UI
✅ hooks/useRealtimeCost.ts - 실시간 비용
✅ pages/Dashboard/index.tsx - 대시보드 위젯 추가
```

**작업 내용:**
- [ ] ModelPermissions 스키마 정의
- [ ] 팀/사용자별 권한 관리
- [ ] 실시간 비용 계산 API
- [ ] 대시보드에 비용 위젯 추가

#### Day 7: 테스트 및 배포
- [ ] 통합 테스트
- [ ] 버그 수정
- [ ] PM2 배포
- [ ] 문서 업데이트

---

## 📊 구현 우선순위 매트릭스

### 🔴 필수 (Must Have) - 3일
| 기능 | 난이도 | 소요시간 | 담당 |
|------|--------|----------|------|
| 메뉴 통합 | Low | 4h | Frontend |
| Cost & Usage 페이지 | Medium | 8h | Frontend |
| 모델 가격 설정 | Medium | 8h | Full Stack |
| 모델 활성화/비활성화 | Low | 4h | Backend |

### 🟡 중요 (Should Have) - 2일
| 기능 | 난이도 | 소요시간 | 담당 |
|------|--------|----------|------|
| Organization 통합 | Medium | 6h | Frontend |
| 팀별 권한 관리 | High | 8h | Full Stack |
| 실시간 비용 계산 | Medium | 6h | Backend |
| 대시보드 위젯 | Low | 4h | Frontend |

### 🟢 선택 (Nice to Have) - 2일
| 기능 | 난이도 | 소요시간 | 담당 |
|------|--------|----------|------|
| 가격 히스토리 | Low | 4h | Backend |
| 사용자별 예외 권한 | Medium | 6h | Full Stack |
| 비용 최적화 제안 | High | 8h | Backend |
| 데이터 내보내기 | Low | 4h | Frontend |

---

## ✅ 체크리스트

### Frontend
- [ ] Sidebar 메뉴 아이템 수정
- [ ] Cost & Usage 페이지 구현
- [ ] Organization 페이지 구현
- [ ] 모델 관리 UI 구현
- [ ] 권한 설정 모달 구현
- [ ] 대시보드 비용 위젯 추가

### Backend
- [ ] ModelPricing 스키마 생성
- [ ] ModelPermissions 스키마 생성
- [ ] 모델 관리 API 구현
- [ ] 권한 체크 미들웨어 구현
- [ ] 실시간 비용 계산 API 구현
- [ ] WebSocket 이벤트 추가

### Database
- [ ] ModelPricing 컬렉션 생성
- [ ] ModelPermissions 컬렉션 생성
- [ ] 인덱스 최적화
- [ ] 초기 데이터 시딩

### Testing
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 수행
- [ ] 성능 테스트
- [ ] 보안 점검

### Deployment
- [ ] 환경 변수 설정
- [ ] PM2 설정 업데이트
- [ ] Nginx 설정 확인
- [ ] 모니터링 설정

---

## 📈 성공 지표

### 기술적 지표
- **코드 재사용률**: 70% 이상
- **수정 파일**: 20개 이내
- **개발 기간**: 7일 이내
- **번들 크기 증가**: 10% 이내

### 비즈니스 지표
- **비용 가시성**: 100% 달성
- **권한 제어**: 팀/사용자 레벨
- **실시간 추적**: 1초 이내 업데이트
- **관리 효율**: 50% 향상

---

## 🚀 배포 전략

### 1. CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy Admin Dashboard

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          npm ci
          npm test
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          npm run build
          pm2 restart admin-backend
          pm2 restart admin-frontend
```

### 2. 환경 구성
- Development: localhost
- Staging: staging.llmdash.com
- Production: www.llmdash.com

### 3. 롤백 전략
- Blue-Green deployment
- Feature flags
- Database migration rollback scripts

---

*이 명세서는 LibreChat Enterprise Admin Dashboard의 완전한 구현을 위한 상세 가이드입니다.*
*각 단계별로 체크리스트를 확인하며 진행하시기 바랍니다.*