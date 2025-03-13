const express = require('express');
const router = express.Router();
const registryController = require('../controllers/registryController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Service registry routes
router.post('/services', registryController.registerService);
router.get('/services', registryController.getServices);
router.get('/services/:name', registryController.getService);
router.delete('/services/:name', registryController.deregisterService);

module.exports = router;
