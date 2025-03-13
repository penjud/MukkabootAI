const express = require('express');
const router = express.Router();
const memoryController = require('../controllers/memoryController');

// Entity routes
router.get('/entities', memoryController.getAllEntities);
router.post('/entities', memoryController.createEntities);
router.delete('/entities', memoryController.deleteEntities);

// Relation routes
router.get('/relations', memoryController.getAllRelations);
router.post('/relations', memoryController.createRelations);
router.delete('/relations', memoryController.deleteRelations);

// Observation routes
router.post('/observations', memoryController.addObservations);
router.delete('/observations', memoryController.deleteObservations);

// Search route
router.get('/search', memoryController.searchEntities);

// Complete memory store route
router.get('/', memoryController.getMemoryStore);

module.exports = router;