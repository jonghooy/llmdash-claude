# LibreChat Admin Dashboard 구현 가이드

## 📋 현재까지 완료된 작업

### ✅ LibreChat 수정사항

1. **데이터 모델 추가**
   - `/api/models/UserMetrics.js` - 사용자 메트릭 수집 모델
   - `/api/models/AuditLog.js` - 감사 로그 모델

2. **Admin API 엔드포인트**
   - `/api/server/routes/admin/users.js` - 사용자 관리 API
   - `/api/server/routes/admin/metrics.js` - 메트릭 조회 API

## 🚀 Admin Dashboard 구현 계획

### 1. Admin Dashboard 백엔드 (Express + TypeScript)

```typescript
// /LibreChat-Admin/backend/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Server } from 'socket.io';
import { adminRouter } from './routes';
import { authMiddleware } from './middleware/auth';
import { MetricsCollector } from './services/MetricsCollector';
import { RealtimeMonitor } from './services/RealtimeMonitor';

const app = express();
const PORT = process.env.ADMIN_PORT || 3090;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.ADMIN_FRONTEND_URL || 'http://localhost:3091',
  credentials: true
}));

// Proxy to LibreChat API
app.use('/api/librechat', createProxyMiddleware({
  target: process.env.LIBRECHAT_URL || 'http://localhost:3080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/librechat': '/api/admin'
  }
}));

// Admin routes
app.use('/api', authMiddleware, adminRouter);

// WebSocket for real-time monitoring
const server = app.listen(PORT);
const io = new Server(server, {
  cors: {
    origin: process.env.ADMIN_FRONTEND_URL || 'http://localhost:3091'
  }
});

const realtimeMonitor = new RealtimeMonitor(io);
const metricsCollector = new MetricsCollector(realtimeMonitor);

metricsCollector.start();
```

### 2. Admin Dashboard 프론트엔드 (React + TypeScript)

