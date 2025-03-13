require('dotenv').config({ path: '../../../.env' });

module.exports = {
  // Service configuration
  service: {
    name: 'mukkaboot-base-service',
    port: process.env.BASE_MCP_PORT || 3010,
    host: process.env.BASE_MCP_HOST || 'localhost',
    logLevel: process.env.BASE_MCP_LOG_LEVEL || 'info',
  },
  
  // Security configuration
  security: {
    authToken: process.env.MCP_AUTH_TOKEN || 'default-auth-token',
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
  
  // Registry configuration
  registry: {
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
    serviceTimeout: parseInt(process.env.SERVICE_TIMEOUT || '5000'),
  },
  
  // API rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }
};
