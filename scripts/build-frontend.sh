#!/bin/bash
# MukkabootAI Frontend Build Script
# This script builds the Vue dashboard for production use

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
FRONTEND_DIR="${BASE_DIR}/frontend/vue-dashboard"
ENV_FILE="${FRONTEND_DIR}/.env.production"
LOG_FILE="${BASE_DIR}/logs/frontend-build.log"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

echo -e "${BLUE}=== MukkabootAI Frontend Build Script ===${NC}"
echo -e "${CYAN}Starting build process at $(date)${NC}"
echo -e "${CYAN}Log file: ${LOG_FILE}${NC}"

# Function to handle errors
handle_error() {
  echo -e "${RED}ERROR: $1${NC}"
  echo "ERROR: $1" >> "$LOG_FILE"
  exit 1
}

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
  handle_error "Frontend directory not found at $FRONTEND_DIR"
fi

# Change to frontend directory
cd "$FRONTEND_DIR" || handle_error "Failed to change to frontend directory"

# Check for required tools
command -v node >/dev/null 2>&1 || handle_error "Node.js is required but not installed"
command -v npm >/dev/null 2>&1 || handle_error "npm is required but not installed"

# Create or update .env.production file
echo -e "${YELLOW}Creating production environment file...${NC}"
cat > "$ENV_FILE" << EOF
# MukkabootAI Vue Dashboard Production Environment
VITE_BASE_API_URL=http://localhost:3010
VITE_AUTH_API_URL=http://localhost:3013
VITE_MEMORY_API_URL=http://localhost:3011
VITE_FILESYSTEM_API_URL=http://localhost:3012
VITE_BRAVE_SEARCH_API_URL=http://localhost:3014
VITE_OLLAMA_BRIDGE_URL=http://localhost:3015
VITE_MODE=production
EOF

echo -e "${GREEN}Created production environment file at $ENV_FILE${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install --no-fund --no-audit >> "$LOG_FILE" 2>&1 || handle_error "Failed to install dependencies"
echo -e "${GREEN}Dependencies installed successfully${NC}"

# Build for production
echo -e "${YELLOW}Building production version...${NC}"
npm run build >> "$LOG_FILE" 2>&1 || handle_error "Build failed, check log file for details"
echo -e "${GREEN}Production build completed successfully${NC}"

# Ensure server.js is present
echo -e "${YELLOW}Checking for server.js...${NC}"
if [ ! -f "server.js" ]; then
  echo -e "${YELLOW}server.js not found, creating it...${NC}"
  cat > "server.js" << 'EOF'
const express = require('express');
const path = require('path');
const compression = require('compression');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

// Enable compression
app.use(compression());

// Check if the dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('Error: The "dist" directory does not exist.');
  console.error('Please run "npm run build" to create the production build.');
  process.exit(1);
}

// Serve static files from the dist directory
app.use(express.static(distPath));

// For any other request, send the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`MukkabootAI Vue Dashboard running on port ${PORT}`);
  
  // Signal ready for PM2
  if (process.send) {
    process.send('ready');
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
EOF

  # Install express and compression for the server
  echo -e "${YELLOW}Installing express and compression for the server...${NC}"
  npm install express compression --save >> "$LOG_FILE" 2>&1 || handle_error "Failed to install express and compression"
  
  echo -e "${GREEN}Created server.js and installed required dependencies${NC}"
else
  echo -e "${GREEN}server.js already exists${NC}"
fi

# Create start script for production
echo -e "${YELLOW}Creating production start script...${NC}"
cat > "start-production.sh" << 'EOF'
#!/bin/bash
# MukkabootAI Vue Dashboard Production Start Script

cd $(dirname $0)
PORT=${PORT:-3002} NODE_ENV=production node server.js
EOF

chmod +x "start-production.sh"
echo -e "${GREEN}Created production start script${NC}"

# Summary
echo -e "${MAGENTA}=== Build Summary ===${NC}"
echo -e "${GREEN}✓ Production build created at: ${FRONTEND_DIR}/dist${NC}"
echo -e "${GREEN}✓ Production server script: ${FRONTEND_DIR}/server.js${NC}"
echo -e "${GREEN}✓ Start script: ${FRONTEND_DIR}/start-production.sh${NC}"
echo -e "${CYAN}To start the production server, run:${NC}"
echo -e "${CYAN}cd ${FRONTEND_DIR} && ./start-production.sh${NC}"
echo -e "${BLUE}=== Build completed at $(date) ===${NC}"
