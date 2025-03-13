/**
 * User Routes
 * Handles user registration, profile management, and admin operations
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Initialize user routes
 * @param {Object} options - Configuration options
 * @returns {Object} Router
 */
function initUserRoutes(options) {
  const {
    userRepository,
    refreshTokenRepository,
    features,
    usersData,
    saveUsers,
    logger,
    middlewares
  } = options;
  
  const router = express.Router();
  const { authenticateToken, requireAdmin } = middlewares;
  
  // File-based user functions
  const saveUserToFile = (user) => {
    // Ensure user has an ID
    if (!user.id) {
      user.id = crypto.randomUUID();
    }
    
    // Check if user already exists
    const existingIndex = usersData.users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      // Update existing user
      usersData.users[existingIndex] = { ...usersData.users[existingIndex], ...user };
    } else {
      // Add new user
      usersData.users.push(user);
    }
    
    return saveUsers();
  };
  
  const deleteUserFromFile = (id) => {
    const initialLength = usersData.users.length;
    usersData.users = usersData.users.filter(u => u.id !== id);
    
    // Also remove refresh tokens
    if (usersData.refreshTokens[id]) {
      delete usersData.refreshTokens[id];
    }
    
    saveUsers();
    return initialLength !== usersData.users.length;
  };
  
  // Routes
  
  // Get current user profile
  router.get('/me', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get user
      let user;
      if (features.useMongoDB) {
        user = await userRepository.findById(userId);
        if (!user) {
          return res.status(404).json({
            error: 'User not found',
            status: 404
          });
        }
        
        // Convert to plain object
        user = user.toObject();
      } else {
        // Find in file
        user = usersData.users.find(u => u.id === userId);
        if (!user) {
          return res.status(404).json({
            error: 'User not found',
            status: 404
          });
        }
      }
      
      // Remove sensitive data
      delete user.passwordHash;
      
      res.json({
        user
      });
    } catch (error) {
      logger.error(`Error getting user profile: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while retrieving the user profile',
        status: 500
      });
    }
  });
  
  // Update user profile
  router.put('/me', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { email, currentPassword, newPassword, preferences } = req.body;
      
      // Fields to update
      const updates = {};
      
      if (features.useMongoDB) {
        // Get user
        const user = await userRepository.findById(userId);
        if (!user) {
          return res.status(404).json({
            error: 'User not found',
            status: 404
          });
        }
        
        // Update email if provided
        if (email) {
          updates.email = email;
        }
        
        // Update password if provided
        if (currentPassword && newPassword) {
          // Verify current password
          const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
          if (!passwordValid) {
            return res.status(400).json({
              error: 'Current password is incorrect',
              status: 400
            });
          }
          
          // Hash new password
          updates.passwordHash = await bcrypt.hash(newPassword, 10);
        }
        
        // Update preferences if provided
        if (preferences) {
          updates.preferences = { ...user.preferences, ...preferences };
        }
        
        // Update user
        const updatedUser = await userRepository.update(userId, updates);
        
        // Remove sensitive data
        const userToReturn = updatedUser.toObject();
        delete userToReturn.passwordHash;
        
        res.json({
          message: 'Profile updated successfully',
          user: userToReturn
        });
      } else {
        // Find user in file
        const userIndex = usersData.users.findIndex(u => u.id === userId);
        if (userIndex < 0) {
          return res.status(404).json({
            error: 'User not found',
            status: 404
          });
        }
        
        // Get user
        const user = usersData.users[userIndex];
        
        // Update email if provided
        if (email) {
          updates.email = email;
        }
        
        // Update password if provided
        if (currentPassword && newPassword) {
          // Verify current password
          const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
          if (!passwordValid) {
            return res.status(400).json({
              error: 'Current password is incorrect',
              status: 400
            });
          }
          
          // Hash new password
          updates.passwordHash = await bcrypt.hash(newPassword, 10);
        }
        
        // Update preferences if provided
        if (preferences) {
          updates.preferences = { ...(user.preferences || {}), ...preferences };
        }
        
        // Update user
        const updatedUser = { ...user, ...updates };
        usersData.users[userIndex] = updatedUser;
        saveUsers();
        
        // Remove sensitive data
        const userToReturn = { ...updatedUser };
        delete userToReturn.passwordHash;
        
        res.json({
          message: 'Profile updated successfully',
          user: userToReturn
        });
      }
    } catch (error) {
      logger.error(`Error updating user profile: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while updating the user profile',
        status: 500
      });
    }
  });
  
  // Register new user
  router.post('/register', async (req, res) => {
    try {
      // Check if registration is enabled
      if (!features.allowUserRegistration) {
        return res.status(403).json({
          error: 'User registration is disabled',
          status: 403
        });
      }
      
      const { username, email, password } = req.body;
      
      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({
          error: 'Username, email, and password are required',
          status: 400
        });
      }
      
      // Check if username or email already exists
      let existingUser;
      
      if (features.useMongoDB) {
        existingUser = await userRepository.findByUsername(username);
        if (!existingUser) {
          existingUser = await userRepository.findByEmail(email);
        }
      } else {
        existingUser = usersData.users.find(
          u => u.username === username || u.email === email
        );
      }
      
      if (existingUser) {
        return res.status(409).json({
          error: 'Username or email already exists',
          status: 409
        });
      }
      
      // Create new user
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = {
        username,
        email,
        passwordHash,
        role: 'user',
        active: true,
        verified: !features.useEmailVerification,
        createdAt: new Date().toISOString()
      };
      
      if (features.useMongoDB) {
        const createdUser = await userRepository.create(newUser);
        
        // Remove sensitive data
        const userToReturn = createdUser.toObject();
        delete userToReturn.passwordHash;
        
        res.status(201).json({
          message: 'User registered successfully',
          user: userToReturn
        });
      } else {
        // Add ID for file storage
        newUser.id = crypto.randomUUID();
        
        // Save to file
        usersData.users.push(newUser);
        saveUsers();
        
        // Remove sensitive data
        const userToReturn = { ...newUser };
        delete userToReturn.passwordHash;
        
        res.status(201).json({
          message: 'User registered successfully',
          user: userToReturn
        });
      }
    } catch (error) {
      logger.error(`Error registering user: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred during registration',
        status: 500
      });
    }
  });
  
  // Admin Routes - Get all users
  router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { skip = 0, limit = 20, role } = req.query;
      
      let users;
      if (features.useMongoDB) {
        users = await userRepository.listAll({
          skip: parseInt(skip),
          limit: parseInt(limit),
          role
        });
        
        // Convert to plain objects and remove sensitive data
        users = users.map(user => {
          const u = user.toObject();
          delete u.passwordHash;
          return u;
        });
      } else {
        // Filter users from file
        users = [...usersData.users];
        
        if (role) {
          users = users.filter(u => u.role === role);
        }
        
        // Apply pagination
        users = users
          .slice(parseInt(skip), parseInt(skip) + parseInt(limit))
          .map(u => {
            const user = { ...u };
            delete user.passwordHash;
            return user;
          });
      }
      
      res.json({
        users,
        meta: {
          skip: parseInt(skip),
          limit: parseInt(limit),
          total: features.useMongoDB ? 
            await userRepository.count(role ? { role } : {}) : 
            usersData.users.filter(u => !role || u.role === role).length
        }
      });
    } catch (error) {
      logger.error(`Error listing users: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while retrieving users',
        status: 500
      });
    }
  });
  
  // Admin Routes - Get user by ID
  router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      let user;
      if (features.useMongoDB) {
        user = await userRepository.findById(id);
        if (!user) {
          return res.status(404).json({
            error: 'User not found',
            status: 404
          });
        }
        
        // Convert to plain object
        user = user.toObject();
      } else {
        // Find in file
        user = usersData.users.find(u => u.id === id);
        if (!user) {
          return res.status(404).json({
            error: 'User not found',
            status: 404
          });
        }
      }
      
      // Remove sensitive data
      delete user.passwordHash;
      
      res.json({
        user
      });
    } catch (error) {
      logger.error(`Error getting user: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while retrieving the user',
        status: 500
      });
    }
  });
  
  // Admin Routes - Create user
  router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { username, email, password, role = 'user' } = req.body;
      
      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({
          error: 'Username, email, and password are required',
          status: 400
        });
      }
      
      // Validate role
      if (role !== 'user' && role !== 'admin') {
        return res.status(400).json({
          error: 'Invalid role',
          status: 400
        });
      }
      
      // Check if username or email already exists
      let existingUser;
      
      if (features.useMongoDB) {
        existingUser = await userRepository.findByUsername(username);
        if (!existingUser) {
          existingUser = await userRepository.findByEmail(email);
        }
      } else {
        existingUser = usersData.users.find(
          u => u.username === username || u.email === email
        );
      }
      
      if (existingUser) {
        return res.status(409).json({
          error: 'Username or email already exists',
          status: 409
        });
      }
      
      // Create new user
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = {
        username,
        email,
        passwordHash,
        role,
        active: true,
        verified: true,
        createdAt: new Date().toISOString()
      };
      
      if (features.useMongoDB) {
        const createdUser = await userRepository.create(newUser);
        
        // Remove sensitive data
        const userToReturn = createdUser.toObject();
        delete userToReturn.passwordHash;
        
        res.status(201).json({
          message: 'User created successfully',
          user: userToReturn
        });
      } else {
        // Add ID for file storage
        newUser.id = crypto.randomUUID();
        
        // Save to file
        usersData.users.push(newUser);
        saveUsers();
        
        // Remove sensitive data
        const userToReturn = { ...newUser };
        delete userToReturn.passwordHash;
        
        res.status(201).json({
          message: 'User created successfully',
          user: userToReturn
        });
      }
    } catch (error) {
      logger.error(`Error creating user: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while creating the user',
        status: 500
      });
    }
  });
  
  // Admin Routes - Update user
  router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { email, role, active, verified, password } = req.body;
      
      // Fields to update
      const updates = {};
      
      // Update fields if provided
      if (email) updates.email = email;
      if (role) updates.role = role;
      if (active !== undefined) updates.active = active;
      if (verified !== undefined) updates.verified = verified;
      
      // Update password if provided
      if (password) {
        updates.passwordHash = await bcrypt.hash(password, 10);
      }
      
      if (features.useMongoDB) {
        // Get user
        const user = await userRepository.findById(id);
        if (!user) {
          return res.status(404).json({
            error: 'User not found',
            status: 404
          });
        }
        
        // Update user
        const updatedUser = await userRepository.update(id, updates);
        
        // Remove sensitive data
        const userToReturn = updatedUser.toObject();
        delete userToReturn.passwordHash;
        
        res.json({
          message: 'User updated successfully',
          user: userToReturn
        });
      } else {
        // Find user in file
        const userIndex = usersData.users.findIndex(u => u.id === id);
        if (userIndex < 0) {
          return res.status(404).json({
            error: 'User not found',
            status: 404
          });
        }
        
        // Update user
        usersData.users[userIndex] = {
          ...usersData.users[userIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        saveUsers();
        
        // Remove sensitive data
        const userToReturn = { ...usersData.users[userIndex] };
        delete userToReturn.passwordHash;
        
        res.json({
          message: 'User updated successfully',
          user: userToReturn
        });
      }
    } catch (error) {
      logger.error(`Error updating user: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while updating the user',
        status: 500
      });
    }
  });
  
  // Admin Routes - Delete user
  router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent deletion of the own account
      if (id === req.user.id) {
        return res.status(400).json({
          error: 'Cannot delete your own account',
          status: 400
        });
      }
      
      let success;
      if (features.useMongoDB) {
        // Delete user
        success = await userRepository.delete(id);
        
        // Revoke all refresh tokens for the user
        if (success) {
          await refreshTokenRepository.revokeAllUserTokens(id);
        }
      } else {
        // Delete from file
        success = deleteUserFromFile(id);
      }
      
      if (!success) {
        return res.status(404).json({
          error: 'User not found',
          status: 404
        });
      }
      
      res.json({
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting user: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while deleting the user',
        status: 500
      });
    }
  });
  
  return router;
}

module.exports = initUserRoutes;