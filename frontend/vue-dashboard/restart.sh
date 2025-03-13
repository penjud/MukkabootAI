#!/bin/bash
# Restart script for MukkabootAI Vue Dashboard

# Log function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if running in development or production mode
if [ "$1" == "prod" ]; then
  MODE="production"
else
  MODE="development"
fi

log "Restarting MukkabootAI Vue Dashboard in $MODE mode..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  log "Installing dependencies..."
  npm install
  if [ $? -ne 0 ]; then
    log "ERROR: Failed to install dependencies. Please check npm error messages."
    exit 1
  fi
  log "Dependencies installed successfully."
fi

# Check for existing process
PID=$(pgrep -f "node.*$(basename "$SCRIPT_DIR")")
if [ ! -z "$PID" ]; then
  log "Stopping existing process (PID: $PID)..."
  kill -15 $PID
  sleep 2
  
  # Force kill if still running
  if ps -p $PID > /dev/null; then
    log "Process didn't exit gracefully, force killing..."
    kill -9 $PID
  fi
fi

# Start the application
if [ "$MODE" == "production" ]; then
  # Production mode uses the built files
  log "Building for production..."
  npm run build
  
  log "Starting production server..."
  NODE_ENV=production nohup node server.js > ../logs/vue-dashboard.log 2>&1 &
else
  # Development mode uses the Vite dev server
  log "Starting development server..."
  nohup npm run dev > ../logs/vue-dashboard-dev.log 2>&1 &
fi

NEW_PID=$!
log "Vue Dashboard started with PID: $NEW_PID"
log "Log file: ../logs/vue-dashboard${MODE == 'production' ? '' : '-dev'}.log"

# Create a PID file for easy management
echo $NEW_PID > .pid

log "Restart complete!"
