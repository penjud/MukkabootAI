import ApiService from './api.service';
import API_CONFIG from './api.config';

const AuthService = {
  /**
   * Login the user and store the auth token
   * @param {Object} credentials - User credentials
   * @param {string} credentials.username - Username
   * @param {string} credentials.password - Password
   * @returns {Promise} - Response from the API
   */
  async login(credentials) {
    try {
      const response = await ApiService.post(`${API_CONFIG.authApiUrl}/login`, credentials);
      
      if (response.data.accessToken) {
        // Store token and user info
        localStorage.setItem('authToken', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Set auth header for future requests
        ApiService.setAuthHeader(response.data.accessToken);
      }
      
      // Transform the response to fit our expected format
      return {
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        user: response.data.user
      };
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Logout the user and clear the auth token
   */
  logout() {
    // Clear token and user info
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Clear auth header
    ApiService.clearAuthHeader();
  },
  
  /**
   * Register a new user
   * @param {Object} user - User data
   * @returns {Promise} - Response from the API
   */
  register(user) {
    return ApiService.post(`${API_CONFIG.authApiUrl}/register`, user);
  },
  
  /**
   * Get current user info
   * @returns {Object|null} - User object or null if not logged in
   */
  getCurrentUser() {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },
  
  /**
   * Check if user is authenticated
   * @returns {boolean} - True if authenticated, false otherwise
   */
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },
  
  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise} - Response from the API
   */
  requestPasswordReset(email) {
    return ApiService.post(`${API_CONFIG.authApiUrl}/reset-password/request`, { email });
  },
  
  /**
   * Reset password with token
   * @param {Object} resetData - Reset data
   * @param {string} resetData.token - Reset token
   * @param {string} resetData.password - New password
   * @returns {Promise} - Response from the API
   */
  resetPassword(resetData) {
    return ApiService.post(`${API_CONFIG.authApiUrl}/reset-password/reset`, resetData);
  },
  
  /**
   * Update user profile
   * @param {Object} userData - User data to update
   * @returns {Promise} - Response from the API
   */
  updateProfile(userData) {
    return ApiService.put(`${API_CONFIG.authApiUrl}/user/profile`, userData);
  },
  
  /**
   * Change user password
   * @param {Object} passwordData - Password data
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Promise} - Response from the API
   */
  changePassword(passwordData) {
    return ApiService.post(`${API_CONFIG.authApiUrl}/user/change-password`, passwordData);
  }
};

export default AuthService;
