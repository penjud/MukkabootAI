import { defineStore } from 'pinia';
import { ChatService } from '../services';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [],
    selectedConversationId: null,
    messages: [],
    isLoadingConversations: false,
    isLoadingMessages: false,
    isSendingMessage: false,
    agents: [
      { id: 'agent-1', name: 'General Assistant', model: 'llama3', category: 'General', icon: 'mdi-robot', description: 'All-purpose assistant for general tasks and questions' },
      { id: 'agent-2', name: 'Code Helper', model: 'codellama', category: 'Development', icon: 'mdi-code-braces', description: 'Specialized assistant for coding and development tasks' },
      { id: 'agent-3', name: 'Research Assistant', model: 'llama3', category: 'Research', icon: 'mdi-book-open-page-variant', description: 'Assistant for research, summarization and information gathering' }
    ],
    selectedAgentId: 'agent-1',
    searchQuery: '',
    error: null,
    streamController: null
  }),

  getters: {
    selectedConversation: (state) => {
      return state.conversations.find(c => c.id === state.selectedConversationId) || null;
    },
    
    selectedAgent: (state) => {
      return state.agents.find(a => a.id === state.selectedAgentId) || state.agents[0];
    },
    
    filteredConversations: (state) => {
      if (!state.searchQuery) {
        return state.conversations;
      }
      
      const query = state.searchQuery.toLowerCase();
      return state.conversations.filter(conversation => 
        conversation.title.toLowerCase().includes(query)
      );
    },
    
    getAgentById: (state) => (agentId) => {
      return state.agents.find(a => a.id === agentId) || null;
    },
    
    getAgentName: (state) => (agentId) => {
      const agent = state.agents.find(a => a.id === agentId);
      return agent ? agent.name : 'Assistant';
    }
  },

  actions: {
    // Fetch all conversations
    async fetchConversations() {
      this.isLoadingConversations = true;
      this.error = null;
      
      try {
        const conversationsData = await ChatService.getConversations();
        this.conversations = conversationsData.map(conversation => ({
          ...conversation,
          timestamp: format(new Date(conversation.updatedAt || conversation.timestamp || new Date()), 'MMM d, yyyy h:mm a')
        }));
      } catch (error) {
        console.error('Error fetching conversations:', error);
        this.error = 'Failed to load conversations';
        
        // Add mock data if API is not available
        this.conversations = [
          { id: 'conv-1', title: 'General Questions', timestamp: 'Mar 13, 2025 9:15 AM', messageCount: 12, agentId: 'agent-1' },
          { id: 'conv-2', title: 'Project Planning', timestamp: 'Mar 12, 2025 2:30 PM', messageCount: 8, agentId: 'agent-2' },
          { id: 'conv-3', title: 'API Documentation', timestamp: 'Mar 10, 2025 4:45 PM', messageCount: 5, agentId: 'agent-3' }
        ];
      } finally {
        this.isLoadingConversations = false;
      }
    },
    
    // Select a conversation and load its messages
    async selectConversation(conversationId) {
      this.selectedConversationId = conversationId;
      
      if (!conversationId) {
        this.messages = [];
        return;
      }
      
      await this.fetchMessages(conversationId);
      
      // Update selected agent based on conversation
      const conversation = this.conversations.find(c => c.id === conversationId);
      if (conversation && conversation.agentId) {
        this.selectedAgentId = conversation.agentId;
      }
    },
    
    // Fetch messages for a conversation
    async fetchMessages(conversationId) {
      this.isLoadingMessages = true;
      this.error = null;
      this.messages = [];
      
      try {
        const messagesData = await ChatService.getMessages(conversationId);
        this.messages = messagesData.map(message => ({
          ...message,
          timestamp: format(new Date(message.timestamp || message.createdAt || new Date()), 'h:mm a')
        }));
      } catch (error) {
        console.error('Error fetching messages:', error);
        this.error = 'Failed to load messages';
        
        // Add mock data if API is not available
        this.loadMockMessages(conversationId);
      } finally {
        this.isLoadingMessages = false;
      }
    },
    
    // Load mock messages for development/testing
    loadMockMessages(conversationId) {
      if (conversationId === 'conv-1') {
        this.messages = [
          { id: 'msg-1', role: 'user', content: 'Hello, how can you help me today?', timestamp: '9:10 AM' },
          { id: 'msg-2', role: 'assistant', content: 'I can help with a variety of tasks such as answering questions, providing information, and assisting with tasks. What would you like help with?', timestamp: '9:11 AM' },
          { id: 'msg-3', role: 'user', content: 'Tell me about the MukkabootAI platform.', timestamp: '9:12 AM' },
          { id: 'msg-4', role: 'assistant', content: 'MukkabootAI is a Docker-free implementation of the MukkaAI platform, designed for AI agents and command operations. It maintains a microservices architecture while eliminating containerization dependencies for improved performance and simplified maintenance.', timestamp: '9:15 AM' }
        ];
      } else if (conversationId === 'conv-2') {
        this.messages = [
          { id: 'msg-5', role: 'user', content: 'Let\'s plan a project to implement a new feature.', timestamp: '2:20 PM' },
          { id: 'msg-6', role: 'assistant', content: 'Great! What kind of feature are you thinking about implementing?', timestamp: '2:21 PM' },
          { id: 'msg-7', role: 'user', content: 'A file sharing system that integrates with our existing platform.', timestamp: '2:25 PM' },
          { id: 'msg-8', role: 'assistant', content: 'That sounds like a useful addition. Let\'s break this down into steps: 1) Requirements gathering, 2) Design phase, 3) Implementation, 4) Testing, and 5) Deployment. Would you like to discuss any of these phases in more detail?', timestamp: '2:30 PM' }
        ];
      } else {
        this.messages = [
          { id: 'msg-9', role: 'user', content: 'I need help understanding the API documentation.', timestamp: '4:40 PM' },
          { id: 'msg-10', role: 'assistant', content: 'I\'d be happy to help. Which API are you working with?', timestamp: '4:41 PM' },
          { id: 'msg-11', role: 'user', content: 'The MukkabootAI Memory Service API.', timestamp: '4:43 PM' },
          { id: 'msg-12', role: 'assistant', content: 'The Memory Service API provides endpoints for storing and retrieving conversation history and knowledge entities. The main endpoints are `/api/conversations`, `/api/entities`, and `/api/relations`. Would you like me to explain any specific endpoint in more detail?', timestamp: '4:45 PM' }
        ];
      }
    },
    
    // Create a new conversation
    async createNewConversation() {
      const newConversationData = {
        title: `New Conversation (${format(new Date(), 'MMM d, h:mm a')})`,
        agentId: this.selectedAgentId
      };
      
      try {
        const newConversation = await ChatService.createConversation(newConversationData);
        const formattedConversation = {
          ...newConversation,
          timestamp: format(new Date(newConversation.createdAt || newConversation.timestamp || new Date()), 'MMM d, yyyy h:mm a')
        };
        this.conversations.unshift(formattedConversation);
        this.selectConversation(formattedConversation.id);
      } catch (error) {
        console.error('Error creating conversation:', error);
        this.error = 'Failed to create conversation';
        
        // Create mock conversation if API is not available
        const mockConversation = {
          id: `conv-${uuidv4()}`,
          title: newConversationData.title,
          timestamp: format(new Date(), 'MMM d, yyyy h:mm a'),
          messageCount: 0,
          agentId: this.selectedAgentId
        };
        this.conversations.unshift(mockConversation);
        this.selectConversation(mockConversation.id);
      }
    },
    
    // Update conversation details
    async updateConversation(conversationId, data) {
      try {
        const updatedConversation = await ChatService.updateConversation(conversationId, data);
        
        // Update the conversation in the list
        const index = this.conversations.findIndex(c => c.id === conversationId);
        if (index !== -1) {
          this.conversations[index] = {
            ...this.conversations[index],
            ...updatedConversation,
            timestamp: format(new Date(updatedConversation.updatedAt || new Date()), 'MMM d, yyyy h:mm a')
          };
        }
        
        return updatedConversation;
      } catch (error) {
        console.error('Error updating conversation:', error);
        this.error = 'Failed to update conversation';
        
        // Update mock conversation
        const index = this.conversations.findIndex(c => c.id === conversationId);
        if (index !== -1) {
          this.conversations[index] = {
            ...this.conversations[index],
            ...data,
            timestamp: format(new Date(), 'MMM d, yyyy h:mm a')
          };
          return this.conversations[index];
        }
      }
    },
    
    // Delete a conversation
    async deleteConversation(conversationId) {
      try {
        await ChatService.deleteConversation(conversationId);
        
        // Remove the conversation from the list
        this.conversations = this.conversations.filter(c => c.id !== conversationId);
        
        // Clear selection if the deleted conversation was selected
        if (this.selectedConversationId === conversationId) {
          this.selectedConversationId = null;
          this.messages = [];
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
        this.error = 'Failed to delete conversation';
        
        // Remove mock conversation
        this.conversations = this.conversations.filter(c => c.id !== conversationId);
        
        // Clear selection if the deleted conversation was selected
        if (this.selectedConversationId === conversationId) {
          this.selectedConversationId = null;
          this.messages = [];
        }
      }
    },
    
    // Send a message
    async sendMessage(messageContent) {
      if (!messageContent.trim() || !this.selectedConversationId || this.isSendingMessage) {
        return;
      }
      
      this.isSendingMessage = true;
      this.error = null;
      
      // Add user message to the UI immediately
      const userMessage = {
        id: `temp-${uuidv4()}`,
        role: 'user',
        content: messageContent,
        timestamp: format(new Date(), 'h:mm a')
      };
      
      this.messages.push(userMessage);
      
      try {
        // Send the message to the server
        const savedMessage = await ChatService.sendMessage(this.selectedConversationId, {
          role: 'user',
          content: messageContent,
          model: this.selectedAgent.model
        });
        
        // Update the user message with the server response if needed
        if (savedMessage && savedMessage.id) {
          const index = this.messages.findIndex(m => m.id === userMessage.id);
          if (index !== -1) {
            this.messages[index] = {
              ...savedMessage,
              timestamp: format(new Date(savedMessage.timestamp || savedMessage.createdAt || new Date()), 'h:mm a')
            };
          }
        }
        
        // Add an initial streaming message
        const streamingMessage = {
          id: `stream-${uuidv4()}`,
          role: 'assistant',
          content: '',
          isStreaming: true,
          timestamp: format(new Date(), 'h:mm a')
        };
        
        this.messages.push(streamingMessage);
        
        // Process the streaming response
        await ChatService.sendStreamingMessage(
          this.selectedConversationId,
          {
            role: 'user',
            content: messageContent,
            model: this.selectedAgent.model
          },
          (chunk, fullText) => {
            // Update the streaming message with new content
            const index = this.messages.findIndex(m => m.id === streamingMessage.id);
            if (index !== -1) {
              this.messages[index].content = fullText;
            }
          }
        ).then((finalResponse) => {
          // Update the message to final state when streaming is complete
          const index = this.messages.findIndex(m => m.id === streamingMessage.id);
          if (index !== -1) {
            this.messages[index].isStreaming = false;
            this.messages[index].content = finalResponse;
          }
          
          // Update conversation timestamp
          const conversationIndex = this.conversations.findIndex(c => c.id === this.selectedConversationId);
          if (conversationIndex !== -1) {
            this.conversations[conversationIndex].timestamp = format(new Date(), 'MMM d, yyyy h:mm a');
            this.conversations[conversationIndex].messageCount = (this.conversations[conversationIndex].messageCount || 0) + 2;
          }
        });
        
      } catch (error) {
        console.error('Error sending message:', error);
        this.error = 'Failed to send message';
        
        // Handle error state - show error in UI
        const errorIndex = this.messages.findIndex(m => m.isStreaming);
        if (errorIndex !== -1) {
          this.messages[errorIndex].isStreaming = false;
          this.messages[errorIndex].content = "I'm sorry, there was an error processing your request. Please try again later.";
          this.messages[errorIndex].isError = true;
        } else {
          // Add error message if no streaming message exists
          this.messages.push({
            id: `error-${uuidv4()}`,
            role: 'assistant',
            content: "I'm sorry, there was an error processing your request. Please try again later.",
            isError: true,
            timestamp: format(new Date(), 'h:mm a')
          });
        }
      } finally {
        this.isSendingMessage = false;
      }
    },
    
    // Cancel a streaming message
    cancelStreamingMessage() {
      if (this.streamController) {
        ChatService.cancelStreamingMessage(this.streamController);
        this.streamController = null;
        
        // Update the streaming message to indicate cancellation
        const index = this.messages.findIndex(m => m.isStreaming);
        if (index !== -1) {
          this.messages[index].isStreaming = false;
          this.messages[index].content += ' [Message generation stopped]';
        }
      }
    },
    
    // Change the selected agent
    async changeAgent(agentId) {
      this.selectedAgentId = agentId;
      
      // Update conversation agent if one is selected
      if (this.selectedConversationId) {
        try {
          await this.updateConversation(this.selectedConversationId, { agentId });
        } catch (error) {
          console.error('Error updating conversation agent:', error);
        }
      }
    },
    
    // Set search query
    setSearchQuery(query) {
      this.searchQuery = query;
    },
    
    // Clear search query
    clearSearchQuery() {
      this.searchQuery = '';
    }
  }
});
