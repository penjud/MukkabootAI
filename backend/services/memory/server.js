const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { StatusCodes } = require('http-status-codes');

const config = require('./config/config');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { retryRegistration } = require('./utils/serviceRegistry');

// Routes
const memoryRoutes = require('./routes/memoryRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const agentRoutes = require('./routes/agentRoutes');
const healthRoutes = require('./routes/healthRoutes');

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
app.use('/api/memory', memoryRoutes);
app.use('/mcp/memory', memoryRoutes); // Legacy MCP path
app.use('/api/conversations', conversationRoutes);
app.use('/conversations', conversationRoutes); // Legacy path
app.use('/api/agents', agentRoutes);
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes); // Simple health endpoint for service checks

// SSE Event Stream Setup for memory updates
app.get('/api/memory/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial ping
  res.write('event: ping\ndata: connected\n\n');
  
  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(':\n\n');
  }, 15000);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// Root route - service info
app.get('/', (req, res) => {
  res.status(StatusCodes.OK).json({
    service: config.service.name,
    version: config.service.version,
    status: 'running',
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.service.port;
const server = app.listen(PORT, () => {
  logger.info(`${config.service.name} running on port ${PORT}`);
  
  // Register with base service after startup
  setTimeout(async () => {
    await retryRegistration();
  }, 3000);
  
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
