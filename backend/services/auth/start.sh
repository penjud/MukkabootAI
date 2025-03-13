#!/bin/bash
# Start the Auth Service for MukkabootAI

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
  echo "Installing dependencies for Auth Service..."
  npm install
fi

# Ensure data directory exists
mkdir -p $(dirname ${USERS_FILE_PATH:-/home/mothership/MukkabootAI/data/users/users.json})

# Create default admin user if needed
node create-default-user.js

# Start the service
echo "Starting Auth Service on port ${AUTH_MCP_PORT:-3013}..."
NODE_ENV=production node src/index.js
