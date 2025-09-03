# LLMDash Claude - Complete LLM Management Platform

A comprehensive platform for managing Large Language Model services, including LibreChat, API relay server, and admin dashboard.

## 🚀 Projects Overview

### 1. LibreChat (`/LibreChat`)
The main chat application for interacting with various LLM providers.
- Multi-model support (OpenAI, Anthropic, Google, etc.)
- User management and authentication
- Conversation history and management
- Plugin system and tools

### 2. API Relay Server (`/api-relay-server`)
An intelligent API proxy for tracking and managing LLM API usage.
- **Cursor IDE Integration**: Use GPT & Claude models through Cursor
- **Usage Tracking**: Monitor API calls and token usage
- **Format Conversion**: Automatic OpenAI ↔ Anthropic format conversion
- **Team Authentication**: Manage multiple teams and users

### 3. LibreChat Admin Dashboard (`/LibreChat-Admin`)
Comprehensive admin panel for managing LibreChat users and monitoring usage.
- **User Management**: CRUD operations for users
- **Usage Analytics**: Token usage, costs, and statistics
- **Real-time Monitoring**: Live dashboard with metrics
- **Settings Management**: System configuration

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript, Material-UI
- **Database**: MongoDB
- **Authentication**: JWT
- **Real-time**: Server-Sent Events (SSE)
- **LLM Providers**: OpenAI, Anthropic Claude

## 📁 Repository Structure
```
llmdash_claude/
├── LibreChat/               # Main chat application
│   ├── api/                # Backend API
│   ├── client/              # React frontend
│   └── packages/            # Shared packages
│
├── api-relay-server/        # API Relay & Proxy Server
│   ├── src/
│   │   ├── handlers/       # Request handlers
│   │   ├── middleware/     # Auth & tracking
│   │   └── server.ts       # Main server
│   └── docs/               # Documentation
│
└── LibreChat-Admin/         # Admin Dashboard
    ├── backend/             # Express API
    └── frontend/            # React UI
```

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/jonghooy/llmdash-claude.git
cd llmdash-claude
```

### 2. Start LibreChat
```bash
cd LibreChat
npm ci
npm run backend  # Port 3080
npm run frontend # Port 3090
```

### 3. Start API Relay Server
```bash
cd api-relay-server
npm install
npm run dev      # Port 4000
```

### 4. Start Admin Dashboard
```bash
# Backend
cd LibreChat-Admin/backend
npm install
npm run dev      # Port 5001

# Frontend
cd LibreChat-Admin/frontend
npm install
npm run dev      # Port 3091
```

## 🔧 Configuration

### LibreChat (.env)
```env
MONGO_URI=mongodb://localhost:27017/LibreChat
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
```

### API Relay Server (.env)
```env
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
RELAY_API_KEYS=lc_dev_team1_cursor_x8k9j2h4
```

### Admin Dashboard (.env)
```env
MONGODB_URI=mongodb://localhost:27017/LibreChat
JWT_SECRET=your_secret
ADMIN_EMAIL=admin@librechat.local
ADMIN_PASSWORD="Admin123!@#"
```

## 🎯 Cursor IDE Integration

1. Open Cursor Settings (Cmd+,)
2. Search for "OpenAI"
3. Configure:
   - **Base URL**: `http://localhost:4000/v1`
   - **API Key**: `lc_dev_team1_cursor_x8k9j2h4`
4. Now you can use both GPT and Claude models!

## 📊 Features

### LibreChat
- ✅ Multi-model conversations
- ✅ User authentication
- ✅ Conversation management
- ✅ Plugin support
- ✅ File uploads
- ✅ Export/Import conversations

### API Relay Server
- ✅ OpenAI API compatibility
- ✅ Anthropic Claude support
- ✅ Usage tracking per team/user
- ✅ Request logging
- ✅ SSE streaming support
- ✅ Automatic format conversion

### Admin Dashboard
- ✅ User CRUD operations
- ✅ Usage statistics
- ✅ Cost analysis
- ✅ Real-time monitoring
- ✅ Token usage tracking
- ✅ System settings

## 🔗 API Endpoints

### LibreChat API
- `POST /api/auth/login` - User login
- `GET /api/conversations` - Get conversations
- `POST /api/ask` - Send message
- `GET /api/models` - Available models

### Relay Server API
- `GET /health` - Health check
- `GET /v1/models` - List models
- `POST /v1/chat/completions` - Chat completion
- `GET /v1/usage` - Usage stats

### Admin API
- `POST /api/auth/login` - Admin login
- `GET /api/dashboard/stats` - Dashboard stats
- `GET /api/users` - User management
- `GET /api/usage/stats` - Usage analytics

## 📈 Performance Optimization

- MongoDB connection pooling (50 connections)
- Redis caching for sessions
- Optimized SSE streaming
- PM2 clustering for production
- Docker support

## 🐳 Docker Support

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

ISC License

## 📞 Support

For issues and questions, please create an issue in the GitHub repository.

---
Built with ❤️ for better LLM management