import ApiService from './api.service';
import API_CONFIG from './api.config';

// Base URL for chat service
const BASE_URL = `${API_CONFIG.baseApiUrl}/api/conversations`;
const OLLAMA_URL = API_CONFIG.ollamaBridgeUrl;

// Chat Service
const ChatService = {
  // Get all conversations
  async getConversations() {
    try {
      const response = await ApiService.get(BASE_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },
  
  // Get a single conversation by ID
  async getConversation(id) {
    try {
      const response = await ApiService.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching conversation ${id}:`, error);
      throw error;
    }
  },
  
  // Create a new conversation
  async createConversation(data) {
    try {
      const response = await ApiService.post(BASE_URL, data);
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },
  
  // Update a conversation
  async updateConversation(id, data) {
    try {
      const response = await ApiService.put(`${BASE_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating conversation ${id}:`, error);
      throw error;
    }
  },
  
  // Delete a conversation
  async deleteConversation(id) {
    try {
      const response = await ApiService.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting conversation ${id}:`, error);
      throw error;
    }
  },
  
  // Get messages for a conversation
  async getMessages(conversationId) {
    try {
      const response = await ApiService.get(`${BASE_URL}/${conversationId}/messages`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      throw error;
    }
  },
  
  // Send a message
  async sendMessage(conversationId, message) {
    try {
      const response = await ApiService.post(`${BASE_URL}/${conversationId}/messages`, message);
      return response.data;
    } catch (error) {
      console.error(`Error sending message to conversation ${conversationId}:`, error);
      throw error;
    }
  },
  
  // Send a streaming message
  async sendStreamingMessage(conversationId, message, onChunk) {
    try {
      const controller = new AbortController();
      const { signal } = controller;
      
      // Create request config with signal for aborting
      const config = {
        signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        responseType: 'stream'
      };
      
      // Prepare the message data
      const messageData = {
        ...message,
        streaming: true
      };
      
      // Make the API call
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          model: message.model || 'llama3',
          prompt: message.content,
          stream: true,
          conversation_id: conversationId
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Create a reader to process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        
        // Parse and handle each line
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          try {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.substring(6));
              
              if (data.done) {
                continue;
              }
              
              // Extract the response chunk
              const responseChunk = data.response || '';
              fullResponse += responseChunk;
              
              // Call the callback with the chunk
              if (onChunk && typeof onChunk === 'function') {
                onChunk(responseChunk, fullResponse);
              }
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e, line);
          }
        }
      }
      
      // Save the message to conversation history
      await ApiService.post(`${BASE_URL}/${conversationId}/messages`, {
        role: 'assistant',
        content: fullResponse,
        model: message.model || 'llama3'
      });
      
      return fullResponse;
    } catch (error) {
      console.error(`Error with streaming message:`, error);
      throw error;
    }
  },
  
  // Cancel a streaming message
  cancelStreamingMessage(controller) {
    if (controller) {
      controller.abort();
    }
  }
};

export default ChatService;
