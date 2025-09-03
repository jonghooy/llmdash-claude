# 50명 사용자 서비스를 위한 확장 가능한 아키텍처 구축 계획

## 📋 현재 상태 분석

### 현재 문제점
1. **단일 프로세스**: CPU 1개 코어만 사용
2. **세션 관리**: 메모리 기반으로 서버 재시작시 세션 손실
3. **연결 제한**: MongoDB 기본 연결 풀 (100개)
4. **동시 메시지 제한**: 사용자당 2개로 제한
5. **확장성 부재**: 수평 확장 불가능

### 목표 아키텍처 (50명 → 500명 → 5000명)
```
현재: 단일 서버
목표: Docker + PM2 + Redis + Nginx
미래: Kubernetes + 마이크로서비스
```

## 🎯 구현 전략

### Phase 1: 기본 인프라 (50명 지원)
- PM2 클러스터링 (4 workers)
- Redis 세션 스토어
- MongoDB 연결 풀 최적화
- 기본 모니터링

### Phase 2: 확장 준비 (향후 500명)
- Docker 컨테이너화
- Nginx 로드 밸런싱
- 자동 스케일링 준비
- 중앙 로깅

## 🔧 단계별 구현 계획

## Step 1: MongoDB 연결 풀 최적화

### 1.1 현재 설정 확인
```bash
# .env 파일 현재 상태
MONGO_URI=mongodb://127.0.0.1:27017/LibreChat
# 연결 풀 설정 없음
```

### 1.2 최적화된 설정
```bash
# .env 파일 수정
MONGO_URI=mongodb://127.0.0.1:27017/LibreChat
MONGO_MAX_POOL_SIZE=50        # 50명 기준
MONGO_MIN_POOL_SIZE=10        # 최소 연결
MONGO_MAX_CONNECTING=5         # 동시 연결 수
MONGO_MAX_IDLE_TIME_MS=60000  # 유휴 시간
MONGO_WAIT_QUEUE_TIMEOUT_MS=5000
```

## Step 2: Rate Limiting 조정

### 2.1 현재 제한 사항
```bash
# 너무 제한적인 설정
CONCURRENT_MESSAGE_MAX=2
MESSAGE_IP_MAX=40
MESSAGE_USER_MAX=40
```

### 2.2 50명을 위한 조정
```bash
# .env 수정
CONCURRENT_MESSAGE_MAX=5       # 동시 메시지 5개
MESSAGE_IP_MAX=100            # IP당 분당 100개
MESSAGE_USER_MAX=60           # 사용자당 분당 60개
LOGIN_MAX=20                  # 로그인 시도 20회
REGISTER_MAX=10               # 회원가입 10회
```

## Step 3: PM2 클러스터 설정

### 3.1 PM2 설정 파일 생성
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'librechat',
    script: './api/server/index.js',
    instances: 4,                    // 4개 워커 프로세스
    exec_mode: 'cluster',            // 클러스터 모드
    watch: false,                    // 프로덕션에서는 false
    max_memory_restart: '1G',        // 메모리 제한
    
    env: {
      NODE_ENV: 'production',
      PORT: 3080
    },
    
    // 무중단 재시작
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // 에러 처리
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    time: true,
    
    // 헬스체크
    min_uptime: '10s',
    max_restarts: 10,
  }]
};
```

### 3.2 PM2 시작 스크립트
```bash
#!/bin/bash
# start-pm2.sh

# PM2 설치 확인
npm install -g pm2

# 기존 프로세스 정리
pm2 delete all

# 로그 디렉토리 생성
mkdir -p logs

# PM2 시작
pm2 start ecosystem.config.js

# 자동 시작 설정
pm2 startup
pm2 save

# 모니터링 시작
pm2 monit
```

## Step 4: Redis 세션 스토어 구성

### 4.1 Redis 설치 및 설정
```bash
# Redis 설치 (macOS)
brew install redis
brew services start redis

# Redis 설정 파일
# /usr/local/etc/redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 4.2 LibreChat Redis 설정
```bash
# .env 추가
USE_REDIS=true
REDIS_URI=redis://127.0.0.1:6379
REDIS_KEY_PREFIX=librechat_50
REDIS_MAX_LISTENERS=50
```

## Step 5: Docker 컨테이너화

