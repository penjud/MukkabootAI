import ApiService from './api.service';
import API_CONFIG from './api.config';

const FilesystemService = {
  /**
   * List directory contents
   * @param {string} path - Directory path (default: '/')
   * @returns {Promise} - Response from the API
   */
  listDirectory(path = '/') {
    return ApiService.get(`${API_CONFIG.filesystemApiUrl}/list`, {
      params: { path }
    });
  },
  
  /**
   * Get file content
   * @param {string} path - File path
   * @returns {Promise} - Response from the API
   */
  getFileContent(path) {
    return ApiService.get(`${API_CONFIG.filesystemApiUrl}/content`, {
      params: { path }
    });
  },
  
  /**
   * Create a new directory
   * @param {string} path - Directory path to create
   * @returns {Promise} - Response from the API
   */
  createDirectory(path) {
    return ApiService.post(`${API_CONFIG.filesystemApiUrl}/directory`, { path });
  },
  
  /**
   * Create a new file
   * @param {string} path - File path to create
   * @param {string} content - File content
   * @returns {Promise} - Response from the API
   */
  createFile(path, content) {
    return ApiService.post(`${API_CONFIG.filesystemApiUrl}/file`, { path, content });
  },
  
  /**
   * Update file content
   * @param {string} path - File path
   * @param {string} content - New file content
   * @returns {Promise} - Response from the API
   */
  updateFile(path, content) {
    return ApiService.put(`${API_CONFIG.filesystemApiUrl}/file`, { path, content });
  },
  
  /**
   * Delete a file or directory
   * @param {string} path - Path to delete
   * @param {boolean} recursive - Whether to delete recursively (for directories)
   * @returns {Promise} - Response from the API
   */
  delete(path, recursive = false) {
    return ApiService.delete(`${API_CONFIG.filesystemApiUrl}/delete`, {
      params: { path, recursive }
    });
  },
  
  /**
   * Move or rename a file or directory
   * @param {string} oldPath - Current path
   * @param {string} newPath - New path
   * @returns {Promise} - Response from the API
   */
  move(oldPath, newPath) {
    return ApiService.post(`${API_CONFIG.filesystemApiUrl}/move`, {
      oldPath,
      newPath
    });
  },
  
  /**
   * Copy a file or directory
   * @param {string} sourcePath - Source path
   * @param {string} targetPath - Target path
   * @returns {Promise} - Response from the API
   */
  copy(sourcePath, targetPath) {
    return ApiService.post(`${API_CONFIG.filesystemApiUrl}/copy`, {
      sourcePath,
      targetPath
    });
  },
  
  /**
   * Search files and directories
   * @param {string} path - Base path to search from
   * @param {string} query - Search query
   * @returns {Promise} - Response from the API
   */
  search(path, query) {
    return ApiService.get(`${API_CONFIG.filesystemApiUrl}/search`, {
      params: { path, query }
    });
  },
  
  /**
   * Get file info (metadata)
   * @param {string} path - File path
   * @returns {Promise} - Response from the API
   */
  getFileInfo(path) {
    return ApiService.get(`${API_CONFIG.filesystemApiUrl}/info`, {
      params: { path }
    });
  },
  
  /**
   * Upload a file (uses FormData)
   * @param {string} path - Directory path to upload to
   * @param {File} file - File object to upload
   * @returns {Promise} - Response from the API
   */
  uploadFile(path, file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    
    return ApiService.post(`${API_CONFIG.filesystemApiUrl}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  /**
   * Get download URL for a file
   * @param {string} path - File path to download
   * @returns {string} - Download URL
   */
  getDownloadUrl(path) {
    return `${API_CONFIG.filesystemApiUrl}/download?path=${encodeURIComponent(path)}`;
  }
};

export default FilesystemService;
