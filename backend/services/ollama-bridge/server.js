const express = require('express');
const cors = require('cors');
const axios = require('axios');
const http = require('http');
const socketIO = require('socket.io');
const morgan = require('morgan');
const winston = require('winston');
const dotenv = require('dotenv');
const helmet = require('helmet');
const mcache = require('memory-cache');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.OLLAMA_BRIDGE_PORT || 3015;
const HOST = process.env.OLLAMA_BRIDGE_HOST || 'localhost';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const BASE_SERVER_URL = process.env.BASE_SERVER_URL || 'http://localhost:3010';
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:3013';
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const CACHE_DURATION = process.env.CACHE_DURATION || 3600000; // 1 hour by default
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Setup logging
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ollama-bridge' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Rate limiter configuration - 100 requests per minute
const rateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

// Cache middleware
const cache = (duration) => {
  return (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') return next();
    
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

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimiterMiddleware);

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    
    // Authentication bypass for development/testing
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      logger.warn('Authentication bypassed in development mode');
      return next();
    }
    
    if (!token || !token.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }
    
    const tokenValue = token.split(' ')[1];
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(tokenValue, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (jwtError) {
      logger.debug('JWT verification failed, trying to validate with auth server');
      
      // If JWT verification fails, try validating with the auth server
      try {
        const authResponse = await axios.post(`${AUTH_SERVER_URL}/validate-token`, {
          token: tokenValue
        });
        
        if (authResponse.data.valid) {
          req.user = authResponse.data.user;
          return next();
        }
      } catch (authError) {
        logger.error('Error validating token with auth server:', authError.message);
      }
      
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    logger.error('Authentication error:', error.message);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

// Register with base server
const registerWithBaseServer = async () => {
  try {
    const response = await axios.post(`${BASE_SERVER_URL}/api/registry/services`, {
      name: 'ollama-bridge',
      host: HOST,
      port: PORT,
      type: 'ollama-bridge',
      description: 'MukkabootAI Ollama Bridge Server for AI model integration'
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

// Check Ollama connection
const checkOllamaConnection = async () => {
  try {
    await axios.get(`${OLLAMA_HOST}/api/tags`);
    logger.info(`Successfully connected to Ollama at ${OLLAMA_HOST}`);
    return true;
  } catch (error) {
    logger.error(`Failed to connect to Ollama at ${OLLAMA_HOST}:`, error.message);
    return false;
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'MukkabootAI Ollama Bridge',
    version: '1.0.0',
    status: 'running',
    ollamaConnected: checkOllamaConnection()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'ollama-bridge',
    timestamp: new Date().toISOString()
  });
});

// Get available models
app.get('/api/models', authenticate, cache(30000), async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_HOST}/api/tags`);
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching models:', error.message);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Get model details
app.get('/api/models/:name', authenticate, cache(60000), async (req, res) => {
  try {
    const modelName = req.params.name;
    const response = await axios.post(`${OLLAMA_HOST}/api/show`, {
      name: modelName
    });
    res.json(response.data);
  } catch (error) {
    logger.error(`Error fetching model ${req.params.name}:`, error.message);
    res.status(500).json({ error: `Failed to fetch model ${req.params.name}` });
  }
});

// Generate text with selected model
app.post('/api/generate', authenticate, async (req, res) => {
  try {
    const { model, prompt, system, options, stream } = req.body;
    
    if (!model || !prompt) {
      return res.status(400).json({ error: 'Model and prompt are required' });
    }
    
    // For non-streaming responses
    if (!stream) {
      const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
        model,
        prompt,
        system,
        options
      });
      
      return res.json(response.data);
    }
    
    // For streaming responses
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model,
      prompt,
      system,
      options,
      stream: true
    }, {
      responseType: 'stream'
    });
    
    response.data.on('data', (chunk) => {
      try {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          const data = JSON.parse(line);
          res.write(`data: ${JSON.stringify(data)}\n\n`);
          
          if (data.done) {
            res.write('event: done\ndata: {}\n\n');
          }
        }
      } catch (error) {
        logger.error('Error processing stream chunk:', error.message);
      }
    });
    
    response.data.on('end', () => {
      res.end();
    });
    
    // Handle client disconnect
    req.on('close', () => {
      logger.debug('Client disconnected from stream');
    });
  } catch (error) {
    logger.error('Error generating text:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate text' });
    }
  }
});

// Chat completion with selected model
app.post('/api/chat', authenticate, async (req, res) => {
  try {
    const { model, messages, stream, options } = req.body;
    
    if (!model || !messages) {
      return res.status(400).json({ error: 'Model and messages are required' });
    }
    
    // For non-streaming responses
    if (!stream) {
      const response = await axios.post(`${OLLAMA_HOST}/api/chat`, {
        model,
        messages,
        options
      });
      
      return res.json(response.data);
    }
    
    // For streaming responses
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const response = await axios.post(`${OLLAMA_HOST}/api/chat`, {
      model,
      messages,
      options,
      stream: true
    }, {
      responseType: 'stream'
    });
    
    response.data.on('data', (chunk) => {
      try {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          const data = JSON.parse(line);
          res.write(`data: ${JSON.stringify(data)}\n\n`);
          
          if (data.done) {
            res.write('event: done\ndata: {}\n\n');
          }
        }
      } catch (error) {
        logger.error('Error processing stream chunk:', error.message);
      }
    });
    
    response.data.on('end', () => {
      res.end();
    });
    
    // Handle client disconnect
    req.on('close', () => {
      logger.debug('Client disconnected from stream');
    });
  } catch (error) {
    logger.error('Error in chat completion:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process chat completion' });
    }
  }
});

// Pull a model
app.post('/api/models/pull', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Model name is required' });
    }
    
    // For streaming pull progress
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const response = await axios.post(`${OLLAMA_HOST}/api/pull`, {
      name
    }, {
      responseType: 'stream'
    });
    
    response.data.on('data', (chunk) => {
      try {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          const data = JSON.parse(line);
          res.write(`data: ${JSON.stringify(data)}\n\n`);
          
          if (data.status === 'success') {
            res.write('event: done\ndata: {}\n\n');
          }
        }
      } catch (error) {
        logger.error('Error processing stream chunk:', error.message);
      }
    });
    
    response.data.on('end', () => {
      res.end();
    });
    
    // Handle client disconnect
    req.on('close', () => {
      logger.debug('Client disconnected from stream');
    });
  } catch (error) {
    logger.error(`Error pulling model:`, error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to pull model' });
    }
  }
});

// Delete a model
app.delete('/api/models/:name', authenticate, async (req, res) => {
  try {
    const modelName = req.params.name;
    await axios.delete(`${OLLAMA_HOST}/api/delete`, {
      data: { name: modelName }
    });
    res.json({ message: `Model ${modelName} deleted successfully` });
  } catch (error) {
    logger.error(`Error deleting model ${req.params.name}:`, error.message);
    res.status(500).json({ error: 'Failed to delete model' });
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

// Socket.IO for real-time model updates and streaming responses
io.on('connection', (socket) => {
  logger.info('Client connected to Ollama Bridge Socket.IO');
  
  // Send initial models list
  const sendModelsList = async () => {
    try {
      const response = await axios.get(`${OLLAMA_HOST}/api/tags`);
      socket.emit('models', response.data.models);
    } catch (error) {
      logger.error('Error fetching models for socket:', error.message);
      socket.emit('error', { message: 'Failed to fetch models' });
    }
  };
  
  sendModelsList();
  
  // Pull a model
  socket.on('pullModel', async (modelName) => {
    try {
      logger.info(`Pulling model: ${modelName}`);
      socket.emit('modelStatus', { 
        model: modelName, 
        status: 'pulling',
        message: `Started pulling ${modelName}...`
      });
      
      const response = await axios.post(`${OLLAMA_HOST}/api/pull`, {
        name: modelName
      }, {
        responseType: 'stream'
      });
      
      response.data.on('data', (chunk) => {
        try {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            const data = JSON.parse(line);
            socket.emit('pullProgress', data);
          }
        } catch (error) {
          logger.error('Error processing pull progress:', error.message);
        }
      });
      
      response.data.on('end', () => {
        socket.emit('modelStatus', { 
          model: modelName, 
          status: 'success',
          message: `Successfully pulled ${modelName}`
        });
        
        // Update models list after successful pull
        sendModelsList();
      });
    } catch (error) {
      logger.error(`Error pulling model ${modelName}:`, error.message);
      socket.emit('modelStatus', { 
        model: modelName, 
        status: 'error',
        message: `Failed to pull ${modelName}: ${error.message}`
      });
    }
  });
  
  // Stream model generation progress
  socket.on('streamGeneration', async (data) => {
    const { model, prompt, system, options } = data;
    
    try {
      logger.info(`Starting stream generation with model: ${model}`);
      
      const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
        model,
        prompt,
        system,
        options,
        stream: true
      }, {
        responseType: 'stream'
      });
      
      response.data.on('data', (chunk) => {
        try {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            const data = JSON.parse(line);
            socket.emit('generationUpdate', data);
            
            if (data.done) {
              socket.emit('generationComplete');
            }
          }
        } catch (error) {
          logger.error('Error processing stream chunk:', error.message);
        }
      });
      
      response.data.on('end', () => {
        socket.emit('generationComplete');
      });
      
    } catch (error) {
      logger.error('Error in stream generation:', error.message);
      socket.emit('error', { message: 'Stream generation failed' });
    }
  });
  
  // Stream chat completion
  socket.on('streamChat', async (data) => {
    const { model, messages, options } = data;
    
    try {
      logger.info(`Starting stream chat with model: ${model}`);
      
      const response = await axios.post(`${OLLAMA_HOST}/api/chat`, {
        model,
        messages,
        options,
        stream: true
      }, {
        responseType: 'stream'
      });
      
      response.data.on('data', (chunk) => {
        try {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            const data = JSON.parse(line);
            socket.emit('chatUpdate', data);
            
            if (data.done) {
              socket.emit('chatComplete');
            }
          }
        } catch (error) {
          logger.error('Error processing chat stream chunk:', error.message);
        }
      });
      
      response.data.on('end', () => {
        socket.emit('chatComplete');
      });
      
    } catch (error) {
      logger.error('Error in stream chat:', error.message);
      socket.emit('error', { message: 'Stream chat failed' });
    }
  });
  
  // Disconnect event
  socket.on('disconnect', () => {
    logger.info('Client disconnected from Ollama Bridge Socket.IO');
  });
});

// Start server and register with base server
const startServer = async () => {
  // Check Ollama connection before starting
  const ollamaConnected = await checkOllamaConnection();
  
  if (!ollamaConnected) {
    logger.warn('Starting server without Ollama connection. Some functionality will be limited.');
  }
  
  server.listen(PORT, HOST, async () => {
    logger.info(`MukkabootAI Ollama Bridge server running at http://${HOST}:${PORT}`);
    logger.info(`Ollama connection status: ${ollamaConnected ? 'Connected' : 'Not connected'}`);
    
    // Register with base server after a short delay
    setTimeout(() => registerWithRetry(), 3000);
  });
};

// Start the server
startServer();

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