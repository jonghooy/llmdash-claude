# How to Run LibreChat Locally

## Prerequisites

Before running LibreChat, ensure you have the following installed:

- **Node.js** (v18+ recommended)
- **npm** or **yarn** package manager
- **MongoDB** (v4.4+ recommended)
- **Git** (for cloning the repository)

### Optional Prerequisites
- **MeiliSearch** (for search functionality)
- **Redis** (for caching and improved performance)

## Quick Start Guide

### 1. Clone the Repository

```bash
git clone https://github.com/danny-avila/LibreChat.git
cd LibreChat
```

### 2. Install Dependencies

```bash
npm install
```

This will install all dependencies for the root project and all workspaces (api, client, packages).

### 3. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

**Essential configurations to update in `.env`:**

```bash
# MongoDB Connection (required)
MONGO_URI=mongodb://127.0.0.1:27017/LibreChat

# Add your API keys for the services you want to use:
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
GOOGLE_KEY=your-google-api-key-here

# Server Configuration
HOST=localhost
PORT=3080

# Domain Configuration
DOMAIN_CLIENT=http://localhost:3080
DOMAIN_SERVER=http://localhost:3080
```

### 4. Build Required Packages

Build the necessary packages before running:

```bash
# Build all required packages
npm run build:data-schemas
npm run build:data-provider
npm run build:api
npm run build:client-package
```

Or build everything at once:

```bash
npm run frontend
```

### 5. Start MongoDB

Make sure MongoDB is running:

