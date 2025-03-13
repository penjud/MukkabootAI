#!/bin/bash
# Start the Vue Dashboard for MukkabootAI

# Load environment variables if .env exists
if [ -f /home/mothership/MukkabootAI/.env ]; then
  source /home/mothership/MukkabootAI/.env
fi

# Change to dashboard directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies for Vue Dashboard..."
  npm install
fi

# Start the development server
echo "Starting Vue Dashboard on port 3002..."
PORT=3002 npm run dev -- --port 3002
