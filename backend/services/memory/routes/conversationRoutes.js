const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

// Get all conversations or search
router.get('/', conversationController.getAllConversations);
router.get('/search', conversationController.searchConversations);

// CRUD for conversations
router.post('/', conversationController.createConversation);
router.get('/:id', conversationController.getConversation);
router.put('/:id', conversationController.updateConversation);
router.delete('/:id', conversationController.deleteConversation);

// Messages
router.get('/:id/messages', conversationController.getMessages);
router.post('/:id/messages', conversationController.addMessage);

module.exports = router;