#!/bin/bash
# Start the Ollama Bridge Service for MukkabootAI

# Load environment variables if .env exists
if [ -f /home/mothership/MukkabootAI/.env ]; then
  source /home/mothership/MukkabootAI/.env
fi

# Wait for Base service to be available
echo "Waiting for Base Service..."
while ! nc -z localhost ${BASE_MCP_PORT:-3010}; do
  sleep 1
done

# Wait for Auth service to be available
echo "Waiting for Auth Service..."
while ! nc -z localhost ${AUTH_MCP_PORT:-3013}; do
  sleep 1
done

# Check if Ollama is running
echo "Checking Ollama service..."
if ! curl -s "http://localhost:11434/api/tags" > /dev/null; then
  echo "Warning: Ollama service does not appear to be running."
  echo "Some functionality may be limited until Ollama is started."
  echo "You can start Ollama by running: ollama serve"
fi

# Change to service directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies for Ollama Bridge Service..."
  npm install
fi

# Start the service
echo "Starting Ollama Bridge Service on port ${OLLAMA_BRIDGE_PORT:-3015}..."
NODE_ENV=production node server.js
