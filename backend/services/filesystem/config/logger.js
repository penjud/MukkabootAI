const winston = require('winston');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

// Ensure logs directory exists
const logsDir = path.resolve(__dirname, '../../../../logs/filesystem');
fs.ensureDirSync(logsDir);

// Configure Winston logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'filesystem-service' },
  transports: [
    // Write to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? 
            '\n' + JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    }),
    // Write to all logs with level 'info' and below
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log')
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error'
    })
  ]
});

module.exports = logger;