const { StatusCodes } = require('http-status-codes');
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  
  // Default error status and message
  let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Server error';
  
  // Handle specific error types
  if (err.name === 'SyntaxError') {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Invalid JSON';
  }
  
  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
