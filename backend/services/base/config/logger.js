const winston = require('winston');
const config = require('./config');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger
const logger = winston.createLogger({
  level: config.service.logLevel,
  format: logFormat,
  defaultMeta: { service: config.service.name },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      )
    }),
    // File transport - system logs
    new winston.transports.File({ 
      filename: '/home/mothership/MukkabootAI/logs/base-service-error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: '/home/mothership/MukkabootAI/logs/base-service.log' 
    })
  ]
});

module.exports = logger;