```typescript
// /LibreChat-Admin/frontend/src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Metrics from './pages/Metrics';
import Security from './pages/Security';
import Settings from './pages/Settings';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/metrics" element={<Metrics />} />
                <Route path="/security" element={<Security />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

## 📊 주요 기능 구현

### 1. 실시간 대시보드
```typescript
// components/Dashboard/RealtimeMetrics.tsx
const RealtimeMetrics: React.FC = () => {
  const { socket } = useSocket();
  const [metrics, setMetrics] = useState<Metrics>({
    activeUsers: 0,
    requestsPerSecond: 0,
    avgResponseTime: 0,
    errorRate: 0
  });

  useEffect(() => {
    socket.on('metrics:realtime', (data) => {
      setMetrics(data);
    });

    socket.emit('subscribe:metrics', ['realtime']);

    return () => {
      socket.off('metrics:realtime');
    };
  }, [socket]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={3}>
        <MetricCard
          title="Active Users"
          value={metrics.activeUsers}
          icon={<PeopleIcon />}
          color="primary"
        />
      </Grid>
      <Grid item xs={3}>
        <MetricCard
          title="Requests/sec"
          value={metrics.requestsPerSecond}
          icon={<SpeedIcon />}
          color="success"
        />
      </Grid>
      <Grid item xs={3}>
        <MetricCard
          title="Avg Response"
          value={`${metrics.avgResponseTime}ms`}
          icon={<TimerIcon />}
          color="info"
        />
      </Grid>
      <Grid item xs={3}>
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate.toFixed(2)}%`}
          icon={<ErrorIcon />}
          color={metrics.errorRate > 5 ? 'error' : 'warning'}
        />
      </Grid>
    </Grid>
  );
};
```

### 2. 사용자 관리
```typescript
// components/Users/UserManagement.tsx
const UserManagement: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { data: users, isLoading } = useQuery(['users'], fetchUsers);

  const suspendUser = useMutation(
    (userId: string) => api.post(`/users/${userId}/suspend`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('User suspended');
      }
    }
  );

  const updateLimits = useMutation(
    ({ userId, limits }) => api.put(`/users/${userId}/limits`, limits),
    {
      onSuccess: () => {
        toast.success('Limits updated');
      }
    }
  );

  return (
    <Box>
      <DataGrid
        rows={users}
        columns={[
          { field: 'username', headerName: 'Username', width: 150 },
          { field: 'email', headerName: 'Email', width: 200 },
          { field: 'role', headerName: 'Role', width: 100 },
          { field: 'isActive', headerName: 'Status', width: 100 },
          {
            field: 'actions',
            headerName: 'Actions',
            width: 200,
            renderCell: (params) => (
              <ButtonGroup>
                <Button onClick={() => setSelectedUser(params.row)}>
                  View
                </Button>
                <Button onClick={() => suspendUser.mutate(params.row.id)}>
                  Suspend
                </Button>
              </ButtonGroup>
            )
          }
        ]}
      />
      
      {selectedUser && (
        <UserDetailsDialog
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdateLimits={(limits) => 
            updateLimits.mutate({ userId: selectedUser.id, limits })
          }
        />
      )}
    </Box>
  );
};
```

### 3. 보안 모니터링
```typescript
// components/Security/SecurityMonitor.tsx
const SecurityMonitor: React.FC = () => {
  const { data: threats } = useQuery(
    ['security', 'threats'],
    fetchSecurityThreats,
    { refetchInterval: 5000 }
  );

  const blockIP = useMutation(
    (ip: string) => api.post('/security/block-ip', { ip }),
    {
      onSuccess: () => {
        toast.success('IP blocked');
      }
    }
  );

  return (
    <Box>
      <Alert severity="warning" sx={{ mb: 2 }}>
        {threats?.criticalCount || 0} critical security events in the last hour
      </Alert>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>User/IP</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {threats?.events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{formatTime(event.timestamp)}</TableCell>
                <TableCell>
                  <Chip 
                    label={event.type} 
                    color={getSeverityColor(event.severity)}
                  />
                </TableCell>
                <TableCell>{event.ip || event.userId}</TableCell>
                <TableCell>{event.description}</TableCell>
                <TableCell>
                  <IconButton onClick={() => blockIP.mutate(event.ip)}>
                    <BlockIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
```

## 🔧 LibreChat 통합 미들웨어

LibreChat에 추가해야 할 미들웨어:

```javascript
// /LibreChat/api/server/middleware/adminIntegration.js
const UserMetrics = require('../models/UserMetrics');
const AuditLog = require('../models/AuditLog');
const { io } = require('../services/socket');

const trackMetrics = async (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', async () => {
    if (!req.user) return;
    
    const responseTime = Date.now() - startTime;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    try {
      // Update metrics
      await UserMetrics.findOneAndUpdate(
        { userId: req.user._id, date: today },
        {
          $inc: {
            'metrics.apiCalls': 1,
            'metrics.messageCount': req.path.includes('/ask') ? 1 : 0
          },
          $min: { 'metrics.responseTime.min': responseTime },
          $max: { 'metrics.responseTime.max': responseTime }
        },
        { upsert: true }
      );
      
      // Emit to admin dashboard
      io.of('/admin').emit('metrics:activity', {
        userId: req.user._id,
        path: req.path,
        method: req.method,
        status: res.statusCode,
        responseTime,
        timestamp: new Date()
      });
      
      // Log if error
      if (res.statusCode >= 400) {
        await AuditLog.create({
          userId: req.user._id,
          action: `${req.method} ${req.path}`,
          category: 'API',
          severity: res.statusCode >= 500 ? 'ERROR' : 'WARNING',
          details: {
            status: res.statusCode,
            responseTime,
            ip: req.ip
          }
        });
      }
    } catch (error) {
      console.error('Metrics tracking error:', error);
    }
  });
  
  next();
};

module.exports = { trackMetrics };
```

## 🚀 배포 설정

### Docker Compose 설정
```yaml
# /LibreChat-Admin/docker-compose.yml
version: '3.8'

services:
  admin-backend:
    build: ./backend
    container_name: librechat-admin-backend
    ports:
      - "3090:3090"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongodb:27017/LibreChat
      - REDIS_URI=redis://redis:6379
      - LIBRECHAT_URL=http://librechat:3080
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
      - redis
    networks:
      - librechat-network

  admin-frontend:
    build: ./frontend
    container_name: librechat-admin-frontend
    ports:
      - "3091:80"
    environment:
      - REACT_APP_API_URL=http://localhost:3090
      - REACT_APP_WS_URL=ws://localhost:3090
    depends_on:
      - admin-backend
    networks:
      - librechat-network

networks:
  librechat-network:
    external: true
```

## 📝 다음 단계

1. **Admin Dashboard 백엔드 구현**
   - Express + TypeScript 서버 설정
   - LibreChat API 프록시 설정
   - WebSocket 실시간 통신 구현
   - 인증/권한 시스템 구현

2. **Admin Dashboard 프론트엔드 구현**
   - React + TypeScript 설정
   - Material-UI 또는 Ant Design UI 구현
   - 실시간 차트 (Chart.js, Recharts)
   - WebSocket 클라이언트 구현

3. **LibreChat 통합**
   - 메트릭 수집 미들웨어 추가
   - Admin API 라우트 등록
   - WebSocket 서버 설정
   - 권한 검증 미들웨어 추가

4. **테스트 및 배포**
   - 단위 테스트 작성
   - 통합 테스트
   - Docker 이미지 빌드
   - PM2/Kubernetes 배포 설정

## 🔐 보안 고려사항

1. **인증 및 권한**
   - Admin 전용 JWT 토큰
   - Role-based access control (RBAC)
   - 2FA 지원

2. **감사 로깅**
   - 모든 Admin 작업 로깅
   - IP 기반 접근 제어
   - 이상 행동 감지

3. **데이터 보호**
   - 민감 정보 마스킹
   - 암호화된 통신 (HTTPS/WSS)
   - Rate limiting

## 🎯 핵심 기능 요약

### Admin Dashboard가 제공하는 기능:
1. **실시간 모니터링** - 활성 사용자, 요청률, 응답시간, 에러율
2. **사용자 관리** - 계정 활성화/비활성화, 한도 설정, 권한 관리
3. **사용량 추적** - 토큰 사용량, API 호출, 비용 분석
4. **보안 모니터링** - 의심스러운 활동, 실패한 로그인, IP 차단
5. **통계 분석** - 사용 패턴, 모델별 사용량, 비용 예측
6. **시스템 관리** - 설정 변경, 모델 활성화, 공지사항

이 구조로 LibreChat의 완전한 엔터프라이즈급 관리 시스템을 구축할 수 있습니다.