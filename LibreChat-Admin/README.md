# LibreChat Admin Dashboard

## 🚀 MVP 버전 - 필수 기능만 구현

LibreChat 관리자 대시보드는 LibreChat 서비스를 모니터링하고 관리하기 위한 독립적인 웹 애플리케이션입니다.

## 📊 MVP 기능 (4개 메뉴)

### 1. **Dashboard** 📊
- 전체 시스템 현황 개요
- 실시간 메트릭 (활성 사용자, 메시지/분, 응답 시간)
- 모델별 사용량 차트
- 활동 타임라인

### 2. **Users** 👥
- 사용자 목록 및 검색
- 사용자 상태 관리 (활성화/비활성화)
- 사용 한도 설정 (일일 메시지, 토큰, 예산)
- 사용자별 상세 통계

### 3. **Usage** 📈
- 전체 사용량 통계
- 모델별 사용량 및 비용
- 시간대별 사용 패턴
- 비용 분석 및 예측

### 4. **Settings** ⚙️
- 전역 제한 설정
- Rate Limiting 설정
- 모델 활성화/비활성화
- 시스템 설정

## 🛠️ 기술 스택

### Backend
- **Node.js** + **TypeScript**
- **Express.js** - Web framework
- **MongoDB** - Database (LibreChat와 공유)
- **Socket.io** - 실시간 통신
- **JWT** - 인증

### Frontend
- **React** + **TypeScript**
- **Material-UI** - UI Components
- **React Query** - 데이터 페칭
- **Recharts** - 차트 라이브러리
- **Vite** - 빌드 도구

## 📁 프로젝트 구조

```
LibreChat-Admin/
├── backend/
│   ├── src/
│   │   ├── routes/       # API 라우트
│   │   ├── middleware/   # 미들웨어
│   │   ├── services/     # 비즈니스 로직
│   │   └── server.ts     # 메인 서버
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── stores/       # 상태 관리
│   │   └── App.tsx       # 메인 앱
│   └── package.json
└── start-admin.sh        # 실행 스크립트
```

## 🚀 빠른 시작

### 1. 사전 요구사항
- Node.js 18+
- MongoDB (LibreChat와 동일한 인스턴스)
- Redis (선택사항)
- LibreChat가 실행 중이어야 함

### 2. 설치 및 실행

```bash
# Admin Dashboard 디렉토리로 이동
cd LibreChat-Admin

# 자동 실행 스크립트 사용
./start-admin.sh

# 또는 수동으로 실행:

# Backend 실행
cd backend
npm install
npm run dev

# Frontend 실행 (새 터미널)
cd frontend
npm install
npm run start
```

### 3. 접속
- Frontend: http://localhost:3091
- Backend API: http://localhost:3090

### 4. 기본 로그인 정보
```
Email: admin@librechat.local
Password: Admin123!@#
```

## 🔧 환경 설정

### Backend (.env)
```env
PORT=3090
MONGO_URI=mongodb://127.0.0.1:27017/LibreChat
LIBRECHAT_API_URL=http://localhost:3080
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@librechat.local
ADMIN_PASSWORD=Admin123!@#
```

## 📊 API 엔드포인트

### Dashboard
- `GET /api/dashboard/overview` - 대시보드 개요
- `GET /api/dashboard/metrics` - 실시간 메트릭
- `GET /api/dashboard/activity` - 활동 타임라인

### Users
- `GET /api/users` - 사용자 목록
- `GET /api/users/:id` - 사용자 상세
- `PATCH /api/users/:id/status` - 상태 변경
- `PUT /api/users/:id/limits` - 한도 설정

### Usage
- `GET /api/usage/stats` - 사용량 통계
- `GET /api/usage/costs` - 비용 분석
- `GET /api/usage/models` - 모델별 사용량

### Settings
- `GET /api/settings` - 설정 조회
- `PUT /api/settings` - 설정 업데이트

## 🔐 보안

- JWT 기반 인증
- Admin 역할 검증
- Rate Limiting
- CORS 설정
- Helmet.js 보안 헤더

## 📈 모니터링 항목

### 실시간 모니터링
- 활성 사용자 수
- 분당 메시지 수
- 평균 응답 시간
- 에러율

### 사용량 추적
- 일일/월간 토큰 사용량
- 모델별 사용 비율
- 비용 추적
- 사용자별 통계

## 🚧 향후 계획 (v2.0)

- [ ] 보안 감사 로그
- [ ] 실시간 알림 시스템
- [ ] 대화 내용 검토 기능
- [ ] 자동화된 사용자 관리
- [ ] 상세 분석 리포트
- [ ] 다중 관리자 지원
- [ ] 2FA 인증
- [ ] 백업/복원 기능

## 📝 문제 해결

### MongoDB 연결 실패
```bash
# MongoDB 실행 확인
mongosh
> use LibreChat
> db.users.countDocuments()
```

### 포트 충돌
```bash
# 포트 사용 확인
lsof -i :3090
lsof -i :3091
```

### 권한 문제
```bash
# 관리자 계정 수동 생성
mongosh
> use LibreChat
> db.users.updateOne(
    { email: "admin@librechat.local" },
    { $set: { role: "admin" } }
  )
```

## 📜 라이선스

MIT License

## 🤝 기여

Pull Request와 Issue는 언제나 환영합니다!

---

**LibreChat Admin Dashboard** - 효율적인 LibreChat 관리를 위한 필수 도구