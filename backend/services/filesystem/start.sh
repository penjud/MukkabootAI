#!/bin/bash
# Start script for Filesystem Service

# Set up log directory
mkdir -p /home/mothership/MukkabootAI/logs

# Start the filesystem service
echo "Starting Filesystem Service on port 3012..."
node server.js > /home/mothership/MukkabootAI/logs/filesystem.log 2>&1 &
