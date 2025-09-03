# Cursor 통합 설정 가이드

## 🚨 문제: "Access to private networks is forbidden"

Cursor는 보안상 localhost 및 private network 접근을 제한합니다. 

## 해결 방법

### 옵션 1: ngrok 사용 (추천) ✅

1. **ngrok 계정 생성** (무료)
   - https://dashboard.ngrok.com/signup 접속
   - 계정 생성

2. **authtoken 설정**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

3. **Relay Server 노출**
   ```bash
   ngrok http 4000
   ```

4. **Cursor 설정**
   - Base URL: `https://xxxx-xx-xx.ngrok-free.app/v1` (ngrok이 제공하는 URL)
   - API Key: `lc_dev_team1_cursor_x8k9j2h4`

### 옵션 2: 로컬 네트워크 IP 사용 🏠

1. **로컬 IP 확인**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   예: `192.168.1.100`

2. **서버 재시작** (모든 인터페이스에서 리스닝)
   ```bash
   # .env 파일 수정
   HOST=0.0.0.0
   ```

3. **Cursor 설정**
   - Base URL: `http://192.168.1.100:4000/v1`
   - API Key: `lc_dev_team1_cursor_x8k9j2h4`

### 옵션 3: Cloudflare Tunnel (무료) ☁️

1. **Cloudflare Tunnel 설치**
   ```bash
   brew install cloudflared
   ```

2. **터널 실행**
   ```bash
   cloudflared tunnel --url http://localhost:4000
   ```

3. **Cursor 설정**
   - Base URL: `https://xxxx.trycloudflare.com/v1`
   - API Key: `lc_dev_team1_cursor_x8k9j2h4`

### 옵션 4: 실제 서버 배포 🚀

1. **VPS/Cloud 서버에 배포**
   - AWS EC2, DigitalOcean, Vercel 등

2. **HTTPS 설정 필수**
   - Let's Encrypt SSL 인증서

3. **Cursor 설정**
   - Base URL: `https://your-domain.com/v1`
   - API Key: `lc_dev_team1_cursor_x8k9j2h4`

## 테스트 방법

설정 완료 후:
1. Cursor 재시작
2. Cmd+K로 채팅 열기
3. 간단한 질문 입력
4. Relay Server 로그 확인

## 디버깅

서버 로그 확인:
```bash
# Relay Server 콘솔에서
[REQUEST] POST /v1/chat/completions
[AUTH] Valid request from: team=team1, user=cursor
[USAGE] team1/cursor - Tokens: 32 - Latency: 1650ms
```

## 권장 사항

**개발 환경**: ngrok 또는 Cloudflare Tunnel
**프로덕션**: 실제 서버 배포 with HTTPS

---

## 빠른 시작 (Cloudflare Tunnel)

```bash
# 1. Cloudflare tunnel 설치 및 실행
brew install cloudflared
cloudflared tunnel --url http://localhost:4000

# 2. 생성된 URL 복사 (예: https://xxx.trycloudflare.com)

# 3. Cursor Settings에서:
# Base URL: https://xxx.trycloudflare.com/v1
# API Key: lc_dev_team1_cursor_x8k9j2h4
```