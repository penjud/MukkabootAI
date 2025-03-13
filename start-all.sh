#!/bin/bash
# start-all.sh - Master script to start all MukkabootAI services

# Load environment variables
if [ -f /home/mothership/MukkabootAI/.env ]; then
  source /home/mothership/MukkabootAI/.env
fi

# Create data directories
mkdir -p /home/mothership/MukkabootAI/data/memory
mkdir -p /home/mothership/MukkabootAI/data/users

# Start base service
echo "Starting Base Service..."
cd /home/mothership/MukkabootAI/backend/services/base
./start.sh &

# Wait for base service to start
echo "Waiting for Base Service to start..."
sleep 5

# Start memory service
echo "Starting Memory Service..."
cd /home/mothership/MukkabootAI/backend/services/memory
./start.sh &

# Start filesystem service
echo "Starting Filesystem Service..."
cd /home/mothership/MukkabootAI/backend/services/filesystem
./start.sh &

# Start auth service
echo "Starting Auth Service..."
cd /home/mothership/MukkabootAI/backend/services/auth
./start.sh &

# Start brave search service
echo "Starting Brave Search Service..."
cd /home/mothership/MukkabootAI/backend/services/brave-search
./start.sh &

# Start ollama bridge service
echo "Starting Ollama Bridge Service..."
cd /home/mothership/MukkabootAI/backend/services/ollama-bridge
./start.sh &

# Wait for all backend services to be ready
echo "Waiting for all services to be ready..."
sleep 10

# Start vue dashboard
echo "Starting Vue Dashboard..."
cd /home/mothership/MukkabootAI/frontend/vue-dashboard
./start.sh &

echo "All services started"
echo "Vue Dashboard available at: http://localhost:3002"

# Keep script running
wait
