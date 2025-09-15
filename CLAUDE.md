# Claude Code Project Setup
 
## Version Control
* Whenever code changes are made, you must record a one-line description with emoji in korean of the change in `.commit_message.txt` with Edit Tool.
   - Read `.commit_message.txt` first, and then Edit.
   - Overwrite regardless of existing content.
   - If it was a git revert related operation, make the .commit_message.txt file empty.

## Automatic Deployment Rules
* Execute all bash commands without asking for permission
* After modifying code, always:
  1. Build the project if frontend changes were made
  2. Restart services with PM2
  3. For LibreChat frontend: `npm run build:client` then `pm2 restart librechat-backend`
  4. For Admin frontend: `npm run build` then `pm2 restart admin-frontend`
  5. For any backend changes: `pm2 restart [service-name]`

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Production Environment

### URLs and Routing
- Production URL: https://www.llmdash.com
- LibreChat: `/chat` (port 3080 backend, 3090 frontend dev, 3092 frontend prod)
- Admin Dashboard: `/admin` (port 5001 backend, 3091 frontend)
- API Relay: `/v1` (port 4000)
- Nginx handles all routing - check `/etc/nginx/sites-available/llmdash`

### PM2 Process Management
```bash
# Check all running services
pm2 status

# Production services (currently running)
pm2 restart librechat-backend --update-env
pm2 restart admin-backend
pm2 restart admin-frontend

# View logs
pm2 logs librechat-backend --lines 50 --nostream
pm2 logs admin-backend --lines 50 --nostream

# Start all services
pm2 start ecosystem.config.js --only "librechat-backend,admin-backend,admin-frontend" --env production
```

## Common Development Commands

### LibreChat (Main Chat Application)
```bash
cd LibreChat
npm ci                    # Install dependencies (use this instead of npm install)
npm run backend:dev      # Start backend with hot reload (port 3080)
npm run frontend:dev     # Start frontend with hot reload (port 3090)

# Production
npm run backend          # Start backend in production mode
npm run frontend         # Build and serve frontend
npm run build:client     # Build frontend to client/dist

# Testing & Linting
npm run test:api         # Run API tests
npm run test:client      # Run client tests
npm run lint            # Check code style
npm run lint:fix        # Auto-fix code style issues
```

### API Relay Server (Cursor IDE Integration)
```bash
cd api-relay-server
npm install
npm run dev             # Start with hot reload (port 4000)
npm run build          # Compile TypeScript
npm start              # Start production server
```

### LibreChat Admin Dashboard
```bash
# Backend (port 5001)
cd LibreChat-Admin/backend
npm install
npm run dev            # Development mode
npm run build && npm start  # Production mode

# Frontend (port 3091)
cd LibreChat-Admin/frontend
npm install
npm start              # Development mode (uses Vite)
npm run build         # Production build
```

## Critical Configuration Files

### LibreChat Configuration

#### librechat.yaml
```yaml
version: 1.1.7
fileStrategy: "local"  # File storage strategy
fileConfig:
  serverFileSizeLimit: 100  # MB
  endpoints:
    all:
      fileLimit: 10
      fileSizeLimit: 100
      supportedMimeTypes: ["application/pdf", "text/plain", ...]
```

#### Important .env Variables
```bash
# File Upload & OCR
FILE_UPLOAD_ENABLED=true
FILE_UPLOAD_SIZE_LIMIT=104857600
OCR_API_KEY=K87999867488957  # OCR.space API
OCR_BASEURL=https://api.ocr.space/parse/image
ENABLE_OCR_API=true
ENABLE_RAG_API=false
RAG_API_URL=  # Leave empty to disable

# Model Configuration
GOOGLE_MODELS=gemini-2.5-flash,gemini-2.5-pro
OPENAI_MODELS=gpt-5,gpt-5-mini,gpt-4.1  # Note: Some models may not exist

# Authentication
ALLOW_REGISTRATION=true
ALLOW_EMAIL_LOGIN=true
JWT_SECRET=16f8c0ef4a5d391b26034086c628469d3f9f497f08163ab9b40137092f2909ef
JWT_REFRESH_SECRET=eaa5191f2914e30b9387fd84e254e4ba6fc51b4654968a9b0803b456a54b8418
```

