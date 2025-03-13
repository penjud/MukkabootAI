'use strict';

const winston = require('winston');
const { createLogger, format, transports } = winston;
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

/**
 * Create a configured Winston logger for MukkabootAI services
 * @param {string} serviceName - Name of the service for log identification
 * @param {Object} options - Configuration options
 * @returns {winston.Logger} Configured logger instance
 */
function createServiceLogger(serviceName, options = {}) {
  const {
    level = process.env.LOG_LEVEL || 'info',
    logDir = process.env.LOG_DIR || path.join(process.cwd(), '..', '..', 'logs'),
    consoleOutput = true,
    fileOutput = true,
    maxSize = '20m',
    maxFiles = '14d',
  } = options;

  // Create format for console output
  const consoleFormat = format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    format.colorize(),
    format.printf(({ timestamp, level, message, service, ...meta }) => {
      const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
      return `[${timestamp}] [${service}] ${level}: ${message}${metaStr}`;
    })
  );

  // Create format for file output (JSON)
  const fileFormat = format.combine(
    format.timestamp(),
    format.json()
  );

  // Configure logger transports
  const loggerTransports = [];

  // Add console transport if enabled
  if (consoleOutput) {
    loggerTransports.push(
      new transports.Console({
        level,
        format: consoleFormat
      })
    );
  }

  // Add file transport if enabled
  if (fileOutput) {
    const fileTransport = new DailyRotateFile({
      level,
      dirname: logDir,
      filename: `${serviceName}-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize,
      maxFiles,
      format: fileFormat,
      zippedArchive: true
    });
    
    loggerTransports.push(fileTransport);
  }

  // Create the logger
  const logger = createLogger({
    defaultMeta: { service: serviceName },
    transports: loggerTransports,
    exitOnError: false
  });

  // Ensure the uncaughtException and unhandledRejection are logged
  logger.exceptions.handle(
    new transports.File({ 
      filename: path.join(logDir, `${serviceName}-exceptions.log`),
      format: fileFormat
    })
  );

  // Add a stream for Morgan or other HTTP logging middleware
  logger.stream = {
    write: (message) => {
      logger.info(message.trim());
    }
  };

  return logger;
}

module.exports = { createServiceLogger };