**macOS (with Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Windows:**
```bash
mongod
```

### 6. Run LibreChat

You have several options for running LibreChat:

#### Option A: Development Mode (with hot-reload)

Run both backend and frontend in separate terminals:

**Terminal 1 - Backend:**
```bash
npm run backend:dev
```

**Terminal 2 - Frontend:**
```bash
npm run frontend:dev
```

- Backend will run on: http://localhost:3080
- Frontend dev server will run on: http://localhost:3090

#### Option B: Production Mode

Build and run the production version:

```bash
# Build the frontend
npm run frontend

# Run the backend in production mode
npm run backend
```

Access the application at: http://localhost:3080

#### Option C: Using Docker (Alternative)

If you prefer Docker:

```bash
docker-compose up
```

## Configuring AI Models

### OpenAI Models

Add to `.env`:
```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
OPENAI_MODELS=gpt-5,gpt-4o,gpt-4o-mini,gpt-3.5-turbo
```

### Anthropic Claude Models

Add to `.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
ANTHROPIC_MODELS=claude-4.1,claude-3-5-sonnet-20241022,claude-3-opus-20240229
```

### Google Models

Add to `.env`:
```bash
GOOGLE_KEY=your-google-api-key
# For Gemini models
GOOGLE_MODELS=gemini-2.0-flash,gemini-2.0-flash-lite
```

## Performance Optimizations

For better performance, the following optimizations have been applied:

1. **Streaming optimizations** in `/api/app/clients/TextStream.js`:
   - Removed artificial delays
   - Increased chunk sizes

2. **Frontend optimizations** in `/client/src/hooks/Messages/useMessageProcess.tsx`:
   - Reduced throttling for smoother updates

3. **Optional: Enable Redis caching**:
   ```bash
   USE_REDIS=true
   REDIS_URI=redis://127.0.0.1:6379
   ```

## Troubleshooting

### Common Issues and Solutions

#### 1. MongoDB Connection Error
**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:** Ensure MongoDB is running:
```bash
# Check MongoDB status
brew services list | grep mongodb  # macOS
sudo systemctl status mongod       # Linux
```

#### 2. Missing Dependencies
**Error:** `Cannot find module '@librechat/data-schemas'`

**Solution:** Build the required packages:
```bash
npm run build:data-schemas
npm run build:data-provider
npm run build:api
npm run build:client-package
```

#### 3. Port Already in Use
**Error:** `Error: listen EADDRINUSE: address already in use :::3080`

**Solution:** 
- Change the port in `.env`:
  ```bash
  PORT=3081
  ```
- Or kill the process using the port:
  ```bash
  lsof -ti:3080 | xargs kill -9
  ```

#### 4. API Key Errors
**Error:** `401 Unauthorized` when using AI models

**Solution:** Verify your API keys in `.env` are correct and have proper permissions.

#### 5. Frontend Not Loading
**Error:** `Cannot GET /` or blank page

**Solution:** Build the frontend first:
```bash
npm run frontend
```

## Available Scripts

### Development
- `npm run backend:dev` - Start backend with hot-reload
- `npm run frontend:dev` - Start frontend dev server
- `npm run backend:stop` - Stop backend server

### Production
- `npm run backend` - Start backend in production mode
- `npm run frontend` - Build frontend for production

### Utilities
- `npm run update` - Update dependencies
- `npm run create-user` - Create a new user
- `npm run reset-password` - Reset user password
- `npm run list-users` - List all users

### Database
- `npm run reset-meili-sync` - Reset MeiliSearch sync
- `npm run flush-cache` - Clear cache

## Environment Variables Reference

### Essential Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/LibreChat` |
| `HOST` | Server host | `localhost` |
| `PORT` | Server port | `3080` |
| `JWT_SECRET` | JWT token secret | (auto-generated) |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | (auto-generated) |

### AI Service Keys

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | For OpenAI models |
| `ANTHROPIC_API_KEY` | Anthropic API key | For Claude models |
| `GOOGLE_KEY` | Google API key | For Gemini models |
| `AZURE_API_KEY` | Azure OpenAI key | For Azure OpenAI |

### Optional Services

| Variable | Description | Default |
|----------|-------------|---------|
| `USE_REDIS` | Enable Redis caching | `false` |
| `REDIS_URI` | Redis connection string | - |
| `MEILI_HOST` | MeiliSearch host | `http://0.0.0.0:7700` |
| `MEILI_MASTER_KEY` | MeiliSearch master key | - |

## Accessing the Application

Once running, you can access LibreChat at:

- **Main Application:** http://localhost:3080
- **Login/Register:** http://localhost:3080/login
- **API Documentation:** http://localhost:3080/api/docs (if enabled)

### Default Login

If registration is disabled, you may need to create a user manually:

```bash
npm run create-user
```

Follow the prompts to create an admin user.

## Stopping the Application

### Development Mode
- Press `Ctrl+C` in each terminal running the servers

### Production Mode
- Press `Ctrl+C` in the terminal running the backend
- Or use: `npm run backend:stop`

### Docker
```bash
docker-compose down
```

## Additional Resources

- **Official Documentation:** https://www.librechat.ai/docs
- **GitHub Repository:** https://github.com/danny-avila/LibreChat
- **Discord Community:** https://discord.librechat.ai
- **Configuration Guide:** https://www.librechat.ai/docs/configuration/dotenv

## Performance Tips

1. **Enable Redis** for caching and better performance
2. **Use production mode** for deployment
3. **Configure proper indexes** in MongoDB
4. **Set up a reverse proxy** (nginx/Apache) for production
5. **Enable compression** in your web server
6. **Use CDN** for static assets in production

## Security Recommendations

1. **Change default secrets** in `.env`:
   - Generate new JWT_SECRET and JWT_REFRESH_SECRET
   - Use the tool at: https://www.librechat.ai/toolkit/creds_generator

2. **Enable HTTPS** in production:
   - Use a reverse proxy with SSL certificates
   - Update DOMAIN_CLIENT and DOMAIN_SERVER to use https://

3. **Restrict MongoDB access**:
   - Use authentication for MongoDB
   - Limit network access to MongoDB

4. **API Key Security**:
   - Never commit `.env` file to version control
   - Use environment-specific configurations
   - Rotate API keys regularly

## Need Help?

If you encounter issues not covered here:

1. Check the [official documentation](https://www.librechat.ai/docs)
2. Search existing [GitHub issues](https://github.com/danny-avila/LibreChat/issues)
3. Join the [Discord community](https://discord.librechat.ai)
4. Create a new issue on GitHub with detailed error information