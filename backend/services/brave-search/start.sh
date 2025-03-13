#!/bin/bash
# Start the Brave Search Service for MukkabootAI

# Load environment variables if .env exists
if [ -f /home/mothership/MukkabootAI/.env ]; then
  source /home/mothership/MukkabootAI/.env
fi

# Wait for Base service to be available
echo "Waiting for Base Service..."
while ! nc -z localhost ${BASE_MCP_PORT:-3010}; do
  sleep 1
done

# Change to service directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies for Brave Search Service..."
  npm install
fi

# Start the service
echo "Starting Brave Search Service on port ${BRAVE_SEARCH_PORT:-3014}..."
NODE_ENV=production node server.js
