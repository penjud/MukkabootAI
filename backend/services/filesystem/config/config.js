const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

// Parse allowed directories from the comma-separated list in .env
const parseAllowedDirectories = () => {
  const dirString = process.env.ALLOWED_DIRECTORIES || '/home/mothership';
  return dirString.split(',').map(dir => dir.trim());
};

const config = {
  service: {
    name: 'MukkabootAI Filesystem Service',
    port: parseInt(process.env.FILESYSTEM_MCP_PORT || '3012', 10),
    host: process.env.FILESYSTEM_MCP_HOST || 'localhost',
    version: '1.0.0',
  },
  baseService: {
    url: process.env.BASE_MCP_URL || `http://${process.env.BASE_MCP_HOST || 'localhost'}:${process.env.BASE_MCP_PORT || '3010'}`,
  },
  filesystem: {
    allowedDirectories: parseAllowedDirectories(),
    uploadsDir: process.env.UPLOADS_DIR || '/home/mothership/MukkabootAI/data/uploads',
    avatarsDir: process.env.AVATARS_DIR || '/home/mothership/MukkabootAI/data/uploads/avatars',
    watcherDepth: parseInt(process.env.WATCHER_DEPTH || '5', 10),
    uploadLimitMB: parseInt(process.env.UPLOAD_LIMIT_MB || '5', 10),
  },
  security: {
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // increased from 100 to 1000 requests per windowMs
  },
  logging: {
    level: process.env.FILESYSTEM_MCP_LOG_LEVEL || 'info',
  },
};

module.exports = config;