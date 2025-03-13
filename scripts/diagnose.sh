#!/bin/bash
# MukkabootAI System Diagnostic Tool
# Checks the status of all services and reports any issues

# Terminal colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_DIR="/home/mothership/MukkabootAI"
ENV_FILE="${BASE_DIR}/.env"
LOG_DIR="${BASE_DIR}/logs"
DATA_DIR="${BASE_DIR}/data"

echo -e "${BLUE}=== MukkabootAI System Diagnostic Tool ===${NC}"
echo -e "${CYAN}Running diagnostics at $(date)${NC}"

# Load environment variables if they exist
if [ -f "$ENV_FILE" ]; then
  echo -e "${CYAN}Loading environment variables from ${ENV_FILE}...${NC}"
  source "$ENV_FILE"
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

# Function to check if a service is running
check_service() {
  local name=$1
  local port=$2
  local endpoint=$3
  local required=$4
  
  echo -e "${YELLOW}Checking ${name} on port ${port}...${NC}"
  
  # Check if port is in use
  if ! nc -z localhost $port >/dev/null 2>&1; then
    if [ "$required" = "true" ]; then
      echo -e "${RED}[CRITICAL] ${name} is not running on port ${port}${NC}"
    else
      echo -e "${YELLOW}[WARNING] ${name} is not running on port ${port}${NC}"
    fi
    return 1
  fi
  
  # If endpoint is provided, check if it responds
  if [ ! -z "$endpoint" ]; then
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port$endpoint)
    if [ "$response" = "000" ]; then
      echo -e "${RED}[ERROR] ${name} is running but not responding to HTTP requests${NC}"
      return 1
    elif [ "$response" -lt 200 ] || [ "$response" -ge 500 ]; then
      echo -e "${RED}[ERROR] ${name} returned error status code: ${response}${NC}"
      return 1
    fi
  fi
  
  echo -e "${GREEN}[OK] ${name} is running on port ${port}${NC}"
  return 0
}

# Function to check data directory
check_data_dir() {
  local path=$1
  local name=$2
  
  echo -e "${YELLOW}Checking ${name} data directory...${NC}"
  
  if [ ! -d "$path" ]; then
    echo -e "${RED}[ERROR] ${name} data directory does not exist: ${path}${NC}"
    return 1
  fi
  
  # Check if directory is writable
  if [ ! -w "$path" ]; then
    echo -e "${RED}[ERROR] ${name} data directory is not writable: ${path}${NC}"
    return 1
  fi
  
  echo -e "${GREEN}[OK] ${name} data directory exists and is writable: ${path}${NC}"
  return 0
}

# Function to check file existence and permissions
check_file() {
  local path=$1
  local name=$2
  local create=${3:-false}
  
  echo -e "${YELLOW}Checking ${name} file...${NC}"
  
  if [ ! -f "$path" ]; then
    if [ "$create" = "true" ]; then
      echo -e "${YELLOW}[WARNING] ${name} file does not exist, creating it...${NC}"
      mkdir -p "$(dirname "$path")"
      touch "$path"
      if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR] Failed to create ${name} file: ${path}${NC}"
        return 1
      fi
    else
      echo -e "${RED}[ERROR] ${name} file does not exist: ${path}${NC}"
      return 1
    fi
  fi
  
  # Check if file is readable
  if [ ! -r "$path" ]; then
    echo -e "${RED}[ERROR] ${name} file is not readable: ${path}${NC}"
    return 1
  fi
  
  # Check if file is writable
  if [ ! -w "$path" ]; then
    echo -e "${RED}[ERROR] ${name} file is not writable: ${path}${NC}"
    return 1
  fi
  
  echo -e "${GREEN}[OK] ${name} file exists and has correct permissions: ${path}${NC}"
  return 0
}

# Function to check logs directory
check_logs() {
  echo -e "${YELLOW}Checking logs directory...${NC}"
  
  if [ ! -d "$LOG_DIR" ]; then
    echo -e "${YELLOW}[WARNING] Logs directory does not exist, creating it...${NC}"
    mkdir -p "$LOG_DIR"
    if [ $? -ne 0 ]; then
      echo -e "${RED}[ERROR] Failed to create logs directory: ${LOG_DIR}${NC}"
      return 1
    fi
  fi
  
  # Check if directory is writable
  if [ ! -w "$LOG_DIR" ]; then
    echo -e "${RED}[ERROR] Logs directory is not writable: ${LOG_DIR}${NC}"
    return 1
  fi
  
  echo -e "${GREEN}[OK] Logs directory exists and is writable: ${LOG_DIR}${NC}"
  return 0
}

# Function to check node versions
check_node() {
  echo -e "${YELLOW}Checking Node.js installation...${NC}"
  
  if ! command -v node &> /dev/null; then
    echo -e "${RED}[CRITICAL] Node.js is not installed or not in PATH${NC}"
    return 1
  fi
  
  local node_version=$(node -v)
  echo -e "${GREEN}[OK] Node.js is installed: ${node_version}${NC}"
  
  if ! command -v npm &> /dev/null; then
    echo -e "${RED}[CRITICAL] npm is not installed or not in PATH${NC}"
    return 1
  fi
  
  local npm_version=$(npm -v)
  echo -e "${GREEN}[OK] npm is installed: ${npm_version}${NC}"
  
  return 0
}

