const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const config = require('../config/config');

class MemoryStore {
  constructor(filePath = config.storage.memoryFilePath) {
    this.filePath = filePath;
    this.memory = {
      entities: [],
      relations: []
    };
    this.init();
  }

  init() {
    // Ensure directory exists
    logger.info(`Initializing memory store: ${this.filePath}`);
    fs.ensureDirSync(path.dirname(this.filePath));
    this.loadMemory();
  }

  loadMemory() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readJSONSync(this.filePath);
        this.memory = data;
        logger.info(`Memory loaded from ${this.filePath}`);
      } else {
        fs.writeJSONSync(this.filePath, this.memory);
        logger.info(`Created new memory file at ${this.filePath}`);
      }
    } catch (error) {
      logger.error(`Error loading memory from ${this.filePath}:`, error);
    }
  }

  saveMemory() {
    try {
      fs.writeJSONSync(this.filePath, this.memory);
      logger.debug('Memory saved to file');
    } catch (error) {
      logger.error('Error saving memory to file:', error);
    }
  }

  getAllEntities() {
    return this.memory.entities;
  }

  getAllRelations() {
    return this.memory.relations;
  }

  createEntities(entities) {
    if (!entities || !Array.isArray(entities)) {
      throw new Error('Invalid entities format');
    }
    
    const createdEntities = [];
    
    for (const entity of entities) {
      const { name, entityType, observations } = entity;
      
      if (!name || !entityType) {
        continue;
      }
      
      const existingEntityIndex = this.memory.entities.findIndex(e => e.name === name);
      
      if (existingEntityIndex !== -1) {
        // Update existing entity
        this.memory.entities[existingEntityIndex] = {
          ...this.memory.entities[existingEntityIndex],
          entityType,
          observations: [...(this.memory.entities[existingEntityIndex].observations || []), ...(observations || [])],
          updatedAt: new Date().toISOString()
        };
        createdEntities.push(this.memory.entities[existingEntityIndex]);
      } else {
        // Create new entity
        const newEntity = {
          id: uuidv4(),
          name,
          entityType,
          observations: observations || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        this.memory.entities.push(newEntity);
        createdEntities.push(newEntity);
      }
    }
    
    this.saveMemory();
    logger.info(`Created/updated ${createdEntities.length} entities`);
    
    return createdEntities;
  }

  createRelations(relations) {
    if (!relations || !Array.isArray(relations)) {
      throw new Error('Invalid relations format');
    }
    
    const createdRelations = [];
    
    for (const relation of relations) {
      const { from, to, relationType } = relation;
      
      if (!from || !to || !relationType) {
        continue;
      }
      
      // Check if entities exist
      const fromEntity = this.memory.entities.find(e => e.name === from);
      const toEntity = this.memory.entities.find(e => e.name === to);
      
      if (!fromEntity || !toEntity) {
        continue;
      }
      
      // Check if relation already exists
      const existingRelationIndex = this.memory.relations.findIndex(
        r => r.from === from && r.to === to && r.relationType === relationType
      );
      
      if (existingRelationIndex !== -1) {
        // Update existing relation
        this.memory.relations[existingRelationIndex].updatedAt = new Date().toISOString();
        createdRelations.push(this.memory.relations[existingRelationIndex]);
      } else {
        // Create new relation
        const newRelation = {
          id: uuidv4(),
          from,
          to,
          relationType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        this.memory.relations.push(newRelation);
        createdRelations.push(newRelation);
      }
    }
    
    this.saveMemory();
    logger.info(`Created/updated ${createdRelations.length} relations`);
    
    return createdRelations;
  }

  searchEntities(query) {
    if (!query) {
      return [];
    }
    
    const lowerQuery = query.toLowerCase();
    logger.debug(`Searching entities for: ${query}`);
    
    return this.memory.entities.filter(entity => {
      // Match entity name or type
      if (entity.name.toLowerCase().includes(lowerQuery) || 
          entity.entityType.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Match entity observations
      for (const observation of entity.observations || []) {
        if (typeof observation === 'string' && observation.toLowerCase().includes(lowerQuery)) {
          return true;
        }
      }
      
      return false;
    });
  }

  deleteEntities(entityNames) {
    if (!entityNames || !Array.isArray(entityNames)) {
      throw new Error('Invalid entityNames format');
    }
    
    const deletedEntities = [];
    
    // Remove entities
    for (const entityName of entityNames) {
      const entityIndex = this.memory.entities.findIndex(e => e.name === entityName);
      
      if (entityIndex !== -1) {
        deletedEntities.push(this.memory.entities[entityIndex]);
      }
    }
    
    // Filter out deleted entities
    this.memory.entities = this.memory.entities.filter(e => !entityNames.includes(e.name));
    
    // Remove relations with deleted entities
    this.memory.relations = this.memory.relations.filter(
      r => !entityNames.includes(r.from) && !entityNames.includes(r.to)
    );
    
    this.saveMemory();
    logger.info(`Deleted ${deletedEntities.length} entities`);
    
    return deletedEntities.length;
  }

  deleteRelations(relations) {
    if (!relations || !Array.isArray(relations)) {
      throw new Error('Invalid relations format');
    }
    
    const originalLength = this.memory.relations.length;
    
    // Filter out relations to be deleted
    this.memory.relations = this.memory.relations.filter(r => {
      for (const relation of relations) {
        if (r.from === relation.from && 
            r.to === relation.to && 
            r.relationType === relation.relationType) {
          return false;
        }
      }
      return true;
    });
    
    const deletedCount = originalLength - this.memory.relations.length;
    
    this.saveMemory();
    logger.info(`Deleted ${deletedCount} relations`);
    
    return deletedCount;
  }

  addObservations(observations) {
    if (!observations || !Array.isArray(observations)) {
      throw new Error('Invalid observations format');
    }
    
    const updatedEntities = [];
    
    for (const observation of observations) {
      const { entityName, contents } = observation;
      
      if (!entityName || !contents || !Array.isArray(contents)) {
        continue;
      }
      
      const entityIndex = this.memory.entities.findIndex(e => e.name === entityName);
      
      if (entityIndex !== -1) {
        // Add new observations
        this.memory.entities[entityIndex].observations = [
          ...(this.memory.entities[entityIndex].observations || []),
          ...contents
        ];
        this.memory.entities[entityIndex].updatedAt = new Date().toISOString();
        updatedEntities.push(this.memory.entities[entityIndex]);
      }
    }
    
    this.saveMemory();
    logger.info(`Added observations to ${updatedEntities.length} entities`);
    
    return updatedEntities;
  }

  deleteObservations(deletions) {
    if (!deletions || !Array.isArray(deletions)) {
      throw new Error('Invalid deletions format');
    }
    
    const updatedEntities = [];
    
    for (const deletion of deletions) {
      const { entityName, observations } = deletion;
      
      if (!entityName || !observations || !Array.isArray(observations)) {
        continue;
      }
      
      const entityIndex = this.memory.entities.findIndex(e => e.name === entityName);
      
      if (entityIndex !== -1 && this.memory.entities[entityIndex].observations) {
        // Remove observations
        this.memory.entities[entityIndex].observations = 
          this.memory.entities[entityIndex].observations.filter(
            obs => !observations.includes(obs)
          );
        this.memory.entities[entityIndex].updatedAt = new Date().toISOString();
        updatedEntities.push(this.memory.entities[entityIndex]);
      }
    }
    
    this.saveMemory();
    logger.info(`Removed observations from ${updatedEntities.length} entities`);
    
    return updatedEntities;
  }
}

module.exports = MemoryStore;