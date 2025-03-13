# MukkabootAI Logger

Enhanced logging utility for MukkabootAI microservices using Winston.

## Features

- Structured JSON logging for file output
- Human-readable console output with colors
- Automatic log rotation and archiving
- HTTP request logging integration
- Exception handling

## Installation

```bash
cd /path/to/your/service
npm install ../../shared/logger
```

## Usage

```javascript
const { createServiceLogger } = require('@mukkaboot/logger');

// Create a logger for your service
const logger = createServiceLogger('auth-service');

// Use the logger
logger.info('Server started', { port: 3013 });
logger.error('Database connection failed', { error: err.message });
logger.debug('Request received', { path: req.path, method: req.method });

// Integration with Express and Morgan
const express = require('express');
const morgan = require('morgan');
const app = express();

// Use with Morgan for HTTP request logging
app.use(morgan('combined', { stream: logger.stream }));
```

## Configuration

You can configure the logger by setting environment variables or passing options:

```javascript
// Environment variables
process.env.LOG_LEVEL = 'debug';
process.env.LOG_DIR = '/custom/log/directory';

// Or pass options directly
const logger = createServiceLogger('my-service', {
  level: 'debug',
  logDir: '/custom/log/directory',
  consoleOutput: true,
  fileOutput: true,
  maxSize: '50m',
  maxFiles: '30d'
});
```

## Log Levels

The logger uses the following levels (from highest to lowest priority):

- error
- warn
- info
- http
- verbose
- debug
- silly

Setting a level shows all logs of that level and higher priority.
