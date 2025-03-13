#!/bin/bash
# MukkabootAI Master Startup Script
# This script starts all MukkabootAI services in the correct order
# with proper dependency management and health checks

# Terminal colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Global variables
MAX_RETRIES=5
RETRY_INTERVAL=3
HEALTH_CHECK_INTERVAL=2
LOG_DIR="/home/mothership/MukkabootAI/logs"
BASE_DIR="/home/mothership/MukkabootAI"
DATA_DIR="${BASE_DIR}/data"
ENV_FILE="${BASE_DIR}/.env"

# Create necessary directories
echo -e "${BLUE}Creating necessary directories...${NC}"
mkdir -p ${LOG_DIR}
mkdir -p ${DATA_DIR}/memory
mkdir -p ${DATA_DIR}/users

# Function to check if a service is already running
check_service_running() {
    local port=$1
    local name=$2
    if netstat -tuln | grep ":$port " > /dev/null; then
        echo -e "${YELLOW}Warning: $name is already running on port $port${NC}"
        return 0
    fi
    return 1
}

# Function to start a service with dependencies and health check
start_service() {
    local service_name=$1
    local port=$2
    local dir=$3
    local cmd=$4
    local dependency_port=$5
    local dependency_name=$6
    local log_file="${LOG_DIR}/${service_name}.log"
    
    echo -e "${BLUE}Starting ${service_name}...${NC}"
    
    # Check if service is already running
    if check_service_running $port "$service_name"; then
        echo -e "${GREEN}${service_name} is already running.${NC}"
        return 0
    fi
    
    # Wait for dependency if specified
    if [ ! -z "$dependency_port" ] && [ ! -z "$dependency_name" ]; then
        echo -e "${CYAN}Waiting for ${dependency_name} to be available...${NC}"
        
        local retries=0
        while ! nc -z localhost $dependency_port && [ $retries -lt $MAX_RETRIES ]; do
            echo -e "${YELLOW}${dependency_name} not ready. Retrying in ${RETRY_INTERVAL} seconds... (${retries}/${MAX_RETRIES})${NC}"
            sleep $RETRY_INTERVAL
            ((retries++))
        done
        
        if ! nc -z localhost $dependency_port; then
            echo -e "${RED}Failed to connect to ${dependency_name} after ${MAX_RETRIES} attempts. Aborting ${service_name} startup.${NC}"
            return 1
        fi
        
        echo -e "${GREEN}Successfully connected to ${dependency_name}.${NC}"
    fi
    
    # Create log file if it doesn't exist
    touch $log_file
    
    # Start the service
    echo -e "${CYAN}Executing start command for ${service_name}...${NC}"
    cd $dir
    
    # Check if node_modules exists, if not, install dependencies
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies for ${service_name}...${NC}"
        npm install >> $log_file 2>&1
    fi
    
    # Start the service
    eval "$cmd >> $log_file 2>&1 &"
    local pid=$!
    echo -e "${CYAN}${service_name} started with PID ${pid}${NC}"
    
    # Check if service is running
    echo -e "${CYAN}Checking if ${service_name} is healthy...${NC}"
    local health_check_retries=0
    while ! nc -z localhost $port && [ $health_check_retries -lt $MAX_RETRIES ]; do
        echo -e "${YELLOW}Waiting for ${service_name} to start on port ${port}... (${health_check_retries}/${MAX_RETRIES})${NC}"
        sleep $HEALTH_CHECK_INTERVAL
        ((health_check_retries++))
        
        # Check if process is still running
        if ! ps -p $pid > /dev/null; then
            echo -e "${RED}Process for ${service_name} died. Check the logs at ${log_file} for details.${NC}"
            return 1
        fi
    done
    
    if ! nc -z localhost $port; then
        echo -e "${RED}Failed to start ${service_name} on port ${port}. Check the logs at ${log_file} for details.${NC}"
        return 1
    fi
    
    echo -e "${GREEN}${service_name} is running successfully on port ${port}.${NC}"
    return 0
}

# Load environment variables if they exist
if [ -f "$ENV_FILE" ]; then
    echo -e "${BLUE}Loading environment variables from ${ENV_FILE}...${NC}"
    source $ENV_FILE
else
    echo -e "${YELLOW}Environment file not found at ${ENV_FILE}. Using default values.${NC}"
fi

# Define service ports
BASE_PORT=${BASE_MCP_PORT:-3010}
AUTH_PORT=${AUTH_MCP_PORT:-3013}
MEMORY_PORT=${MEMORY_MCP_PORT:-3011}
FILESYSTEM_PORT=${FILESYSTEM_MCP_PORT:-3012}
BRAVE_SEARCH_PORT=${BRAVE_SEARCH_MCP_PORT:-3014}
OLLAMA_BRIDGE_PORT=${OLLAMA_BRIDGE_PORT:-3015}
FRONTEND_PORT=${FRONTEND_PORT:-3002}

