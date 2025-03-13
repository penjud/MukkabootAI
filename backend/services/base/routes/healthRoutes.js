const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// Health check route
router.get('/', healthController.getHealth);

module.exports = router;
