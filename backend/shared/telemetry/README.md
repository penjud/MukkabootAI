# MukkabootAI Telemetry

This package provides OpenTelemetry integration for MukkabootAI microservices, enabling distributed tracing across the entire platform.

## Installation

```bash
cd /path/to/your/service
npm install ../../shared/telemetry
```

## Usage

Add this to the top of your service's main file (before any other imports):

```javascript
// In your server.js or index.js file
const { initializeTelemetry } = require('@mukkaboot/telemetry');

// Initialize telemetry at the very beginning of your application
initializeTelemetry('service-name');

// Rest of your imports and application code
const express = require('express');
// ...
```

## Configuration

You can configure the telemetry by setting environment variables:

- `OTEL_EXPORTER_OTLP_ENDPOINT`: URL of your OpenTelemetry collector (default: http://localhost:4318/v1/traces)
- `NODE_ENV`: Your deployment environment (default: development)

## Visualization

For visualizing the traces, you can use:

1. Jaeger UI: http://localhost:16686
2. Zipkin: http://localhost:9411
3. Or other OpenTelemetry-compatible visualization tools

## Support

This telemetry package automatically instruments:

- HTTP/HTTPS client and server
- Express.js middleware
- MongoDB operations
- Redis operations (if used)
