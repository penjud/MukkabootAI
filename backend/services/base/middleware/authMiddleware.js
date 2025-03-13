const { StatusCodes } = require('http-status-codes');
const config = require('../config/config');
const logger = require('../config/logger');

// Simple token-based authentication
const authMiddleware = (req, res, next) => {
  try {
    // Skip auth for health endpoint
    if (req.path === '/health') {
      return next();
    }
    
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: No token provided');
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Validate token
    if (token !== config.security.authToken) {
      logger.warn('Authentication failed: Invalid token');
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }
    
    // Authentication successful
    next();
  } catch (error) {
    logger.error(`Auth error: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

module.exports = authMiddleware;
