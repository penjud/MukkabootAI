import ApiService from './api.service';
import API_CONFIG from './api.config';

// Socket.io client
let socket = null;

const OllamaService = {
  /**
   * Get available models
   * @returns {Promise} - Response from the API
   */
  getModels() {
    return ApiService.get(`${API_CONFIG.ollamaBridgeUrl}/api/models`);
  },
  
  /**
   * Get model details
   * @param {string} name - Model name
   * @returns {Promise} - Response from the API
   */
  getModelDetails(name) {
    return ApiService.get(`${API_CONFIG.ollamaBridgeUrl}/api/models/${name}`);
  },
  
  /**
   * Generate text with a model
   * @param {Object} params - Generation parameters
   * @param {string} params.model - Model name
   * @param {string} params.prompt - Prompt text
   * @param {string} params.system - System prompt (optional)
   * @param {Object} params.options - Model options (optional)
   * @returns {Promise} - Response from the API
   */
  generateText(params) {
    return ApiService.post(`${API_CONFIG.ollamaBridgeUrl}/api/generate`, params);
  },
  
  /**
   * Generate text with streaming response
   * @param {Object} params - Generation parameters
   * @param {string} params.model - Model name
   * @param {string} params.prompt - Prompt text
   * @param {string} params.system - System prompt (optional)
   * @param {Object} params.options - Model options (optional)
   * @param {Function} onUpdate - Callback for each chunk of text
   * @param {Function} onComplete - Callback when generation is complete
   * @param {Function} onError - Callback for errors
   * @returns {EventSource} - The event source object (call .close() to stop streaming)
   */
  generateTextStream(params, onUpdate, onComplete, onError) {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Create EventSource for server-sent events
    const eventSource = new EventSource(
      `${API_CONFIG.ollamaBridgeUrl}/api/generate?${new URLSearchParams({
        model: params.model,
        prompt: params.prompt,
        system: params.system || '',
        stream: true,
        ...headers,
        ...(params.options || {})
      }).toString()}`
    );
    
    // Handle incoming data
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onUpdate && typeof onUpdate === 'function') {
          onUpdate(data);
        }
      } catch (err) {
        if (onError && typeof onError === 'function') {
          onError(err);
        }
      }
    };
    
    // Handle completion
    eventSource.addEventListener('done', () => {
      if (onComplete && typeof onComplete === 'function') {
        onComplete();
      }
      eventSource.close();
    });
    
    // Handle errors
    eventSource.onerror = (err) => {
      if (onError && typeof onError === 'function') {
        onError(err);
      }
      eventSource.close();
    };
    
    return eventSource;
  },
  
  /**
   * Chat completion with a model
   * @param {Object} params - Chat parameters
   * @param {string} params.model - Model name
   * @param {Array} params.messages - Chat messages
   * @param {Object} params.options - Model options (optional)
   * @returns {Promise} - Response from the API
   */
  chatCompletion(params) {
    return ApiService.post(`${API_CONFIG.ollamaBridgeUrl}/api/chat`, params);
  },
  
  /**
   * Chat completion with streaming response
   * @param {Object} params - Chat parameters
   * @param {string} params.model - Model name
   * @param {Array} params.messages - Chat messages
   * @param {Object} params.options - Model options (optional)
   * @param {Function} onUpdate - Callback for each chunk of text
   * @param {Function} onComplete - Callback when generation is complete
   * @param {Function} onError - Callback for errors
   * @returns {Object} - Object with close method to abort the request
   */
  chatCompletionStream(params, onUpdate, onComplete, onError) {
    // Create request with proper headers
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_CONFIG.ollamaBridgeUrl}/api/chat`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    // Set response type for streaming
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.responseType = 'text';
    
    // Handle state changes
    let buffer = '';
    xhr.onreadystatechange = () => {
      // Process chunks as they arrive (readyState 3 = LOADING)
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        // Get new chunk
        const newData = xhr.responseText.substring(buffer.length);
        buffer = xhr.responseText;
        
        // Process new data chunks
        const lines = newData.split('\n\n');
        for (const line of lines) {
          if (line.trim().startsWith('data:')) {
            try {
              const json = JSON.parse(line.trim().substring(5));
              if (onUpdate && typeof onUpdate === 'function') {
                onUpdate(json);
              }
              
              if (json.done && onComplete && typeof onComplete === 'function') {
                onComplete();
              }
            } catch (err) {
              // Skip parsing errors on incomplete chunks
            }
          } else if (line.trim().startsWith('event: done')) {
            if (onComplete && typeof onComplete === 'function') {
              onComplete();
            }
          }
        }
      }
      
      // Handle completion (readyState 4 = DONE)
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (onComplete && typeof onComplete === 'function') {
            onComplete();
          }
        } else {
          if (onError && typeof onError === 'function') {
            onError(new Error(`Request failed with status ${xhr.status}`));
          }
        }
      }
    };
    
    // Handle errors
    xhr.onerror = (err) => {
      if (onError && typeof onError === 'function') {
        onError(err);
      }
    };
    
    // Send the request
    xhr.send(JSON.stringify({
      ...params,
      stream: true
    }));
    
    // Return an object with close method to abort the request
    return {
      close: () => xhr.abort()
    };
  },
  
  /**
   * Pull a model
   * @param {string} name - Model name
   * @param {Function} onProgress - Callback for progress updates
   * @param {Function} onComplete - Callback when pull is complete
   * @param {Function} onError - Callback for errors
   * @returns {Object} - Object with close method to abort the request
   */
  pullModel(name, onProgress, onComplete, onError) {
    // Create EventSource for server-sent events
    const eventSource = new EventSource(
      `${API_CONFIG.ollamaBridgeUrl}/api/models/pull?${new URLSearchParams({
        name
      }).toString()}`
    );
    
    // Handle incoming data
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onProgress && typeof onProgress === 'function') {
          onProgress(data);
        }
        
        if (data.status === 'success') {
          if (onComplete && typeof onComplete === 'function') {
            onComplete();
          }
          eventSource.close();
        }
      } catch (err) {
        if (onError && typeof onError === 'function') {
          onError(err);
        }
      }
    };
    
    // Handle completion
    eventSource.addEventListener('done', () => {
      if (onComplete && typeof onComplete === 'function') {
        onComplete();
      }
      eventSource.close();
    });
    
    // Handle errors
    eventSource.onerror = (err) => {
      if (onError && typeof onError === 'function') {
        onError(err);
      }
      eventSource.close();
    };
    
    return {
      close: () => eventSource.close()
    };
  },
  
  /**
   * Delete a model
   * @param {string} name - Model name
   * @returns {Promise} - Response from the API
   */
  deleteModel(name) {
    return ApiService.delete(`${API_CONFIG.ollamaBridgeUrl}/api/models/${name}`);
  },
  
  /**
   * Connect to Socket.IO for real-time updates
   * @param {Function} onModelsUpdate - Callback for models list updates
   * @param {Function} onModelStatus - Callback for model status updates
   * @param {Function} onError - Callback for errors
   * @returns {Object} - Socket.IO object
   */
  connectSocket(onModelsUpdate, onModelStatus, onError) {
    if (!socket) {
      // Create Socket.IO connection
      socket = io(API_CONFIG.ollamaBridgeUrl, {
        transports: ['websocket'],
        auth: {
          token: localStorage.getItem('authToken') || ''
        }
      });
      
      // Handle connection events
      socket.on('connect', () => {
        console.log('Connected to Ollama Bridge Socket.IO');
      });
      
      socket.on('disconnect', () => {
        console.log('Disconnected from Ollama Bridge Socket.IO');
      });
      
      // Handle models list updates
      socket.on('models', (models) => {
        if (onModelsUpdate && typeof onModelsUpdate === 'function') {
          onModelsUpdate(models);
        }
      });
      
      // Handle model status updates
      socket.on('modelStatus', (status) => {
        if (onModelStatus && typeof onModelStatus === 'function') {
          onModelStatus(status);
        }
      });
      
      // Handle pull progress
      socket.on('pullProgress', (progress) => {
        if (onModelStatus && typeof onModelStatus === 'function') {
          onModelStatus({
            model: progress.name || 'unknown',
            status: 'pulling',
            progress: progress.completed ? 100 : (progress.percent || 0),
            details: progress
          });
        }
      });
      
      // Handle errors
      socket.on('error', (error) => {
        if (onError && typeof onError === 'function') {
          onError(error);
        }
      });
    }
    
    return socket;
  },
  
  /**
   * Disconnect Socket.IO
   */
  disconnectSocket() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
  
  /**
   * Pull a model via Socket.IO
   * @param {string} modelName - Model name to pull
   */
  pullModelViaSocket(modelName) {
    if (socket && socket.connected) {
      socket.emit('pullModel', modelName);
    } else {
      throw new Error('Socket not connected');
    }
  },
  
  /**
   * Stream generation via Socket.IO
   * @param {Object} params - Generation parameters
   * @param {Function} onUpdate - Callback for each generation update
   * @param {Function} onComplete - Callback when generation is complete
   */
  streamGenerationViaSocket(params, onUpdate, onComplete) {
    if (!socket || !socket.connected) {
      this.connectSocket();
    }
    
    // Set up event listeners
    socket.on('generationUpdate', (data) => {
      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate(data);
      }
    });
    
    socket.on('generationComplete', () => {
      if (onComplete && typeof onComplete === 'function') {
        onComplete();
      }
      
      // Remove listeners to avoid duplicates
      socket.off('generationUpdate');
      socket.off('generationComplete');
    });
    
    // Start generation
    socket.emit('streamGeneration', params);
  },
  
  /**
   * Stream chat via Socket.IO
   * @param {Object} params - Chat parameters
   * @param {Function} onUpdate - Callback for each chat update
   * @param {Function} onComplete - Callback when chat is complete
   */
  streamChatViaSocket(params, onUpdate, onComplete) {
    if (!socket || !socket.connected) {
      this.connectSocket();
    }
    
    // Set up event listeners
    socket.on('chatUpdate', (data) => {
      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate(data);
      }
    });
    
    socket.on('chatComplete', () => {
      if (onComplete && typeof onComplete === 'function') {
        onComplete();
      }
      
      // Remove listeners to avoid duplicates
      socket.off('chatUpdate');
      socket.off('chatComplete');
    });
    
    // Start chat
    socket.emit('streamChat', params);
  }
};

export default OllamaService;
