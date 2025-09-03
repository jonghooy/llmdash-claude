# LibreChat Admin Dashboard Architecture

## 🏗️ 시스템 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                         Users (End Users)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │  Nginx   │
                    │   (80)   │
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
   │LibreChat│      │  Admin  │     │   API   │
   │  (3080) │      │  (3090) │     │Gateway  │
   └────┬────┘      └────┬────┘     └────┬────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
     │ MongoDB │   │  Redis  │   │Postgres │
     │         │   │         │   │(Metrics)│
     └─────────┘   └─────────┘   └─────────┘
```

## 📁 프로젝트 구조

```
/llmdash_claude/
├── LibreChat/                 # 기존 LibreChat 서비스
│   ├── api/
│   │   ├── server/
│   │   │   ├── routes/
│   │   │   │   ├── admin/    # 새로운 Admin API 엔드포인트
│   │   │   │   │   ├── users.js
│   │   │   │   │   ├── metrics.js
│   │   │   │   │   ├── usage.js
│   │   │   │   │   ├── permissions.js
│   │   │   │   │   ├── audit.js
│   │   │   │   │   └── realtime.js
│   │   │   │   └── ...
│   │   │   ├── middleware/
│   │   │   │   ├── adminAuth.js    # Admin 인증 미들웨어
│   │   │   │   ├── auditLogger.js  # 감사 로그 미들웨어
│   │   │   │   └── rateTracker.js  # 사용량 추적 미들웨어
│   │   │   └── services/
│   │   │       ├── MetricsService.js
│   │   │       ├── AuditService.js
│   │   │       └── UsageTracker.js
│   └── ...
│
└── LibreChat-Admin/           # 새로운 Admin Dashboard
    ├── backend/
    │   ├── src/
    │   │   ├── controllers/
    │   │   ├── services/
    │   │   ├── models/
    │   │   ├── routes/
    │   │   ├── middleware/
    │   │   ├── websocket/
    │   │   └── app.js
    │   ├── package.json
    │   └── ecosystem.config.js
    ├── frontend/
    │   ├── src/
    │   │   ├── components/
    │   │   ├── pages/
    │   │   ├── services/
    │   │   ├── hooks/
    │   │   └── App.tsx
    │   └── package.json
    └── docker-compose.yml
