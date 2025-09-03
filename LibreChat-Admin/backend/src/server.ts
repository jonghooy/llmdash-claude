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

// Import middleware
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3091',
    credentials: true
  }
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3091',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/usage', authMiddleware, usageRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);

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