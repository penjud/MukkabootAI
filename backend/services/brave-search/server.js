const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const winston = require('winston');
const dotenv = require('dotenv');
const axios = require('axios');
const _ = require('lodash');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const mcache = require('memory-cache');

// Load environment variables
dotenv.config();

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'brave-search-server' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Configuration
const PORT = process.env.BRAVE_SEARCH_PORT || 3014;
const HOST = process.env.BRAVE_SEARCH_HOST || 'localhost';
const BASE_SERVER_URL = process.env.BASE_SERVER_URL || 'http://localhost:3010';
const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
const BRAVE_SEARCH_API_URL = 'https://api.search.brave.com/res/v1/web/search';
const CACHE_DURATION = process.env.CACHE_DURATION || 3600000; // 1 hour by default

if (!BRAVE_SEARCH_API_KEY) {
  logger.warn('BRAVE_SEARCH_API_KEY not set. Brave Search API will not work properly.');
}

// Create Express app
const app = express();

// Rate limiter configuration - 60 requests per minute
const rateLimiter = new RateLimiterMemory({
  points: 60,
  duration: 60,
});

// Cache middleware
const cache = (duration) => {
  return (req, res, next) => {
    const key = '__express__' + req.originalUrl || req.url;
    const cachedBody = mcache.get(key);
    
    if (cachedBody) {
      logger.debug('Cache hit for', key);
      res.send(JSON.parse(cachedBody));
      return;
    }

    // Override res.send to cache the response
    const originalSend = res.send;
    res.send = function(body) {
      mcache.put(key, JSON.stringify(body), duration);
      originalSend.call(this, body);
    };
    
    next();
  };
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

// Rate limiting middleware
const rateLimiterMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (error) {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(error.msBeforeNext / 1000) || 60
    });
  }
};

// Apply rate limiting to search endpoints
app.use('/search', rateLimiterMiddleware);
app.use('/local', rateLimiterMiddleware);
app.use('/news', rateLimiterMiddleware);
app.use('/images', rateLimiterMiddleware);

// Register with base server
const registerWithBaseServer = async () => {
  try {
    const response = await axios.post(`${BASE_SERVER_URL}/api/registry/services`, {
      name: 'brave-search',
      host: HOST,
      port: PORT,
      type: 'brave-search',
      description: 'MukkabootAI Brave Search Server for web search capabilities'
    }, {
      headers: {
        'Authorization': 'Bearer default-auth-token'
      }
    });
    logger.info('Registered with base server', response.data);
    return true;
  } catch (error) {
    logger.error('Failed to register with base server:', error.message);
    return false;
  }
};