# Function to check MongoDB (if used)
check_mongodb() {
  echo -e "${YELLOW}Checking MongoDB connectivity...${NC}"
  
  if ! command -v mongosh &> /dev/null; then
    echo -e "${YELLOW}[INFO] MongoDB client is not installed, skipping MongoDB checks${NC}"
    return 0
  fi
  
  # Try to connect to MongoDB
  if ! mongosh --eval "db.serverStatus()" --quiet &> /dev/null; then
    echo -e "${YELLOW}[WARNING] Unable to connect to MongoDB${NC}"
    echo -e "${YELLOW}[INFO] This is OK if using file-based storage${NC}"
    return 0
  fi
  
  echo -e "${GREEN}[OK] MongoDB is running and accessible${NC}"
  return 0
}

# Function to check Auth service users file
check_auth_users() {
  local users_file=${USERS_FILE_PATH:-"${DATA_DIR}/users/users.json"}
  
  echo -e "${YELLOW}Checking Auth service users file...${NC}"
  
  if [ ! -f "$users_file" ]; then
    echo -e "${RED}[ERROR] Users file does not exist: ${users_file}${NC}"
    echo -e "${YELLOW}[FIX] Run ./scripts/reset-auth.sh to create default users${NC}"
    return 1
  fi
  
  # Check if file is valid JSON
  if ! jq . "$users_file" &> /dev/null; then
    echo -e "${RED}[ERROR] Users file is not valid JSON: ${users_file}${NC}"
    echo -e "${YELLOW}[FIX] Run ./scripts/reset-auth.sh to reset users file${NC}"
    return 1
  fi
  
  # Check if admin user exists
  if ! jq -e '.users[] | select(.username == "admin")' "$users_file" &> /dev/null; then
    echo -e "${RED}[ERROR] Admin user not found in users file${NC}"
    echo -e "${YELLOW}[FIX] Run ./scripts/reset-auth.sh to create default admin user${NC}"
    return 1
  fi
  
  echo -e "${GREEN}[OK] Users file exists and contains admin user: ${users_file}${NC}"
  return 0
}

# Header
echo -e "\n${MAGENTA}=== Service Status Check ===${NC}"

# Check all services
check_service "Base Service" $BASE_PORT "/health" true
BASE_STATUS=$?

check_service "Auth Service" $AUTH_PORT "/health" true
AUTH_STATUS=$?

check_service "Memory Service" $MEMORY_PORT "/health" true
MEMORY_STATUS=$?

check_service "Filesystem Service" $FILESYSTEM_PORT "/health" true
FILESYSTEM_STATUS=$?

check_service "Brave Search Service" $BRAVE_SEARCH_PORT "/health" false
BRAVE_STATUS=$?

check_service "Ollama Bridge Service" $OLLAMA_BRIDGE_PORT "/health" false
OLLAMA_STATUS=$?

check_service "Vue Dashboard" $FRONTEND_PORT "/" true
FRONTEND_STATUS=$?

# Check data directories
echo -e "\n${MAGENTA}=== Data Directory Check ===${NC}"
check_data_dir "${DATA_DIR}/users" "Users"
USERS_DIR_STATUS=$?

check_data_dir "${DATA_DIR}/memory" "Memory"
MEMORY_DIR_STATUS=$?

# Check specific files
echo -e "\n${MAGENTA}=== Configuration File Check ===${NC}"
check_file "$ENV_FILE" "Environment config" false
ENV_STATUS=$?

# Check users file
echo -e "\n${MAGENTA}=== Authentication Check ===${NC}"
check_auth_users
USERS_FILE_STATUS=$?

# Check logs directory
echo -e "\n${MAGENTA}=== Logs Check ===${NC}"
check_logs
LOGS_STATUS=$?

# Check Node.js installation
echo -e "\n${MAGENTA}=== System Requirements Check ===${NC}"
check_node
NODE_STATUS=$?

# Check MongoDB
check_mongodb
MONGODB_STATUS=$?

# Summary
echo -e "\n${MAGENTA}=== Diagnostic Summary ===${NC}"
printf "${CYAN}%-30s %-10s${NC}\n" "Component" "Status"
printf "%-30s %-10s\n" "------------------------------" "----------"

status_text() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}FAILED${NC}"
  fi
}