# Start Base Service (No dependencies)
start_service "Base MCP Service" $BASE_PORT "${BASE_DIR}/backend/services/base" "NODE_ENV=production node server.js"

# Start Auth Service (Depends on Base)
start_service "Auth MCP Service" $AUTH_PORT "${BASE_DIR}/backend/services/auth" "NODE_ENV=production node server.js" $BASE_PORT "Base MCP Service"

# Start Memory Service (Depends on Base)
start_service "Memory MCP Service" $MEMORY_PORT "${BASE_DIR}/backend/services/memory" "NODE_ENV=production node server.js" $BASE_PORT "Base MCP Service"

# Start Filesystem Service (Depends on Base)
start_service "Filesystem MCP Service" $FILESYSTEM_PORT "${BASE_DIR}/backend/services/filesystem" "NODE_ENV=production node server.js" $BASE_PORT "Base MCP Service"

# Start Brave Search Service (Depends on Base)
if [ -d "${BASE_DIR}/backend/services/brave-search" ]; then
    start_service "Brave Search MCP Service" $BRAVE_SEARCH_PORT "${BASE_DIR}/backend/services/brave-search" "NODE_ENV=production node server.js" $BASE_PORT "Base MCP Service"
fi

# Start Ollama Bridge Service (Depends on Base)
if [ -d "${BASE_DIR}/backend/services/ollama-bridge" ]; then
    start_service "Ollama Bridge Service" $OLLAMA_BRIDGE_PORT "${BASE_DIR}/backend/services/ollama-bridge" "NODE_ENV=production node server.js" $BASE_PORT "Base MCP Service"
fi

# Start Vue Dashboard (Depends on Auth and other services)
echo -e "${BLUE}Starting Vue Dashboard...${NC}"
if check_service_running $FRONTEND_PORT "Vue Dashboard"; then
    echo -e "${GREEN}Vue Dashboard is already running.${NC}"
else
    cd "${BASE_DIR}/frontend/vue-dashboard"
    
    # Check if node_modules exists, if not, install dependencies
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies for Vue Dashboard...${NC}"
        npm install >> "${LOG_DIR}/vue-dashboard.log" 2>&1
    fi
    
    # Start in production mode if a production build exists
    if [ -d "dist" ] && [ -f "server.js" ]; then
        echo -e "${CYAN}Starting Vue Dashboard in production mode...${NC}"
        NODE_ENV=production node server.js >> "${LOG_DIR}/vue-dashboard.log" 2>&1 &
    else
        echo -e "${CYAN}Starting Vue Dashboard in development mode...${NC}"
        PORT=$FRONTEND_PORT npm run serve >> "${LOG_DIR}/vue-dashboard.log" 2>&1 &
    fi
    
    # Wait for the dashboard to start
    echo -e "${CYAN}Waiting for Vue Dashboard to start...${NC}"
    for i in {1..10}; do
        if nc -z localhost $FRONTEND_PORT; then
            echo -e "${GREEN}Vue Dashboard is running on port ${FRONTEND_PORT}.${NC}"
            break
        fi
        echo -e "${YELLOW}Waiting for Vue Dashboard to start (${i}/10)...${NC}"
        sleep 3
    done
    
    if ! nc -z localhost $FRONTEND_PORT; then
        echo -e "${RED}Failed to start Vue Dashboard. Check logs at ${LOG_DIR}/vue-dashboard.log${NC}"
    fi
fi

# Final status report
echo -e "\n${MAGENTA}======= MukkabootAI Services Status =======${NC}"
printf "${CYAN}%-25s %-10s %-10s${NC}\n" "Service" "Port" "Status"
printf "%-25s %-10s %-10s\n" "---------------------------" "----------" "----------"

# Function to check and report status
check_status() {
    local name=$1
    local port=$2
    if nc -z localhost $port 2>/dev/null; then
        printf "${GREEN}%-25s %-10s %-10s${NC}\n" "$name" "$port" "Running"
        return 0
    else
        printf "${RED}%-25s %-10s %-10s${NC}\n" "$name" "$port" "Not Running"
        return 1
    fi
}

# Check status of all services
check_status "Base MCP Service" $BASE_PORT
check_status "Auth MCP Service" $AUTH_PORT
check_status "Memory MCP Service" $MEMORY_PORT
check_status "Filesystem MCP Service" $FILESYSTEM_PORT
check_status "Brave Search Service" $BRAVE_SEARCH_PORT
check_status "Ollama Bridge Service" $OLLAMA_BRIDGE_PORT
check_status "Vue Dashboard" $FRONTEND_PORT

echo -e "\n${GREEN}MukkabootAI system startup completed.${NC}"
echo -e "${CYAN}Vue Dashboard URL: http://localhost:${FRONTEND_PORT}${NC}"
echo -e "${CYAN}Default Admin Credentials:${NC}"
echo -e "${CYAN}  - Username: admin${NC}"
echo -e "${CYAN}  - Password: password${NC}"
echo -e "\n${YELLOW}Check service logs in ${LOG_DIR} if you encounter any issues.${NC}"