```

## 🔧 LibreChat 수정 사항

### 1. 데이터베이스 스키마 확장

#### 사용자 메트릭 컬렉션
```javascript
// models/UserMetrics.js
const UserMetricsSchema = new Schema({
  userId: { type: ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  metrics: {
    messageCount: { type: Number, default: 0 },
    tokenUsage: {
      input: { type: Number, default: 0 },
      output: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    modelUsage: {
      type: Map,
      of: {
        count: Number,
        tokens: Number,
        cost: Number
      }
    },
    apiCalls: { type: Number, default: 0 },
    errors: { type: Number, default: 0 },
    responseTime: {
      avg: { type: Number, default: 0 },
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 }
    }
  },
  limits: {
    dailyTokenLimit: { type: Number },
    dailyMessageLimit: { type: Number },
    monthlyBudget: { type: Number }
  }
}, {
  timestamps: true,
  timeseries: {
    timeField: 'date',
    metaField: 'userId',
    granularity: 'hours'
  }
});
```

#### 감사 로그 컬렉션
```javascript
// models/AuditLog.js
const AuditLogSchema = new Schema({
  userId: { type: ObjectId, ref: 'User' },
  action: { type: String, required: true },
  category: {
    type: String,
    enum: ['AUTH', 'API', 'ADMIN', 'SECURITY', 'DATA', 'SYSTEM'],
    required: true
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
    default: 'INFO'
  },
  details: {
    ip: String,
    userAgent: String,
    method: String,
    path: String,
    query: Object,
    body: Object,
    response: {
      status: Number,
      message: String
    },
    error: String
  },
  metadata: {
    conversationId: String,
    model: String,
    tokens: Number,
    cost: Number
  },
  timestamp: { type: Date, default: Date.now }
}, {
  indexes: [
    { userId: 1, timestamp: -1 },
    { category: 1, timestamp: -1 },
    { severity: 1, timestamp: -1 }
  ]
});
```

### 2. API 엔드포인트 추가

```javascript
// api/server/routes/admin/index.js
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../../middleware/adminAuth');

// Admin 인증 미들웨어 적용
router.use(requireAdmin);

// 사용자 관리
router.use('/users', require('./users'));
router.use('/metrics', require('./metrics'));
router.use('/usage', require('./usage'));
router.use('/permissions', require('./permissions'));
router.use('/audit', require('./audit'));
router.use('/realtime', require('./realtime'));
router.use('/analytics', require('./analytics'));
router.use('/security', require('./security'));

module.exports = router;
```

### 3. 실시간 모니터링 WebSocket

```javascript
// api/server/services/RealtimeMonitor.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class RealtimeMonitor {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.ADMIN_URL || 'http://localhost:3090',
        credentials: true
      },
      path: '/ws/admin'
    });
    
    this.metrics = {
      activeUsers: new Set(),
      requestsPerSecond: 0,
      activeConversations: 0,
      systemHealth: {
        cpu: 0,
        memory: 0,
        mongodb: 'healthy',
        redis: 'healthy'
      }
    };
    
    this.setupSocketHandlers();
    this.startMetricsCollection();
  }
  
  setupSocketHandlers() {
    // Admin namespace
    const adminNamespace = this.io.of('/admin');
    
    adminNamespace.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify admin role
        if (decoded.role !== 'admin') {
          return next(new Error('Unauthorized'));
        }
        
        socket.userId = decoded.userId;
        next();
      } catch (err) {
        next(new Error('Authentication failed'));
      }
    });
    
    adminNamespace.on('connection', (socket) => {
      console.log(`Admin connected: ${socket.userId}`);
      
      // Send initial metrics
      socket.emit('metrics:initial', this.metrics);
      
      // Subscribe to specific metrics
      socket.on('subscribe:metrics', (types) => {
        types.forEach(type => {
          socket.join(`metrics:${type}`);
        });
      });
      
      // Handle real-time commands
      socket.on('user:suspend', async (userId) => {
        await this.suspendUser(userId);
        socket.emit('user:suspended', userId);
      });
      
      socket.on('limit:update', async (data) => {
        await this.updateUserLimits(data.userId, data.limits);
        socket.emit('limit:updated', data);
      });
      
      socket.on('disconnect', () => {
        console.log(`Admin disconnected: ${socket.userId}`);
      });
    });
  }
  
  // Broadcast metrics to admin dashboard
  broadcastMetrics(type, data) {
    this.io.of('/admin').to(`metrics:${type}`).emit(`metrics:${type}`, data);
  }
  
  // Track user activity
  trackUserActivity(userId, action, metadata) {
    this.metrics.activeUsers.add(userId);
    
    this.broadcastMetrics('activity', {
      userId,
      action,
      metadata,
      timestamp: new Date()
    });
  }
  
  // Track API usage
  trackAPIUsage(userId, endpoint, tokens, cost) {
    this.broadcastMetrics('usage', {
      userId,
      endpoint,
      tokens,
      cost,
      timestamp: new Date()
    });
  }
}

module.exports = RealtimeMonitor;
```

### 4. 사용량 추적 미들웨어

```javascript
// api/server/middleware/usageTracker.js
const UserMetrics = require('../models/UserMetrics');
const { getTokenCount } = require('../utils/tokens');

