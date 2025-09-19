# LLMDash
- relationship: Main Project
- type: Multi-Model AI Chat Platform
- description: Enterprise-grade AI chat platform based on LibreChat with advanced memory integration
- version: 2.0.0
- status: Production
- url: https://www.llmdash.com

## Technologies
- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React, Vite, Tailwind CSS, Recoil
- **Process Management**: PM2 (cluster mode)
- **Reverse Proxy**: Nginx
- **Authentication**: JWT-based with refresh tokens
- **File Storage**: Local filesystem with OCR support
- **Memory System**: mem-agent-mcp with vLLM backend

## Architecture
### Services
1. **LibreChat Backend** (Port 3080)
   - Main API server
   - Handles chat conversations
   - Integrates with multiple LLM providers
   - Memory context injection via OrgMemory service

2. **LibreChat Frontend** (Port 3090/3092)
   - React-based UI
   - Real-time chat interface
   - File upload with OCR support
   - Responsive design

3. **Admin Dashboard Backend** (Port 5001)
   - Administrative API
   - User management
   - Model registry and pricing
   - Usage statistics

4. **Admin Dashboard Frontend** (Port 3091)
   - Admin UI built with React
   - Real-time monitoring
   - Cost usage tracking
   - Organization management

5. **API Relay Server** (Port 4000)
   - OpenAI-compatible API endpoint
   - Cursor IDE integration
   - API key management
   - Request routing to LibreChat

6. **Memory System (mem-agent-mcp)** (Port 8001)
   - vLLM-based memory service
   - Obsidian-style markdown storage
   - Context retrieval for conversations
   - Direct file reading for accuracy

## Features
### Core Features
- **Multiple LLM Support**: OpenAI (GPT-4, GPT-5), Claude, Gemini, Mistral
- **Conversation Management**: Save, search, export conversations
- **File Processing**: Upload and process PDFs, images with OCR
- **Memory Integration**: Automatic context injection from organizational memory
- **Admin Controls**: User management, model configuration, usage tracking

### Advanced Features
- **Model Registry**: Dynamic model configuration and pricing
- **Cost Tracking**: Per-user and per-model usage monitoring
- **Team Collaboration**: Shared conversations and memory
- **API Compatibility**: OpenAI-compatible API for external tools
- **Real-time Updates**: WebSocket support for streaming responses

## Deployment
### URLs
- **Main Application**: https://www.llmdash.com/chat
- **Admin Dashboard**: https://www.llmdash.com/admin
- **API Endpoint**: https://www.llmdash.com/v1

### Infrastructure
- **Server**: Ubuntu Linux with Nginx
- **Database**: MongoDB (local instance)
- **GPU**: RTX 5090 for vLLM inference
- **SSL**: Let's Encrypt certificates

## Configuration Files
- **LibreChat Config**: `librechat.yaml`
- **Environment**: `.env` files for each service
- **PM2 Config**: `ecosystem.config.js`
- **Nginx Config**: `/etc/nginx/sites-available/llmdash`

## Recent Updates
- 2025-09-18: Improved memory system with direct file reading
- 2025-09-17: Integrated mem-agent-mcp for organizational memory
- 2025-09-10: Added model registry and pricing management
- 2025-09-09: Implemented admin dashboard with cost tracking

## Development
### Commands
- **Start all services**: `pm2 start ecosystem.config.js`
- **Build frontend**: `npm run build:client`
- **Development mode**: `npm run backend:dev` + `npm run frontend:dev`
- **View logs**: `pm2 logs [service-name]`

## Integration Points
- **Cursor IDE**: Via API relay server at /v1 endpoint
- **Memory System**: Automatic context injection in conversations
- **Admin API**: REST endpoints for management operations
- **File Processing**: OCR.space API integration

## Security
- JWT authentication with refresh tokens
- Rate limiting on API endpoints
- Path traversal protection
- MongoDB injection prevention
- CORS configuration for production domains

## Performance
- PM2 cluster mode with 4 workers
- Response caching for static content
- Optimized MongoDB queries with indexes
- Lazy loading for frontend components
- GPU acceleration for memory inference

## Update 2025-09-18 19:10
런칭 예정일: 2025년 12월 31일 (MCP 툴을 통해 업데이트됨)

## Update 2025-09-17
베타 테스트 참가자 100명 모집 중

## Update 2025-09-17
새로운 Claude 3.5 Sonnet 모델 추가

## Update 2025-09-17
월간 활성 사용자 1,000명 돌파

## Update 2025-09-17
첫 번째 유료 고객 획득 (Enterprise Plan)


## Update: 2025-09-18 09:40:22

### MCP Integration Test Results (2025-09-18 09:40:22)

**Test Summary:**
- MCP interface successfully connected
- Memory read operations verified
- Memory write operations functional
- File modification via add_memory tool confirmed

**Technical Details:**
- MCP Protocol: stdio-based communication
- Backend: vLLM server on port 8001
- Memory Storage: Markdown files in /home/jonghooy/work/llmdash-claude/memory-storage
- Entity Update Method: Append mode with timestamp

**Test Status:** ✅ PASSED

*** 2015.9.13. Check Manual Update is Valid. **


## Update: 2025-09-18 12:22:22

## Direct MCP Test - 2025-09-18T03:22:22.129Z

**Launch Date**: December 3rd, 2024 (Updated via Direct MCP Client)

### MCP Protocol Status
- Direct Python execution: ✅ WORKING
- MCP tools integration: ✅ SUCCESS
- Memory persistence: ✅ VERIFIED

Updated at: 2025-09-18T03:22:22.129Z

## Update 2025-09-18 19:15
### 최근 개발 진행사항

**MCP 서버 접근 알림 기능 추가**
- MCP 서버 접속 시 사용자에게 실시간 알림 표시
- SSE(Server-Sent Events)를 통한 상태 메시지 전송
- 메모리 업데이트 과정의 투명성 확보

**알림 메시지 종류**:
- 🔄 [MCP 서버 접속 중] - 서비스 연결 시작
- ✅ MCP 서버 연결 성공
- 📝 메모리 업데이트 진행 중
- ✅ 메모리 업데이트 완료
- ❌ 오류 발생 시 상세 메시지

**기술 구현**:
- MemoryUpdateTool에 sendEvent 통합
- handleTools.js에서 response 객체 전달
- 실시간 사용자 피드백 제공


## Update: 2025-09-18 21:13:36
- 인퍼런스 속도: 질의당 약 0.25초 (속도 최적화됨, 기존 0.35초에서 개선)

## Update 2025-09-18
해줘

## Update 2025-09-18
해줘

## Update 2025-09-18
해줘
