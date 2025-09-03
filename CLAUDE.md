# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### LibreChat (Main Chat Application)
```bash
# Development
cd LibreChat
npm ci                    # Install dependencies (use this instead of npm install)
npm run backend:dev      # Start backend with hot reload (port 3080)
npm run frontend:dev     # Start frontend with hot reload (port 3090)

# Production
npm run backend          # Start backend in production mode
npm run frontend         # Build and serve frontend

# Testing
npm run test:api         # Run API tests
npm run test:client      # Run client tests
npm run e2e             # Run e2e tests
npm run e2e:headed      # Run e2e tests with browser visible

# Linting & Formatting
npm run lint            # Check code style
npm run lint:fix        # Auto-fix code style issues
npm run format          # Format code with Prettier

# User Management
npm run create-user     # Create a new user
npm run reset-password  # Reset user password
npm run ban-user        # Ban a user
npm run list-users      # List all users
```

### API Relay Server (Cursor IDE Integration)
```bash
# Development
cd api-relay-server
npm install
npm run dev             # Start with hot reload (port 4000)

# Production
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

## Architecture Overview

### Project Structure
The repository contains three interconnected projects:

1. **LibreChat** - The main chat application
   - Multi-model LLM interface (OpenAI, Anthropic, Google, etc.)
   - User authentication and conversation management
   - Plugin system with tools and agents
   - MongoDB for data persistence
   - Express API with React frontend

2. **API Relay Server** - Intelligent API proxy
   - Converts between OpenAI and Anthropic formats
   - Tracks usage per team/user
   - Provides Cursor IDE integration
   - TypeScript Express server
   - SSE streaming support

3. **LibreChat Admin Dashboard** - Management interface
   - User CRUD operations
   - Usage analytics and cost tracking
   - Real-time monitoring
   - TypeScript backend with React Material-UI frontend

### Key Technical Details

#### Database
- MongoDB is used across all services
- Connection string: `mongodb://localhost:27017/LibreChat`
- Models are in `LibreChat/api/models/`
- Key collections: Users, Conversations, Messages, Transactions, Agents, Files

#### Authentication
- JWT-based authentication
- Sessions stored in MongoDB
- Rate limiting on auth endpoints
- Admin dashboard has separate auth from main LibreChat

#### API Integration Points
- LibreChat API: `http://localhost:3080/api/`
- Relay Server: `http://localhost:4000/v1/` (OpenAI compatible)
- Admin API: `http://localhost:5001/api/`

#### Frontend Technologies
- LibreChat: React 18, Recoil state management, Tailwind CSS, Radix UI
- Admin Dashboard: React 18, Material-UI, Zustand, Recharts

#### Testing Approach
- Unit tests: Jest with React Testing Library
- API tests: Jest with supertest
- E2E tests: Playwright
- Test files follow `*.test.{js,ts,tsx}` or `*.spec.js` pattern

### Environment Configuration

Each project requires its own `.env` file:

#### LibreChat (.env)
- `MONGO_URI` - MongoDB connection string
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` - LLM provider keys
- JWT and session secrets
- Various feature flags and limits

#### API Relay Server (.env)
- LLM provider API keys
- `RELAY_API_KEYS` - Comma-separated list of authorized API keys

#### Admin Dashboard Backend (.env)
- `MONGODB_URI` - MongoDB connection
- `JWT_SECRET` - Authentication secret
- Admin credentials

### Cursor IDE Integration
Configure Cursor to use the relay server:
- Base URL: `http://localhost:4000/v1`
- API Key: Use a key from `RELAY_API_KEYS` in relay server .env

### Important Patterns

#### Code Organization
- Controllers handle HTTP requests
- Services contain business logic
- Models define data schemas
- Middleware for auth, rate limiting, error handling
- Shared packages in `LibreChat/packages/`

#### State Management
- LibreChat uses Recoil for complex state
- Admin uses Zustand for simpler state
- React Query for server state synchronization

#### Real-time Features
- Server-Sent Events (SSE) for streaming responses
- Socket.io in admin dashboard for live updates

#### File Handling
- Files stored in MongoDB GridFS or local filesystem
- Support for images, documents, and code files
- Processing for vector search and embeddings