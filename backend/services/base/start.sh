#!/bin/bash
# Start the Base MCP Service

# Load environment variables if .env exists
if [ -f /home/mothership/MukkabootAI/.env ]; then
  source /home/mothership/MukkabootAI/.env
fi

# Change to service directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies for Base MCP Service..."
  npm install
fi

# Start the service
echo "Starting Base MCP Service on port ${BASE_MCP_PORT:-3010}..."
NODE_ENV=production node server.js
