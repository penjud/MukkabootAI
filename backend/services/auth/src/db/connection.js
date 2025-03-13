/**
 * MongoDB Connection Module
 * Manages database connection for Auth Service
 */

const mongoose = require('mongoose');

// Connection status
let connected = false;

/**
 * Initialize database connection
 * @param {object} logger - Winston logger instance
 * @returns {Promise} Connection promise
 */
const initializeDatabase = async (logger) => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mcp-auth';
    
    // Set mongoose options
    mongoose.set('strictQuery', false);
    
    // Add connection event listeners
    mongoose.connection.on('connected', () => {
      connected = true;
      logger.info('MongoDB connection established');
    });
    
    mongoose.connection.on('error', (err) => {
      connected = false;
      logger.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      connected = false;
      logger.warn('MongoDB connection disconnected');
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      mongoose.connection.close(() => {
        logger.info('MongoDB connection closed due to application termination');
        process.exit(0);
      });
    });
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    return mongoose.connection;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    connected = false;
    throw error;
  }
};

/**
 * Check if database is connected
 * @returns {boolean} Connection status
 */
const isConnected = () => {
  return connected && mongoose.connection.readyState === 1;
};

module.exports = {
  initializeDatabase,
  isConnected,
  mongoose
};