const usageTracker = (realtimeMonitor) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Capture original methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Track response
    const trackResponse = async (body) => {
      if (!req.user) return;
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      try {
        // Calculate tokens if it's a chat completion
        let tokenUsage = { input: 0, output: 0 };
        if (req.path.includes('/ask') && body) {
          tokenUsage.input = getTokenCount(req.body.text || '');
          tokenUsage.output = getTokenCount(body.text || body.response || '');
        }
        
        // Update metrics
        await UserMetrics.findOneAndUpdate(
          {
            userId: req.user._id,
            date: new Date().setHours(0, 0, 0, 0)
          },
          {
            $inc: {
              'metrics.messageCount': 1,
              'metrics.tokenUsage.input': tokenUsage.input,
              'metrics.tokenUsage.output': tokenUsage.output,
              'metrics.tokenUsage.total': tokenUsage.input + tokenUsage.output,
              'metrics.apiCalls': 1,
              [`metrics.modelUsage.${req.body.model}.count`]: 1,
              [`metrics.modelUsage.${req.body.model}.tokens`]: tokenUsage.input + tokenUsage.output
            },
            $min: { 'metrics.responseTime.min': responseTime },
            $max: { 'metrics.responseTime.max': responseTime }
          },
          { upsert: true }
        );
        
        // Broadcast to admin dashboard
        if (realtimeMonitor) {
          realtimeMonitor.trackAPIUsage(
            req.user._id,
            req.path,
            tokenUsage.input + tokenUsage.output,
            calculateCost(req.body.model, tokenUsage)
          );
        }
        
        // Check limits
        const metrics = await UserMetrics.findOne({
          userId: req.user._id,
          date: new Date().setHours(0, 0, 0, 0)
        });
        
        if (metrics?.limits) {
          if (metrics.limits.dailyTokenLimit && 
              metrics.metrics.tokenUsage.total > metrics.limits.dailyTokenLimit) {
            return res.status(429).json({
              error: 'Daily token limit exceeded'
            });
          }
          
          if (metrics.limits.dailyMessageLimit && 
              metrics.metrics.messageCount > metrics.limits.dailyMessageLimit) {
            return res.status(429).json({
              error: 'Daily message limit exceeded'
            });
          }
        }
      } catch (error) {
        console.error('Usage tracking error:', error);
      }
    };
    
    // Override response methods
    res.send = function(body) {
      trackResponse(body);
      return originalSend.call(this, body);
    };
    
    res.json = function(body) {
      trackResponse(body);
      return originalJson.call(this, body);
    };
    
    next();
  };
};

module.exports = usageTracker;
```

### 5. 보안 감사 로그

```javascript
// api/server/middleware/auditLogger.js
const AuditLog = require('../models/AuditLog');

const auditLogger = (realtimeMonitor) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Determine audit category
    const getCategory = (path) => {
      if (path.includes('/auth')) return 'AUTH';
      if (path.includes('/admin')) return 'ADMIN';
      if (path.includes('/api')) return 'API';
      return 'SYSTEM';
    };
    
    // Determine severity
    const getSeverity = (statusCode) => {
      if (statusCode >= 500) return 'ERROR';
      if (statusCode >= 400) return 'WARNING';
      return 'INFO';
    };
    
    // Log after response
    res.on('finish', async () => {
      try {
        const auditEntry = {
          userId: req.user?._id,
          action: `${req.method} ${req.path}`,
          category: getCategory(req.path),
          severity: getSeverity(res.statusCode),
          details: {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            method: req.method,
            path: req.path,
            query: req.query,
            body: req.body ? { ...req.body, password: undefined } : undefined,
            response: {
              status: res.statusCode,
              time: Date.now() - startTime
            }
          },
          timestamp: new Date()
        };
        
        // Log security events
        if (res.statusCode === 401 || res.statusCode === 403) {
          auditEntry.severity = 'WARNING';
          auditEntry.category = 'SECURITY';
        }
        
        // Save to database
        await AuditLog.create(auditEntry);
        
        // Broadcast critical events
        if (auditEntry.severity === 'ERROR' || auditEntry.severity === 'CRITICAL') {
          realtimeMonitor?.broadcastMetrics('security', auditEntry);
        }
      } catch (error) {
        console.error('Audit logging error:', error);
      }
    });
    
    next();
  };
};

module.exports = auditLogger;
```

## 🎨 Admin Dashboard 프로젝트

이제 별도의 Admin Dashboard 프로젝트를 생성하겠습니다.

```bash
mkdir -p /Users/yoonjonghoo/work/llmdash_claude/LibreChat-Admin
cd /Users/yoonjonghoo/work/llmdash_claude/LibreChat-Admin
```