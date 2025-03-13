const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const { glob } = require('glob');
const { StatusCodes } = require('http-status-codes');
const logger = require('../config/logger');
const config = require('../config/config');

// Helper function to check if path is within allowed directories
const isPathAllowed = (checkPath) => {
  return config.filesystem.allowedDirectories.some(basePath => 
    checkPath.startsWith(basePath));
};

// Helper function to format directory listing
const formatDirectoryListing = (dirPath, files) => {
  return files.map(file => {
    const fullPath = path.join(dirPath, file);
    try {
      const stats = fs.statSync(fullPath);
      return {
        name: file,
        path: fullPath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime,
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      logger.error(`Error getting stats for ${fullPath}:`, error);
      return {
        name: file,
        path: fullPath,
        type: 'unknown',
        error: error.message
      };
    }
  }).sort((a, b) => {
    // Directories first, then files
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
};

// Get list of allowed directories
const getDirectories = (req, res) => {
  try {
    res.status(StatusCodes.OK).json({ 
      directories: config.filesystem.allowedDirectories 
    });
  } catch (error) {
    logger.error('Error getting directories:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to retrieve directories' 
    });
  }
};

// List directory contents
const listDirectory = async (req, res) => {
  try {
    const { directory } = req.query;
    
    if (!directory) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Directory parameter is required' 
      });
    }
    
    // Check if directory is within allowed paths
    if (!isPathAllowed(directory)) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        error: 'Access to this directory is not allowed' 
      });
    }
    
    if (!fs.existsSync(directory)) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: 'Directory not found' 
      });
    }
    
    if (!fs.statSync(directory).isDirectory()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Path is not a directory' 
      });
    }
    
    const files = await fs.readdir(directory);
    const listing = formatDirectoryListing(directory, files);
    
    res.status(StatusCodes.OK).json({ directory, contents: listing });
  } catch (error) {
    logger.error('Error listing directory:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: error.message 
    });
  }
};

// Alternative endpoint for browsing files (to match Web UI expectations)
const browseDirectory = async (req, res) => {
  try {
    const { path: dirPath } = req.query;
    
    if (!dirPath) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Path parameter is required' 
      });
    }
    
    // Check if directory is within allowed paths
    if (!isPathAllowed(dirPath)) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        error: 'Access to this path is not allowed' 
      });
    }
    
    if (!fs.existsSync(dirPath)) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: 'Path not found' 
      });
    }
    
    if (!fs.statSync(dirPath).isDirectory()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Path is not a directory' 
      });
    }
    
    const files = await fs.readdir(dirPath);
    const listing = formatDirectoryListing(dirPath, files);
    
    res.status(StatusCodes.OK).json({ path: dirPath, files: listing });
  } catch (error) {
    logger.error('Error browsing directory:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: error.message 
    });
  }
};

// Read file contents
const readFile = async (req, res) => {
  try {
    const { file, encoding = 'utf8' } = req.query;
    
    if (!file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'File parameter is required' 
      });
    }
    
    // Check if file is within allowed paths
    if (!isPathAllowed(file)) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        error: 'Access to this file is not allowed' 
      });
    }
    
    if (!fs.existsSync(file)) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: 'File not found' 
      });
    }
    
    if (fs.statSync(file).isDirectory()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Path is a directory, not a file' 
      });
    }
    
    // Determine content type
    const contentType = mime.lookup(file) || 'application/octet-stream';
    
    // For binary files, send as octet-stream
    if (!contentType.startsWith('text/') && contentType !== 'application/json') {
      const buffer = await fs.readFile(file);
      res.setHeader('Content-Type', contentType);
      return res.send(buffer);
    }
    
    // For text files, send as text with specified encoding
    const content = await fs.readFile(file, encoding);
    
    if (contentType === 'application/json') {
      try {
        const jsonContent = JSON.parse(content);
        return res.status(StatusCodes.OK).json({ 
          file, 
          content: jsonContent, 
          contentType 
        });
      } catch (e) {
        // If JSON parsing fails, send as text
        return res.status(StatusCodes.OK).json({ 
          file, 
          content, 
          contentType 
        });
      }
    }
    
    res.status(StatusCodes.OK).json({ file, content, contentType });
  } catch (error) {
    logger.error('Error reading file:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: error.message 
    });
  }
};

