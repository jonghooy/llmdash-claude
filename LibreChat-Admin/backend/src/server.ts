import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import usersRoutes from './routes/users';
import usageRoutes from './routes/usage';
import settingsRoutes from './routes/settings';
import approvalRoutes from './routes/approval';
import modelRegistryRoutes from './routes/modelRegistry';
import modelPricingRoutes from './routes/modelPricing';
import modelPermissionsRoutes from './routes/modelPermissions';
import apiKeysRoutes from './routes/apiKeys';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter, authRateLimiter } from './middleware/rateLimiter';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      'http://localhost:3091',
      'http://localhost:3092', 
      'http://localhost:3093',
      'http://localhost:5173',
      'https://www.llmdash.com',
      'https://llmdash.com'
    ],
    credentials: true
  }
});

const PORT = process.env.PORT || 5001;

// Trust proxy for nginx (limit to loopback and private network)
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

// Middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Allow multiple origins for development
    const allowedOrigins = [
      'http://localhost:3091',
      'http://localhost:3092',
      'http://localhost:3093',
      'http://localhost:5173',
      'https://www.llmdash.com',
      'https://llmdash.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      // In development, allow any localhost origin
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (no rate limit)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Auth routes with special rate limiter
app.use('/api/auth', authRateLimiter, authRoutes);

// Apply general rate limiter to all other routes
app.use(rateLimiter);

// Protected routes
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/usage', authMiddleware, usageRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/approval', approvalRoutes);

// Model management routes (accessible without auth for debugging)
app.use('/api/model-registry', modelRegistryRoutes);
app.use('/api/model-pricing', modelPricingRoutes);
app.use('/api/model-permissions', modelPermissionsRoutes);
app.use('/api/api-keys', apiKeysRoutes);

// Proxy to LibreChat API
app.use('/api/librechat', authMiddleware, createProxyMiddleware({
  target: process.env.LIBRECHAT_API_URL || 'http://localhost:3080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/librechat': '/api/admin'
  },
  onProxyReq: (proxyReq, req: any) => {
    // Add admin authentication header
    if (req.user) {
      proxyReq.setHeader('X-Admin-User', req.user.id);
      proxyReq.setHeader('X-Admin-Role', req.user.role);
    }
  }
}));

// WebSocket handling
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    // Verify token here
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log('Admin client connected:', socket.id);
  
  socket.on('subscribe:metrics', (metrics: string[]) => {
    metrics.forEach(metric => {
      socket.join(`metric:${metric}`);
    });
    
    // Start sending real-time updates for this client
    if (metrics.includes('realtime')) {
      const intervalId = setInterval(async () => {
        try {
          const db = mongoose.connection.db;
          const messagesCollection = db.collection('messages');
          const usersCollection = db.collection('users');
          
          const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          
          const [messagesLastMinute, activeUserResult] = await Promise.all([
            messagesCollection.countDocuments({ createdAt: { $gte: oneMinuteAgo } }),
            messagesCollection.aggregate([
              { $match: { createdAt: { $gte: fiveMinutesAgo } } },
              { $group: { _id: '$user' } },
              { $count: 'count' }
            ]).toArray()
          ]);
          const activeUsers = activeUserResult[0]?.count || 0;
          
          // Calculate real average response time
          const recentMessages = await messagesCollection.find({
            createdAt: { $gte: fiveMinutesAgo }
          }).sort({ conversationId: 1, createdAt: 1 }).toArray();
          
          let responseTimes: number[] = [];
          let lastUserMsg: any = null;
          
          recentMessages.forEach((msg: any) => {
            if (msg.isCreatedByUser) {
              lastUserMsg = msg;
            } else if (lastUserMsg && msg.conversationId === lastUserMsg.conversationId) {
              const responseTime = (msg.createdAt.getTime() - lastUserMsg.createdAt.getTime()) / 1000;
              if (responseTime < 300) {
                responseTimes.push(responseTime);
              }
              lastUserMsg = null;
            }
          });
          
          // Estimate TTFT as 20% of full response time
          const fullResponseTime = responseTimes.length > 0 
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0;
          const avgResponseTime = fullResponseTime > 0
            ? Math.max(500, Math.round(fullResponseTime * 0.2 * 1000))
            : 0;
          
          const realtimeData = {
            activeNow: activeUsers,
            messagesPerMinute: messagesLastMinute,
            avgResponseTime,
            systemLoad: Math.min((messagesLastMinute / 100) * 100, 100)
          };
          
          socket.emit('metric:realtime', realtimeData);
        } catch (error) {
          console.error('Error sending realtime metrics:', error);
        }
      }, 3000); // Send updates every 3 seconds
      
      // Clean up interval on disconnect
      socket.on('disconnect', () => {
        clearInterval(intervalId);
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Admin client disconnected:', socket.id);
  });
});

// Error handling
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    httpServer.listen(PORT, () => {
      console.log(`Admin Dashboard Backend running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Export for use in other modules
export { io };