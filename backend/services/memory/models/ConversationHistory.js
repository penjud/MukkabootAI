const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const config = require('../config/config');

class ConversationHistory {
  constructor(storageDir = config.storage.conversationsDir) {
    this.storageDir = storageDir;
    this.conversations = new Map();
    this.init();
  }

  init() {
    // Ensure storage directory exists
    logger.info(`Initializing conversation history storage: ${this.storageDir}`);
    fs.ensureDirSync(this.storageDir);
    this.loadConversations();
  }

  loadConversations() {
    try {
      const files = fs.readdirSync(this.storageDir);
      logger.info(`Found ${files.length} conversation files`);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const conversationId = path.basename(file, '.json');
          const conversationData = fs.readJSONSync(path.join(this.storageDir, file));
          this.conversations.set(conversationId, conversationData);
        }
      }
      logger.info(`Loaded ${this.conversations.size} conversations`);
    } catch (error) {
      logger.error('Error loading conversations:', error);
    }
  }

  saveConversation(conversationId) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        fs.writeJSONSync(
          path.join(this.storageDir, `${conversationId}.json`), 
          conversation
        );
        logger.debug(`Saved conversation: ${conversationId}`);
      }
    } catch (error) {
      logger.error(`Error saving conversation ${conversationId}:`, error);
    }
  }

  createConversation(title = 'New Conversation', metadata = {}) {
    const conversationId = uuidv4();
    const conversation = {
      id: conversationId,
      title,
      metadata,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.conversations.set(conversationId, conversation);
    this.saveConversation(conversationId);
    logger.info(`Created new conversation: ${conversationId}`);
    
    return conversation;
  }

  getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }

  getAllConversations() {
    return Array.from(this.conversations.values()).map(conv => ({
      id: conv.id,
      title: conv.title,
      messageCount: conv.messages.length,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      metadata: conv.metadata
    })).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  addMessage(conversationId, message) {
    const conversation = this.conversations.get(conversationId);
    
    if (!conversation) {
      logger.error(`Conversation ${conversationId} not found when adding message`);
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const newMessage = {
      id: messageId,
      ...message,
      timestamp
    };
    
    conversation.messages.push(newMessage);
    conversation.updatedAt = timestamp;
    
    this.saveConversation(conversationId);
    logger.debug(`Added message to conversation ${conversationId}`);
    
    return newMessage;
  }

  updateConversation(conversationId, updates) {
    const conversation = this.conversations.get(conversationId);
    
    if (!conversation) {
      logger.error(`Conversation ${conversationId} not found when updating`);
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    const updatedConversation = {
      ...conversation,
      ...(updates.title && { title: updates.title }),
      ...(updates.metadata && { metadata: { ...conversation.metadata, ...updates.metadata } }),
      updatedAt: new Date().toISOString()
    };
    
    this.conversations.set(conversationId, updatedConversation);
    this.saveConversation(conversationId);
    logger.info(`Updated conversation: ${conversationId}`);
    
    return updatedConversation;
  }

  deleteConversation(conversationId) {
    if (!this.conversations.has(conversationId)) {
      logger.error(`Conversation ${conversationId} not found when deleting`);
      return false;
    }
    
    this.conversations.delete(conversationId);
    
    try {
      fs.removeSync(path.join(this.storageDir, `${conversationId}.json`));
      logger.info(`Deleted conversation: ${conversationId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting conversation ${conversationId}:`, error);
      return false;
    }
  }

  searchConversations(query) {
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    logger.debug(`Searching conversations for: ${query}`);
    
    return Array.from(this.conversations.values())
      .filter(conv => {
        // Search in title
        if (conv.title.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        
        // Search in messages
        return conv.messages.some(msg => 
          (msg.content && typeof msg.content === 'string' && msg.content.toLowerCase().includes(lowerQuery)) ||
          (msg.role && msg.role.toLowerCase().includes(lowerQuery))
        );
      })
      .map(conv => ({
        id: conv.id,
        title: conv.title,
        messageCount: conv.messages.length,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        metadata: conv.metadata
      }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }
}

module.exports = ConversationHistory;