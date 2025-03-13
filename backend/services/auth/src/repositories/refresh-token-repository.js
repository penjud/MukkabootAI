/**
 * Refresh Token Repository
 * Handles refresh token operations for MongoDB
 */

const mongoose = require('mongoose');
const features = require('../config/features');

// Define schema for refresh tokens if MongoDB is available
let RefreshToken;

try {
  if (mongoose.connection) {
    const refreshTokenSchema = new mongoose.Schema({
      token: {
        type: String,
        required: true,
        unique: true
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      expires: {
        type: Date,
        required: true
      },
      revoked: {
        type: Boolean,
        default: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      createdByIp: String
    });

    RefreshToken = mongoose.models.RefreshToken || mongoose.model('RefreshToken', refreshTokenSchema);
  }
} catch (error) {
  // MongoDB not available
  RefreshToken = null;
}

class RefreshTokenRepository {
  /**
   * Create a new refresh token
   * @param {Object} tokenData - Token data object
   * @returns {Promise<Object>} Created token
   */
  async create(tokenData) {
    if (!features.useMongoDB || !RefreshToken) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    const token = new RefreshToken(tokenData);
    return await token.save();
  }
  
  /**
   * Find a token by its value
   * @param {string} token - Token value to search for
   * @returns {Promise<Object|null>} Token object or null if not found
   */
  async findByToken(token) {
    if (!features.useMongoDB || !RefreshToken) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    return await RefreshToken.findOne({ token });
  }
  
  /**
   * Find all tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of tokens
   */
  async findByUserId(userId) {
    if (!features.useMongoDB || !RefreshToken) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    return await RefreshToken.find({ userId });
  }
  
  /**
   * Revoke a token
   * @param {string} token - Token value
   * @returns {Promise<Object|null>} Updated token or null if not found
   */
  async revokeToken(token) {
    if (!features.useMongoDB || !RefreshToken) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    return await RefreshToken.findOneAndUpdate(
      { token },
      { revoked: true },
      { new: true }
    );
  }
  
  /**
   * Revoke all tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of tokens revoked
   */
  async revokeAllUserTokens(userId) {
    if (!features.useMongoDB || !RefreshToken) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    const result = await RefreshToken.updateMany(
      { userId },
      { revoked: true }
    );
    
    return result.modifiedCount;
  }
  
  /**
   * Delete expired tokens
   * @returns {Promise<number>} Number of tokens deleted
   */
  async deleteExpired() {
    if (!features.useMongoDB || !RefreshToken) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    const result = await RefreshToken.deleteMany({
      expires: { $lt: new Date() }
    });
    
    return result.deletedCount;
  }
}

module.exports = RefreshTokenRepository;