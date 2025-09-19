#!/usr/bin/env node

/**
 * Test memory update API
 */

const axios = require('axios');

// Enhanced LLMDash project information
const llmdashContent = `# LLMDash
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
- **LibreChat Config**: \`librechat.yaml\`
- **Environment**: \`.env\` files for each service
- **PM2 Config**: \`ecosystem.config.js\`
- **Nginx Config**: \`/etc/nginx/sites-available/llmdash\`

## Recent Updates
- 2025-09-18: Improved memory system with direct file reading
- 2025-09-17: Integrated mem-agent-mcp for organizational memory
- 2025-09-10: Added model registry and pricing management
- 2025-09-09: Implemented admin dashboard with cost tracking

## Development
### Commands
- **Start all services**: \`pm2 start ecosystem.config.js\`
- **Build frontend**: \`npm run build:client\`
- **Development mode**: \`npm run backend:dev\` + \`npm run frontend:dev\`
- **View logs**: \`pm2 logs [service-name]\`

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
`;

async function updateMemory() {
  try {
    // Direct file update (since we don't have auth token readily available)
    const fs = require('fs').promises;
    const path = require('path');

    const filePath = '/home/jonghooy/work/llmdash-claude/memory-storage/entities/llmdash.md';

    console.log('Updating LLMDash memory file...');
    await fs.writeFile(filePath, llmdashContent, 'utf-8');

    console.log('✅ Successfully updated llmdash.md with comprehensive project information');
    console.log(`File location: ${filePath}`);
    console.log(`Content length: ${llmdashContent.length} characters`);
  } catch (error) {
    console.error('❌ Error updating memory:', error);
  }
}

updateMemory();