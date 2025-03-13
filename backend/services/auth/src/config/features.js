/**
 * Feature Flags Configuration
 * Controls which features are enabled/disabled in the Auth Service
 */

module.exports = {
  // MongoDB Integration
  useMongoDB: false,
  
  // Email Integration
  useEmailVerification: false,
  
  // Security Features
  useRateLimiting: true,
  use2FA: false,
  
  // User Management
  allowUserRegistration: true,
  adminApprovalRequired: false,
  
  // Password Management
  allowPasswordReset: true,
  complexPasswordPolicy: false,
  
  // Token Management
  useRefreshTokens: true,
  
  // Testing & Development
  debugMode: process.env.NODE_ENV !== 'production'
};