#!/bin/bash

# Script to install MukkabootAI enhanced libraries to all services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="/home/mothership/MukkabootAI"

# Define services to enhance
SERVICES=(
  "backend/services/auth"
  "backend/services/base"
  "backend/services/filesystem"
  "backend/services/memory"
  "backend/services/brave-search"
  "backend/services/ollama-bridge"
)

# Shared libraries
SHARED_LIBS=(
  "backend/shared/telemetry"
  "backend/shared/logger"
  "backend/shared/circuit-breaker"
  "backend/shared/queue"
)

# Function to check if a directory exists
check_dir() {
  if [ ! -d "$1" ]; then
    echo -e "${RED}Directory $1 does not exist!${NC}"
    return 1
  fi
  return 0
}

# Function to install a shared library to a service
install_lib_to_service() {
  local lib=$1
  local service=$2
  local lib_name=$(basename "$lib")
  
  echo -e "${YELLOW}Installing $lib_name to $service...${NC}"
  
  # Check if directories exist
  check_dir "$BASE_DIR/$lib" || return 1
  check_dir "$BASE_DIR/$service" || return 1
  
  # Install the library
  (cd "$BASE_DIR/$service" && npm install --save "$BASE_DIR/$lib")
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Successfully installed $lib_name to $service${NC}"
    return 0
  else
    echo -e "${RED}Failed to install $lib_name to $service${NC}"
    return 1
  fi
}

# Function to install Redis for BullMQ if not already installed
install_redis() {
  echo -e "${YELLOW}Checking for Redis installation...${NC}"
  
  if command -v redis-server >/dev/null 2>&1; then
    echo -e "${GREEN}Redis is already installed.${NC}"
    return 0
  fi
  
  echo -e "${YELLOW}Installing Redis...${NC}"
  sudo apt-get update && sudo apt-get install -y redis-server
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Redis installed successfully.${NC}"
    # Enable and start Redis service
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
    return 0
  else
    echo -e "${RED}Failed to install Redis. Please install it manually.${NC}"
    return 1
  fi
}

# Main function
main() {
  echo -e "${YELLOW}=== MukkabootAI Enhancement Installer ===${NC}"
  
  # Check if Redis is needed for BullMQ
  echo "Do you want to install Redis for the queue system? (y/n)"
  read install_redis_answer
  
  if [[ "$install_redis_answer" =~ ^[Yy]$ ]]; then
    install_redis
  fi
  
  # Build shared libraries
  echo -e "${YELLOW}Building shared libraries...${NC}"
  for lib in "${SHARED_LIBS[@]}"; do
    echo -e "${YELLOW}Building $lib...${NC}"
    (cd "$BASE_DIR/$lib" && npm install)
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Successfully built $(basename "$lib")${NC}"
    else
      echo -e "${RED}Failed to build $(basename "$lib")${NC}"
    fi
  done
  
  # Install libraries to each service
  echo -e "${YELLOW}Installing libraries to services...${NC}"
  for service in "${SERVICES[@]}"; do
    echo -e "${YELLOW}Enhancing service: $(basename "$service")${NC}"
    
    for lib in "${SHARED_LIBS[@]}"; do
      install_lib_to_service "$lib" "$service"
    done
    
    echo -e "${GREEN}Enhanced service: $(basename "$service")${NC}"
  done
  
  echo -e "${GREEN}=== Enhancement Installation Complete ===${NC}"
  echo -e "${YELLOW}Next steps:${NC}"
  echo "1. Update your services to use the new libraries"
  echo "2. Restart your services to apply changes"
  echo "3. See README files in each shared library directory for integration instructions"
}

# Run the main function
main
