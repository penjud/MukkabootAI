const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// Avatar upload route
router.post('/avatar', uploadController.upload.single('avatar'), uploadController.uploadAvatar);

// General file upload route
router.post('/file', uploadController.upload.single('file'), uploadController.uploadFile);

module.exports = router;