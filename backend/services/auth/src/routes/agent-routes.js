/**
 * Agent Routes
 * Handles agent authentication and management
 */

const express = require('express');
const crypto = require('crypto');

/**
 * Initialize agent routes
 * @param {Object} options - Configuration options
 * @returns {Object} Router
 */
function initAgentRoutes(options) {
  const {
    logger,
    middlewares
  } = options;
  
  const router = express.Router();
  const { authenticateToken, requireAdmin } = middlewares;
  
  // Routes
  
  // Create agent token (for automated API access)
  router.post('/token', authenticateToken, requireAdmin, (req, res) => {
    try {
      const { name, expires } = req.body;
      
      if (!name) {
        return res.status(400).json({
          error: 'Agent name is required',
          status: 400
        });
      }
      
      // Generate a secure token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Calculate expiry date (default to 30 days)
      const expiryDays = parseInt(expires) || 30;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      
      // In a real implementation, save token to database
      // For now, log it (in production, we'd hash it)
      logger.info(`Generated agent token for ${name}: ${token.substring(0, 8)}...`);
      
      res.json({
        token,
        name,
        expires: expiryDate.toISOString(),
        createdBy: req.user.username
      });
    } catch (error) {
      logger.error(`Error generating agent token: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while generating the agent token',
        status: 500
      });
    }
  });
  
  // Revoke agent token
  router.delete('/token/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      
      // In a real implementation, revoke token in database
      logger.info(`Revoked agent token: ${id}`);
      
      res.json({
        message: 'Agent token revoked successfully'
      });
    } catch (error) {
      logger.error(`Error revoking agent token: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while revoking the agent token',
        status: 500
      });
    }
  });
  
  // List agent tokens (placeholder - would be DB-backed in real implementation)
  router.get('/tokens', authenticateToken, requireAdmin, (req, res) => {
    try {
      // Mock data for demonstration
      const tokens = [
        {
          id: '1',
          name: 'CI/CD Pipeline',
          tokenPrefix: 'abc123',
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'admin',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'Monitoring System',
          tokenPrefix: 'def456',
          expires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'admin',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      res.json({
        tokens
      });
    } catch (error) {
      logger.error(`Error listing agent tokens: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while listing agent tokens',
        status: 500
      });
    }
  });
  
  // Agent configuration endpoints
  
  // List available agents
  router.get('/', authenticateToken, (req, res) => {
    try {
      // Mock data for demonstration
      const agents = [
        {
          id: '1',
          name: 'General Assistant',
          description: 'A general-purpose assistant agent',
          model: 'llama3',
          systemPrompt: 'You are a helpful assistant...',
          isDefault: true,
          createdBy: 'system',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'Code Helper',
          description: 'An agent specialized in programming assistance',
          model: 'llama3-code',
          systemPrompt: 'You are a programming assistant...',
          isDefault: false,
          createdBy: 'admin',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Research Analyst',
          description: 'An agent for research and data analysis',
          model: 'llama3',
          systemPrompt: 'You are a research assistant...',
          isDefault: false,
          createdBy: 'admin',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      res.json({
        agents
      });
    } catch (error) {
      logger.error(`Error listing agents: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while listing agents',
        status: 500
      });
    }
  });
  
  // Get agent by ID
  router.get('/:id', authenticateToken, (req, res) => {
    try {
      const { id } = req.params;
      
      // Mock data for demonstration
      const agent = {
        id,
        name: 'General Assistant',
        description: 'A general-purpose assistant agent',
        model: 'llama3',
        systemPrompt: 'You are a helpful assistant designed to provide information and assistance on a wide range of topics. You should be helpful, informative, and respectful in your responses. When answering questions, try to provide relevant details and context. If you don\'t know the answer to something, be honest about it rather than making up information. You can help with information, advice, creative content, and general conversation.',
        isDefault: true,
        createdBy: 'system',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        settings: {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.95,
          frequencyPenalty: 0.5,
          presencePenalty: 0.5
        }
      };
      
      res.json({
        agent
      });
    } catch (error) {
      logger.error(`Error getting agent: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while retrieving the agent',
        status: 500
      });
    }
  });
  
  // Create agent
  router.post('/', authenticateToken, (req, res) => {
    try {
      const { name, description, model, systemPrompt, settings } = req.body;
      
      if (!name || !model || !systemPrompt) {
        return res.status(400).json({
          error: 'Name, model, and system prompt are required',
          status: 400
        });
      }
      
      // Generate ID
      const id = crypto.randomBytes(8).toString('hex');
      
      // Create agent (mock response)
      const agent = {
        id,
        name,
        description,
        model,
        systemPrompt,
        settings: settings || {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.95,
          frequencyPenalty: 0.5,
          presencePenalty: 0.5
        },
        isDefault: false,
        createdBy: req.user.username,
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json({
        message: 'Agent created successfully',
        agent
      });
    } catch (error) {
      logger.error(`Error creating agent: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while creating the agent',
        status: 500
      });
    }
  });
  
  // Update agent
  router.put('/:id', authenticateToken, (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, model, systemPrompt, settings } = req.body;
      
      // Mock agent update
      const agent = {
        id,
        name,
        description,
        model,
        systemPrompt,
        settings: settings || {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.95,
          frequencyPenalty: 0.5,
          presencePenalty: 0.5
        },
        isDefault: false,
        createdBy: 'admin',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: req.user.username,
        updatedAt: new Date().toISOString()
      };
      
      res.json({
        message: 'Agent updated successfully',
        agent
      });
    } catch (error) {
      logger.error(`Error updating agent: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while updating the agent',
        status: 500
      });
    }
  });
  
  // Delete agent
  router.delete('/:id', authenticateToken, (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if agent is default
      if (id === '1') {
        return res.status(400).json({
          error: 'Cannot delete default agent',
          status: 400
        });
      }
      
      res.json({
        message: 'Agent deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting agent: ${error.message}`);
      res.status(500).json({
        error: 'An error occurred while deleting the agent',
        status: 500
      });
    }
  });
  
  return router;
}

module.exports = initAgentRoutes;