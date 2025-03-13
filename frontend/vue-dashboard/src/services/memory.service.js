import ApiService from './api.service';
import API_CONFIG from './api.config';

const MemoryService = {
  /**
   * Get all entities
   * @returns {Promise} - Response from the API
   */
  getAllEntities() {
    return ApiService.get(`${API_CONFIG.memoryApiUrl}/api/memory/entities`);
  },
  
  /**
   * Get entity by ID
   * @param {string} id - Entity ID
   * @returns {Promise} - Response from the API
   */
  getEntity(id) {
    return ApiService.get(`${API_CONFIG.memoryApiUrl}/entities/${id}`);
  },
  
  /**
   * Create a new entity
   * @param {Object} entity - Entity data
   * @returns {Promise} - Response from the API
   */
  createEntity(entity) {
    return ApiService.post(`${API_CONFIG.memoryApiUrl}/entities`, entity);
  },
  
  /**
   * Update an entity
   * @param {string} id - Entity ID
   * @param {Object} entity - Entity data to update
   * @returns {Promise} - Response from the API
   */
  updateEntity(id, entity) {
    return ApiService.put(`${API_CONFIG.memoryApiUrl}/entities/${id}`, entity);
  },
  
  /**
   * Delete an entity
   * @param {string} id - Entity ID
   * @returns {Promise} - Response from the API
   */
  deleteEntity(id) {
    return ApiService.delete(`${API_CONFIG.memoryApiUrl}/entities/${id}`);
  },
  
  /**
   * Get all relations
   * @returns {Promise} - Response from the API
   */
  getAllRelations() {
    return ApiService.get(`${API_CONFIG.memoryApiUrl}/relations`);
  },
  
  /**
   * Create a new relation
   * @param {Object} relation - Relation data
   * @returns {Promise} - Response from the API
   */
  createRelation(relation) {
    return ApiService.post(`${API_CONFIG.memoryApiUrl}/relations`, relation);
  },
  
  /**
   * Delete a relation
   * @param {string} id - Relation ID
   * @returns {Promise} - Response from the API
   */
  deleteRelation(id) {
    return ApiService.delete(`${API_CONFIG.memoryApiUrl}/relations/${id}`);
  },
  
  /**
   * Get conversation history
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of messages (default: 50)
   * @param {number} options.page - Page number for pagination
   * @returns {Promise} - Response from the API
   */
  getConversationHistory(options = {}) {
    return ApiService.get(`${API_CONFIG.memoryApiUrl}/conversations`, { params: options });
  },
  
  /**
   * Add message to conversation history
   * @param {Object} message - Message data
   * @returns {Promise} - Response from the API
   */
  addConversationMessage(message) {
    return ApiService.post(`${API_CONFIG.memoryApiUrl}/conversations/messages`, message);
  },
  
  /**
   * Delete a conversation message
   * @param {string} id - Message ID
   * @returns {Promise} - Response from the API
   */
  deleteConversationMessage(id) {
    return ApiService.delete(`${API_CONFIG.memoryApiUrl}/conversations/messages/${id}`);
  },
  
  /**
   * Clear all conversation history
   * @returns {Promise} - Response from the API
   */
  clearConversationHistory() {
    return ApiService.delete(`${API_CONFIG.memoryApiUrl}/conversations`);
  },
  
  /**
   * Search memory
   * @param {string} query - Search query
   * @returns {Promise} - Response from the API
   */
  searchMemory(query) {
    return ApiService.get(`${API_CONFIG.memoryApiUrl}/search`, { params: { query } });
  }
};

export default MemoryService;
