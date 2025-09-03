# API Relay Server MVP for Cursor

## 🎯 목적
Cursor IDE에서 사용하는 LLM API 호출을 중계하여 사용량 추적 및 통계를 수집하는 서버

## 🚀 Quick Start

### 1. 환경 설정
```bash
# .env 파일 수정
OPENAI_API_KEY=your-actual-openai-api-key
```

### 2. 서버 시작
```bash
# 개발 모드로 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

### 3. Cursor 설정

Cursor IDE에서:
1. Settings 열기 (Cmd+, or Ctrl+,)
2. "OpenAI" 검색
3. 다음 설정 입력:
   - **Base URL**: `http://localhost:4000/v1`
   - **API Key**: `lc_dev_team1_cursor_x8k9j2h4`

## 📊 기능

### ✅ 구현된 기능
- ✅ OpenAI 호환 API 프록시
- ✅ SSE 스트리밍 지원 (Cursor 자동완성/채팅)
- ✅ API 키 인증
- ✅ 사용량 추적 (요청, 토큰, 비용)
- ✅ 실시간 로깅
- ✅ 모델 필터링

### 🔄 추가 예정
- ⏳ MongoDB 연동
- ⏳ Redis 캐싱
- ⏳ Admin Dashboard 통합
- ⏳ Anthropic Claude 지원
- ⏳ 고급 Rate Limiting

## 🧪 테스트

```bash
# 테스트 스크립트 실행
./test-relay.sh

# 수동 테스트
curl http://localhost:4000/health
```

## 📁 프로젝트 구조

```
api-relay-server/
├── src/
│   ├── server.ts           # 메인 서버
│   ├── handlers/           # API 핸들러
│   │   ├── chatCompletions.ts  # 채팅/완성 프록시
│   │   └── models.ts           # 모델 목록
│   └── middleware/         # 미들웨어
│       ├── auth.ts         # API 키 인증
│       ├── usage.ts        # 사용량 추적
│       └── error.ts        # 에러 처리
├── .env                    # 환경 변수
├── package.json
└── tsconfig.json
```

## 📈 사용량 통계

서버는 10개 요청마다 자동으로 통계를 출력합니다:

```
╔═══════════════════════════════════════════════════════╗
║                    USAGE STATISTICS                   ║
╠═══════════════════════════════════════════════════════╣
║  Total Requests: 10                                   ║
║  Total Tokens:   1523                                 ║
║  Total Cost:     $0.0234                              ║
║  Avg Latency:    234ms                                ║
╚═══════════════════════════════════════════════════════╝
```

## 🔐 API 키 형식

```
lc_[환경]_[팀]_[사용자]_[랜덤]
예: lc_dev_team1_cursor_x8k9j2h4
```

## ⚡ 성능

- **레이턴시**: < 50ms 추가 (로컬)
- **스트리밍**: 실시간 SSE 지원
- **동시 요청**: 100+ 지원

## 🐛 문제 해결

### Cursor에서 연결 안 됨
1. 서버 실행 확인: `curl http://localhost:4000/health`
2. Base URL 끝에 `/v1` 포함 확인
3. API 키가 `.env`의 `RELAY_API_KEYS`에 포함되어 있는지 확인

### 스트리밍이 작동하지 않음
1. OpenAI API 키가 유효한지 확인
2. 콘솔에서 `[STREAM]` 로그 확인

## 📝 로그 예시

```
[AUTH] Valid request from: team=team1, user=cursor
[RELAY] Chat completion request: { model: 'gpt-3.5-turbo', messages: 2, stream: true }
[STREAM] Completed. Total chunks sent.
[USAGE] team1/cursor - /v1/chat/completions - gpt-3.5-turbo - Tokens: 156 - Latency: 1234ms
```

## 🚦 다음 단계

1. **MongoDB 연동**: 영구 사용량 저장
2. **Admin Dashboard**: 통계 시각화
3. **캐싱**: 자동완성 응답 캐싱
4. **멀티 프로바이더**: Claude, Gemini 추가

## 📄 라이센스

ISC