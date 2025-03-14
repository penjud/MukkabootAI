const axios = require('axios');
const logger = require('../config/logger');
const config = require('../config/config');

// Register with base service
const registerWithBaseService = async () => {
  try {
    const registrationData = {
      name: 'memory',
      host: config.service.host,
      port: config.service.port,
      type: 'memory',
      description: 'Memory service for knowledge graph and conversation history storage'
    };

    logger.info(`Registering with base service at ${config.baseService.url}/api/registry/services`);
    
    const response = await axios.post(
      `${config.baseService.url}/api/registry/services`, 
      registrationData,
      {
        headers: {
          'Authorization': 'Bearer default-auth-token'
        }
      }
    );
    
    logger.info('Registered with base service successfully', response.data);
    return true;
  } catch (error) {
    logger.error('Failed to register with base service:', error.message);
    return false;
  }
};

// Retry registration with exponential backoff
const retryRegistration = async (maxRetries = 5, initialDelay = 3000) => {
  let retries = 0;
  let delay = initialDelay;

  const attempt = async () => {
    if (await registerWithBaseService()) {
      return true;
    }

    retries++;
    if (retries >= maxRetries) {
      logger.error(`Failed to register after ${maxRetries} attempts`);
      return false;
    }

    // Exponential backoff with jitter
    delay = Math.min(delay * 1.5, 30000) * (0.9 + Math.random() * 0.2);
    logger.info(`Retrying registration in ${Math.round(delay / 1000)} seconds...`);
    
    return new Promise(resolve => {
      setTimeout(async () => {
        resolve(await attempt());
      }, delay);
    });
  };

  return attempt();
};

module.exports = {
  registerWithBaseService,
  retryRegistration
};