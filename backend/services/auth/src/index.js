/**
 * MCP Authentication Server with MongoDB Integration
 * Supports both MongoDB and file-based storage with feature flags
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const winston = require('winston');
const dotenv = require('dotenv');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Import database connection
const { initializeDatabase, isConnected } = require('./db/connection');

// Import repositories
const { UserRepository, RefreshTokenRepository, PasswordResetTokenRepository } = require('./repositories');

// Import feature flags
const features = require('./config/features');

// Import route initializers
const initAuthRoutes = require('./routes/auth-routes');
const initUserRoutes = require('./routes/user-routes');
const initPasswordResetRoutes = require('./routes/password-reset-routes');
const initAgentRoutes = require('./routes/agent-routes');

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'mcp-auth-server' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Create Express app
const app = express();

// Trust proxy - configure it more securely to only trust specific proxies
// This helps with the express-rate-limit warnings
app.set('trust proxy', 'loopback, linklocal, uniquelocal');
const PORT = process.env.PORT || 3013;
const BASE_SERVER_URL = process.env.BASE_SERVER_URL || 'http://localhost:3010';

// Configuration object
const config = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'your-super-secret-refresh-token-key',
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '1h',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  USERS_FILE_PATH: process.env.USERS_FILE_PATH || '/home/mothership/MukkabootAI/data/users/users.json'
};

// Configure rate limiter for general API requests
const apiLimiter = rateLimit({
  windowMs: process.env.API_RATE_LIMIT_WINDOW_MS || 60 * 1000, // 1 minute
  max: process.env.API_RATE_LIMIT_MAX || 1000, // increased from 100 to 1000 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later',
    status: 429
  }
});

// Initialize repositories
let userRepository, refreshTokenRepository, passwordResetTokenRepository;

// Initialize database if using MongoDB
if (features.useMongoDB) {
  logger.info('Using MongoDB for data storage');
  
  // Create repository instances
  userRepository = new UserRepository();
  refreshTokenRepository = new RefreshTokenRepository();
  passwordResetTokenRepository = new PasswordResetTokenRepository();
  
  // Initialize database connection
  initializeDatabase(logger).catch(err => {
    logger.error(`Failed to connect to MongoDB: ${err.message}`);
    logger.info('Falling back to JSON file storage');
    features.useMongoDB = false;
  });
} else {
  logger.info('Using JSON file for data storage');
}

// Ensure users directory exists (for file storage)
if (!features.useMongoDB) {
  const usersDir = path.dirname(config.USERS_FILE_PATH);
  if (!fs.existsSync(usersDir)) {
    fs.mkdirSync(usersDir, { recursive: true });
  }
}

// Load or create users file (for file storage)
let usersData = { users: [], refreshTokens: {}, passwordResetTokens: {} };
if (!features.useMongoDB) {
  try {
    if (fs.existsSync(config.USERS_FILE_PATH)) {
      usersData = JSON.parse(fs.readFileSync(config.USERS_FILE_PATH, 'utf8'));
      // Ensure objects exist
      if (!usersData.refreshTokens) {
        usersData.refreshTokens = {};
      }
      if (!usersData.passwordResetTokens) {
        usersData.passwordResetTokens = {};
      }
      logger.info(`Loaded ${usersData.users.length} users from ${config.USERS_FILE_PATH}`);
    } else {
      // Create default admin user if file doesn't exist
      const passwordHash = '$2b$10$gfqQiZM.zk566.F14h.ngO9fAzZgn5K9PObNKTLQK7pRJUYh4t5gC'; // Hash for 'admin123'
      usersData = {
        users: [
          {
            username: 'admin',
            passwordHash,
            role: 'admin',
            createdAt: new Date().toISOString(),
            email: 'admin@example.com' // Add default email for admin
          }
        ],
        refreshTokens: {},
        passwordResetTokens: {}
      };
      fs.writeFileSync(config.USERS_FILE_PATH, JSON.stringify(usersData, null, 2));
      logger.info(`Default users file created at ${config.USERS_FILE_PATH}`);
    }
  } catch (error) {
    logger.error(`Error loading or creating users file: ${error.message}`);
  }
}

// Save users to file (for file storage)
const saveUsers = () => {
  if (features.useMongoDB) return true; // No need to save to file if using MongoDB
  
  try {
    fs.writeFileSync(config.USERS_FILE_PATH, JSON.stringify(usersData, null, 2));
    logger.info(`Saved ${usersData.users.length} users to ${config.USERS_FILE_PATH}`);
    return true;
  } catch (error) {
    logger.error(`Error saving users file: ${error.message}`);
    return false;
  }
};

// Middleware
// Updated CORS to allow both frontend URLs
app.use(cors({
  origin: function(origin, callback) {
    // Allow any origin in development, or from the allowed list in production
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3000',  // Common development port
      'http://localhost:8080',  // Another common Vue development port
      'http://127.0.0.1:3001'   // Local address variant
    ];
    
    // In development, allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Apply general API rate limiter to all requests
app.use(apiLimiter);

// Security headers middleware
app.use((req, res, next) => {
  // Protect against XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Strict Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  
  // HTTP Strict Transport Security (when in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
});

// Log middleware for debugging requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} ${JSON.stringify(req.body)}`);
  next();
});

// Database connection check middleware (for MongoDB)
app.use((req, res, next) => {
  if (features.useMongoDB && !isConnected()) {
    logger.warn('MongoDB connection is not active, falling back to file storage');
    features.useMongoDB = false;
  }
  next();
});

// Initialize routes
const authRouter = initAuthRoutes({
  userRepository,
  refreshTokenRepository,
  passwordResetTokenRepository,
  features,
  usersData,
  saveUsers,
  logger,
  config
});

const userRouter = initUserRoutes({
  userRepository,
  refreshTokenRepository,
  features,
  usersData,
  saveUsers,
  logger,
  middlewares: {
    authenticateToken: authRouter.authenticateToken,
    requireAdmin: authRouter.requireAdmin
  }
});

const passwordResetRouter = initPasswordResetRoutes({
  userRepository,
  passwordResetTokenRepository,
  refreshTokenRepository,
  features,
  usersData,
  saveUsers,
  logger
});

const agentRouter = initAgentRoutes({
  logger,
  middlewares: {
    authenticateToken: authRouter.authenticateToken,
    requireAdmin: authRouter.requireAdmin
  }
});

// System configuration data (static for now, can be made dynamic)
const systemConfig = {
  systemName: 'MukkaAI',
  defaultModel: 'llama3',
  defaultTheme: 'System Default',
  defaultLanguage: 'English',
  allowRegistration: true,
  autoToolTriggering: true,
  welcomeMessage: 'Welcome to MukkaAI!'
};

// Register with base MCP server
const registerWithBaseServer = async () => {
  try {
    const response = await axios.post(`${BASE_SERVER_URL}/services/register`, {
      name: 'auth',
      host: 'localhost',
      port: PORT,
      type: 'auth',
      description: 'MCP Authentication Server'
    });
    logger.info('Registered with base MCP server', response.data);
  } catch (error) {
    logger.error('Failed to register with base MCP server:', error.message);
    // Retry after delay
    setTimeout(registerWithBaseServer, 5000);
  }
};

// Error handler middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error(`Error (${status}): ${message}`);
  if (err.stack) {
    logger.error(err.stack);
  }
  
  // Return error response with consistent format
  res.status(status).json({
    error: message,
    status,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'MCP Authentication Server',
    version: '1.0.0',
    status: 'running',
    storage: features.useMongoDB ? 'MongoDB' : 'File'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime()
  });
});

// Database health check endpoint
app.get('/health/db', (req, res) => {
  if (features.useMongoDB) {
    res.json({
      type: 'MongoDB',
      status: isConnected() ? 'connected' : 'disconnected'
    });
  } else {
    res.json({
      type: 'File',
      status: 'active',
      path: config.USERS_FILE_PATH
    });
  }
});

// System configuration endpoints
app.get('/config', (req, res) => {
  res.json(systemConfig);
});

app.put('/config', authRouter.authenticateToken, authRouter.requireAdmin, (req, res) => {
  // Update system config
  Object.assign(systemConfig, req.body);
  res.json({
    message: 'Configuration updated successfully',
    config: systemConfig
  });
});

// Simple metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    activeUsers: 3,
    conversations: 145,
    customAgents: 7
  });
});

// Mount routers
app.use('/', authRouter);

// Add redirect for /me endpoint to maintain frontend compatibility
app.get('/me', authRouter.authenticateToken, (req, res, next) => {
  req.url = '/users/me';
  app._router.handle(req, res, next);
});

// Mount user routes at both /users and /admin/users
app.use('/users', userRouter);

// Create admin routes by mounting the same router at /admin/users
app.use('/admin/users', userRouter);

// Mount config routes at /admin/config as well
app.get('/admin/config', (req, res) => {
  res.json(systemConfig);
});

app.put('/admin/config', authRouter.authenticateToken, authRouter.requireAdmin, (req, res) => {
  // Update system config
  Object.assign(systemConfig, req.body);
  res.json({
    message: 'Configuration updated successfully',
    config: systemConfig
  });
});

// Mount admin metrics endpoint
app.get('/admin/metrics', (req, res) => {
  res.json({
    activeUsers: 3,
    conversations: 145,
    customAgents: 7
  });
});

app.use('/', passwordResetRouter);

// Mount agent routes
app.use('/agents', agentRouter);
app.use('/admin/agents', agentRouter);

// Test endpoint for checking users (development only)
app.get('/debug/users', (req, res) => {
  // Only in development 
  if (process.env.NODE_ENV !== 'production') {
    if (features.useMongoDB) {
      userRepository.listAll().then(users => {
        res.json({
          users: users.map(u => ({
            username: u.username,
            role: u.role,
            createdAt: u.createdAt
          }))
        });
      }).catch(err => {
        res.status(500).json({ error: err.message });
      });
    } else {
      res.json({
        users: usersData.users.map(u => ({
          username: u.username,
          role: u.role,
          createdAt: u.createdAt,
          passwordHashLength: u.passwordHash.length
        }))
      });
    }
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Options route for CORS preflight
app.options('*', cors());

// Start server
app.listen(PORT, () => {
  logger.info(`MCP Authentication Server running on port ${PORT}`);
  // Register with base server after a short delay
  setTimeout(registerWithBaseServer, 3000);
});

module.exports = app;