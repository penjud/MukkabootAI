const { StatusCodes } = require('http-status-codes');
const logger = require('../config/logger');
const AgentManagement = require('../models/AgentManagement');

// Initialize agent management
const agentManagement = new AgentManagement();

// Get all agents
const getAllAgents = (req, res) => {
  try {
    const agents = agentManagement.getAllAgents();
    res.status(StatusCodes.OK).json(agents);
  } catch (error) {
    logger.error('Error getting all agents:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to retrieve agents' 
    });
  }
};

// Get agent by ID
const getAgent = (req, res) => {
  try {
    const agent = agentManagement.getAgent(req.params.id);
    
    if (!agent) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: 'Agent not found' 
      });
    }
    
    res.status(StatusCodes.OK).json(agent);
  } catch (error) {
    logger.error(`Error getting agent ${req.params.id}:`, error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to retrieve agent' 
    });
  }
};

// Create a new agent
const createAgent = (req, res) => {
  try {
    const agentData = req.body;
    const agent = agentManagement.createAgent(agentData);
    res.status(StatusCodes.CREATED).json(agent);
  } catch (error) {
    logger.error('Error creating agent:', error);
    res.status(StatusCodes.BAD_REQUEST).json({ 
      error: error.message 
    });
  }
};

// Update an agent
const updateAgent = (req, res) => {
  try {
    const updates = req.body;
    const agent = agentManagement.updateAgent(req.params.id, updates);
    res.status(StatusCodes.OK).json(agent);
  } catch (error) {
    logger.error(`Error updating agent ${req.params.id}:`, error);
    res.status(StatusCodes.NOT_FOUND).json({ 
      error: error.message 
    });
  }
};

// Delete an agent
const deleteAgent = (req, res) => {
  try {
    const result = agentManagement.deleteAgent(req.params.id);
    
    if (!result) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: 'Agent not found' 
      });
    }
    
    res.status(StatusCodes.OK).json({ 
      success: true, 
      message: 'Agent deleted successfully' 
    });
  } catch (error) {
    logger.error(`Error deleting agent ${req.params.id}:`, error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to delete agent' 
    });
  }
};

// Search agents
const searchAgents = (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Query parameter is required' 
      });
    }
    
    const results = agentManagement.searchAgents(query);
    res.status(StatusCodes.OK).json(results);
  } catch (error) {
    logger.error('Error searching agents:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to search agents' 
    });
  }
};

module.exports = {
  getAllAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  searchAgents
};