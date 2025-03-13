/**
 * Password Reset Token Repository
 * Handles password reset token operations
 */

const mongoose = require('mongoose');
const features = require('../config/features');

// Define schema for password reset tokens if MongoDB is available
let PasswordResetToken;

try {
  if (mongoose.connection) {
    const passwordResetSchema = new mongoose.Schema({
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
      used: {
        type: Boolean,
        default: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    });

    PasswordResetToken = mongoose.models.PasswordResetToken || 
                          mongoose.model('PasswordResetToken', passwordResetSchema);
  }
} catch (error) {
  // MongoDB not available
  PasswordResetToken = null;
}

class PasswordResetTokenRepository {
  /**
   * Create a new password reset token
   * @param {Object} tokenData - Token data object
   * @returns {Promise<Object>} Created token
   */
  async create(tokenData) {
    if (!features.useMongoDB || !PasswordResetToken) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    const token = new PasswordResetToken(tokenData);
    return await token.save();
  }
  
  /**
   * Find a token by its value
   * @param {string} token - Token value to search for
   * @returns {Promise<Object|null>} Token object or null if not found
   */
  async findByToken(token) {
    if (!features.useMongoDB || !PasswordResetToken) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    return await PasswordResetToken.findOne({ token });
  }
  
  /**
   * Find the latest token for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Token object or null if not found
   */
  async findLatestByUserId(userId) {
    if (!features.useMongoDB || !PasswordResetToken) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    return await PasswordResetToken.findOne({ userId })
      .sort({ createdAt: -1 });
  }
  
  /**
   * Mark a token as used
   * @param {string} token - Token value
   * @returns {Promise<Object|null>} Updated token or null if not found
   */
  async markAsUsed(token) {
    if (!features.useMongoDB || !PasswordResetToken) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    return await PasswordResetToken.findOneAndUpdate(
      { token },
      { used: true },
      { new: true }
    );
  }
  
  /**
   * Delete all tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of tokens deleted
   */
  async deleteAllForUser(userId) {
    if (!features.useMongoDB || !PasswordResetToken) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    const result = await PasswordResetToken.deleteMany({ userId });
    return result.deletedCount;
  }
  
  /**
   * Delete expired tokens
   * @returns {Promise<number>} Number of tokens deleted
   */
  async deleteExpired() {
    if (!features.useMongoDB || !PasswordResetToken) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    const result = await PasswordResetToken.deleteMany({
      expires: { $lt: new Date() }
    });
    
    return result.deletedCount;
  }
}

module.exports = PasswordResetTokenRepository;