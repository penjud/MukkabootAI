#!/bin/bash
# Start script for Memory Service

# Set up log directory
mkdir -p /home/mothership/MukkabootAI/logs

# Start the memory service
echo "Starting Memory Service on port 3011..."
node server.js > /home/mothership/MukkabootAI/logs/memory.log 2>&1 &