// Write file contents
const writeFile = async (req, res) => {
  try {
    const { file } = req.query;
    const content = req.body;
    
    if (!file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'File parameter is required' 
      });
    }
    
    // Check if file is within allowed paths
    if (!isPathAllowed(file)) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        error: 'Access to this file is not allowed' 
      });
    }
    
    // Ensure parent directory exists
    await fs.ensureDir(path.dirname(file));
    
    // Write content
    if (typeof content === 'object') {
      await fs.writeJSON(file, content, { spaces: 2 });
    } else {
      await fs.writeFile(file, content);
    }
    
    res.status(StatusCodes.OK).json({ 
      success: true, 
      file 
    });
  } catch (error) {
    logger.error('Error writing file:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: error.message 
    });
  }
};

// Delete file or directory
const deleteFileOrDirectory = async (req, res) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Path parameter is required' 
      });
    }
    
    // Check if path is within allowed paths
    if (!isPathAllowed(filePath)) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        error: 'Access to this path is not allowed' 
      });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: 'Path not found' 
      });
    }
    
    await fs.remove(filePath);
    
    res.status(StatusCodes.OK).json({ 
      success: true, 
      path: filePath 
    });
  } catch (error) {
    logger.error('Error deleting path:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: error.message 
    });
  }
};

// Search for files
const searchFiles = async (req, res) => {
  try {
    const { pattern, basePath } = req.query;
    
    if (!pattern) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Pattern parameter is required' 
      });
    }
    
    const searchBasePath = basePath && isPathAllowed(basePath) 
      ? basePath 
      : config.filesystem.allowedDirectories[0];
    
    const files = await glob(`${searchBasePath}/**/${pattern}`, {
      ignore: ['**/node_modules/**', '**/.*/**'],
      nodir: true
    });
    
    res.status(StatusCodes.OK).json({ 
      pattern, 
      basePath: searchBasePath,
      results: files.filter(file => isPathAllowed(file))
    });
  } catch (error) {
    logger.error('Error searching files:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: error.message 
    });
  }
};

// Create directory
const createDirectory = async (req, res) => {
  try {
    const { directory } = req.query;
    
    if (!directory) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Directory parameter is required' 
      });
    }
    
    // Check if directory is within allowed paths
    if (!isPathAllowed(directory)) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        error: 'Access to this directory is not allowed' 
      });
    }
    
    await fs.ensureDir(directory);
    
    res.status(StatusCodes.OK).json({ 
      success: true, 
      directory 
    });
  } catch (error) {
    logger.error('Error creating directory:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: error.message 
    });
  }
};

// Get file or directory stats
const getStats = async (req, res) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Path parameter is required' 
      });
    }
    
    // Check if path is within allowed paths
    if (!isPathAllowed(filePath)) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        error: 'Access to this path is not allowed' 
      });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: 'Path not found' 
      });
    }
    
    const stats = await fs.stat(filePath);
    
    res.status(StatusCodes.OK).json({
      path: filePath,
      exists: true,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime
    });
  } catch (error) {
    logger.error('Error getting stats:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: error.message 
    });
  }
};

// Get filesystem info
const getFilesystemInfo = (req, res) => {
  try {
    res.status(StatusCodes.OK).json({
      type: 'filesystem',
      data: {
        allowedDirectories: config.filesystem.allowedDirectories,
        uploadsDir: config.filesystem.uploadsDir,
        avatarsDir: config.filesystem.avatarsDir
      }
    });
  } catch (error) {
    logger.error('Error getting filesystem info:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: error.message 
    });
  }
};

module.exports = {
  getDirectories,
  listDirectory,
  browseDirectory,
  readFile,
  writeFile,
  deleteFileOrDirectory,
  searchFiles,
  createDirectory,
  getStats,
  getFilesystemInfo
};