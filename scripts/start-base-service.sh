#!/bin/bash
# Start the Base MCP Service

# Set script directory as current
cd "$(dirname "$0")/../backend/services/base"

# Load environment variables
if [ -f "../../../.env" ]; then
  source ../../../.env
else
  echo "Warning: .env file not found"
fi

# Create log directory
mkdir -p ../../../logs

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies for Base MCP Service..."
  npm install
fi

# Start the service
echo "Starting Base MCP Service on port ${BASE_MCP_PORT:-3010}..."
NODE_ENV=${NODE_ENV:-production} node server.js
