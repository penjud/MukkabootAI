/**
 * Password Reset Routes
 * Handles password reset requests and token validation
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Initialize password reset routes
 * @param {Object} options - Configuration options
 * @returns {Object} Router
 */
function initPasswordResetRoutes(options) {
  const {
    userRepository,
    passwordResetTokenRepository,
    features,
    usersData,
    saveUsers,
    logger
  } = options;
  
  const router = express.Router();
  
  // File-based functions
  const findUserByEmail = (email) => {
    return usersData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  };
  
  const createPasswordResetToken = (userId) => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1); // 1 hour from now
    
    const resetToken = {
      token,
      userId,
      expires: expiryDate,
      used: false,
      createdAt: new Date().toISOString()
    };
    
    // Store token
    if (!usersData.passwordResetTokens[userId]) {
      usersData.passwordResetTokens[userId] = [];
    }
    
    usersData.passwordResetTokens[userId].push(resetToken);
    saveUsers();
    
    return resetToken;
  };
  
  const findPasswordResetToken = (token) => {
    for (const [userId, tokens] of Object.entries(usersData.passwordResetTokens)) {
      const foundToken = tokens.find(t => t.token === token && !t.used);
      if (foundToken) {
        return { ...foundToken, userId };
      }
    }
    return null;
  };
  
  const markTokenAsUsed = (token) => {
    for (const [userId, tokens] of Object.entries(usersData.passwordResetTokens)) {
      const tokenIndex = tokens.findIndex(t => t.token === token);
      if (tokenIndex >= 0) {
        usersData.passwordResetTokens[userId][tokenIndex].used = true;
        saveUsers();
        return true;
      }
    }
    return false;
  };
  
  // Routes
  
  // Request password reset
  router.post('/password-reset/request', async (req, res) => {
    try {
      // Check if password reset is enabled
      if (!features.allowPasswordReset) {
        return res.status(403).json({
          error: 'Password reset is disabled',
          status: 403
        });
      }
      
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          error: 'Email is required',
          status: 400
        });
      }
      
      // Find user by email
      let user;
      if (features.useMongoDB) {
        user = await userRepository.findByEmail(email);
      } else {
        user = findUserByEmail(email);
      }
      
      // Don't reveal if user exists for security
      if (!user) {
        return res.json({
          message: 'If your email is registered, you will receive a password reset link'
        });
      }
      
      // Generate reset token
      let resetToken;
      
      if (features.useMongoDB) {
        // Create token in DB
        const userId = user._id.toString();
        const token = crypto.randomBytes(32).toString('hex');
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1); // 1 hour from now
        
        resetToken = await passwordResetTokenRepository.create({
          token,
          userId,
          expires: expiryDate
        });
      } else {
        // Create token in file
        resetToken = createPasswordResetToken(user.id);
      }
      
      // In a real implementation, send email with reset link
      // For this implementation, just return the token
      logger.info(`Password reset token for ${email}: ${resetToken.token}`);
      
      res.json({
        message: 'If your email is registered, you will receive a password reset link',
        // Include token in response (for development)
        token: process.env.NODE_ENV !== 'production' ? resetToken.token : undefined
      });
    } catch (error) {
      logger.error(`Password reset request error: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while processing your request',
        status: 500
      });
    }
  });
  
  // Validate reset token
  router.post('/password-reset/validate', async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          error: 'Token is required',
          status: 400
        });
      }
      
      // Validate token
      let tokenData;
      
      if (features.useMongoDB) {
        tokenData = await passwordResetTokenRepository.findByToken(token);
        if (!tokenData || tokenData.used || tokenData.expires < new Date()) {
          return res.status(400).json({
            error: 'Invalid or expired token',
            status: 400
          });
        }
      } else {
        // Find token in file
        tokenData = findPasswordResetToken(token);
        if (!tokenData || new Date(tokenData.expires) < new Date()) {
          return res.status(400).json({
            error: 'Invalid or expired token',
            status: 400
          });
        }
      }
      
      res.json({
        valid: true
      });
    } catch (error) {
      logger.error(`Password reset token validation error: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while validating the token',
        status: 500
      });
    }
  });
  
  // Reset password
  router.post('/password-reset/reset', async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({
          error: 'Token and password are required',
          status: 400
        });
      }
      
      // Validate token
      let tokenData, userId;
      
      if (features.useMongoDB) {
        tokenData = await passwordResetTokenRepository.findByToken(token);
        if (!tokenData || tokenData.used || tokenData.expires < new Date()) {
          return res.status(400).json({
            error: 'Invalid or expired token',
            status: 400
          });
        }
        userId = tokenData.userId.toString();
      } else {
        // Find token in file
        tokenData = findPasswordResetToken(token);
        if (!tokenData || new Date(tokenData.expires) < new Date()) {
          return res.status(400).json({
            error: 'Invalid or expired token',
            status: 400
          });
        }
        userId = tokenData.userId;
      }
      
      // Hash new password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Update user password
      if (features.useMongoDB) {
        await userRepository.update(userId, { passwordHash });
        
        // Mark token as used
        await passwordResetTokenRepository.markAsUsed(token);
      } else {
        // Find user in file
        const userIndex = usersData.users.findIndex(u => u.id === userId);
        if (userIndex < 0) {
          return res.status(404).json({
            error: 'User not found',
            status: 404
          });
        }
        
        // Update password
        usersData.users[userIndex].passwordHash = passwordHash;
        usersData.users[userIndex].updatedAt = new Date().toISOString();
        
        // Mark token as used
        markTokenAsUsed(token);
        
        saveUsers();
      }
      
      res.json({
        message: 'Password reset successful'
      });
    } catch (error) {
      logger.error(`Password reset error: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while resetting the password',
        status: 500
      });
    }
  });
  
  return router;
}

module.exports = initPasswordResetRoutes;