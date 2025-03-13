#!/bin/bash
# Start the Auth Service

# Change to script directory
cd "$(dirname "$0")"
cd ..

# Load .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Check if base service is running
echo "Checking if Base Service is running..."
for i in {1..30}; do
  if nc -z localhost ${BASE_PORT:-3010} 2>/dev/null; then
    echo "Base Service is running"
    break
  fi
  echo "Waiting for Base Service... ($i/30)"
  sleep 1
  if [ $i -eq 30 ]; then
    echo "Base Service not found. Starting anyway, but service registration may fail."
  fi
done

# Ensure data directory exists
mkdir -p $(dirname $USERS_FILE_PATH)

# Start the service
echo "Starting Auth Service on port ${PORT:-3013}..."
node src/index.js
