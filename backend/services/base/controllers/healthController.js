const { StatusCodes } = require('http-status-codes');
const logger = require('../config/logger');
const config = require('../config/config');
const os = require('os');

// Get service health
const getHealth = (req, res) => {
  try {
    const healthInfo = {
      service: config.service.name,
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      systemInfo: {
        memory: {
          free: os.freemem(),
          total: os.totalmem()
        },
        cpus: os.cpus().length,
        platform: os.platform(),
        hostname: os.hostname()
      }
    };
    
    return res.status(StatusCodes.OK).json(healthInfo);
  } catch (error) {
    logger.error(`Error getting health status: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      service: config.service.name,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getHealth
};
