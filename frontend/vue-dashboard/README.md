# MukkabootAI Frontend Dashboard

A modern web interface for the MukkabootAI platform, built with Vue.js, Vuetify, and Vite.

## Overview

This dashboard provides a user-friendly interface to interact with the MukkabootAI backend services, offering features like:

- Secure authentication and user management
- Intuitive chat interface with streaming responses
- File management and exploration
- Model selection and management
- Agent configuration and usage
- Knowledge base management

## Project Structure

```
frontend/vue-dashboard/
├── public/             # Static assets served as-is
├── src/
│   ├── components/     # Reusable Vue components
│   │   ├── agents/     # Agent-related components
│   │   ├── chat/       # Chat interface components
│   │   └── files/      # File management components
│   ├── router/         # Vue Router configuration
│   ├── services/       # API service modules
│   ├── stores/         # State management (if used)
│   ├── views/          # Page components
│   ├── App.vue         # Root component
│   └── main.js         # Entry point
├── .env.development    # Development environment variables
├── .env.production     # Production environment variables
├── index.html          # HTML entry point
├── package.json        # Dependencies and scripts
├── server.js           # Express server for production
├── vite.config.js      # Build configuration
└── README.md           # This documentation
```

## Setup and Development

### Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)
- MukkabootAI backend services running

### Installation

```bash
# Clone the repository (if not done already)
git clone https://github.com/yourusername/MukkabootAI.git
cd MukkabootAI/frontend/vue-dashboard

# Install dependencies
npm install
```

### Development Server

```bash
# Start the development server
npm run dev
```

This will start the development server at http://localhost:3002 (or another port if configured differently).

### Building for Production

```bash
# Build for production
npm run build

# Preview the production build
npm run preview

# Serve the production build
npm run serve
```

## Environment Configuration

The application uses different environment variables for development and production:

- `.env.development` - Used during development
- `.env.production` - Used for production builds

Key environment variables:

```
VITE_BASE_API_URL=http://localhost:3010
VITE_AUTH_API_URL=http://localhost:3013
VITE_MEMORY_API_URL=http://localhost:3011
VITE_FILESYSTEM_API_URL=http://localhost:3012
VITE_BRAVE_SEARCH_API_URL=http://localhost:3014
VITE_OLLAMA_BRIDGE_URL=http://localhost:3015
```

## Features

### Authentication

- Login with username and password
- JWT token-based authentication
- Secure route protection
- Token refresh mechanism

### Chat Interface

- Real-time streaming responses
- Markdown rendering
- Code syntax highlighting
- File attachment support
- Conversation management

### File Management

- File explorer with breadcrumb navigation
- Upload, download, and delete files
- Create and manage directories
- File previews for common formats
- Integration with chat for file analysis

### Model Selection

- Browse available models
- View model details and parameters
- Create custom agents with specific models
- Configure agent parameters

## API Integration

The frontend integrates with several backend services:

- **Base Service** (3010): Service registry and coordination
- **Auth Service** (3013): Authentication and user management
- **Memory Service** (3011): Conversation history and knowledge storage
- **Filesystem Service** (3012): File browsing and management
- **Brave Search Service** (3014): Web search capabilities
- **Ollama Bridge** (3015): LLM integration and inference

## Security Considerations

- All API requests include JWT authentication
- Automatic redirection to login on authentication failure
- Path validation for file operations
- Input sanitization for all user inputs
- HTTPS recommended for production deployments

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

[MIT License](LICENSE)
