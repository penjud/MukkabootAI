# MukkabootAI Frontend Authentication Integration

This document provides detailed information about the authentication implementation in the MukkabootAI frontend.

## Authentication Flow

1. **User Login**
   - User enters credentials (username/password) on the login page
   - Credentials are sent to the Auth Service
   - Upon successful authentication, a JWT token is returned
   - Token is stored in localStorage for persistence

2. **Token Management**
   - JWT token includes expiration information
   - Token is included in all API requests via Authorization header
   - Token is automatically refreshed when needed
   - On token expiration/invalidation, user is redirected to login

3. **Route Protection**
   - Vue Router navigation guards protect authenticated routes
   - Each route has a `requiresAuth` metadata flag
   - Unauthenticated users are redirected to login
   - Authenticated users accessing login are redirected to dashboard

## Implementation Details

### Auth Service Integration

The frontend communicates with the Auth Service (`http://localhost:3013`) for all authentication operations:

```javascript
// services/auth.service.js
import ApiService from './api.service';
import API_CONFIG from './api.config';

const AUTH_URL = API_CONFIG.authApiUrl;

const AuthService = {
  login(credentials) {
    return ApiService.post(`${AUTH_URL}/login`, credentials);
  },
  
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    ApiService.clearAuthHeader();
  },
  
  // ...other auth-related methods
};
```

### API Request Interceptors

All API requests automatically include the authentication token:

```javascript
// services/api.service.js
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);
```

### Response Interceptors

The system handles 401 Unauthorized errors by redirecting to login:

```javascript
// services/api.service.js
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);
```

### Router Navigation Guards

Protected routes are secured using Vue Router navigation guards:

```javascript
// router/index.js
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = !!localStorage.getItem('authToken');
  
  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && isAuthenticated) {
    next('/');
  } else {
    next();
  }
});
```

## User Management

### Default Admin User

The system automatically creates a default admin user on first startup:

- **Username**: admin
- **Password**: password

This user has full access to all features and should be changed in production.

### User Data Storage

User information is stored in JSON format at:

```
/home/mothership/MukkabootAI/data/users/users.json
```

Example user data structure:

```json
[
  {
    "id": "1",
    "username": "admin",
    "password": "$2a$10$X7VYoOVQM4acRd7mUpgGz.kP0q0xMO/YSdnX4mYIDjvRD1cRBHkjK",
    "name": "Administrator",
    "email": "admin@example.com",
    "role": "admin",
    "created_at": "2025-03-13T10:00:00.000Z",
    "updated_at": "2025-03-13T10:00:00.000Z"
  }
]
```

## Security Considerations

1. **Token Storage**
   - JWT tokens are stored in localStorage for convenience
   - For higher security, consider using httpOnly cookies instead

2. **Password Hashing**
   - Passwords are hashed using bcryptjs
   - 10 rounds of salting is applied by default

3. **HTTPS**
   - In production, ensure all communication is over HTTPS
   - JWT tokens should never be transmitted over unsecured connections

4. **Token Expiration**
   - Tokens expire after 24 hours by default
   - Implement token refresh to extend valid sessions

## Testing Authentication

To verify authentication is working:

1. Start all backend services:
   ```bash
   ./start-all.sh
   ```

2. Navigate to the login page:
   ```
   http://localhost:3002/login
   ```

3. Log in with default credentials:
   - Username: admin
   - Password: password

4. Verify you can access protected routes
   - Dashboard, Chat, Files, etc.

5. Test token expiration by manually removing the token:
   ```javascript
   // In browser console
   localStorage.removeItem('authToken');
   ```

6. Attempt to navigate to a protected route (should redirect to login)

## Troubleshooting

### Common Issues

1. **Login Fails**
   - Verify Auth Service is running
   - Check credential format and try default admin/password
   - Verify database or users.json file exists and is accessible

2. **Token Not Sent**
   - Check localStorage for 'authToken'
   - Verify request interceptor is properly configured
   - Inspect network requests for Authorization header

3. **Redirect Loops**
   - Check navigation guard logic for infinite redirects
   - Verify isAuthenticated check is working properly

4. **CORS Issues**
   - Ensure backend services have proper CORS headers
   - Check for protocol/domain/port mismatches

## Future Improvements

1. **User Registration**
   - Add self-registration capability
   - Implement email verification process

2. **Password Reset**
   - Implement password reset functionality
   - Add email-based reset flow

3. **Role-Based Access Control**
   - Enhance authorization with role-based permissions
   - Restrict UI elements based on user roles

4. **Multi-Factor Authentication**
   - Add support for 2FA using TOTP
   - Integrate with authentication apps

5. **Session Management**
   - Add ability to view and manage active sessions
   - Implement forced logout for security incidents

## Integration with Other Services

The authentication system interacts with several other services:

1. **Chat Service**
   - Authenticated user info is attached to chat messages
   - Conversation history is tied to user accounts

2. **Filesystem Service**
   - File access permissions are based on user authentication
   - File ownership is tracked per user

3. **Memory Service**
   - Knowledge entities can be user-specific
   - Memory recall includes user context

For additional details on service integration, refer to the service-specific documentation.
