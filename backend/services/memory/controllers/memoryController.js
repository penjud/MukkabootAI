const { StatusCodes } = require('http-status-codes');
const logger = require('../config/logger');
const MemoryStore = require('../models/MemoryStore');

// Initialize memory store
const memoryStore = new MemoryStore();

// Get all entities
const getAllEntities = (req, res) => {
  try {
    const entities = memoryStore.getAllEntities();
    res.status(StatusCodes.OK).json(entities);
  } catch (error) {
    logger.error('Error getting all entities:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to retrieve entities' 
    });
  }
};

// Create entities
const createEntities = (req, res) => {
  try {
    const { entities } = req.body;
    
    if (!entities || !Array.isArray(entities)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Invalid entities format' 
      });
    }
    
    const createdEntities = memoryStore.createEntities(entities);
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Entities created/updated successfully',
      entities: createdEntities
    });
  } catch (error) {
    logger.error('Error creating entities:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to create entities' 
    });
  }
};

// Get all relations
const getAllRelations = (req, res) => {
  try {
    const relations = memoryStore.getAllRelations();
    res.status(StatusCodes.OK).json(relations);
  } catch (error) {
    logger.error('Error getting all relations:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to retrieve relations' 
    });
  }
};

// Create relations
const createRelations = (req, res) => {
  try {
    const { relations } = req.body;
    
    if (!relations || !Array.isArray(relations)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Invalid relations format' 
      });
    }
    
    const createdRelations = memoryStore.createRelations(relations);
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Relations created/updated successfully',
      relations: createdRelations
    });
  } catch (error) {
    logger.error('Error creating relations:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to create relations' 
    });
  }
};

// Search entities
const searchEntities = (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Query parameter is required' 
      });
    }
    
    const results = memoryStore.searchEntities(query);
    res.status(StatusCodes.OK).json(results);
  } catch (error) {
    logger.error('Error searching entities:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to search entities' 
    });
  }
};

// Delete entities
const deleteEntities = (req, res) => {
  try {
    const { entityNames } = req.body;
    
    if (!entityNames || !Array.isArray(entityNames)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Invalid entityNames format' 
      });
    }
    
    const deletedCount = memoryStore.deleteEntities(entityNames);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Entities deleted successfully',
      deletedCount
    });
  } catch (error) {
    logger.error('Error deleting entities:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to delete entities' 
    });
  }
};

// Delete relations
const deleteRelations = (req, res) => {
  try {
    const { relations } = req.body;
    
    if (!relations || !Array.isArray(relations)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Invalid relations format' 
      });
    }
    
    const deletedCount = memoryStore.deleteRelations(relations);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Relations deleted successfully',
      deletedCount
    });
  } catch (error) {
    logger.error('Error deleting relations:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to delete relations' 
    });
  }
};

// Add observations
const addObservations = (req, res) => {
  try {
    const { observations } = req.body;
    
    if (!observations || !Array.isArray(observations)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Invalid observations format' 
      });
    }
    
    const updatedEntities = memoryStore.addObservations(observations);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Observations added successfully',
      entities: updatedEntities
    });
  } catch (error) {
    logger.error('Error adding observations:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to add observations' 
    });
  }
};

// Delete observations
const deleteObservations = (req, res) => {
  try {
    const { deletions } = req.body;
    
    if (!deletions || !Array.isArray(deletions)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: 'Invalid deletions format' 
      });
    }
    
    const updatedEntities = memoryStore.deleteObservations(deletions);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Observations deleted successfully',
      entities: updatedEntities
    });
  } catch (error) {
    logger.error('Error deleting observations:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to delete observations' 
    });
  }
};

// Get complete memory store
const getMemoryStore = (req, res) => {
  try {
    const memory = {
      entities: memoryStore.getAllEntities(),
      relations: memoryStore.getAllRelations()
    };
    
    res.status(StatusCodes.OK).json({
      type: 'memory',
      data: memory
    });
  } catch (error) {
    logger.error('Error getting memory store:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: 'Failed to retrieve memory store' 
    });
  }
};

module.exports = {
  getAllEntities,
  createEntities,
  getAllRelations,
  createRelations,
  searchEntities,
  deleteEntities,
  deleteRelations,
  addObservations,
  deleteObservations,
  getMemoryStore
};