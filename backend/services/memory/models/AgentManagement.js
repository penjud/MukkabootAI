const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const config = require('../config/config');

class AgentManagement {
  constructor(storageDir = config.storage.agentsDir) {
    this.storageDir = storageDir;
    this.agents = new Map();
    this.init();
  }

  init() {
    // Ensure storage directory exists
    logger.info(`Initializing agent management storage: ${this.storageDir}`);
    fs.ensureDirSync(this.storageDir);
    this.loadAgents();
  }

  loadAgents() {
    try {
      const files = fs.readdirSync(this.storageDir);
      logger.info(`Found ${files.length} agent files`);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const agentId = path.basename(file, '.json');
          const agentData = fs.readJSONSync(path.join(this.storageDir, file));
          this.agents.set(agentId, agentData);
        }
      }
      logger.info(`Loaded ${this.agents.size} agents`);
    } catch (error) {
      logger.error('Error loading agents:', error);
    }
  }

  saveAgent(agentId) {
    try {
      const agent = this.agents.get(agentId);
      if (agent) {
        fs.writeJSONSync(
          path.join(this.storageDir, `${agentId}.json`), 
          agent
        );
        logger.debug(`Saved agent: ${agentId}`);
      }
    } catch (error) {
      logger.error(`Error saving agent ${agentId}:`, error);
    }
  }

  createAgent(agentData) {
    const agentId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const newAgent = {
      id: agentId,
      name: agentData.name || 'New Agent',
      description: agentData.description || '',
      avatar: agentData.avatar || null,
      color: agentData.color || 'primary',
      traits: agentData.traits || [],
      expertise: agentData.expertise || [],
      model: agentData.model || 'llama3',
      systemPrompt: agentData.systemPrompt || 'You are a helpful AI assistant.',
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    this.agents.set(agentId, newAgent);
    this.saveAgent(agentId);
    logger.info(`Created new agent: ${agentId}`);
    
    return newAgent;
  }

  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  getAllAgents() {
    return Array.from(this.agents.values());
  }

  updateAgent(agentId, updates) {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      logger.error(`Agent ${agentId} not found when updating`);
      throw new Error(`Agent ${agentId} not found`);
    }
    
    const updatedAgent = {
      ...agent,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Ensure id remains unchanged
    updatedAgent.id = agentId;
    
    this.agents.set(agentId, updatedAgent);
    this.saveAgent(agentId);
    logger.info(`Updated agent: ${agentId}`);
    
    return updatedAgent;
  }

  deleteAgent(agentId) {
    if (!this.agents.has(agentId)) {
      logger.error(`Agent ${agentId} not found when deleting`);
      return false;
    }
    
    this.agents.delete(agentId);
    
    try {
      fs.removeSync(path.join(this.storageDir, `${agentId}.json`));
      logger.info(`Deleted agent: ${agentId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting agent ${agentId}:`, error);
      return false;
    }
  }

  searchAgents(query) {
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    logger.debug(`Searching agents for: ${query}`);
    
    return Array.from(this.agents.values())
      .filter(agent => {
        return (
          (agent.name && agent.name.toLowerCase().includes(lowerQuery)) ||
          (agent.description && agent.description.toLowerCase().includes(lowerQuery)) ||
          (agent.traits && agent.traits.some(trait => trait.toLowerCase().includes(lowerQuery))) ||
          (agent.expertise && agent.expertise.some(skill => skill.toLowerCase().includes(lowerQuery)))
        );
      });
  }
}

module.exports = AgentManagement;