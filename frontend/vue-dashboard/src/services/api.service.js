import axios from 'axios';
import API_CONFIG from './api.config';

// Create axios instance with default config
const apiClient = axios.create({
  timeout: API_CONFIG.defaultTimeout,
  headers: API_CONFIG.defaultHeaders
});

// Request interceptor
apiClient.interceptors.request.use(
  config => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // If not already on login page, redirect
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Base API Service
const ApiService = {
  // Set Authorization header
  setAuthHeader(token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  
  // Clear Authorization header
  clearAuthHeader() {
    delete apiClient.defaults.headers.common['Authorization'];
  },
  
  // GET request
  get(url, config = {}) {
    return apiClient.get(url, config);
  },
  
  // POST request
  post(url, data = {}, config = {}) {
    return apiClient.post(url, data, config);
  },
  
  // PUT request
  put(url, data = {}, config = {}) {
    return apiClient.put(url, data, config);
  },
  
  // DELETE request
  delete(url, config = {}) {
    return apiClient.delete(url, config);
  },
  
  // Custom request
  request(config) {
    return apiClient.request(config);
  }
};

export default ApiService;
