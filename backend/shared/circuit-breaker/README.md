# MukkabootAI Circuit Breaker

Circuit breaker pattern implementation for MukkabootAI microservices using the Opossum library.

## What is a Circuit Breaker?

The Circuit Breaker pattern prevents cascading failures in distributed systems by failing fast when a dependent service is unavailable, overloaded, or experiencing high latency. It helps your system degrade gracefully and recover automatically once the dependent service returns to normal.

## Features

- Fail fast when dependent services are down
- Automatic recovery testing
- Configurable timeouts and failure thresholds
- Event-based monitoring
- Fallback functionality

## Installation

```bash
cd /path/to/your/service
npm install ../../shared/circuit-breaker
```

## Basic Usage

```javascript
const { createCircuitBreaker } = require('@mukkaboot/circuit-breaker');

// Create a circuit breaker for a function that might fail
const getUser = async (userId) => {
  // This could be a database query or API call
  return await db.users.findById(userId);
};

const getUserBreaker = createCircuitBreaker(getUser, { 
  name: 'get-user',
  timeout: 3000
});

// Use the circuit breaker
try {
  const user = await getUserBreaker.fire('user-123');
  console.log('User:', user);
} catch (error) {
  console.error('Failed to get user:', error);
}
```

## HTTP Requests Example

```javascript
const { httpCircuitBreaker } = require('@mukkaboot/circuit-breaker');
const axios = require('axios');

// Create a circuit-broken HTTP request function
const fetchData = httpCircuitBreaker(
  async (url) => {
    const response = await axios.get(url);
    return response.data;
  },
  { name: 'api-request', timeout: 2000 },
  // Fallback function that returns cached data
  async (url) => {
    return cachedData[url] || { error: 'Service unavailable' };
  }
);

// Use it
const data = await fetchData('https://api.example.com/data');
```

## Advanced Configuration

```javascript
const breaker = createCircuitBreaker(myFunction, {
  name: 'important-service',
  timeout: 5000,                   // Time in ms before a request is considered failed
  errorThresholdPercentage: 50,    // Percentage of failures before opening circuit
  resetTimeout: 10000,             // Time in ms to wait before testing the service again
  rollingCountTimeout: 10000,      // Time window for failure statistics
  volumeThreshold: 10,             // Minimum number of requests before tripping circuit
});

// React to circuit breaker events
breaker.on('open', () => {
  console.log('Circuit breaker opened - service is unavailable');
});

breaker.on('close', () => {
  console.log('Circuit breaker closed - service is operational');
});
```

## Integration with Telemetry

The circuit breaker logs events that can be captured by your telemetry system for monitoring and alerting.
