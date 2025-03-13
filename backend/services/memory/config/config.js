const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const config = {
  service: {
    name: 'MukkabootAI Memory Service',
    port: parseInt(process.env.MEMORY_MCP_PORT || '3011', 10),
    host: process.env.MEMORY_MCP_HOST || 'localhost',
    version: '1.0.0',
  },
  baseService: {
    url: process.env.BASE_MCP_URL || `http://${process.env.BASE_MCP_HOST || 'localhost'}:${process.env.BASE_MCP_PORT || '3010'}`,
  },
  storage: {
    memoryFilePath: process.env.MEMORY_FILE_PATH || '/home/mothership/MukkabootAI/data/memory/memory.json',
    conversationsDir: process.env.CONVERSATIONS_DIR || '/home/mothership/MukkabootAI/data/memory/conversations',
    agentsDir: process.env.AGENTS_DIR || '/home/mothership/MukkabootAI/data/memory/agents',
  },
  security: {
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // increased limit from 100 to 1000 requests per windowMs
  },
  logging: {
    level: process.env.MEMORY_MCP_LOG_LEVEL || 'info',
  },
};

module.exports = config;