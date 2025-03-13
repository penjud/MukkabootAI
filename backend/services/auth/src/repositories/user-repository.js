/**
 * User Repository
 * Handles user CRUD operations for MongoDB
 */

const User = require('../models/user-model');
const features = require('../config/features');

class UserRepository {
  /**
   * Create a new user
   * @param {Object} userData - User data object
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    if (!features.useMongoDB || !User) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    const user = new User(userData);
    return await user.save();
  }
  
  /**
   * Find a user by username
   * @param {string} username - Username to search for
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async findByUsername(username) {
    if (!features.useMongoDB || !User) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    return await User.findOne({ username });
  }
  
  /**
   * Find a user by email
   * @param {string} email - Email to search for
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async findByEmail(email) {
    if (!features.useMongoDB || !User) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    return await User.findOne({ email });
  }
  
  /**
   * Find a user by ID
   * @param {string} id - User ID to search for
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async findById(id) {
    if (!features.useMongoDB || !User) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    return await User.findById(id);
  }
  
  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated user or null if not found
   */
  async update(id, updateData) {
    if (!features.useMongoDB || !User) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    return await User.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
  }
  
  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  async delete(id) {
    if (!features.useMongoDB || !User) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }
  
  /**
   * List all users
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Array>} List of users
   */
  async listAll(options = {}) {
    if (!features.useMongoDB || !User) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    const { skip = 0, limit = 100, role, active } = options;
    
    const query = {};
    if (role !== undefined) query.role = role;
    if (active !== undefined) query.active = active;
    
    return await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }
  
  /**
   * Count users
   * @param {Object} filter - Filter criteria
   * @returns {Promise<number>} Count of users
   */
  async count(filter = {}) {
    if (!features.useMongoDB || !User) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    return await User.countDocuments(filter);
  }
  
  /**
   * Update last login timestamp
   * @param {string} id - User ID
   * @returns {Promise<void>}
   */
  async updateLastLogin(id) {
    if (!features.useMongoDB || !User) {
      throw new Error('MongoDB is not enabled or available');
    }
    
    await User.findByIdAndUpdate(id, { lastLogin: Date.now() });
  }
}

module.exports = UserRepository;