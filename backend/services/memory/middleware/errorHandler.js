const { StatusCodes } = require('http-status-codes');
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { 
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  let customError = {
    // Set default status code and message
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || 'Something went wrong, please try again later'
  };

  // Handle validation errors
  if (err.name === 'ValidationError') {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.message = Object.values(err.errors)
      .map(item => item.message)
      .join(', ');
  }

  // Handle duplicate key errors
  if (err.code && err.code === 11000) {
    customError.statusCode = StatusCodes.CONFLICT;
    customError.message = `Duplicate value for ${Object.keys(err.keyValue)}, please choose another value`;
  }

  // Handle cast errors
  if (err.name === 'CastError') {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.message = `Invalid ${err.path}: ${err.value}`;
  }

  return res.status(customError.statusCode).json({ error: customError.message });
};

module.exports = errorHandler;