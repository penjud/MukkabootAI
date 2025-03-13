const { StatusCodes } = require('http-status-codes');
const logger = require('../config/logger');
const ConversationHistory = require('../models/ConversationHistory');
const AgentManagement = require('../models/AgentManagement');

// Initialize conversation history and agent management
const conversationHistory = new ConversationHistory();
const agentManagement = new AgentManagement();

// Get all conversations
const getAllConversations = (req, res) => {
  try {
    const conversations = conversationHistory.getAllConversations();
    res.status(StatusCodes.OK).json(conversations);
  } catch (error) {
    logger.error('Error getting all conversations:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to retrieve conversations' 
    });
  }
};

// Create a new conversation
const createConversation = (req, res) => {
  try {
    const { title, metadata, agentId } = req.body;
    
    // If agentId is provided, associate the conversation with an agent
    let conversationMetadata = metadata || {};
    if (agentId) {
      const agent = agentManagement.getAgent(agentId);
      if (agent) {
        conversationMetadata.agentId = agentId;
        conversationMetadata.agent = {
          id: agent.id,
          name: agent.name,
          avatar: agent.avatar,
          color: agent.color
        };
      }
    }
    
    const conversation = conversationHistory.createConversation(title, conversationMetadata);
    res.status(StatusCodes.CREATED).json(conversation);
  } catch (error) {
    logger.error('Error creating conversation:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to create conversation' 
    });
  }
};

// Get a conversation by ID
const getConversation = (req, res) => {
  try {
    const conversation = conversationHistory.getConversation(req.params.id);
    
    if (!conversation) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: 'Conversation not found' 
      });
    }
    
    res.status(StatusCodes.OK).json(conversation);
  } catch (error) {
    logger.error(`Error getting conversation ${req.params.id}:`, error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to retrieve conversation' 
    });
  }
};

// Add a message to a conversation
const addMessage = (req, res) => {
  try {
    const { role, content, model, metadata } = req.body;
    
    if (!role || !content) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Role and content are required' 
      });
    }
    
    const message = conversationHistory.addMessage(req.params.id, {
      role,
      content,
      model,
      metadata
    });
    
    res.status(StatusCodes.CREATED).json(message);
  } catch (error) {
    logger.error(`Error adding message to conversation ${req.params.id}:`, error);
    res.status(StatusCodes.NOT_FOUND).json({ 
      error: error.message 
    });
  }
};

// Get messages for a conversation
const getMessages = (req, res) => {
  try {
    const conversation = conversationHistory.getConversation(req.params.id);
    
    if (!conversation) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: 'Conversation not found' 
      });
    }
    
    res.status(StatusCodes.OK).json(conversation.messages);
  } catch (error) {
    logger.error(`Error getting messages for conversation ${req.params.id}:`, error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to retrieve messages' 
    });
  }
};

// Update a conversation
const updateConversation = (req, res) => {
  try {
    const { title, metadata } = req.body;
    const conversation = conversationHistory.updateConversation(req.params.id, { title, metadata });
    res.status(StatusCodes.OK).json(conversation);
  } catch (error) {
    logger.error(`Error updating conversation ${req.params.id}:`, error);
    res.status(StatusCodes.NOT_FOUND).json({ 
      error: error.message 
    });
  }
};

// Delete a conversation
const deleteConversation = (req, res) => {
  try {
    const result = conversationHistory.deleteConversation(req.params.id);
    
    if (!result) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: 'Conversation not found' 
      });
    }
    
    res.status(StatusCodes.OK).json({ 
      success: true, 
      message: 'Conversation deleted successfully' 
    });
  } catch (error) {
    logger.error(`Error deleting conversation ${req.params.id}:`, error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to delete conversation' 
    });
  }
};

// Search conversations
const searchConversations = (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Query parameter is required' 
      });
    }
    
    const results = conversationHistory.searchConversations(query);
    res.status(StatusCodes.OK).json(results);
  } catch (error) {
    logger.error('Error searching conversations:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to search conversations' 
    });
  }
};

module.exports = {
  getAllConversations,
  createConversation,
  getConversation,
  addMessage,
  getMessages,
  updateConversation,
  deleteConversation,
  searchConversations
};