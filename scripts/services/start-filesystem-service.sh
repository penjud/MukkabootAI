#!/bin/bash
# Start the Filesystem MCP Service

# Script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load environment variables
source "$PROJECT_ROOT/.env"

# Wait for Base service to be available
echo "Waiting for Base MCP Service..."
timeout=30
counter=0
while ! nc -z localhost $BASE_MCP_PORT 2>/dev/null; do
  sleep 1
  counter=$((counter + 1))
  if [ $counter -ge $timeout ]; then
    echo "Timeout waiting for Base MCP Service. Starting anyway..."
    break
  fi
  if [ $((counter % 5)) -eq 0 ]; then
    echo "Still waiting for Base MCP Service... ($counter seconds)"
  fi
done

# Change to service directory
cd "$PROJECT_ROOT/backend/services/filesystem"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies for Filesystem MCP Service..."
  npm install
fi

# Ensure data directories exist
mkdir -p "$PROJECT_ROOT/data/uploads"
mkdir -p "$PROJECT_ROOT/data/uploads/avatars"

# Start the service
echo "Starting Filesystem MCP Service on port $FILESYSTEM_MCP_PORT..."
if [ "$1" == "--dev" ]; then
  echo "Starting in development mode with nodemon..."
  npx nodemon server.js
else
  NODE_ENV=production node server.js
fi
