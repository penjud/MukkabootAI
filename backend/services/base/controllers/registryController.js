const { StatusCodes } = require('http-status-codes');
const axios = require('axios');
const logger = require('../config/logger');
const config = require('../config/config');

// In-memory service registry
const serviceRegistry = new Map();

// Register a service
const registerService = async (req, res) => {
  try {
    const { name, port, host = 'localhost', healthEndpoint = '/health' } = req.body;
    
    if (!name || !port) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Service name and port are required'
      });
    }
    
    // Construct service URL (for host-based implementation)
    const url = `http://${host}:${port}`;
    
    // Add to registry with timestamp
    serviceRegistry.set(name, {
      name,
      url,
      host,
      port,
      healthEndpoint,
      status: 'unknown',
      registeredAt: new Date().toISOString(),
      lastHealthCheck: null
    });
    
    logger.info(`Service registered: ${name} at ${url}`);
    
    // Perform initial health check
    try {
      await checkServiceHealth(name);
    } catch (error) {
      logger.warn(`Initial health check failed for service ${name}: ${error.message}`);
    }
    
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: `Service ${name} registered successfully`,
      data: {
        name,
        url,
        status: serviceRegistry.get(name).status
      }
    });
  } catch (error) {
    logger.error(`Error registering service: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error registering service',
      error: error.message
    });
  }
};

// Get all registered services
const getServices = (req, res) => {
  try {
    const services = Array.from(serviceRegistry.values());
    
    return res.status(StatusCodes.OK).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    logger.error(`Error getting services: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error retrieving services',
      error: error.message
    });
  }
};

// Get a specific service by name
const getService = (req, res) => {
  try {
    const { name } = req.params;
    
    if (!serviceRegistry.has(name)) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: `Service ${name} not found`
      });
    }
    
    return res.status(StatusCodes.OK).json({
      success: true,
      data: serviceRegistry.get(name)
    });
  } catch (error) {
    logger.error(`Error getting service: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error retrieving service',
      error: error.message
    });
  }
};

// Check the health of a service
const checkServiceHealth = async (serviceName) => {
  if (!serviceRegistry.has(serviceName)) {
    throw new Error(`Service ${serviceName} not found`);
  }
  
  const service = serviceRegistry.get(serviceName);
  const healthUrl = `${service.url}${service.healthEndpoint}`;
  
  try {
    const response = await axios.get(healthUrl, {
      timeout: config.registry.serviceTimeout
    });
    
    const isHealthy = response.status === 200;
    
    // Update service health status
    serviceRegistry.set(serviceName, {
      ...service,
      status: isHealthy ? 'healthy' : 'unhealthy',
      lastHealthCheck: new Date().toISOString()
    });
    
    return isHealthy;
  } catch (error) {
    // Update service as unhealthy
    serviceRegistry.set(serviceName, {
      ...service,
      status: 'unhealthy',
      lastHealthCheck: new Date().toISOString()
    });
    
    throw error;
  }
};

// Deregister a service
const deregisterService = (req, res) => {
  try {
    const { name } = req.params;
    
    if (!serviceRegistry.has(name)) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: `Service ${name} not found`
      });
    }
    
    serviceRegistry.delete(name);
    logger.info(`Service deregistered: ${name}`);
    
    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Service ${name} deregistered successfully`
    });
  } catch (error) {
    logger.error(`Error deregistering service: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error deregistering service',
      error: error.message
    });
  }
};

// Periodically check the health of all services
setInterval(async () => {
  logger.debug('Running health checks for all services');
  
  for (const [serviceName] of serviceRegistry) {
    try {
      await checkServiceHealth(serviceName);
      logger.debug(`Health check passed for ${serviceName}`);
    } catch (error) {
      logger.warn(`Health check failed for ${serviceName}: ${error.message}`);
    }
  }
}, config.registry.healthCheckInterval);

module.exports = {
  registerService,
  getServices,
  getService,
  deregisterService,
  checkServiceHealth
};
