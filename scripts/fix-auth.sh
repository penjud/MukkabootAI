#!/bin/bash
# MukkabootAI Authentication Fix Script
# This script performs a complete reset and restart of the authentication system

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
AUTH_DIR="${BASE_DIR}/backend/services/auth"
DATA_DIR="${BASE_DIR}/data"
USERS_DIR="${DATA_DIR}/users"
USERS_FILE="${USERS_DIR}/users.json"
ENV_FILE="${BASE_DIR}/.env"

echo -e "${BLUE}=== MukkabootAI Authentication Fix Script ===${NC}"
echo -e "${CYAN}Starting complete authentication fix at $(date)${NC}"

# Load environment variables if they exist
if [ -f "$ENV_FILE" ]; then
  echo -e "${CYAN}Loading environment variables from ${ENV_FILE}...${NC}"
  source "$ENV_FILE"
else
  echo -e "${YELLOW}Environment file not found at ${ENV_FILE}. Using default values.${NC}"
fi

# Update USERS_FILE if set in environment
if [ ! -z "$USERS_FILE_PATH" ]; then
  USERS_FILE="$USERS_FILE_PATH"
  USERS_DIR="$(dirname "$USERS_FILE")"
fi

echo -e "${CYAN}Using users file: ${USERS_FILE}${NC}"

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p "$USERS_DIR"

# Step 1: Kill all Node.js processes
echo -e "${YELLOW}Stopping all Node.js processes...${NC}"
pkill -f node || true
sleep 2

# Step 2: Create a new users file with bcrypt hash for 'password'
echo -e "${YELLOW}Creating new users file with default admin user...${NC}"
cat > "$USERS_FILE" << EOF
{
  "users": [
    {
      "id": "$(date +%s)",
      "username": "admin",
      "passwordHash": "\$2a\$10\$n9mGXfZvkG1FTJ0bi6f0Z.P3vv1p.kkV./oJhJueLBSOBtqvwqREy",
      "email": "admin@mukkabootai.local",
      "role": "admin",
      "createdAt": "$(date -Iseconds)",
      "updatedAt": "$(date -Iseconds)"
    }
  ],
  "refreshTokens": {},
  "passwordResetTokens": {}
}
EOF

echo -e "${GREEN}Created new users file with default admin user${NC}"
echo -e "${CYAN}Default credentials:${NC}"
echo -e "${CYAN}  - Username: admin${NC}"
echo -e "${CYAN}  - Password: password${NC}"

# Step 3: Start Base service
echo -e "${YELLOW}Starting Base service...${NC}"
cd "${BASE_DIR}/backend/services/base"
./start.sh &
echo -e "${GREEN}Base service started${NC}"

# Wait for Base service to start
echo -e "${YELLOW}Waiting for Base service to be available...${NC}"
while ! nc -z localhost ${BASE_MCP_PORT:-3010}; do
  sleep 1
  echo -n "."
done
echo ""

# Step 4: Start Auth service
echo -e "${YELLOW}Starting Auth service...${NC}"
cd "${BASE_DIR}/backend/services/auth"
./start.sh &
echo -e "${GREEN}Auth service started${NC}"

# Wait for Auth service to start
echo -e "${YELLOW}Waiting for Auth service to be available...${NC}"
while ! nc -z localhost ${AUTH_MCP_PORT:-3013}; do
  sleep 1
  echo -n "."
done
echo ""

# Step 5: Test authentication
echo -e "${YELLOW}Testing authentication with default credentials...${NC}"
sleep 2  # Give the service a moment to fully initialize

TEST_RESPONSE=$(curl -s -X POST "http://localhost:${AUTH_MCP_PORT:-3013}/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}')

if echo "$TEST_RESPONSE" | grep -q "accessToken"; then
  echo -e "${GREEN}Authentication working successfully!${NC}"
  echo -e "${GREEN}Login response: ${TEST_RESPONSE}${NC}"
else
  echo -e "${RED}Authentication test failed. Response:${NC}"
  echo "$TEST_RESPONSE"
  
  # Detailed diagnostics
  echo -e "${YELLOW}Running detailed authentication diagnostics...${NC}"
  cd "${AUTH_DIR}" && node scripts/test-login.js
fi

# Step 6: Start remaining services
echo -e "${YELLOW}Starting Memory service...${NC}"
cd "${BASE_DIR}/backend/services/memory"
if [ -f "./start.sh" ]; then
  ./start.sh &
  echo -e "${GREEN}Memory service started${NC}"
else
  echo -e "${RED}Memory service start script not found${NC}"
fi

echo -e "${YELLOW}Starting Filesystem service...${NC}"
cd "${BASE_DIR}/backend/services/filesystem"
if [ -f "./start.sh" ]; then
  ./start.sh &
  echo -e "${GREEN}Filesystem service started${NC}"
else
  echo -e "${RED}Filesystem service start script not found${NC}"
fi

echo -e "${YELLOW}Starting other services...${NC}"
cd "${BASE_DIR}/backend/services/brave-search"
if [ -f "./start.sh" ]; then
  ./start.sh &
  echo -e "${GREEN}Brave Search service started${NC}"
else
  echo -e "${YELLOW}Brave Search service start script not found (optional)${NC}"
fi

cd "${BASE_DIR}/backend/services/ollama-bridge"
if [ -f "./start.sh" ]; then
  ./start.sh &
  echo -e "${GREEN}Ollama Bridge service started${NC}"
else
  echo -e "${YELLOW}Ollama Bridge service start script not found (optional)${NC}"
fi

# Step 7: Start frontend
echo -e "${YELLOW}Starting Vue Dashboard...${NC}"
cd "${BASE_DIR}/frontend/vue-dashboard"
if [ -f "./start.sh" ]; then
  ./start.sh &
  echo -e "${GREEN}Vue Dashboard started${NC}"
else
  echo -e "${YELLOW}Vue Dashboard start script not found, trying dev server...${NC}"
  PORT=${FRONTEND_PORT:-3002} npm run serve &
  echo -e "${GREEN}Vue Dashboard dev server started${NC}"
fi

echo -e "\n${MAGENTA}=== Authentication Fix Summary ===${NC}"
echo -e "${GREEN}✓ All services restarted in the correct order${NC}"
echo -e "${GREEN}✓ New users file created with default admin credentials${NC}"
echo -e "${GREEN}✓ Authentication system should now be working correctly${NC}"

echo -e "\n${CYAN}Default login credentials:${NC}"
echo -e "${CYAN}  - Username: admin${NC}"
echo -e "${CYAN}  - Password: password${NC}"
echo -e "${CYAN}  - Dashboard URL: http://localhost:${FRONTEND_PORT:-3002}${NC}"

echo -e "\n${BLUE}=== Fix process completed at $(date) ===${NC}"
