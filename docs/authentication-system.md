# MukkabootAI Authentication System Documentation

This document provides a comprehensive overview of the MukkabootAI authentication system, including architecture, troubleshooting, and common issues.

## Authentication Architecture

The MukkabootAI authentication system consists of the following components:

1. **Auth Service**: Node.js server that handles authentication, user management, and token issuance
2. **Base Service**: Core service that coordinates all MukkabootAI services
3. **Vue Dashboard**: Frontend interface that handles user login and session management

### Service Dependencies

Services must be started in the following order:

1. Base Service (port 3010)
2. Auth Service (port 3013) - depends on Base Service
3. Other backend services (Memory, Filesystem, etc.)
4. Frontend (Vue Dashboard)

## Default Credentials

The system comes with a default administrator account:

- **Username**: `admin`
- **Password**: `password`

This account is created automatically when the system starts for the first time or when the authentication system is reset.

## Authentication Flow

1. **Login Process**:
   - User submits credentials to `/login` endpoint
   - Auth Service validates credentials against stored users
   - Upon successful validation, Auth Service issues JWT tokens (access + refresh)
   - Frontend stores tokens in localStorage

2. **Authentication Checks**:
   - Frontend adds token to Authorization header for API requests
   - Protected endpoints verify token before processing requests
   - Invalid/expired tokens result in 401/403 responses

3. **Token Refresh**:
   - Access tokens expire after 1 hour (configurable)
   - Refresh tokens allow getting new access tokens without re-login
   - Refresh tokens expire after 7 days (configurable)

## Common Issues and Solutions

### 1. Dashboard Routing Issue

**Problem**: After login, the system redirects to `/dashboard` which returns a 404 error.

**Cause**: The Vue Router has the dashboard component mounted at the root path (`/`), but redirects to `/dashboard`.

**Solution**: The issue has been addressed by:
   - Adding a redirect in the router configuration from `/dashboard` to `/`
   - Ensuring the login component redirects directly to the root path

### 2. Service Dependency Chain Issues

**Problem**: Auth Service startup hangs or fails.

**Cause**: The Auth Service depends on the Base Service being available.

**Solution**:
   - Start the Base Service first
   - Use the `start-all-services.sh` script which starts services in the correct order
   - The script includes dependency checks and proper retry logic

### 3. Authentication Failures

**Problem**: Unable to log in with correct credentials.

**Possible Causes**:
   - Auth Service is not running
   - Default user has been modified or deleted
   - Password hash mismatch due to different bcrypt implementations

**Solutions**:
   - Run `scripts/auth-test.sh` to validate the Auth Service is working
   - Run `scripts/reset-auth.sh` to reset the authentication system and recreate the default admin user
   - Check Auth Service logs for detailed error messages

### 4. JWT Token Issues

**Problem**: Token validation fails or tokens expire too quickly.

**Possible Causes**:
   - Different JWT secrets between service restarts
   - Clock drift between services
   - Misconfigured token expiry times

**Solutions**:
   - Ensure JWT_SECRET is consistently set in the environment
   - Configure appropriate token expiry times in the `.env` file
   - Check time synchronization between services if running on different hosts

## Authentication Reset Procedure

If the authentication system needs to be reset:

1. Run the reset script:
   ```bash
   ./scripts/reset-auth.sh
   ```

2. This script will:
   - Stop the Auth Service if it's running
   - Backup the existing users file
   - Create a new users file with the default admin user
   - Restart the Auth Service
   - Validate the authentication is working

## Security Considerations

1. **Production Deployment**:
   - Change default admin password immediately
   - Use strong, unique JWT secrets
   - Enable HTTPS for all services
   - Consider implementing IP-based rate limiting

2. **Token Storage**:
   - Access tokens are stored in localStorage by default
   - For higher security, consider implementing HttpOnly cookie storage
   - Refresh tokens should be rotated upon use

3. **Password Policies**:
   - Implement password complexity requirements
   - Add account lockout after failed attempts
   - Enable multi-factor authentication for sensitive operations

## Monitoring and Maintenance

1. **Auth Service Logs**:
   - Located at `/home/mothership/MukkabootAI/logs/mcp-auth.log`
   - Contains detailed information about authentication attempts and errors

2. **Health Checks**:
   - Auth Service exposes a `/health` endpoint
   - Base Service monitors all services and reports status

3. **User Management**:
   - Admin users can manage other users through the dashboard
   - User data is stored in `/home/mothership/MukkabootAI/data/users/users.json`

## PM2 Process Management

For improved reliability, the authentication system can be managed using PM2:

```bash
# Start all services using PM2
pm2 start ecosystem.config.js

# View service status
pm2 status

# View Auth Service logs
pm2 logs mcp-auth

# Restart Auth Service
pm2 restart mcp-auth
```

The PM2 configuration is in `/home/mothership/MukkabootAI/ecosystem.config.js`.

## Authentication API Endpoints

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/login` | POST | Authenticate user and get tokens | No |
| `/refresh-token` | POST | Refresh access token | No (but requires valid refresh token) |
| `/logout` | POST | Invalidate refresh token | Yes |
| `/validate-token` | POST | Validate access token | No |
| `/users/me` | GET | Get current user profile | Yes |
| `/users/change-password` | POST | Change user password | Yes |

## Contributing to Auth System

When modifying the authentication system:

1. Follow the modular design pattern
2. Update documentation for any changes
3. Test thoroughly using the auth-test.sh script
4. Consider security implications of changes
5. Maintain backward compatibility where possible
