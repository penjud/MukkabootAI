'use strict';

const { Queue, Worker, QueueEvents, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');

// Default Redis connection
let redisClient = null;

/**
 * Initialize a Redis connection for BullMQ
 * @param {Object} options - Redis connection options
 * @returns {IORedis} Redis client instance
 */
function initializeRedis(options = {}) {
  const {
    host = process.env.REDIS_HOST || 'localhost',
    port = process.env.REDIS_PORT || 6379,
    password = process.env.REDIS_PASSWORD,
    db = process.env.REDIS_DB || 0,
    prefix = process.env.REDIS_PREFIX || 'mukkaboot',
  } = options;

  if (!redisClient) {
    redisClient = new IORedis({
      host,
      port,
      password: password || undefined,
      db,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      keyPrefix: `${prefix}:`
    });
  }

  return redisClient;
}

/**
 * Create a job queue
 * @param {string} name - Queue name
 * @param {Object} options - Queue options
 * @param {Object} redisOptions - Redis connection options
 * @returns {Queue} BullMQ Queue instance
 */
function createQueue(name, options = {}, redisOptions = {}) {
  const connection = initializeRedis(redisOptions);
  
  const queue = new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep successful jobs for 24 hours
        count: 100      // Keep last 100 successful jobs
      },
      removeOnFail: {
        age: 7 * 24 * 3600 // Keep failed jobs for 7 days
      },
      ...options.defaultJobOptions
    },
    ...options
  });

  // Create a scheduler to handle delayed jobs
  const scheduler = new QueueScheduler(name, {
    connection,
    ...options.schedulerOptions
  });

  return queue;
}

/**
 * Create a worker to process jobs from a queue
 * @param {string} queueName - Queue name
 * @param {Function} processor - Job processor function
 * @param {Object} options - Worker options
 * @param {Object} redisOptions - Redis connection options
 * @returns {Worker} BullMQ Worker instance
 */
function createWorker(queueName, processor, options = {}, redisOptions = {}) {
  const connection = initializeRedis(redisOptions);
  
  const worker = new Worker(queueName, processor, {
    connection,
    concurrency: options.concurrency || 1,
    limiter: options.limiter,
    stalledInterval: 30000,
    maxStalledCount: 3,
    ...options
  });

  // Handle worker events
  worker.on('completed', (job) => {
    if (options.logger) {
      options.logger.info(`Job ${job.id} completed in queue ${queueName}`, { 
        jobId: job.id,
        queue: queueName,
        data: job.data 
      });
    }
  });

  worker.on('failed', (job, error) => {
    if (options.logger) {
      options.logger.error(`Job ${job?.id} failed in queue ${queueName}`, { 
        jobId: job?.id,
        queue: queueName,
        data: job?.data,
        error: error.message,
        stack: error.stack
      });
    }
  });

  worker.on('error', (error) => {
    if (options.logger) {
      options.logger.error(`Worker error in queue ${queueName}`, { 
        queue: queueName,
        error: error.message,
        stack: error.stack
      });
    }
  });

  return worker;
}

/**
 * Create queue events listener
 * @param {string} queueName - Queue name
 * @param {Object} options - Options
 * @param {Object} redisOptions - Redis connection options
 * @returns {QueueEvents} BullMQ QueueEvents instance
 */
function createQueueEvents(queueName, options = {}, redisOptions = {}) {
  const connection = initializeRedis(redisOptions);
  return new QueueEvents(queueName, { connection, ...options });
}

/**
 * Gracefully shutdown all workers and connections
 */
async function shutdown() {
  // Close Redis connection
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

module.exports = {
  createQueue,
  createWorker,
  createQueueEvents,
  initializeRedis,
  shutdown
};
