# Claude 모델 지원 추가됨! 🎉

## 지원 모델
API Relay Server가 이제 OpenAI와 Anthropic Claude 모델을 모두 지원합니다.

### OpenAI 모델
- gpt-4
- gpt-4-turbo-preview
- gpt-3.5-turbo
- gpt-3.5-turbo-16k

### Anthropic Claude 모델
- claude-3-5-sonnet
- claude-3-5-sonnet-20241022
- claude-3-opus
- claude-3-sonnet
- claude-3-haiku

## 작동 방식
1. **자동 라우팅**: 모델명에 "claude"가 포함되면 자동으로 Anthropic API로 라우팅
2. **형식 변환**: OpenAI 형식 ↔ Anthropic 형식 자동 변환
3. **스트리밍 지원**: 두 공급자 모두 SSE 스트리밍 지원
4. **통합 인터페이스**: Cursor는 OpenAI API만 알면 됨

## Cursor 설정
변경 없음! 동일한 설정으로 Claude 모델 사용 가능:
- **Base URL:** `http://localhost:4000/v1` 
- **API Key:** `lc_dev_team1_cursor_x8k9j2h4`

## 테스트 결과
```bash
# Claude 테스트
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer lc_dev_team1_cursor_x8k9j2h4" \
  -d '{
    "model": "claude-3-5-sonnet",
    "messages": [{"role": "user", "content": "Say hello in Korean"}],
    "stream": false
  }'

# 응답
"안녕하세요 (Annyeong-haseyo) - This is the formal/polite way to say \"hello\" in Korean"
```

## 로그 예시
```
[RELAY] Chat completion request: {
  model: 'claude-3-5-sonnet',
  messages: 1,
  stream: false,
  team: 'team1',
  user: 'cursor'
}
[RELAY] Routing to Anthropic for model: claude-3-5-sonnet
[USAGE] team1/cursor - /v1/chat/completions - claude-3-5-sonnet - Tokens: 78 - Latency: 2409ms
```

## 주의사항
1. **API 키 필요**: `.env`에 `ANTHROPIC_API_KEY` 설정 필요
2. **토큰 계산**: Claude와 GPT의 토큰 계산 방식이 다를 수 있음
3. **모델명 정확히**: Cursor에서 정확한 모델명 사용 필요

## Cursor에서 Claude 사용하기
1. Cursor Settings (Cmd+,)
2. Model 선택 드롭다운
3. "claude-3-5-sonnet" 선택 (목록에 표시됨)
4. 대화 시작!

이제 Cursor에서 GPT와 Claude를 자유롭게 전환하며 사용할 수 있습니다!