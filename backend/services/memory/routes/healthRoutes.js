const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const config = require('../config/config');

// Health check route
router.get('/', (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'healthy',
    service: config.service.name,
    version: config.service.version,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;