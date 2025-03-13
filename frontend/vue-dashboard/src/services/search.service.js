import ApiService from './api.service';
import API_CONFIG from './api.config';

const SearchService = {
  /**
   * Perform a web search
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {number} options.count - Number of results to return (default: 10, max: 20)
   * @param {number} options.offset - Results offset for pagination (default: 0)
   * @returns {Promise} - Response from the API
   */
  webSearch(query, options = {}) {
    return ApiService.get(`${API_CONFIG.braveSearchApiUrl}/search`, {
      params: {
        query,
        ...options
      }
    });
  },
  
  /**
   * Perform a local business search
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {number} options.count - Number of results to return (default: 5, max: 20)
   * @returns {Promise} - Response from the API
   */
  localSearch(query, options = {}) {
    return ApiService.get(`${API_CONFIG.braveSearchApiUrl}/local`, {
      params: {
        query,
        ...options
      }
    });
  },
  
  /**
   * Perform a news search
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {number} options.count - Number of results to return (default: 10, max: 20)
   * @param {string} options.freshness - Freshness filter ('day', 'week', 'month')
   * @returns {Promise} - Response from the API
   */
  newsSearch(query, options = {}) {
    return ApiService.get(`${API_CONFIG.braveSearchApiUrl}/news`, {
      params: {
        query,
        ...options
      }
    });
  },
  
  /**
   * Perform an image search
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {number} options.count - Number of results to return (default: 10, max: 20)
   * @returns {Promise} - Response from the API
   */
  imageSearch(query, options = {}) {
    return ApiService.get(`${API_CONFIG.braveSearchApiUrl}/images`, {
      params: {
        query,
        ...options
      }
    });
  },
  
  /**
   * Generic query handler (unified search interface)
   * @param {string} query - Search query
   * @param {string} type - Search type ('web', 'local', 'news', 'images')
   * @param {Object} options - Search options
   * @returns {Promise} - Response from the API
   */
  query(query, type = 'web', options = {}) {
    return ApiService.post(`${API_CONFIG.braveSearchApiUrl}/query`, {
      query,
      type,
      options
    });
  }
};

export default SearchService;
