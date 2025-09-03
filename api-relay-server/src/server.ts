import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { chatCompletionsHandler } from './handlers/chatCompletions';
import { modelsHandler } from './handlers/models';
import { authMiddleware } from './middleware/auth';
import { usageTracker } from './middleware/usage';
import { errorHandler } from './middleware/error';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins for testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));

// Logging
if (process.env.LOG_REQUESTS === 'true') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'API Relay Server',
    version: '1.0.0'
  });
});

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  console.log(`[HEADERS]`, req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`[BODY]`, JSON.stringify(req.body).substring(0, 200));
  }
  next();
});

// OpenAI Compatible API Routes
// These routes are what Cursor will call
app.post('/v1/chat/completions', authMiddleware, usageTracker, chatCompletionsHandler);
app.get('/v1/models', authMiddleware, modelsHandler);

// Test endpoints without auth (for debugging)
app.post('/test/chat/completions', (req, res, next) => {
  console.log('[TEST] Request without auth - adding fake auth header');
  req.headers.authorization = 'Bearer lc_dev_team1_cursor_x8k9j2h4';
  next();
}, authMiddleware, usageTracker, chatCompletionsHandler);

// Anthropic Compatible Routes (future)
app.post('/anthropic/v1/messages', authMiddleware, usageTracker, (req, res) => {
  res.status(501).json({ error: 'Anthropic support coming soon' });
});

// Usage statistics endpoint
app.get('/v1/usage', authMiddleware, (req, res) => {
  // Return usage stats for the API key
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  res.json({
    apiKey: apiKey?.substring(0, 10) + '...',
    usage: {
      requests_today: 42,
      tokens_today: 15000,
      requests_this_month: 1337,
      tokens_this_month: 500000
    }
  });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║           API Relay Server for Cursor MVP             ║
╠═══════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}            ║
║                                                       ║
║  Cursor Configuration:                               ║
║  1. Open Cursor Settings (Cmd+,)                     ║
║  2. Search for "OpenAI"                              ║
║  3. Set Base URL: http://localhost:${PORT}/v1           ║
║  4. Set API Key: lc_dev_team1_cursor_x8k9j2h4       ║
║                                                       ║
║  Test with: curl http://localhost:${PORT}/health       ║
╚═══════════════════════════════════════════════════════╝
  `);
});