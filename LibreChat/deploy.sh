#!/bin/bash

#=====================================================================#
#                LibreChat Production Deployment Script               #
#                        50 Users Optimized                          #
#=====================================================================#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-production}
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  LibreChat Deployment Script${NC}"
echo -e "${GREEN}  Environment: ${DEPLOY_ENV}${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓ $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗ $1${NC}"
    exit 1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed"
fi

if ! command_exists npm; then
    print_error "npm is not installed"
fi

if ! command_exists docker; then
    print_error "Docker is not installed"
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed"
fi

print_success "All prerequisites are installed"

# Create backup
print_status "Creating backup..."
mkdir -p "$BACKUP_DIR"

if [ -f .env ]; then
    cp .env "$BACKUP_DIR/.env.backup"
    print_success "Environment file backed up"
fi

if [ -d ./data-node ]; then
    tar -czf "$BACKUP_DIR/mongodb-data.tar.gz" ./data-node 2>/dev/null || true
    print_success "MongoDB data backed up"
fi

# Load environment configuration
print_status "Loading environment configuration..."
if [ "$DEPLOY_ENV" == "production" ]; then
    if [ -f .env.production ]; then
        cp .env.production .env
        print_success "Production environment loaded"
    else
        print_error ".env.production file not found"
    fi
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false
print_success "Dependencies installed"

# Build packages
print_status "Building packages..."
npm run build:data-schemas
npm run build:data-provider
npm run build:api
npm run build:client-package
print_success "Packages built"

# Build frontend
print_status "Building frontend..."
NODE_OPTIONS="--max-old-space-size=4096" npm run frontend
print_success "Frontend built"

# Deploy with Docker Compose
if [ "$DEPLOY_ENV" == "docker" ]; then
    print_status "Deploying with Docker Compose..."
    
    # Stop existing containers
    docker-compose -f docker-compose.production.yml down
    
    # Build and start containers
    docker-compose -f docker-compose.production.yml build
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 10
    
    # Check health status
    if curl -f http://localhost:3080/health >/dev/null 2>&1; then
        print_success "Services are healthy"
    else
        print_error "Health check failed"
    fi
    
# Deploy with PM2
elif [ "$DEPLOY_ENV" == "pm2" ]; then
    print_status "Deploying with PM2..."
    
    # Install PM2 globally if not installed
    if ! command_exists pm2; then
        npm install -g pm2
    fi
    
    # Stop existing PM2 processes
    pm2 stop ecosystem.config.js 2>/dev/null || true
    pm2 delete ecosystem.config.js 2>/dev/null || true
    
    # Start PM2 with cluster mode
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup
    
    print_success "PM2 deployment complete"
    
# Direct Node.js deployment
else
    print_status "Starting services..."
    
    # Start MongoDB if not running
    if ! pgrep -x "mongod" > /dev/null; then
        print_status "Starting MongoDB..."
        mongod --fork --logpath ./logs/mongodb.log --dbpath ./data-node
    fi
    
    # Start Redis if not running
    if ! pgrep -x "redis-server" > /dev/null; then
        print_status "Starting Redis..."
        redis-server --daemonize yes
    fi
    
    # Start application with PM2
    if command_exists pm2; then
        pm2 start ecosystem.config.js --env production
        print_success "Application started with PM2"
    else
        # Fallback to direct node execution
        NODE_ENV=production node api/server/index.js &
        print_success "Application started"
    fi
fi

# Run health check
print_status "Running health check..."
sleep 5

if curl -f http://localhost:3080/health >/dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s http://localhost:3080/health)
    print_success "Health check passed"
    echo -e "${GREEN}Health Status:${NC}"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    print_error "Health check failed"
fi

# Show service status
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Application URL: ${GREEN}http://localhost:3080${NC}"
echo -e "Health Check: ${GREEN}http://localhost:3080/health${NC}"
echo -e "Metrics: ${GREEN}http://localhost:3080/metrics${NC}"

# Show logs location
echo -e "\n${YELLOW}Logs:${NC}"
echo -e "  Application: ./logs/pm2/"
echo -e "  MongoDB: ./logs/mongodb.log"
echo -e "  Nginx: /var/log/nginx/"

# Show PM2 commands (if using PM2)
if command_exists pm2; then
    echo -e "\n${YELLOW}PM2 Commands:${NC}"
    echo -e "  View logs: pm2 logs"
    echo -e "  View status: pm2 status"
    echo -e "  Restart: pm2 restart librechat"
    echo -e "  Stop: pm2 stop librechat"
    echo -e "  Monitoring: pm2 monit"
fi

echo -e "\n${GREEN}Deployment completed successfully!${NC}"