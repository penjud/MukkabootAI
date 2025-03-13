const express = require('express');
const router = express.Router();
const filesystemController = require('../controllers/filesystemController');

// Directory routes
router.get('/directories', filesystemController.getDirectories);
router.get('/ls', filesystemController.listDirectory);
router.get('/browse', filesystemController.browseDirectory);
router.post('/mkdir', filesystemController.createDirectory);

// File routes
router.get('/read', filesystemController.readFile);
router.post('/write', filesystemController.writeFile);
router.delete('/delete', filesystemController.deleteFileOrDirectory);

// Search and info routes
router.get('/search', filesystemController.searchFiles);
router.get('/stats', filesystemController.getStats);

// Legacy compatibility
router.get('/', filesystemController.getFilesystemInfo);

module.exports = router;