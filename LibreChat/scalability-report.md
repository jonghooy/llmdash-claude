# LibreChat 확장성 검증 보고서

## 📊 검증 결과 요약

LibreChat는 **50-100명** 수준의 동시 접속은 처리 가능하나, **500명** 이상의 대규모 동시 접속을 위해서는 추가적인 최적화와 인프라 개선이 필요합니다.

## ✅ 현재 구현된 확장성 기능

### 1. **PM2 클러스터 모드 지원**
- `ecosystem.config.js`에 4개 워커 프로세스 설정
- 자동 재시작 및 메모리 관리 (2GB 제한)
- CPU 코어 활용한 수평 확장 가능

### 2. **MongoDB 연결 풀링**
- 환경변수를 통한 연결 풀 크기 제어
  - `MONGO_MAX_POOL_SIZE`: 최대 연결 수
  - `MONGO_MIN_POOL_SIZE`: 최소 연결 수
  - `MONGO_MAX_CONNECTING`: 동시 연결 시도 수

### 3. **Redis 캐싱 시스템**
- 세션 스토어 (express-session + connect-redis)
- Rate limiting 캐시
- 일반 데이터 캐싱 (Keyv)
- SSE 연결 상태 관리

### 4. **Rate Limiting**
- IP 기반 및 사용자 기반 제한
- 파일 업로드, TTS/STT, 대화 임포트 등 리소스별 제한
- Redis 기반 분산 rate limiting

### 5. **SSE (Server-Sent Events)**
- Keep-alive 연결 유지
- 청크 단위 스트리밍
- X-Accel-Buffering 비활성화로 실시간 전송

## ⚠️ 병목 지점 및 제한사항

### 1. **단일 서버 구조**
- 기본적으로 단일 Node.js 프로세스
- PM2 사용 시에도 단일 머신 제약

### 2. **SSE 연결 제한**
- 브라우저당 SSE 연결 수 제한 (보통 6개)
- 장시간 연결 유지로 인한 리소스 점유

### 3. **LLM API 병목**
- 외부 LLM 서비스의 rate limit
- API 응답 시간에 따른 대기 시간

### 4. **메모리 사용량**
- Agent 및 Tool 로딩 시 메모리 증가
- 대화 컨텍스트 누적

## 🔧 권장 개선사항

### 50-100명 동시 접속 (현재 가능)
```bash
# PM2 클러스터 모드 실행
pm2 start ecosystem.config.js --env production

# MongoDB 연결 풀 설정
MONGO_MAX_POOL_SIZE=100
MONGO_MIN_POOL_SIZE=10

# Redis 활성화
USE_REDIS=true
```

### 500명+ 동시 접속 (추가 작업 필요)

#### 1. **인프라 확장**
```yaml
# Docker Swarm / Kubernetes 구성
services:
  librechat:
    replicas: 10  # 10개 인스턴스
    resources:
      limits:
        memory: 2G
        cpus: '2'
```

#### 2. **로드 밸런서 구성**
```nginx
# Nginx 설정 예시
upstream librechat_backend {
    least_conn;
    server backend1:3080;
    server backend2:3080;
    server backend3:3080;
    keepalive 32;
}
```

#### 3. **데이터베이스 최적화**
```javascript
// MongoDB 연결 풀 확장
MONGO_MAX_POOL_SIZE=500
MONGO_MIN_POOL_SIZE=50
MONGO_MAX_CONNECTING=50

// MongoDB 레플리카 셋 구성 권장
```

#### 4. **Redis 클러스터**
```bash
# Redis Sentinel 또는 Redis Cluster 구성
redis-cli --cluster create node1:6379 node2:6379 node3:6379
```

#### 5. **SSE → WebSocket 전환 고려**
```javascript
// Socket.io 구현으로 전환
const io = require('socket.io')(server, {
  transports: ['websocket'],
  perMessageDeflate: true
});
```

## 📈 성능 메트릭

### 현재 예상 처리 능력
- **50명**: ✅ 안정적 운영 가능
- **100명**: ✅ PM2 클러스터 모드로 가능
- **500명**: ⚠️ 추가 최적화 필요
- **1000명+**: ❌ 대규모 아키텍처 변경 필요

### 리소스 요구사항
| 동시 접속 | CPU | RAM | MongoDB | Redis |
|---------|-----|-----|---------|-------|
| 50명 | 4 cores | 8GB | 100 connections | 2GB |
| 100명 | 8 cores | 16GB | 200 connections | 4GB |
| 500명 | 16+ cores | 32GB+ | 500+ connections | 8GB+ |

## 🚀 즉시 적용 가능한 최적화

1. **PM2 클러스터 인스턴스 증가**
```javascript
// ecosystem.config.js
instances: 'max',  // CPU 코어 수만큼 자동 설정
```

2. **MongoDB 인덱스 최적화**
```javascript
// 자주 조회되는 필드에 인덱스 추가
db.conversations.createIndex({ userId: 1, createdAt: -1 })
db.messages.createIndex({ conversationId: 1, createdAt: 1 })
```

3. **Rate Limiting 강화**
```javascript
// 사용자별 분당 요청 제한
RATE_LIMIT_USER_MAX=20
RATE_LIMIT_USER_WINDOW=1
```

## 결론

LibreChat는 기본적인 확장성 기능을 갖추고 있으나, 대규모 서비스를 위해서는:
1. **수평 확장** (multiple servers)
2. **로드 밸런싱**
3. **데이터베이스 클러스터링**
4. **캐싱 레이어 강화**
5. **CDN 및 정적 자원 분리**

등의 추가 작업이 필요합니다.