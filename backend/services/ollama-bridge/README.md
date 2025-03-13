# MukkabootAI Ollama Bridge Service

This service provides a bridge between MukkabootAI and the Ollama API, offering enhanced features for language model integration including authentication, caching, and streaming responses.

## Features

- **Model Management**
  - List available models
  - Get model details
  - Pull new models
  - Delete models

- **AI Capabilities**
  - Text generation (completion)
  - Chat completion
  - Stream generation for real-time responses

- **Enhanced Functionality**
  - Authentication integration with MukkabootAI Auth Service
  - Response caching for improved performance
  - Rate limiting to prevent abuse
  - Socket.IO for real-time updates and streaming
  - Comprehensive error handling

## API Endpoints

### General Endpoints

- `GET /` - Service information
- `GET /health` - Health check endpoint

### Model Management

- `GET /api/models` - List all available models
- `GET /api/models/:name` - Get details for a specific model
- `POST /api/models/pull` - Pull a model (with stream support)
- `DELETE /api/models/:name` - Delete a model

### AI Capabilities

- `POST /api/generate` - Generate text with a model
  - Supports both regular and streaming responses
  - Parameters: `model`, `prompt`, `system` (optional), `options` (optional), `stream` (boolean)

- `POST /api/chat` - Chat completion with a model
  - Supports both regular and streaming responses
  - Parameters: `model`, `messages` (array), `options` (optional), `stream` (boolean)

### Admin Endpoints

- `POST /admin/clear-cache` - Clear response cache

## Socket.IO Events

### Client to Server

- `pullModel` - Start pulling a model
- `streamGeneration` - Start streaming text generation
- `streamChat` - Start streaming chat completion

### Server to Client

- `models` - List of available models
- `modelStatus` - Model status updates
- `pullProgress` - Model pull progress
- `generationUpdate` - Text generation updates
- `generationComplete` - Text generation completion
- `chatUpdate` - Chat completion updates
- `chatComplete` - Chat completion finished
- `error` - Error notifications

## Configuration

The service can be configured using the following environment variables:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| OLLAMA_BRIDGE_PORT | Port for the service | 3015 |
| OLLAMA_BRIDGE_HOST | Host for the service | localhost |
| OLLAMA_HOST | URL for Ollama API | http://localhost:11434 |
| BASE_SERVER_URL | URL of the Base Service | http://localhost:3010 |
| AUTH_SERVER_URL | URL of the Auth Service | http://localhost:3013 |
| JWT_SECRET | Secret for JWT verification | default-secret-key |
| CACHE_DURATION | Cache duration in milliseconds | 3600000 (1 hour) |
| LOG_LEVEL | Logging level | info |

## Usage

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables in `.env` file or environment.

3. Start the service:
   ```bash
   npm start
   ```

Or use the provided start script:
```bash
./start.sh
```

### Example: Text Generation

```javascript
// Regular text generation
const response = await fetch('http://localhost:3015/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token-here'
  },
  body: JSON.stringify({
    model: 'llama2',
    prompt: 'Explain quantum computing in simple terms',
    options: {
      temperature: 0.7
    }
  })
});

const result = await response.json();
```

### Example: Streaming Chat

```javascript
// Streaming chat
const eventSource = new EventSource('http://localhost:3015/api/chat');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.message.content);
  
  if (data.done) {
    eventSource.close();
  }
};

fetch('http://localhost:3015/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token-here'
  },
  body: JSON.stringify({
    model: 'llama2',
    messages: [
      { role: 'user', content: 'Hello, who are you?' }
    ],
    stream: true
  })
});
```

## Development

For development:
```bash
npm run dev
```

This will start the service with nodemon for automatic reloading.
