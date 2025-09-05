# System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        U1[Users/Chat Interface]
        U2[Admin Users]
        C1[Cursor IDE]
    end

    subgraph "Gateway Layer"
        NGINX[Nginx<br/>Reverse Proxy<br/>:80/:443]
        subgraph "Routes"
            R1[/ → LibreChat:3090]
            R2[/api → LibreChat:3080]
            R3[/admin → Admin:3091]
            R4[/admin/api → Admin:5001]
            R5[/v1 → Relay:4000]
        end
    end

    subgraph "Application Layer"
        subgraph "LibreChat (Port 3080/3090)"
            LC_FE[React Frontend<br/>:3090]
            LC_BE[Express Backend<br/>:3080]
            LC_FE -->|API Calls| LC_BE
        end

        subgraph "LibreChat Admin (Port 3091/5001)"
            LA_FE[React Material-UI<br/>:3091]
            LA_BE[TypeScript Backend<br/>:5001]
            LA_FE -->|API Calls| LA_BE
        end

        subgraph "API Relay Server (Port 4000)"
            RS[TypeScript Express<br/>:4000]
            RS_CONV[Format Converter<br/>OpenAI ↔ Anthropic]
            RS_TRACK[Usage Tracker]
            RS --> RS_CONV
            RS --> RS_TRACK
        end
    end

    subgraph "Data Layer"
        DB[(MongoDB<br/>:27017/LibreChat)]
        subgraph "Collections"
            COL1[Users]
            COL2[Conversations]
            COL3[Messages]
            COL4[Transactions]
            COL5[Agents]
            COL6[Files/GridFS]
        end
        
        REDIS[(Redis<br/>:6379)]
        subgraph "Cache Storage"
            CACHE1[Sessions]
            CACHE2[Rate Limiting]
            CACHE3[API Response Cache]
            CACHE4[User Tokens]
        end
    end

    subgraph "External Services"
        OAI[OpenAI API]
        ANT[Anthropic API]
        GOO[Google API]
        OTHER[Other LLM APIs]
    end

    %% User Connections through Nginx
    U1 -->|HTTPS| NGINX
    U2 -->|HTTPS| NGINX
    C1 -->|HTTPS| NGINX

    %% Nginx Routing
    NGINX -->|Proxy Pass| LC_FE
    NGINX -->|Proxy Pass| LC_BE
    NGINX -->|Proxy Pass| LA_FE
    NGINX -->|Proxy Pass| LA_BE
    NGINX -->|Proxy Pass| RS

    %% LibreChat Connections
    LC_BE -->|Query/Update| DB
    LC_BE -->|Cache/Session| REDIS
    LC_BE -->|Direct API Calls| OAI
    LC_BE -->|Direct API Calls| ANT
    LC_BE -->|Direct API Calls| GOO
    LC_BE -->|Direct API Calls| OTHER

    %% Admin Dashboard Connections
    LA_BE -->|Query/Update| DB
    LA_BE -->|Cache/Session| REDIS
    LA_BE -->|Socket.io| LA_FE

    %% API Relay Connections
    RS -->|Converted Requests| OAI
    RS -->|Converted Requests| ANT
    RS -->|Cache/Rate Limit| REDIS
    RS_TRACK -->|Log Usage| DB

    %% Database Details
    DB --> COL1
    DB --> COL2
    DB --> COL3
    DB --> COL4
    DB --> COL5
    DB --> COL6
    
    %% Redis Details
    REDIS --> CACHE1
    REDIS --> CACHE2
    REDIS --> CACHE3
    REDIS --> CACHE4

    style NGINX fill:#d4edda
    style LC_FE fill:#e1f5fe
    style LC_BE fill:#bbdefb
    style LA_FE fill:#fff3e0
    style LA_BE fill:#ffe0b2
    style RS fill:#f3e5f5
    style DB fill:#c8e6c9
    style REDIS fill:#ffcdd2
```

## Component Details

### 1. **Nginx Gateway (Entry Point)**
- **Port 80/443**: HTTPS termination & SSL certificates
- **Reverse Proxy Routes**:
  - `/` → LibreChat Frontend (3090)
  - `/api` → LibreChat Backend (3080)
  - `/admin` → Admin Frontend (3091)
  - `/admin/api` → Admin Backend (5001)
  - `/v1` → API Relay Server (4000)
- **Features**:
  - Load balancing
  - SSL/TLS termination
  - Request rate limiting
  - CORS handling
  - WebSocket proxy for real-time features
  - Static file caching

### 2. **LibreChat (Main Application)**
- **Frontend (Port 3090)**
  - React 18 with Recoil state management
  - Tailwind CSS + Radix UI components
  - Real-time chat interface with SSE streaming
  
- **Backend (Port 3080)**
  - Express.js API server
  - JWT authentication
  - Multi-model LLM support
  - Plugin system for tools/agents
  - Direct connections to LLM providers

### 3. **LibreChat Admin Dashboard**
- **Frontend (Port 3091)**
  - React 18 with Material-UI
  - Zustand for state management
  - Recharts for analytics visualization
  
- **Backend (Port 5001)**
  - TypeScript Express server
  - Separate admin authentication
  - Socket.io for real-time updates
  - User management & analytics APIs

### 4. **API Relay Server (Port 4000)**
- OpenAI-compatible endpoint (`/v1/`)
- Format conversion between OpenAI ↔ Anthropic
- Usage tracking per team/user
- SSE streaming support
- Cursor IDE integration point

### 5. **Data Storage**

#### **MongoDB Database (Port 27017)**
- Shared database across all services
- Key collections:
  - **Users**: Authentication & profiles
  - **Conversations**: Chat sessions
  - **Messages**: Individual messages
  - **Transactions**: Usage & billing
  - **Agents**: Custom AI agents
  - **Files**: GridFS for attachments

#### **Redis Cache (Port 6379)**
- High-performance in-memory data store
- Key usage:
  - **Sessions**: JWT token storage & validation
  - **Rate Limiting**: API request throttling per user/IP
  - **API Response Cache**: Frequently accessed data
  - **User Tokens**: Active session management
- Features:
  - TTL-based expiration
  - Pub/Sub for real-time updates
  - Distributed locking for concurrency control

### 6. **Data Flow**
1. **Chat Flow**: User → Nginx → LibreChat Frontend → Backend → LLM APIs → Response
2. **Admin Flow**: Admin → Nginx → Admin Frontend → Admin Backend → MongoDB
3. **Cursor Flow**: Cursor IDE → Nginx → Relay Server → Format Conversion → LLM APIs
4. **Usage Tracking**: All API calls → Transaction logs in MongoDB

### 7. **Key Features**
- **Authentication**: JWT-based with MongoDB session storage
- **Real-time**: SSE for chat streaming, Socket.io for admin updates
- **Monitoring**: Usage analytics and cost tracking
- **Scalability**: Microservices architecture with shared database