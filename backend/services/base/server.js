const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { StatusCodes } = require('http-status-codes');

const config = require('./config/config');
const logger = require('./config/logger');
const registryRoutes = require('./routes/registryRoutes');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middleware/errorHandler');

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

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  server.close(() => {
    logger.info('Server shutdown complete');
    process.exit(0);
  });
  
  // Force close after timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { app, server };
