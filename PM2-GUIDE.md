# PM2 운영 가이드

PM2를 사용하여 LibreChat과 LibreChat-Admin을 프로덕션 환경에서 운영하는 가이드입니다.

## 📋 사전 준비

### PM2 설치
```bash
# 전역 설치
npm install -g pm2

# serve 설치 (정적 파일 서빙용)
npm install -g serve
```

### 빌드 준비
```bash
# LibreChat Frontend 빌드
cd LibreChat
npm run frontend  # client/dist에 빌드

# LibreChat-Admin Backend 빌드
cd LibreChat-Admin/backend
npm run build  # dist에 빌드

# LibreChat-Admin Frontend 빌드
cd ../frontend
npm run build  # dist에 빌드

# API Relay Server 빌드
cd ../../api-relay-server
npm run build  # dist에 빌드
```

## 🚀 빠른 시작

### 전체 서비스 한 번에 시작 (루트 디렉토리에서)
```bash
# 모든 Production 서비스 시작 (프론트엔드 + 백엔드)
pm2 start ecosystem.config.js --only "librechat-backend,librechat-frontend,admin-backend,admin-frontend,api-relay" --env production

# 모든 Development 서비스 시작 (프론트엔드 + 백엔드)
pm2 start ecosystem.config.js --only "librechat-backend-dev,librechat-frontend-dev,admin-backend-dev,admin-frontend-dev,api-relay-dev"

# 백엔드만 Production으로 시작
pm2 start ecosystem.config.js --only "librechat-backend,admin-backend,api-relay" --env production

# 프론트엔드만 Production으로 시작
pm2 start ecosystem.config.js --only "librechat-frontend,admin-frontend" --env production

# 모든 서비스 시작 (Production + Dev 모두)
pm2 start ecosystem.config.js
```

### 개별 서비스 시작

#### LibreChat
```bash
cd LibreChat
# Backend Production 모드 (클러스터)
pm2 start ecosystem.config.js --only librechat-backend --env production

# Backend Development 모드
pm2 start ecosystem.config.js --only librechat-backend-dev

# Frontend Production 모드 (serve)
pm2 start ecosystem.config.js --only librechat-frontend --env production

# Frontend Development 모드 (Vite)
pm2 start ecosystem.config.js --only librechat-frontend-dev

# Backend + Frontend 함께 시작
pm2 start ecosystem.config.js
```

#### LibreChat-Admin
```bash
# Backend
cd LibreChat-Admin/backend
pm2 start ecosystem.config.js --only admin-backend --env production  # Production
pm2 start ecosystem.config.js --only admin-backend-dev              # Development

# Frontend
cd LibreChat-Admin/frontend
pm2 start ecosystem.config.js --only admin-frontend --env production # Production
pm2 start ecosystem.config.js --only admin-frontend-dev             # Development

# 또는 루트에서 Backend + Frontend 함께
cd ../..
pm2 start ecosystem.config.js --only "admin-backend,admin-frontend" --env production
```

#### API Relay Server
```bash
cd api-relay-server
# Production 모드
pm2 start ecosystem.config.js --only api-relay-server --env production

# Development 모드
pm2 start ecosystem.config.js --only api-relay-dev
```

## 📊 PM2 관리 명령어

### 상태 확인
```bash
# 전체 프로세스 상태
pm2 status

# Backend 서비스 상태
pm2 info librechat-backend
pm2 info librechat-backend-dev
pm2 info admin-backend
pm2 info admin-backend-dev
pm2 info api-relay
pm2 info api-relay-dev

# Frontend 서비스 상태
pm2 info librechat-frontend
pm2 info librechat-frontend-dev
pm2 info admin-frontend
pm2 info admin-frontend-dev

# CPU/메모리 모니터링
pm2 monit
```

### 로그 확인
```bash
# 전체 로그
pm2 logs

# 특정 서비스 로그
pm2 logs librechat-backend
pm2 logs admin-backend --lines 100

# 실시간 로그 스트리밍
pm2 logs --follow
```

### 서비스 제어
```bash
# 재시작
pm2 restart all
pm2 restart librechat-backend
pm2 restart admin-backend

# 정지
pm2 stop all
pm2 stop librechat-backend

# 삭제
pm2 delete all
pm2 delete admin-backend

# 리로드 (무중단 재시작)
pm2 reload librechat-backend
```

### 스케일링
```bash
# 인스턴스 수 조정
pm2 scale librechat-backend 8  # 8개로 증가
pm2 scale admin-backend 4      # 4개로 증가
```

## 🔧 고급 설정

### 시스템 부팅 시 자동 시작
```bash
# startup 스크립트 생성
pm2 startup

# 현재 실행 중인 프로세스 저장
pm2 save

# 저장된 프로세스 리스트 확인
pm2 list
```

### 환경변수 설정
```bash
# 환경변수와 함께 시작
PORT=3081 pm2 start ecosystem.config.js --env production

# 또는 ecosystem.config.js에서 설정
env: {
  NODE_ENV: 'production',
  PORT: 3080,
  MONGO_URI: process.env.MONGO_URI
}
```

