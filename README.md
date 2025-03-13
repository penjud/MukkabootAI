# MukkabootAI Platform

A Docker-free implementation of the MukkaAI platform, providing a comprehensive environment for AI-assisted knowledge work.

## Overview

MukkabootAI is a unified platform that combines:
- File management
- Knowledge graph and memory
- Web search capabilities
- Local AI model integration
- Conversation history

All implemented without Docker dependencies for improved performance and simpler deployment.

## Architecture

MukkabootAI follows a microservices architecture with the following components:

1. **Base Service** (Port 3010)
   - Service registry
   - Health monitoring
   - Service discovery

2. **Memory Service** (Port 3011)
   - Conversation history
   - Knowledge graph
   - Entity and relation management

3. **Filesystem Service** (Port 3012)
   - File operations
   - Directory management
   - Search capabilities

4. **Auth Service** (Port 3013)
   - User authentication
   - JWT token management
   - User profile management

5. **Brave Search Service** (Port 3014)
   - Web search
   - News search
   - Local business search
   - Image search

6. **Ollama Bridge Service** (Port 3015)
   - Model management
   - Text generation
   - Chat completion
   - Streaming responses

7. **Vue Dashboard** (Port 3002)
   - Web user interface
   - Service integration

## Installation

### Prerequisites

1. Node.js 16+ and npm
2. Ollama for local AI models
3. MongoDB (optional, for Auth Service)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/MukkabootAI.git
   cd MukkabootAI
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file to configure your environment.

4. Install dependencies for all services:
   ```bash
   ./install-dependencies.sh
   ```

## Starting the Platform

### Option 1: Start Individual Services

Start each service individually:

```bash
# Start Base Service
cd backend/services/base
./start.sh

# Start Memory Service
cd backend/services/memory
./start.sh

# Start Filesystem Service
cd backend/services/filesystem
./start.sh

# Start Auth Service
cd backend/services/auth
./start.sh

# Start Brave Search Service
cd backend/services/brave-search
./start.sh

# Start Ollama Bridge Service
cd backend/services/ollama-bridge
./start.sh

# Start Vue Dashboard
cd frontend/vue-dashboard
./start.sh
```

### Option 2: Start All Services

Use the master startup script:

```bash
./start-all.sh
```

## Accessing the Platform

Once all services are running, access the platform at:
http://localhost:3002

Default login:
- Username: admin
- Password: password

## Development

### Project Structure

```
MukkabootAI/
├── backend/
│   └── services/
│       ├── base/           # Base Service
│       ├── memory/         # Memory Service
│       ├── filesystem/     # Filesystem Service
│       ├── auth/           # Auth Service
│       ├── brave-search/   # Brave Search Service
│       └── ollama-bridge/  # Ollama Bridge Service
├── frontend/
│   └── vue-dashboard/      # Vue Dashboard
├── data/                   # Data storage
├── rag/                    # RAG system
│   └── mukka_vault/        # Documentation vault
└── scripts/                # Utility scripts
```

### Adding a New Service

1. Create a new directory in `backend/services/`
2. Implement the service following the established patterns
3. Add service registration in the startup

## Documentation

Detailed documentation is available in the `rag/mukka_vault` directory:

- **System Documentation**: `/rag/mukka_vault/01-System/`
- **User Guides**: `/rag/mukka_vault/02-User/`
- **Developer Guides**: `/rag/mukka_vault/03-Developer/`
- **Design Documents**: `/rag/mukka_vault/04-Design/`

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[MIT License](LICENSE.md)