### 5.1 Dockerfile 최적화
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 캐싱
COPY package*.json ./
COPY api/package*.json ./api/
COPY client/package*.json ./client/
COPY packages/*/package*.json ./packages/

RUN npm ci --only=production

# 소스 복사 및 빌드
COPY . .
RUN npm run build:data-provider && \
    npm run build:data-schemas && \
    npm run build:api && \
    npm run build:client-package && \
    npm run frontend

# 실행 이미지
FROM node:20-alpine

WORKDIR /app

# PM2 설치
RUN npm install -g pm2

# 빌드된 파일 복사
COPY --from=builder /app .

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3080/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

EXPOSE 3080

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```

### 5.2 Docker Compose 설정
```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - librechat-network

  app:
    build: .
    ports:
      - "3080-3083:3080"  # 4개 포트 매핑
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/librechat
      - REDIS_URI=redis://redis:6379
      - PM2_PUBLIC_KEY=${PM2_PUBLIC_KEY}
      - PM2_SECRET_KEY=${PM2_SECRET_KEY}
    depends_on:
      - mongo
      - redis
    deploy:
      replicas: 1  # 단일 컨테이너, PM2가 내부에서 4개 프로세스 관리
      resources:
        limits:
          cpus: '4'
          memory: 4G
        reservations:
          cpus: '2'
          memory: 2G
    networks:
      - librechat-network
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=librechat
    volumes:
      - mongo_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js
    networks:
      - librechat-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - librechat-network

  # 모니터링 (선택사항)
  portainer:
    image: portainer/portainer-ce
    ports:
      - "9000:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    networks:
      - librechat-network

networks:
  librechat-network:
    driver: bridge

volumes:
  mongo_data:
  redis_data:
  portainer_data:
```

## Step 6: Nginx 로드 밸런서 설정

### 6.1 Nginx 설정 파일
```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 로깅
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # 성능 최적화
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;

    # 업스트림 설정 (PM2 워커들)
    upstream librechat_backend {
        least_conn;  # 최소 연결 로드 밸런싱
        
        # PM2 워커 프로세스들
        server app:3080 max_fails=3 fail_timeout=30s;
        
        # 연결 유지
        keepalive 32;
    }

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    server {
        listen 80;
        server_name localhost;

        # 연결 제한
        limit_conn addr 10;

        # 정적 파일 캐싱
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://librechat_backend;
            expires 7d;
            add_header Cache-Control "public, immutable";
        }

        # API 엔드포인트
        location /api {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://librechat_backend;
            proxy_http_version 1.1;
            
            # 헤더 설정
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # 타임아웃
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # SSE/WebSocket 지원
        location /api/ask {
            proxy_pass http://librechat_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            
            # SSE 설정
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 86400;
            chunked_transfer_encoding on;
        }

        # 헬스체크
        location /health {
            proxy_pass http://librechat_backend;
            access_log off;
        }

        # 메인 애플리케이션
        location / {
            limit_req zone=general burst=5 nodelay;
            
            proxy_pass http://librechat_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

## Step 7: 헬스체크 및 모니터링

### 7.1 헬스체크 엔드포인트 추가
```javascript
// api/server/routes/health.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const healthcheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      checks: {
        database: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
        memory: process.memoryUsage(),
        pid: process.pid,
        cpuUsage: process.cpuUsage()
      }
    };
    res.status(200).send(healthcheck);
  } catch (error) {
    res.status(503).send({ status: 'error', message: error.message });
  }
});

router.get('/metrics', async (req, res) => {
  // Prometheus 형식 메트릭
  const metrics = `
# HELP nodejs_memory_usage_bytes Memory usage in bytes
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes ${process.memoryUsage().heapUsed}

# HELP nodejs_cpu_usage_seconds CPU usage in seconds
# TYPE nodejs_cpu_usage_seconds counter
nodejs_cpu_usage_seconds ${process.cpuUsage().user / 1000000}

# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} ${global.requestCount || 0}
  `;
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

module.exports = router;
```

## Step 8: 환경별 설정 관리

### 8.1 환경 설정 파일 구조
```bash
config/
├── .env.development    # 개발 환경
├── .env.production     # 프로덕션 환경 (50명)
├── .env.staging        # 스테이징 환경
└── .env.example        # 예제 파일
```

### 8.2 프로덕션 환경 설정
```bash
# config/.env.production
NODE_ENV=production
HOST=0.0.0.0
PORT=3080

# Database
MONGO_URI=mongodb://mongo:27017/librechat
MONGO_MAX_POOL_SIZE=50
MONGO_MIN_POOL_SIZE=10

# Redis
USE_REDIS=true
REDIS_URI=redis://redis:6379
REDIS_KEY_PREFIX=librechat_prod

# Rate Limiting (50명 기준)
CONCURRENT_MESSAGE_MAX=5
MESSAGE_IP_MAX=100
MESSAGE_USER_MAX=60

# Security
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
CREDS_KEY=${CREDS_KEY}
CREDS_IV=${CREDS_IV}

# Monitoring
ENABLE_METRICS=true
ENABLE_HEALTH_CHECK=true
```

## Step 9: 배포 스크립트

### 9.1 자동 배포 스크립트
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 LibreChat 50명 사용자 배포 시작..."

# 환경 변수 로드
source config/.env.production

# 1. 의존성 설치
echo "📦 의존성 설치 중..."
npm ci

# 2. 빌드
echo "🔨 애플리케이션 빌드 중..."
npm run build:data-provider
npm run build:data-schemas
npm run build:api
npm run build:client-package
npm run frontend

# 3. Docker 이미지 빌드
echo "🐳 Docker 이미지 빌드 중..."
docker-compose build

# 4. 기존 컨테이너 정리
echo "🧹 기존 컨테이너 정리 중..."
docker-compose down

# 5. 새 컨테이너 시작
echo "▶️ 새 컨테이너 시작 중..."
docker-compose up -d

# 6. 헬스체크
echo "❤️ 헬스체크 진행 중..."
sleep 10
curl -f http://localhost/health || exit 1

# 7. PM2 모니터링
echo "📊 PM2 상태 확인..."
docker-compose exec app pm2 status

echo "✅ 배포 완료!"
echo "🌐 접속 주소: http://localhost"
echo "📊 모니터링: http://localhost:9000 (Portainer)"
```

### 9.2 롤백 스크립트
```bash
#!/bin/bash
# rollback.sh

echo "⏪ 이전 버전으로 롤백 중..."

# 이전 이미지로 복원
docker-compose down
docker-compose up -d --force-recreate

echo "✅ 롤백 완료!"
```

## Step 10: 모니터링 대시보드

### 10.1 PM2 모니터링
```bash
# PM2 웹 대시보드
pm2 install pm2-web
pm2 web

# PM2 로그 스트리밍
pm2 logs --lines 100
```

### 10.2 Docker 모니터링
```bash
# 리소스 사용량 확인
docker stats

# 로그 확인
docker-compose logs -f app
```

## 📊 성능 목표 및 측정

### 50명 동시 사용자 기준
- **응답 시간**: < 200ms (P95)
- **처리량**: 100 req/sec
- **메모리 사용**: < 2GB
- **CPU 사용률**: < 60%
- **동시 연결**: 200개
- **가용성**: 99.5%

### 부하 테스트
```bash
# Artillery 부하 테스트
npm install -g artillery

cat > load-test-50.yml << EOF
config:
  target: 'http://localhost'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 300
      arrivalRate: 10
      name: "50 users simulation"
scenarios:
  - name: "User Session"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password"
      - think: 5
      - post:
          url: "/api/ask/openAI"
          json:
            message: "Hello"
      - think: 10
EOF

artillery run load-test-50.yml
```

## 🚦 체크리스트

### 구현 완료 확인
- [ ] MongoDB 연결 풀 설정 (50 connections)
- [ ] Rate Limiting 조정 (5 concurrent messages)
- [ ] PM2 클러스터 설정 (4 workers)
- [ ] Redis 세션 스토어 구성
- [ ] Docker 컨테이너화
- [ ] Nginx 로드 밸런서 설정
- [ ] 헬스체크 엔드포인트 구현
- [ ] 환경별 설정 파일 분리
- [ ] 자동 배포 스크립트 작성
- [ ] 부하 테스트 통과

## 🔄 향후 확장 계획

### 100명 → 500명 확장시
1. MongoDB Replica Set 구성
2. Redis Cluster 모드 전환
3. Kubernetes 마이그레이션
4. 오토 스케일링 구현
5. CDN 추가

### 500명 → 5000명 확장시
1. 마이크로서비스 분리
2. Message Queue (Kafka) 도입
3. 멀티 리전 배포
4. API Gateway 구현
5. 서비스 메시 (Istio) 도입

---

이 계획에 따라 단계별로 구현하면 50명 서비스는 안정적으로 운영 가능하며, 
향후 확장시에도 큰 아키텍처 변경 없이 스케일업이 가능합니다.