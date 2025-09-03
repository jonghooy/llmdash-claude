#!/bin/bash

# LibreChat Admin Dashboard Startup Script

echo "========================================="
echo "  LibreChat Admin Dashboard Starter"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites checked${NC}"

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Create missing directories
mkdir -p src/{components,pages,stores,services,hooks,types}
mkdir -p src/components/{Layout,Dashboard,Users,Usage,Settings}

# Start services
echo -e "${GREEN}Starting Admin Dashboard...${NC}"
echo ""
echo "Backend will run on: http://localhost:3090"
echo "Frontend will run on: http://localhost:3091"
echo ""

# Start backend in background
cd ../backend
echo -e "${YELLOW}Starting backend server...${NC}"
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
cd ../frontend
echo -e "${YELLOW}Starting frontend server...${NC}"
npm run start &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}Admin Dashboard is starting...${NC}"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait