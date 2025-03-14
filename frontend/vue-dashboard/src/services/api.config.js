// API Configuration
const API_CONFIG = {
  // Base Service
  baseApiUrl: import.meta.env.VITE_BASE_API_URL || 'http://localhost:3010',
  
  // Auth Service
  authApiUrl: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3013',
  
  // Memory Service
  memoryApiUrl: import.meta.env.VITE_MEMORY_API_URL || 'http://localhost:3011',
  
  // Filesystem Service
  filesystemApiUrl: import.meta.env.VITE_FILESYSTEM_API_URL || 'http://localhost:3012',
  
  // Brave Search Service
  braveSearchApiUrl: import.meta.env.VITE_BRAVE_SEARCH_API_URL || 'http://localhost:3014',
  
  // Ollama Bridge Service
  ollamaBridgeUrl: import.meta.env.VITE_OLLAMA_BRIDGE_URL || 'http://localhost:3015',
  
  // Default timeout in milliseconds
  defaultTimeout: 30000,
  
  // Default headers
  defaultHeaders: {
    'Content-Type': 'application/json'
  }
};

export default API_CONFIG;
