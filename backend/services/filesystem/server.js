const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const chokidar = require('chokidar');
const path = require('path');
const { StatusCodes } = require('http-status-codes');

const config = require('./config/config');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { retryRegistration } = require('./utils/serviceRegistry');

// Routes
const filesystemRoutes = require('./routes/filesystemRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
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
// For raw text and binary files
app.use(express.text());
app.use(express.raw({ type: ['application/octet-stream'], limit: '10mb' }));

// Set up file watcher
const setupWatcher = () => {
  logger.info(`Setting up file watcher for: ${config.filesystem.allowedDirectories.join(', ')}`);
  
  const watcher = chokidar.watch(config.filesystem.allowedDirectories, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    depth: config.filesystem.watcherDepth
  });
  
  watcher
    .on('ready', () => logger.info('Initial scan complete. Ready for changes'))
    .on('error', error => logger.error(`Watcher error: ${error}`))
    .on('change', changedPath => logger.debug(`File ${changedPath} has been changed`));
    
  return watcher;
};

// Initialize watcher
const watcher = setupWatcher();

// Routes
app.use('/api/filesystem', filesystemRoutes);
app.use('/mcp/filesystem', filesystemRoutes); // Legacy MCP path
app.use('/api/uploads', uploadRoutes);
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes); // Simple health endpoint for service checks

// Serve uploaded files statically
app.use('/uploads', express.static(config.filesystem.uploadsDir));

// SSE Event Stream Setup for filesystem notifications
app.get('/api/filesystem/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial paths
  const data = JSON.stringify({
    type: 'filesystem',
    data: {
      paths: config.filesystem.allowedDirectories
    }
  });
  
  res.write(`data: ${data}\n\n`);
  
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
    allowedDirectories: config.filesystem.allowedDirectories
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
  
  // Close the file watcher
  watcher.close();
  
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