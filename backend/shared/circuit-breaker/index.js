'use strict';

const CircuitBreaker = require('opossum');

/**
 * Default options for the circuit breaker
 */
const DEFAULT_OPTIONS = {
  // If our function takes longer than 5 seconds, trigger a failure
  timeout: 5000,
  // When 50% of requests fail, trip the circuit
  errorThresholdPercentage: 50,
  // After 10 seconds, try again
  resetTimeout: 10000,
  // Only track the last 20 requests for statistics
  rollingCountTimeout: 10000,
  rollingCountBuckets: 10,
  // Allow 3 half-open requests per reset timeout
  rollingPercentilesEnabled: true,
  capacity: 10,
  // Enable fire-and-forget fallbacks
  allowWarmUp: true,
  // Volume threshold before the circuit can trip
  volumeThreshold: 5,
  // Cache rejected promises
  cache: true
};

/**
 * Create a circuit breaker for a service function
 * 
 * @param {Function} action - The function to circuit-break (often an API call)
 * @param {Object} options - Circuit breaker options
 * @param {Function} fallback - Optional fallback function to call when the circuit is open
 * @param {Object} logger - Optional logger instance
 * @returns {CircuitBreaker} Configured circuit breaker
 */
function createCircuitBreaker(action, options = {}, fallback = null, logger = console) {
  // Merge default options with custom options
  const breaker = new CircuitBreaker(action, {
    ...DEFAULT_OPTIONS,
    ...options
  });

  // Wire up logging
  breaker.on('open', () => {
    logger.warn(`Circuit breaker opened: ${options.name || 'unnamed'}`);
  });

  breaker.on('close', () => {
    logger.info(`Circuit breaker closed: ${options.name || 'unnamed'}`);
  });

  breaker.on('halfOpen', () => {
    logger.info(`Circuit breaker half-open: ${options.name || 'unnamed'}`);
  });

  breaker.on('fallback', (result) => {
    logger.info(`Circuit breaker fallback: ${options.name || 'unnamed'}`);
  });

  breaker.on('timeout', (delay) => {
    logger.warn(`Circuit breaker timeout after ${delay}ms: ${options.name || 'unnamed'}`);
  });

  breaker.on('reject', () => {
    logger.warn(`Circuit breaker rejected: ${options.name || 'unnamed'}`);
  });

  breaker.on('success', () => {
    logger.debug(`Circuit breaker success: ${options.name || 'unnamed'}`);
  });

  breaker.on('failure', (error) => {
    logger.error(`Circuit breaker failure: ${options.name || 'unnamed'}`, { 
      error: error.message,
      stack: error.stack
    });
  });

  // Add fallback if provided
  if (fallback) {
    breaker.fallback(fallback);
  }

  return breaker;
}

/**
 * Circuit breaker for HTTP requests (works with axios, node-fetch, etc.)
 * 
 * @param {Function} requestFn - The HTTP request function
 * @param {Object} options - Circuit breaker options
 * @param {Function} fallback - Optional fallback function
 * @param {Object} logger - Optional logger
 * @returns {Function} Function that executes the request with circuit breaking
 */
function httpCircuitBreaker(requestFn, options = {}, fallback = null, logger = console) {
  const defaultHttpOptions = {
    name: options.name || 'HTTP Request',
    timeout: options.timeout || 3000,
    errorThresholdPercentage: options.errorThresholdPercentage || 50
  };
  
  const breaker = createCircuitBreaker(requestFn, defaultHttpOptions, fallback, logger);
  
  return (...args) => breaker.fire(...args);
}

module.exports = {
  createCircuitBreaker,
  httpCircuitBreaker
};
