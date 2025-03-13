# MukkabootAI Enhanced Libraries Integration Guide

This document provides guidance on integrating the enhanced libraries into MukkabootAI services.

## Overview of Enhancements

We've added four major enhancements to the MukkabootAI platform:

1. **OpenTelemetry Integration** - Distributed tracing across all services
2. **Enhanced Logging** - Structured logging with Winston
3. **Circuit Breaker Pattern** - Fault tolerance with Opossum
4. **Job Queue System** - Background processing with BullMQ

## Prerequisites

- Redis server (required for the queue system)
- Node.js 16+ (already part of the platform)

## Installation

Run the provided installation script:

```bash
./scripts/install-enhancements.sh
```

The script will:
1. Install Redis if requested
2. Build the shared libraries
3. Install the libraries to each service

## Integration Guides

### 1. OpenTelemetry Integration

Add to the very top of your service's main file (before any other imports):

```javascript
// Initialize telemetry before any other imports
const { initializeTelemetry } = require('@mukkaboot/telemetry');
initializeTelemetry('your-service-name');

// Rest of your imports
const express = require('express');
// ...
```

#### Configuration

Configure via environment variables:
- `OTEL_EXPORTER_OTLP_ENDPOINT` - URL of your OpenTelemetry collector
- `NODE_ENV` - Your deployment environment

### 2. Enhanced Logging

Replace your current logger with the enhanced version:

```javascript
const { createServiceLogger } = require('@mukkaboot/logger');

// Create a logger for your service
const logger = createServiceLogger('your-service-name', {
  level: 'info',
  logDir: '../../logs'
});

// Replace Morgan setup with:
app.use(morgan('combined', { stream: logger.stream }));

// Use logger throughout your code
logger.info('Server started', { port: 3000 });
logger.error('Database connection failed', { error: err.message });
```

#### Configuration

Configure via environment variables:
- `LOG_LEVEL` - Logging level (default: info)
- `LOG_DIR` - Log directory (default: ../../logs)

### 3. Circuit Breaker Pattern

Use for HTTP requests or other operations that might fail:

```javascript
const { httpCircuitBreaker } = require('@mukkaboot/circuit-breaker');
const axios = require('axios');

// Create a circuit breaker for an HTTP request
const fetchData = httpCircuitBreaker(
  async (url) => {
    const response = await axios.get(url);
    return response.data;
  },
  { 
    name: 'api-request',
    timeout: 3000
  },
  // Optional fallback function
  async () => {
    return { status: 'error', message: 'Service unavailable' };
  },
  logger // Pass your logger
);

// Use it
try {
  const data = await fetchData('https://api.example.com/data');
  // Process data
} catch (error) {
  // Handle error
}
```

### 4. Job Queue System

For operations that should run in the background:

```javascript
const { createQueue, createWorker } = require('@mukkaboot/queue');

// Create a queue for tasks
const taskQueue = createQueue('task-queue');

// Add a job to the queue
await taskQueue.add('process-data', {
  userId: 'user123',
  dataId: 'data456'
});

// In another file or service, create a worker to process jobs
const worker = createWorker(
  'task-queue',
  async (job) => {
    logger.info(`Processing job ${job.id}`);
    
    // Process the job
    const result = await processData(job.data.userId, job.data.dataId);
    
    return result;
  },
  { 
    concurrency: 2,
    logger
  }
);
```

#### Configuration

Configure via environment variables:
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis password (if required)
- `REDIS_DB` - Redis database number (default: 0)

## Example Service

See `/backend/services/base/server.enhanced.js` for a complete example of integrating all enhancements into a service.

## Best Practices

1. **Initialize telemetry first** - Always initialize telemetry at the very top of your service file
2. **Use structured logging** - Include context in your logs with objects: `logger.info('Message', { key: value })`
3. **Circuit break all external calls** - Use circuit breakers for all calls to external services
4. **Queue long-running tasks** - Move any operation taking more than 500ms to a background job
5. **Graceful shutdown** - Ensure all resources are properly closed during shutdown

## Troubleshooting

### OpenTelemetry Issues

- Check that the initialization comes before any other imports
- Verify that the exporter URL is correct

### Logging Issues

- Ensure the log directory exists and is writable
- Check log level configuration

### Circuit Breaker Issues

- Set appropriate timeouts based on the operation
- Implement fallback functions for critical operations

### Queue System Issues

- Verify Redis is running and accessible
- Check for proper graceful shutdown to avoid lost jobs

## Next Steps

After successful integration, consider:

1. Setting up an OpenTelemetry collector (Jaeger, Zipkin, etc.)
2. Adding a centralized log aggregation system (ELK Stack, Graylog, etc.)
3. Creating a queue monitoring dashboard
4. Implementing more advanced background job patterns

For additional help, refer to the README files in each shared library directory.
