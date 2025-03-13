#!/bin/bash
# MukkabootAI Master Startup Script
# This script kills any processes using our ports and starts all services in the correct order

# Set the project root directory
PROJECT_ROOT="/home/mothership/MukkabootAI"
LOG_DIR="$PROJECT_ROOT/logs"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Create a log file for this startup session
STARTUP_LOG="$LOG_DIR/startup-$(date +%Y%m%d-%H%M%S).log"
touch "$STARTUP_LOG"

# Helper function for logging
log() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" | tee -a "$STARTUP_LOG"
}

log "Starting MukkabootAI services cleanup and initialization..."

# Define the ports used by our services
PORTS=(3002 3003 3010 3011 3012 3013 3014 3015)

# Kill processes using our ports
log "Killing any processes using our ports..."
for PORT in "${PORTS[@]}"; do
  # Find process using the port
  PID=$(lsof -ti:$PORT)
  if [ ! -z "$PID" ]; then
    log "Killing process $PID using port $PORT"
    kill -9 $PID 2>/dev/null || log "Failed to kill process on port $PORT"
  else
    log "No process found on port $PORT"
  fi
done

# Sleep a moment to ensure all processes are terminated
sleep 2

# Create necessary data directories
log "Creating data directories..."
mkdir -p "$PROJECT_ROOT/data/memory"
mkdir -p "$PROJECT_ROOT/data/users"

# Start Base Service (must be first)
log "Starting Base Service on port 3010..."
cd "$PROJECT_ROOT/backend/services/base"
node server.js > "$LOG_DIR/base.log" 2>&1 &
BASE_PID=$!
log "Base Service started with PID: $BASE_PID"

# Wait for Base Service to be ready
log "Waiting for Base Service to be fully operational..."
sleep 5

# Verify Base Service is running
if ! curl -s http://localhost:3010/health > /dev/null; then
  attempts=0
  while ! curl -s http://localhost:3010/health > /dev/null && [ $attempts -lt 5 ]; do
    log "Base Service not responding yet, waiting..."
    sleep 3
    attempts=$((attempts+1))
  done
  
  if [ $attempts -eq 5 ]; then
    log "WARNING: Could not verify Base Service is running. Continuing anyway..."
  else
    log "Base Service is responding."
  fi
fi

# Start Auth Service
log "Starting Auth Service on port 3013..."
cd "$PROJECT_ROOT/backend/services/auth"
node src/index.js > "$LOG_DIR/auth.log" 2>&1 &
AUTH_PID=$!
log "Auth Service started with PID: $AUTH_PID"

# Start Memory Service
log "Starting Memory Service on port 3011..."
cd "$PROJECT_ROOT/backend/services/memory"

# Check if node_modules exists, if not, install dependencies
if [ ! -d "node_modules" ]; then
  log "Installing dependencies for Memory Service..."
  npm install
fi

# Start the service with explicit environment variables
PORT=3011 NODE_ENV=production node server.js > "$LOG_DIR/memory.log" 2>&1 &
MEMORY_PID=$!
log "Memory Service started with PID: $MEMORY_PID"

# Verify Memory Service has started
sleep 3
if lsof -ti:3011 > /dev/null; then
  log "Memory Service successfully started"
else
  log "WARNING: Memory Service may not have started properly!"
fi

# Start Filesystem Service
log "Starting Filesystem Service on port 3012..."
cd "$PROJECT_ROOT/backend/services/filesystem"
node server.js > "$LOG_DIR/filesystem.log" 2>&1 &
FS_PID=$!
log "Filesystem Service started with PID: $FS_PID"

# Check if brave-search service exists and start it
if [ -d "$PROJECT_ROOT/backend/services/brave-search" ]; then
  log "Starting Brave Search Service on port 3014..."
  cd "$PROJECT_ROOT/backend/services/brave-search"
  node server.js > "$LOG_DIR/brave-search.log" 2>&1 &
  BRAVE_PID=$!
  log "Brave Search Service started with PID: $BRAVE_PID"
fi

# Check if ollama-bridge service exists and start it
if [ -d "$PROJECT_ROOT/backend/services/ollama-bridge" ]; then
  log "Starting Ollama Bridge Service on port 3015..."
  cd "$PROJECT_ROOT/backend/services/ollama-bridge"
  node server.js > "$LOG_DIR/ollama-bridge.log" 2>&1 &
  OLLAMA_PID=$!
  log "Ollama Bridge Service started with PID: $OLLAMA_PID"
fi

# Wait for all backend services to start
log "Waiting for all backend services to initialize..."
sleep 15

# Test the auth endpoint directly to ensure it's working
AUTH_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3013/health || echo "failed")
if [ "$AUTH_TEST" = "200" ]; then
  log "Auth service is responding correctly"
else
  log "WARNING: Auth service health check failed with code: $AUTH_TEST"
fi

# Start Vue frontend
log "Starting Vue Dashboard on port 3002..."
cd "$PROJECT_ROOT/frontend/vue-dashboard"
PORT=3002 npm run dev -- --port 3002 > "$LOG_DIR/frontend-dev.log" 2>&1 &
FRONTEND_PID=$!
log "Vue Dashboard started with PID: $FRONTEND_PID"

# Verify all services are running
log "Verifying services..."

# Function to check if a port is in use
check_port() {
  port=$1
  service=$2
  if lsof -ti:$port > /dev/null; then
    log "✅ $service is running on port $port"
    return 0
  else
    log "❌ $service is NOT running on port $port"
    return 1
  fi
}

sleep 5

# Check all core services
check_port 3010 "Base Service"
check_port 3013 "Auth Service"
check_port 3011 "Memory Service"
check_port 3012 "Filesystem Service"
check_port 3002 "Vue Dashboard"

# Optional services
if [ -d "$PROJECT_ROOT/backend/services/brave-search" ]; then
  check_port 3014 "Brave Search Service"
fi

if [ -d "$PROJECT_ROOT/backend/services/ollama-bridge" ]; then
  check_port 3015 "Ollama Bridge Service"
fi

# Final message
log "All services have been started."
log "Vue Dashboard should be available at: http://localhost:3002"
log "Login with default credentials: username: admin, password: password"
log "Reminder: After login, navigate to http://localhost:3002/ if directed to /dashboard"
log "For monitoring services, check log files in: $LOG_DIR"

# Display PIDs for manual management if needed
echo ""
log "Service PIDs for manual management:"
log "Base Service: $BASE_PID"
log "Auth Service: $AUTH_PID"
log "Memory Service: $MEMORY_PID"
log "Filesystem Service: $FS_PID"
log "Vue Dashboard: $FRONTEND_PID"
if [ -d "$PROJECT_ROOT/backend/services/brave-search" ]; then
  log "Brave Search Service: $BRAVE_PID"
fi
if [ -d "$PROJECT_ROOT/backend/services/ollama-bridge" ]; then
  log "Ollama Bridge Service: $OLLAMA_PID"
fi

echo ""
log "To stop all services: pkill -f \"node.*MukkabootAI\""
log "Startup completed successfully."
