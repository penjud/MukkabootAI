import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import AuthService from '../services/auth.service';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
  const token = ref(null);
  const loading = ref(false);
  const error = ref(null);
  
  // Initialize state from localStorage
  const initialize = () => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      user.value = JSON.parse(storedUser);
    }
    
    // Get token from localStorage
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      token.value = storedToken;
    }
  };
  
  // Call initialize
  initialize();
  
  // Getters
  const isAuthenticated = computed(() => !!token.value);
  const currentUser = computed(() => user.value);
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => !!error.value);
  const errorMessage = computed(() => error.value);
  
  // Actions
  const login = async (credentials) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await AuthService.login(credentials);
      user.value = response.user;
      token.value = response.token;
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Authentication failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const logout = () => {
    AuthService.logout();
    user.value = null;
    token.value = null;
    error.value = null;
  };
  
  const register = async (userData) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await AuthService.register(userData);
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Registration failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const updateProfile = async (userData) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await AuthService.updateProfile(userData);
      // Update local user data
      user.value = { ...user.value, ...userData };
      localStorage.setItem('user', JSON.stringify(user.value));
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Profile update failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const changePassword = async (passwordData) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await AuthService.changePassword(passwordData);
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Password change failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const requestPasswordReset = async (email) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await AuthService.requestPasswordReset(email);
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Password reset request failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const resetPassword = async (resetData) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await AuthService.resetPassword(resetData);
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Password reset failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const clearError = () => {
    error.value = null;
  };
  
  return {
    // State
    user,
    token,
    loading,
    error,
    
    // Getters
    isAuthenticated,
    currentUser,
    isLoading,
    hasError,
    errorMessage,
    
    // Actions
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    clearError
  };
});
