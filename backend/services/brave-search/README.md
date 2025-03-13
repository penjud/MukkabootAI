# MukkabootAI Brave Search Service

This service provides web search capabilities to the MukkabootAI platform by integrating with the Brave Search API.

## Features

- Web search with pagination support
- Local business search
- News search with freshness filtering
- Image search
- Caching layer to reduce API calls
- Rate limiting to prevent abuse
- Event streaming for real-time updates

## Architecture

The Brave Search Service is designed as a standalone service that registers with the Base Service for discovery. It provides a RESTful API for search operations and implements various search types through specific endpoints.

## API Endpoints

### General Endpoints

- `GET /` - Service information
- `GET /health` - Health check endpoint
- `GET /events` - SSE event stream for real-time updates

### Search Endpoints

- `GET /search` - Web search
  - Parameters: `query` (required), `count` (default: 10), `offset` (default: 0)
  
- `GET /local` - Local business search
  - Parameters: `query` (required), `count` (default: 5)
  
- `GET /news` - News search
  - Parameters: `query` (required), `count` (default: 10), `freshness` (optional: 'day', 'week', 'month')
  
- `GET /images` - Image search
  - Parameters: `query` (required), `count` (default: 10)

### Utility Endpoints

- `POST /query` - Generic query handler
  - Body: `{ "query": "search term", "type": "web|local|news|images", "options": {} }`
  
- `POST /admin/clear-cache` - Clear the cache (admin only)

## Configuration

The service can be configured using the following environment variables:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| BRAVE_SEARCH_PORT | Port for the service | 3014 |
| BRAVE_SEARCH_HOST | Host for the service | localhost |
| BASE_SERVER_URL | URL of the Base Service | http://localhost:3010 |
| BRAVE_SEARCH_API_KEY | API key for Brave Search | (required) |
| CACHE_DURATION | Cache duration in milliseconds | 3600000 (1 hour) |
| LOG_LEVEL | Logging level | info |

## Installation

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

## Security Features

- Rate limiting to prevent API abuse
- Input validation
- Response caching
- CORS protection
- Security headers with Helmet

## Error Handling

The service implements comprehensive error handling with:
- Input validation
- API error forwarding
- Detailed error responses
- Logging of errors

## Development

For development:
```bash
npm run dev
```

This will start the service with nodemon for automatic reloading.
