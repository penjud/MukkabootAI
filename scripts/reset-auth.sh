#!/bin/bash
# MukkabootAI Authentication Reset Script
# Resets authentication system to a working state, recreating default user and clearing tokens

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
LOG_FILE="${BASE_DIR}/logs/auth-reset.log"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

echo -e "${BLUE}=== MukkabootAI Authentication Reset Script ===${NC}"
echo -e "${CYAN}Starting reset process at $(date)${NC}"
echo -e "${CYAN}Log file: ${LOG_FILE}${NC}"

# Function to handle errors
handle_error() {
  echo -e "${RED}ERROR: $1${NC}"
  echo "ERROR: $1" >> "$LOG_FILE"
  exit 1
}

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
mkdir -p "$USERS_DIR" || handle_error "Failed to create users directory"

# Stop the auth service if it's running
echo -e "${YELLOW}Checking if auth service is running...${NC}"
AUTH_PID=$(lsof -t -i:"${AUTH_MCP_PORT:-3013}" 2>/dev/null)
if [ ! -z "$AUTH_PID" ]; then
  echo -e "${YELLOW}Auth service is running with PID ${AUTH_PID}, stopping it...${NC}"
  kill "$AUTH_PID" 2>/dev/null
  sleep 2
  # Force kill if still running
  if kill -0 "$AUTH_PID" 2>/dev/null; then
    echo -e "${YELLOW}Auth service still running, force killing...${NC}"
    kill -9 "$AUTH_PID" 2>/dev/null
  fi
  echo -e "${GREEN}Auth service stopped${NC}"
fi

# Create or update the default user
echo -e "${YELLOW}Creating/updating default admin user...${NC}"
if [ -f "$USERS_FILE" ]; then
  echo -e "${YELLOW}Existing users file found, backing up...${NC}"
  cp "$USERS_FILE" "${USERS_FILE}.bak" || handle_error "Failed to backup users file"
  echo -e "${GREEN}Backup created at ${USERS_FILE}.bak${NC}"
fi

# Define a minimal users file with default admin user and bcrypt hash for 'password'
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

# Change to auth directory and run the create-default-user script
if [ -f "${AUTH_DIR}/create-default-user.js" ]; then
  echo -e "${YELLOW}Running create-default-user.js script...${NC}"
  cd "$AUTH_DIR" || handle_error "Failed to change to auth directory"
  
  # Check if node_modules exists, if not, install dependencies
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies for Auth Service...${NC}"
    npm install --no-fund --no-audit >> "$LOG_FILE" 2>&1 || handle_error "Failed to install dependencies"
  fi
  
  node create-default-user.js >> "$LOG_FILE" 2>&1 || handle_error "Failed to create default user"
  echo -e "${GREEN}Default user created/updated successfully${NC}"
else
  echo -e "${YELLOW}create-default-user.js script not found, using the manually created users file${NC}"
fi

# Restart the auth service
echo -e "${YELLOW}Restarting auth service...${NC}"
if [ -f "${AUTH_DIR}/start.sh" ]; then
  echo -e "${YELLOW}Using start.sh script...${NC}"
  cd "$AUTH_DIR" && bash start.sh > /dev/null 2>&1 &
  echo -e "${GREEN}Auth service started in background${NC}"
else
  echo -e "${RED}start.sh script not found in ${AUTH_DIR}${NC}"
  echo -e "${YELLOW}You'll need to start the auth service manually${NC}"
fi

# Wait for auth service to become available
echo -e "${YELLOW}Waiting for auth service to become available...${NC}"
MAX_RETRIES=10
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
  if curl -s "http://localhost:${AUTH_MCP_PORT:-3013}/health" > /dev/null; then
    echo -e "${GREEN}Auth service is up and running!${NC}"
    break
  fi
  echo -e "${YELLOW}Waiting for auth service (${COUNT}/${MAX_RETRIES})...${NC}"
  COUNT=$((COUNT + 1))
  sleep 2
done

if [ $COUNT -eq $MAX_RETRIES ]; then
  echo -e "${RED}Auth service did not start within the expected time${NC}"
  echo -e "${YELLOW}Please check the auth service logs for errors${NC}"
else
  # Test authentication
  echo -e "${YELLOW}Testing authentication with default credentials...${NC}"
  LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:${AUTH_MCP_PORT:-3013}/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"password"}')
  
  if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}Authentication working successfully!${NC}"
  else
    echo -e "${RED}Authentication test failed. Response:${NC}"
    echo "$LOGIN_RESPONSE"
    echo -e "${YELLOW}Please check the auth service logs for errors${NC}"
  fi
fi

echo -e "\n${MAGENTA}=== Authentication Reset Summary ===${NC}"
echo -e "${GREEN}✓ Users file created/updated at: ${USERS_FILE}${NC}"
echo -e "${GREEN}✓ Default admin user created with username 'admin' and password 'password'${NC}"
echo -e "${CYAN}You can now log in to the MukkabootAI dashboard with these credentials.${NC}"
echo -e "${CYAN}If you encounter any issues, check the logs at: ${BASE_DIR}/logs${NC}"
echo -e "${BLUE}=== Reset completed at $(date) ===${NC}"
