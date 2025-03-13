#!/bin/bash
# Master script to stop all MukkabootAI services

# Script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Stopping all MukkabootAI services..."

# Find and kill all node processes related to MukkabootAI
pkill -f "node.*mukkaboot.*server.js" || echo "No MukkabootAI services running"

# Verify no services are still running
sleep 2
if pgrep -f "node.*mukkaboot.*server.js" > /dev/null; then
  echo "Some services are still running. Sending SIGKILL..."
  pkill -9 -f "node.*mukkaboot.*server.js"
fi

echo "All services stopped."
