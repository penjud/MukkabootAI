#!/bin/bash
# MukkabootAI Core Startup Script
# This script kills any processes using our ports and starts essential services

# Set the project root directory
PROJECT_ROOT="/home/mothership/MukkabootAI"
LOG_DIR="$PROJECT_ROOT/logs"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Helper function for logging
log() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1"
}

log "Starting MukkabootAI core services..."

# Kill all existing Node.js processes in the project
log "Killing all existing Node.js processes in the project..."
pkill -f "node.*MukkabootAI" || log "No existing processes found to kill"

# Wait for processes to terminate
sleep 2

# Create necessary data directories
log "Creating data directories..."
mkdir -p "$PROJECT_ROOT/data/memory"
mkdir -p "$PROJECT_ROOT/data/users"

# Ensure there's a default user
log "Checking for default user..."
if [ ! -f "$PROJECT_ROOT/data/users/users.json" ]; then
    log "Creating default user file..."
    mkdir -p "$PROJECT_ROOT/data/users"
    cat > "$PROJECT_ROOT/data/users/users.json" << EOL
{
  "users": [
    {
      "username": "admin",
      "passwordHash": "\$2b\$10\$gfqQiZM.zk566.F14h.ngO9fAzZgn5K9PObNKTLQK7pRJUYh4t5gC",
      "role": "admin",
      "email": "admin@example.com",
      "createdAt": "$(date -Iseconds)"
    }
  ],
  "refreshTokens": {},
  "passwordResetTokens": {}
}
EOL
    log "Default user file created"
fi

# Start Base Service (must be first)
log "Starting Base Service on port 3010..."
cd "$PROJECT