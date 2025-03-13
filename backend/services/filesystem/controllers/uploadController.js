const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const { StatusCodes } = require('http-status-codes');
const logger = require('../config/logger');
const config = require('../config/config');

// Ensure uploads directories exist
fs.ensureDirSync(config.filesystem.uploadsDir);
fs.ensureDirSync(config.filesystem.avatarsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on upload type
    if (req.path.includes('/avatar')) {
      cb(null, config.filesystem.avatarsDir);
    } else {
      cb(null, config.filesystem.uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with original extension
    const extension = path.extname(file.originalname) || '';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;
    cb(null, filename);
  }
});

// Create upload middleware with size limits
const upload = multer({ 
  storage,
  limits: { 
    fileSize: config.filesystem.uploadLimitMB * 1024 * 1024
  }
});

// Upload avatar file
const uploadAvatar = (req, res) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'No file uploaded' 
      });
    }
    
    // Create a publicly accessible URL
    const relativePath = path.relative(config.filesystem.uploadsDir, req.file.path);
    const filePath = `/uploads/${relativePath}`;
    
    // Return the file info with URL path
    res.status(StatusCodes.OK).json({
      success: true,
      originalName: req.file.originalname,
      filename: req.file.filename,
      filePath,
      url: filePath,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    logger.error('Error uploading avatar:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: error.message 
    });
  }
};

// Upload generic file
const uploadFile = (req, res) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'No file uploaded' 
      });
    }
    
    // Create a publicly accessible URL
    const relativePath = path.relative(config.filesystem.uploadsDir, req.file.path);
    const filePath = `/uploads/${relativePath}`;
    
    // Return the file info with URL path
    res.status(StatusCodes.OK).json({
      success: true,
      originalName: req.file.originalname,
      filename: req.file.filename,
      filePath,
      url: filePath,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    logger.error('Error uploading file:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: error.message 
    });
  }
};

module.exports = {
  upload,
  uploadAvatar,
  uploadFile
};