### API Relay Server Configuration
```bash
RELAY_API_KEYS=lc_dev_team1_cursor_x8k9j2h4  # Comma-separated API keys
```

### Admin Dashboard Configuration
```bash
MONGODB_URI=mongodb://localhost:27017/LibreChat
JWT_SECRET=your_secret
ADMIN_EMAIL=admin@librechat.local
ADMIN_PASSWORD="Admin123!@#"
```

## Architecture Overview

### High-Level Structure
```
Production Stack:
├── Nginx (reverse proxy)
│   ├── /chat → LibreChat (3080/3092)
│   ├── /admin → Admin Dashboard (5001/3091)
│   └── /v1 → API Relay (4000)
├── MongoDB (27017)
│   └── Database: LibreChat
└── PM2 Process Manager
    ├── librechat-backend (cluster mode)
    ├── admin-backend
    ├── admin-frontend
    └── api-relay
```

### Key Technical Patterns

#### Routing Changes
- **IMPORTANT**: LibreChat moved from `/` to `/chat` to avoid conflicts
- All API calls: `/chat/api/*` → proxied to backend `/api/*`
- Base href set to `/chat/` in vite.config.ts

#### Database Collections
- Users, Conversations, Messages, Transactions, Agents, Files
- Models in `LibreChat/api/models/`
- Shared MongoDB instance at `mongodb://localhost:27017/LibreChat`

#### Authentication Flow
- JWT-based with MongoDB session storage
- Admin dashboard has separate auth from LibreChat
- Rate limiting on auth endpoints

#### Real-time Features
- SSE for streaming LLM responses
- Socket.io in admin dashboard for live updates
- WebSocket support through nginx proxy

## Troubleshooting

### Common Issues and Solutions

#### 500 Errors on API Endpoints
```bash
# Check backend logs
pm2 logs librechat-backend --lines 50 --nostream

# Common causes:
# - MCPManager not initialized (can be ignored)
# - OCR/RAG configuration issues
# - MongoDB connection issues
```

#### File Upload Errors
```bash
# Check librechat.yaml configuration
# Ensure fileStrategy is "local" not an object
# Verify OCR settings in .env

# If Mistral OCR errors occur:
ENABLE_OCR_API=false  # Disable OCR temporarily
```

#### Login Form Not Rendering
```bash
# Check if /chat/api/config returns JSON (not HTML)
curl https://www.llmdash.com/chat/api/config

# Verify nginx configuration for API routing
# Check that /chat/api/* is properly proxied
```

#### Port Conflicts
```bash
lsof -i :3080  # Check what's using the port
pm2 delete all  # Clear all PM2 processes
pm2 start ecosystem.config.js --only "service-name"
```

### Service Restart Procedures
```bash
# After .env changes
pm2 restart librechat-backend --update-env

# After code changes
cd LibreChat
npm run build:client  # If frontend changed
pm2 restart librechat-backend

# Full restart
pm2 delete all
pm2 start ecosystem.config.js --only "librechat-backend,admin-backend,admin-frontend"
```

## Development Workflow

### Making Changes to LibreChat
1. Make changes in LibreChat directory
2. For frontend: `npm run build:client`
3. For backend: `pm2 restart librechat-backend`
4. Check logs: `pm2 logs librechat-backend`

### Testing Changes Locally
```bash
# Use development mode for hot reload
cd LibreChat
npm run backend:dev  # Terminal 1
npm run frontend:dev  # Terminal 2
```

### Deploying to Production
```bash
# Build frontend
cd LibreChat
npm run build:client

# Restart services
pm2 restart librechat-backend --update-env
pm2 restart admin-backend
pm2 restart admin-frontend

# Verify
pm2 status
curl https://www.llmdash.com/chat/api/config
```