printf "%-30s %-10s\n" "Base Service" "$(status_text $BASE_STATUS)"
printf "%-30s %-10s\n" "Auth Service" "$(status_text $AUTH_STATUS)"
printf "%-30s %-10s\n" "Memory Service" "$(status_text $MEMORY_STATUS)"
printf "%-30s %-10s\n" "Filesystem Service" "$(status_text $FILESYSTEM_STATUS)"
printf "%-30s %-10s\n" "Brave Search Service" "$(status_text $BRAVE_STATUS)"
printf "%-30s %-10s\n" "Ollama Bridge Service" "$(status_text $OLLAMA_STATUS)"
printf "%-30s %-10s\n" "Vue Dashboard" "$(status_text $FRONTEND_STATUS)"
printf "%-30s %-10s\n" "Users Data Directory" "$(status_text $USERS_DIR_STATUS)"
printf "%-30s %-10s\n" "Memory Data Directory" "$(status_text $MEMORY_DIR_STATUS)"
printf "%-30s %-10s\n" "Environment Config" "$(status_text $ENV_STATUS)"
printf "%-30s %-10s\n" "Auth Users File" "$(status_text $USERS_FILE_STATUS)"
printf "%-30s %-10s\n" "Logs Directory" "$(status_text $LOGS_STATUS)"
printf "%-30s %-10s\n" "Node.js Installation" "$(status_text $NODE_STATUS)"

# Recommendations
echo -e "\n${MAGENTA}=== Recommendations ===${NC}"

# Check for critical issues
CRITICAL_ISSUES=false

if [ $BASE_STATUS -ne 0 ] || [ $AUTH_STATUS -ne 0 ] || [ $USERS_FILE_STATUS -ne 0 ]; then
  CRITICAL_ISSUES=true
  echo -e "${RED}Critical issues detected!${NC}"
  
  if [ $BASE_STATUS -ne 0 ]; then
    echo -e "${YELLOW}→ Base Service is not running. Start it with:${NC}"
    echo -e "  cd ${BASE_DIR}/backend/services/base && ./start.sh"
  fi
  
  if [ $AUTH_STATUS -ne 0 ]; then
    echo -e "${YELLOW}→ Auth Service is not running. Start it with:${NC}"
    echo -e "  cd ${BASE_DIR}/backend/services/auth && ./start.sh"
  fi
  
  if [ $USERS_FILE_STATUS -ne 0 ]; then
    echo -e "${YELLOW}→ Auth users file is missing or invalid. Fix it with:${NC}"
    echo -e "  ${BASE_DIR}/scripts/reset-auth.sh"
  fi
  
  echo -e "${YELLOW}→ Or restart all services in the correct order:${NC}"
  echo -e "  ${BASE_DIR}/scripts/start-all-services.sh"
  
  echo -e "\n${YELLOW}To fix authentication issues:${NC}"
  echo -e "  ${BASE_DIR}/scripts/reset-auth.sh"
else
  echo -e "${GREEN}No critical issues detected.${NC}"
fi

# Check for non-critical issues
if [ $MEMORY_STATUS -ne 0 ] || [ $FILESYSTEM_STATUS -ne 0 ] || [ $FRONTEND_STATUS -ne 0 ]; then
  echo -e "${YELLOW}Some non-critical services are not running:${NC}"
  
  if [ $MEMORY_STATUS -ne 0 ]; then
    echo -e "${YELLOW}→ Memory Service is not running. Start it with:${NC}"
    echo -e "  cd ${BASE_DIR}/backend/services/memory && ./start.sh"
  fi
  
  if [ $FILESYSTEM_STATUS -ne 0 ]; then
    echo -e "${YELLOW}→ Filesystem Service is not running. Start it with:${NC}"
    echo -e "  cd ${BASE_DIR}/backend/services/filesystem && ./start.sh"
  fi
  
  if [ $FRONTEND_STATUS -ne 0 ]; then
    echo -e "${YELLOW}→ Vue Dashboard is not running. Start it with:${NC}"
    echo -e "  cd ${BASE_DIR}/frontend/vue-dashboard && ./start.sh"
  fi
fi

# Check for optional services
if [ $BRAVE_STATUS -ne 0 ] || [ $OLLAMA_STATUS -ne 0 ]; then
  echo -e "${YELLOW}Optional services are not running:${NC}"
  
  if [ $BRAVE_STATUS -ne 0 ] && [ -d "${BASE_DIR}/backend/services/brave-search" ]; then
    echo -e "${YELLOW}→ Brave Search Service is not running (optional)${NC}"
  fi
  
  if [ $OLLAMA_STATUS -ne 0 ] && [ -d "${BASE_DIR}/backend/services/ollama-bridge" ]; then
    echo -e "${YELLOW}→ Ollama Bridge Service is not running (optional)${NC}"
  fi
fi

# PM2 recommendation
echo -e "\n${CYAN}For better reliability, consider using PM2 to manage services:${NC}"
echo -e "  pm2 start ${BASE_DIR}/ecosystem.config.js"
echo -e "  pm2 status"

# Authentication details
if [ $AUTH_STATUS -eq 0 ] && [ $USERS_FILE_STATUS -eq 0 ]; then
  echo -e "\n${CYAN}Authentication is working. Default credentials:${NC}"
  echo -e "  - Username: admin"
  echo -e "  - Password: password"
  echo -e "  - Dashboard URL: http://localhost:${FRONTEND_PORT}"
fi

# Final message
echo -e "\n${BLUE}=== Diagnostic completed at $(date) ===${NC}"
if [ $CRITICAL_ISSUES = true ]; then
  echo -e "${RED}Please resolve the critical issues before using the system.${NC}"
else
  echo -e "${GREEN}System appears to be functioning correctly.${NC}"
fi