### 로그 관리
```bash
# 로그 파일 위치
# LibreChat: ./LibreChat/logs/pm2/
# Admin Backend: ./LibreChat-Admin/backend/logs/pm2/
# Admin Frontend: ./LibreChat-Admin/frontend/logs/pm2/

# 로그 순환 설정
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 📈 모니터링

### PM2 Plus (웹 모니터링)
```bash
# PM2 Plus 연결 (무료 플랜 가능)
pm2 link <secret_key> <public_key>
```

### 메트릭 확인
```bash
# CPU/메모리 사용량
pm2 describe librechat-backend

# 프로세스 정보
pm2 show admin-backend
```

## 🛠 문제 해결

### 포트 충돌
```bash
# 사용 중인 포트 확인
lsof -i :3080
lsof -i :5001
lsof -i :3092

# 프로세스 종료
kill -9 <PID>
```

### 메모리 누수
```bash
# 메모리 제한 설정 (ecosystem.config.js)
max_memory_restart: '2G'

# 메모리 사용량 모니터링
pm2 monit
```

### 로그 확인
```bash
# 에러 로그만 확인
pm2 logs --err

# 특정 시간 이후 로그
pm2 logs --since "10min"
```

## 📌 서비스 포트 정보

| 서비스 | 포트 | 용도 | PM2 프로세스명 |
|--------|------|------|----------------|
| LibreChat Backend | 3080 | 메인 API 서버 | librechat-backend, librechat-backend-dev |
| LibreChat Frontend | 3090 | 프론트엔드 | librechat-frontend, librechat-frontend-dev |
| Admin Backend | 5001 | 관리자 API 서버 | admin-backend, admin-backend-dev |
| Admin Frontend | 3091 | 관리자 대시보드 | admin-frontend, admin-frontend-dev |
| API Relay | 4000 | API 프록시 | api-relay, api-relay-dev |

## 🔄 업데이트 프로세스

```bash
# 1. 코드 업데이트
git pull

# 2. 의존성 설치
npm install

# 3. 빌드
npm run build

# 4. PM2 리로드 (무중단)
pm2 reload all

# 또는 개별 서비스
pm2 reload librechat-backend
pm2 reload admin-backend
```

## 🎯 Best Practices

1. **프로덕션 배포**
   - 항상 `npm ci` 사용 (not `npm install`)
   - 환경변수는 `.env` 파일로 관리
   - `pm2 save`로 프로세스 목록 저장

2. **로그 관리**
   - 정기적인 로그 순환 설정
   - 로그 레벨 적절히 설정
   - 중요 에러는 외부 모니터링 연동

3. **성능 최적화**
   - CPU 코어 수에 맞춰 인스턴스 조정
   - 메모리 제한 적절히 설정
   - Redis 캐싱 활용

4. **보안**
   - PM2 API 키 안전하게 관리
   - 로그에 민감정보 노출 방지
   - 정기적인 의존성 업데이트

## 📝 스크립트 예제

### 전체 서비스 시작 스크립트
```bash
#!/bin/bash
# start-all-services.sh

# Production 모드로 모든 서비스 시작
pm2 start ecosystem.config.js --only "librechat-backend,librechat-frontend,admin-backend,admin-frontend,api-relay" --env production

echo "All services started. Checking status..."
pm2 status
```

### 개발 모드 전체 시작 스크립트
```bash
#!/bin/bash
# start-dev.sh

# Development 모드로 모든 서비스 시작
pm2 start ecosystem.config.js --only "librechat-backend-dev,librechat-frontend-dev,admin-backend-dev,admin-frontend-dev,api-relay-dev"

echo "Development services started. Checking status..."
pm2 status
```

### 전체 재시작 스크립트
```bash
#!/bin/bash
# restart-all.sh

echo "Building applications..."
# Backend 빌드
cd LibreChat && npm ci && cd ..
cd LibreChat-Admin/backend && npm ci && npm run build && cd ../..
cd api-relay-server && npm ci && npm run build && cd ..

# Frontend 빌드
cd LibreChat && npm run frontend && cd ..
cd LibreChat-Admin/frontend && npm ci && npm run build && cd ../..

echo "Restarting PM2 services..."
pm2 reload ecosystem.config.js --env production

echo "Services restarted. Checking status..."
pm2 status
```

### 헬스체크 스크립트
```bash
#!/bin/bash
# healthcheck.sh

services=("librechat-backend" "librechat-frontend" "admin-backend" "admin-frontend" "api-relay")

for service in "${services[@]}"; do
  status=$(pm2 describe $service | grep status | awk '{print $4}')
  if [ "$status" != "online" ]; then
    echo "WARNING: $service is $status"
    pm2 restart $service
  else
    echo "OK: $service is online"
  fi
done
```

## 📞 지원

문제가 발생하면:
1. 로그 확인: `pm2 logs --err`
2. 프로세스 상태 확인: `pm2 status`
3. 설정 파일 검증: `pm2 start ecosystem.config.js --dry-run`