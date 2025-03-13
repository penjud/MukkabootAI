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

  // Handle file system specific errors
  if (err.code === 'ENOENT') {
    customError.statusCode = StatusCodes.NOT_FOUND;
    customError.message = `File or directory not found: ${err.path}`;
  }

  if (err.code === 'EACCES') {
    customError.statusCode = StatusCodes.FORBIDDEN;
    customError.message = `Permission denied: ${err.path}`;
  }

  if (err.code === 'EEXIST') {
    customError.statusCode = StatusCodes.CONFLICT;
    customError.message = `Path already exists: ${err.path}`;
  }

  if (err.code === 'EISDIR') {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.message = `Expected file but found directory: ${err.path}`;
  }

  if (err.code === 'ENOTDIR') {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.message = `Expected directory but found file: ${err.path}`;
  }

  // Handle multer file upload errors
  if (err.name === 'MulterError') {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    if (err.code === 'LIMIT_FILE_SIZE') {
      customError.message = `File size exceeds the limit`;
    } else {
      customError.message = `File upload error: ${err.message}`;
    }
  }

  return res.status(customError.statusCode).json({ error: customError.message });
};

module.exports = errorHandler;