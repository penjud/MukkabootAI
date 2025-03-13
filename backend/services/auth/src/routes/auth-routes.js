/**
 * Authentication Routes
 * Handles login, logout, token validation and refresh
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

/**
 * Initialize authentication routes
 * @param {Object} options - Configuration options
 * @returns {Object} Router and middleware functions
 */
function initAuthRoutes(options) {
  const {
    userRepository,
    refreshTokenRepository,
    features,
    usersData,
    saveUsers,
    logger,
    config
  } = options;
  
  const router = express.Router();
  
  // Configure rate limiter for login attempts
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many login attempts, please try again later',
      status: 429
    }
  });
  
  // File-based user functions
  const findUserByUsername = (username) => {
    return usersData.users.find(u => u.username === username);
  };
  
  const findUserById = (id) => {
    return usersData.users.find(u => u.id === id);
  };
  
  // Token generation and validation functions
  const generateAccessToken = (user) => {
    const payload = {
      id: user.id || user._id?.toString(),
      username: user.username,
      role: user.role
    };
    
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.ACCESS_TOKEN_EXPIRY });
  };
  
  const generateRefreshToken = (userId, ipAddress) => {
    const token = crypto.randomBytes(40).toString('hex');
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now
    
    const refreshToken = {
      token,
      userId,
      expires: expiryDate,
      createdByIp: ipAddress
    };
    
    if (features.useMongoDB) {
      refreshTokenRepository.create(refreshToken).catch(err => {
        logger.error(`Error creating refresh token: ${err.message}`);
      });
    } else {
      // Store in memory/file
      if (!usersData.refreshTokens[userId]) {
        usersData.refreshTokens[userId] = [];
      }
      
      usersData.refreshTokens[userId].push(refreshToken);
      saveUsers();
    }
    
    return token;
  };
  
  // Middleware for authenticating tokens
  const authenticateToken = (req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        status: 401
      });
    }
    
    // Verify token
    jwt.verify(token, config.JWT_SECRET, (err, user) => {
      if (err) {
        // Token is invalid or expired
        return res.status(403).json({
          error: 'Invalid or expired token',
          status: 403
        });
      }
      
      // Store user info in request
      req.user = user;
      next();
    });
  };
  
  // Middleware for requiring admin role
  const requireAdmin = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        status: 401
      });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin privileges required',
        status: 403
      });
    }
    
    next();
  };
  
  // Routes
  
  // Login route
  router.post('/login', loginLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          error: 'Username and password are required',
          status: 400
        });
      }
      
      // Find user
      let user;
      if (features.useMongoDB) {
        user = await userRepository.findByUsername(username);
      } else {
        user = findUserByUsername(username);
      }
      
      if (!user) {
        return res.status(401).json({
          error: 'Invalid username or password',
          status: 401
        });
      }
      
      // Check password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({
          error: 'Invalid username or password',
          status: 401
        });
      }
      
      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(
        user.id || user._id?.toString(),
        req.ip
      );
      
      // Update last login timestamp
      if (features.useMongoDB) {
        userRepository.updateLastLogin(user._id).catch(err => {
          logger.error(`Error updating last login: ${err.message}`);
        });
      } else {
        user.lastLogin = new Date().toISOString();
        saveUsers();
      }
      
      // Return tokens and user info
      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id || user._id?.toString(),
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred during login',
        status: 500
      });
    }
  });
  
  // Token refresh route
  router.post('/refresh-token', async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          error: 'Refresh token is required',
          status: 400
        });
      }
      
      // Validate refresh token
      let userId, tokenData;
      
      if (features.useMongoDB) {
        tokenData = await refreshTokenRepository.findByToken(token);
        if (!tokenData || tokenData.revoked || tokenData.expires < new Date()) {
          return res.status(401).json({
            error: 'Invalid or expired refresh token',
            status: 401
          });
        }
        userId = tokenData.userId.toString();
      } else {
        // Find token in memory/file
        let found = false;
        for (const [id, tokens] of Object.entries(usersData.refreshTokens)) {
          const tokenEntry = tokens.find(t => t.token === token);
          if (tokenEntry) {
            if (tokenEntry.revoked || new Date(tokenEntry.expires) < new Date()) {
              return res.status(401).json({
                error: 'Invalid or expired refresh token',
                status: 401
              });
            }
            userId = id;
            tokenData = tokenEntry;
            found = true;
            break;
          }
        }
        
        if (!found) {
          return res.status(401).json({
            error: 'Invalid refresh token',
            status: 401
          });
        }
      }
      
      // Get user
      let user;
      if (features.useMongoDB) {
        user = await userRepository.findById(userId);
      } else {
        user = findUserById(userId);
      }
      
      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          status: 401
        });
      }
      
      // Generate new tokens
      const accessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(userId, req.ip);
      
      // Revoke old token
      if (features.useMongoDB) {
        await refreshTokenRepository.revokeToken(token);
      } else {
        tokenData.revoked = true;
        saveUsers();
      }
      
      // Return new tokens
      res.json({
        accessToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      logger.error(`Token refresh error: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred during token refresh',
        status: 500
      });
    }
  });
  
  // Logout route
  router.post('/logout', async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          error: 'Refresh token is required',
          status: 400
        });
      }
      
      // Revoke token
      if (features.useMongoDB) {
        await refreshTokenRepository.revokeToken(token);
      } else {
        // Find and revoke token in memory/file
        for (const [id, tokens] of Object.entries(usersData.refreshTokens)) {
          const tokenIndex = tokens.findIndex(t => t.token === token);
          if (tokenIndex >= 0) {
            usersData.refreshTokens[id][tokenIndex].revoked = true;
            saveUsers();
            break;
          }
        }
      }
      
      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error(`Logout error: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred during logout',
        status: 500
      });
    }
  });
  
  // Validate token route
  router.post('/validate-token', (req, res) => {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: 'Token is required',
        status: 400
      });
    }
    
    // Verify token
    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          valid: false,
          error: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
        });
      }
      
      res.json({
        valid: true,
        user: {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role
        }
      });
    });
  });
  
  // Return router and middleware
  return Object.assign(router, {
    authenticateToken,
    requireAdmin
  });
}

module.exports = initAuthRoutes;