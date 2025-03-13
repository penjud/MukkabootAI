#!/bin/bash
# Start the Vue Dashboard

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

# Change to Vue dashboard directory
cd "$PROJECT_ROOT/frontend/vue-dashboard"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies for Vue Dashboard..."
  npm install
fi

# Start the Vue dashboard
if [ "$1" == "--dev" ]; then
  echo "Starting Vue Dashboard in development mode..."
  npm run dev
else
  echo "Starting Vue Dashboard..."
  if [ ! -d "dist" ]; then
    echo "Building production version..."
    npm run build
  fi
  npm run serve
fi
