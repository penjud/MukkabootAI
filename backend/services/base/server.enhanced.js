// Initialize telemetry before any other imports
const { initializeTelemetry } = require('@mukkaboot/telemetry');
initializeTelemetry('base-service');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { StatusCodes } = require('http-status-codes');

// Enhanced libraries
const { createServiceLogger } = require('@mukkaboot/logger');
const { httpCircuitBreaker } = require('@mukkaboot/circuit-breaker');
const { createQueue, createWorker } = require('@mukkaboot/queue');

const config = require('./config/config');
const registryRoutes = require('./routes/registryRoutes');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middleware/errorHandler');

// Enhanced logger
const logger = createServiceLogger('base-service', {
  level: config.logging?.level || 'info',
  logDir: config.logging?.directory || '../../logs'
});

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.security.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Apply rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logging middleware using enhanced logger
app.use(morgan('combined', { stream: logger.stream }));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create a task queue for background operations
const systemTasksQueue = createQueue('system-tasks');

// Create a worker to process system tasks
const systemTasksWorker = createWorker(
  'system-tasks',
  async (job) => {
    logger.info(`Processing system task: ${job.name}`, { jobId: job.id });
    
    switch (job.name) {
      case 'health-check':
        return await performHealthCheck(job.data.services);
      case 'cleanup-registry':
        return await cleanupRegistry(job.data.olderThan);
      default:
        logger.warn(`Unknown job type: ${job.name}`);
        return { success: false, error: 'Unknown job type' };
    }
  },
  { concurrency: 2, logger }
);

// Example circuit breaker for service health checks
async function checkServiceHealth(serviceUrl) {
  const fetch = require('node-fetch');
  
  const checkHealth = httpCircuitBreaker(
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Service returned status ${response.status}`);
      }
      return await response.json();
    },
    {
      name: `health-check-${new URL(serviceUrl).hostname}`,
      timeout: 2000,
      errorThresholdPercentage: 50,
      resetTimeout: 10000
    },
    // Fallback function when circuit is open
    async () => ({ status: 'unknown', reason: 'circuit-open' }),
    logger
  );
  
  return await checkHealth(serviceUrl);
}

// Health check function
async function performHealthCheck(services) {
  const results = {};
  
  for (const [name, url] of Object.entries(services)) {
    try {
      results[name] = await checkServiceHealth(`${url}/health`);
    } catch (error) {
      logger.error(`Error checking health for ${name}`, { error: error.message });
      results[name] = { status: 'error', error: error.message };
    }
  }
  
  return results;
}

// Cleanup registry function
async function cleanupRegistry(olderThan) {
  // Implementation for cleaning up the registry
  logger.info(`Cleaning up registry entries older than ${olderThan} ms`);
  // ... implementation
  return { success: true, count: 0 };
}

// Schedule regular health checks
systemTasksQueue.add(
  'health-check',
  { services: config.services },
  { repeat: { every: 60000 } } // Every minute
);

// Schedule registry cleanup
systemTasksQueue.add(
  'cleanup-registry',
  { olderThan: 24 * 60 * 60 * 1000 }, // 24 hours
  { repeat: { every: 3600000 } } // Every hour
);

// Routes
app.use('/api/registry', registryRoutes);
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes); // Simple health endpoint for service checks

// Root route - service info
app.get('/', (req, res) => {
  res.status(StatusCodes.OK).json({
    service: config.service.name,
    status: 'running',
    version: '1.0.0',
  });
});

// Add Queue status endpoint
app.get('/api/queue/status', async (req, res) => {
  try {
    const counts = await systemTasksQueue.getJobCounts();
    res.status(StatusCodes.OK).json({
      queue: 'system-tasks',
      counts,
      status: 'active'
    });
  } catch (error) {
    logger.error('Error getting queue status', { error: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to get queue status',
      message: error.message
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.service.port;
const server = app.listen(PORT, () => {
  logger.info(`${config.service.name} running on port ${PORT}`);
  
  // Log when server is ready (used by PM2 wait_ready)
  if (process.send) {
    process.send('ready');
  }
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...');
  
  try {
    // Gracefully close the worker
    await systemTasksWorker.close();
    logger.info('Worker shutdown complete');
    
    // Shutdown queue system
    const { shutdown: queueShutdown } = require('@mukkaboot/queue');
    await queueShutdown();
    logger.info('Queue shutdown complete');
    
    // Close server
    server.close(() => {
      logger.info('Server shutdown complete');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
  
  // Force close after timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { app, server };