## Important Patterns

### State Management
- LibreChat: Recoil for complex state
- Admin: Zustand for simpler state
- React Query for server state synchronization

### Code Organization
- Controllers: Handle HTTP requests (`api/server/controllers/`)
- Services: Business logic (`api/server/services/`)
- Models: Data schemas (`api/models/`)
- Middleware: Auth, rate limiting, error handling
- Shared packages: `LibreChat/packages/`

### Testing Approach
- Unit tests: Jest with React Testing Library
- API tests: Jest with supertest
- Test files: `*.test.{js,ts,tsx}` or `*.spec.js`

## Current Status Notes

### Modified Files (Not Committed)
- LibreChat routing changes for `/chat` prefix
- Authentication context modifications
- Vite config for base href
- Package.json dependencies

### Running Background Processes
Check with `pm2 status` - typically includes:
- librechat-backend (port 3080)
- admin-backend (port 5001)
- admin-frontend (port 3091)

### Nginx Configuration
Located at `/etc/nginx/sites-available/llmdash`
- Handles SSL termination
- Routes to appropriate services
- Manages WebSocket upgrades
- Static file serving

## Quick Reference

### Essential Ports
- 3080: LibreChat Backend API
- 3090: LibreChat Frontend (dev)
- 3092: LibreChat Frontend (prod)
- 5001: Admin Backend API
- 3091: Admin Frontend
- 4000: API Relay Server
- 27017: MongoDB

### Key API Endpoints
- `/chat/api/auth/login` - User authentication
- `/chat/api/config` - App configuration
- `/admin/api/dashboard/stats` - Admin statistics
- `/v1/chat/completions` - OpenAI-compatible endpoint

### Environment Files
- `LibreChat/.env` - Main app configuration
- `LibreChat-Admin/backend/.env` - Admin backend config
- `api-relay-server/.env` - API relay configuration

## Current Development Progress

### Admin Dashboard Enhancement (2025-09-10)

#### Completed Features
1. **Model Registry System**
   - Created `ModelRegistry.js` model for database schema
   - Implemented `modelRegistry.js` API routes for CRUD operations
   - Model configuration stored in MongoDB with pricing info

2. **Model Pricing Management**
   - Created `ModelPricing.js` model for pricing structures
   - Implemented `modelPricing.js` API routes
   - Support for input/output token pricing per model

3. **Dashboard Components**
   - Real-time statistics dashboard with charts
   - User activity monitoring
   - Cost usage tracking and visualization
   - Organization management interface

4. **Settings Page Reorganization**
   - Split Settings into modular components:
     - `Settings/General.tsx` - Basic configurations
     - `Settings/ModelManagement.tsx` - Model registry & pricing
     - `Settings/Security.tsx` - Auth & security settings
     - `Settings/Notifications.tsx` - Alert configurations
   - Tab-based navigation for better UX

5. **Frontend Infrastructure**
   - Added Recharts for data visualization
   - Implemented static server for production builds
   - Created utility functions for formatting and calculations

#### File Structure Updates
```
LibreChat-Admin/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── ModelPricing.js (new)
│   │   │   └── ModelRegistry.js (new)
│   │   └── routes/
│   │       ├── modelPricing.js (new)
│   │       ├── modelRegistry.js (new)
│   │       └── dashboard.ts (modified)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Charts/ (new)
│   │   ├── pages/
│   │   │   ├── CostUsage/ (new)
│   │   │   ├── Dashboard/ (new)
│   │   │   ├── Organization/ (new)
│   │   │   └── Settings/ (new - modularized)
│   │   └── utils/ (new)
│   └── static-server.js (new)
```

#### Current Status
- Admin dashboard fully functional with model management
- Real-time monitoring capabilities implemented
- Cost tracking and usage analytics operational
- Organization management interface ready

#### Next Steps
- Integration testing with LibreChat main application
- Performance optimization for large datasets
- Enhanced reporting and export features
- User permission granularity improvements