// Register with retries
const registerWithRetry = async (maxRetries = 5, delay = 5000) => {
  let retries = 0;
  let registered = false;

  while (!registered && retries < maxRetries) {
    registered = await registerWithBaseServer();
    if (!registered) {
      retries++;
      logger.info(`Retrying registration in ${delay/1000} seconds (${retries}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  if (!registered) {
    logger.error(`Failed to register after ${maxRetries} attempts.`);
  }
};

// SSE Event Stream Setup
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial data
  const data = JSON.stringify({
    type: 'brave-search',
    data: {
      status: 'ready',
      hasApiKey: !!BRAVE_SEARCH_API_KEY
    }
  });
  
  res.write(`data: ${data}\n\n`);
  
  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(':\n\n');
  }, 15000);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    logger.debug('Client disconnected from event stream');
  });
});

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'MukkabootAI Brave Search Server',
    version: '1.0.0',
    status: 'running',
    hasApiKey: !!BRAVE_SEARCH_API_KEY
  });
});

// Health endpoint for service discovery
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'brave-search',
    timestamp: new Date().toISOString(),
    hasApiKey: !!BRAVE_SEARCH_API_KEY
  });
});

// Web search endpoint
app.get('/search', cache(CACHE_DURATION), async (req, res) => {
  try {
    const { query, count = 10, offset = 0 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    if (!BRAVE_SEARCH_API_KEY) {
      return res.status(500).json({ error: 'Brave Search API key not configured' });
    }
    
    logger.debug(`Processing web search for query: ${query}`);
    
    // Make request to Brave Search API
    const response = await axios.get(BRAVE_SEARCH_API_URL, {
      params: {
        q: query,
        count: Math.min(20, parseInt(count) || 10),
        offset: parseInt(offset) || 0
      },
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_SEARCH_API_KEY
      }
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error searching:', error);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Error from Brave Search API',
        status: error.response.status,
        message: error.response.data
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Local search endpoint (places, businesses, etc.)
app.get('/local', cache(CACHE_DURATION), async (req, res) => {
  try {
    const { query, count = 5 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    if (!BRAVE_SEARCH_API_KEY) {
      return res.status(500).json({ error: 'Brave Search API key not configured' });
    }
    
    logger.debug(`Processing local search for query: ${query}`);
    
    // Make request to Brave Search API with local search parameters
    const response = await axios.get(BRAVE_SEARCH_API_URL, {
      params: {
        q: `${query} near me`,
        count: Math.min(20, parseInt(count) || 5),
        result_filter: 'local'
      },
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_SEARCH_API_KEY
      }
    });
    
    // Extract local results or fallback to regular search
    const results = _.get(response.data, 'local', []);
    
    if (results.length === 0) {
      return res.json({
        query,
        results: [],
        fallback: 'No local results found',
        web_results: response.data.web && response.data.web.results
      });
    }
    
    res.json({
      query,
      results
    });
  } catch (error) {
    logger.error('Error with local search:', error);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Error from Brave Search API',
        status: error.response.status,
        message: error.response.data
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// News search endpoint
app.get('/news', cache(CACHE_DURATION), async (req, res) => {
  try {
    const { query, count = 10, freshness } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    if (!BRAVE_SEARCH_API_KEY) {
      return res.status(500).json({ error: 'Brave Search API key not configured' });
    }
    
    logger.debug(`Processing news search for query: ${query}`);
    
    // Prepare parameters
    const params = {
      q: query,
      count: Math.min(20, parseInt(count) || 10),
      result_filter: 'news'
    };
    
    // Add freshness if specified
    if (freshness && ['day', 'week', 'month'].includes(freshness)) {
      params.freshness = freshness;
    }
    
    // Make request to Brave Search API
    const response = await axios.get(BRAVE_SEARCH_API_URL, {
      params,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_SEARCH_API_KEY
      }
    });
    
    // Extract news results
    const results = _.get(response.data, 'news', []);
    
    res.json({
      query,
      results
    });
  } catch (error) {
    logger.error('Error searching news:', error);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Error from Brave Search API',
        status: error.response.status,
        message: error.response.data
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Images search endpoint
app.get('/images', cache(CACHE_DURATION), async (req, res) => {
  try {
    const { query, count = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    if (!BRAVE_SEARCH_API_KEY) {
      return res.status(500).json({ error: 'Brave Search API key not configured' });
    }
    
    logger.debug(`Processing image search for query: ${query}`);
    
    // Make request to Brave Search API with image search parameters
    const response = await axios.get(BRAVE_SEARCH_API_URL, {
      params: {
        q: query,
        count: Math.min(20, parseInt(count) || 10),
        result_filter: 'images'
      },
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_SEARCH_API_KEY
      }
    });
    
    // Extract image results
    const results = _.get(response.data, 'images', []);
    
    res.json({
      query,
      results
    });
  } catch (error) {
    logger.error('Error searching images:', error);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Error from Brave Search API',
        status: error.response.status,
        message: error.response.data
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Clear cache endpoint (admin only)
app.post('/admin/clear-cache', async (req, res) => {
  // In a real implementation, you would check admin credentials here
  
  logger.info('Clearing cache');
  mcache.clear();
  
  res.json({
    status: 'success',
    message: 'Cache cleared successfully'
  });
});

// Query handler endpoint
app.post('/query', async (req, res) => {
  try {
    const { query, type = 'web', options = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    let searchEndpoint;
    
    switch (type.toLowerCase()) {
      case 'local':
        searchEndpoint = '/local';
        break;
      case 'news':
        searchEndpoint = '/news';
        break;
      case 'images':
        searchEndpoint = '/images';
        break;
      case 'web':
      default:
        searchEndpoint = '/search';
    }
    
    // Make internal request to appropriate endpoint
    const url = `http://localhost:${PORT}${searchEndpoint}`;
    const params = { query, ...options };
    
    // Use axios to make the request
    const response = await axios.get(url, { params });
    
    // Return structured response
    res.json({
      status: 'success',
      source: 'brave-search',
      type,
      data: response.data
    });
  } catch (error) {
    logger.error('Error handling query:', error);
    
    res.status(500).json({
      status: 'error',
      source: 'brave-search',
      error: error.message
    });
  }
});

// Start server and register with base server
const server = app.listen(PORT, HOST, async () => {
  logger.info(`MukkabootAI Brave Search Server running at http://${HOST}:${PORT}`);
  // Register with base server after a short delay
  setTimeout(() => registerWithRetry(), 3000);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Export app for testing
module.exports = app;