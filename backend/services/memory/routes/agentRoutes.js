const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

// Get all agents or search
router.get('/', agentController.getAllAgents);
router.get('/search', agentController.searchAgents);

// CRUD for agents
router.post('/', agentController.createAgent);
router.get('/:id', agentController.getAgent);
router.put('/:id', agentController.updateAgent);
router.delete('/:id', agentController.deleteAgent);

module.exports = router;