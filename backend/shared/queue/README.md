# MukkabootAI Queue System

Job queue system for MukkabootAI using BullMQ and Redis.

## Features

- Persistent job storage with Redis
- Delayed job execution
- Job prioritization
- Auto-retry with exponential backoff
- Job progress tracking
- Concurrency control
- Dead letter queueing

## Prerequisites

- Redis server (version 5.0+)

## Installation

```bash
cd /path/to/your/service
npm install ../../shared/queue
```

## Basic Usage

### Adding Jobs to a Queue

```javascript
const { createQueue } = require('@mukkaboot/queue');

// Create a queue
const emailQueue = createQueue('email-notifications');

// Add a job to the queue
await emailQueue.add('welcome-email', {
  userId: 'user123',
  email: 'user@example.com',
  template: 'welcome'
});

// Add a high priority job
await emailQueue.add('password-reset', {
  userId: 'user456',
  email: 'another@example.com',
  template: 'reset-password'
}, { 
  priority: 1,
  attempts: 5
});

// Add a delayed job (send in 1 hour)
await emailQueue.add('reminder', {
  userId: 'user789',
  email: 'third@example.com',
  template: 'reminder'
}, { 
  delay: 60 * 60 * 1000 
});
```

### Processing Jobs with a Worker

```javascript
const { createWorker } = require('@mukkaboot/queue');
const { createServiceLogger } = require('@mukkaboot/logger');

const logger = createServiceLogger('email-worker');

// Create a worker to process jobs
const worker = createWorker(
  'email-notifications',
  async (job) => {
    // Process the job
    logger.info(`Processing ${job.name} job`, { id: job.id });
    
    // Update progress
    await job.updateProgress(50);
    
    // Send the email
    await sendEmail(job.data.email, job.data.template, job.data);
    
    // Return a result
    return { sent: true, timestamp: new Date() };
  },
  { 
    concurrency: 5,
    logger
  }
);
```

### Handling Queue Events

```javascript
const { createQueueEvents } = require('@mukkaboot/queue');

const events = createQueueEvents('email-notifications');

events.on('completed', ({ jobId, returnvalue }) => {
  console.log(`Job ${jobId} completed with result:`, returnvalue);
});

events.on('failed', ({ jobId, failedReason }) => {
  console.error(`Job ${jobId} failed with reason:`, failedReason);
});

events.on('progress', ({ jobId, data }) => {
  console.log(`Job ${jobId} reported progress:`, data);
});
```

### Using Queues in Express Routes

```javascript
const express = require('express');
const { createQueue } = require('@mukkaboot/queue');

const app = express();
const fileProcessingQueue = createQueue('file-processing');

app.post('/process-file', async (req, res) => {
  try {
    // Add job to the queue instead of processing immediately
    const job = await fileProcessingQueue.add('convert', {
      fileId: req.body.fileId,
      format: req.body.format,
      userId: req.user.id
    });
    
    // Return the job ID for status tracking
    res.json({ 
      success: true, 
      message: 'File conversion started', 
      jobId: job.id 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to queue conversion' 
    });
  }
});

// Route to check job status
app.get('/job-status/:jobId', async (req, res) => {
  try {
    const job = await fileProcessingQueue.getJob(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found' 
      });
    }
    
    const state = await job.getState();
    const progress = job._progress;
    
    res.json({
      jobId: job.id,
      state,
      progress,
      data: job.data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch job status' 
    });
  }
});
```

## Advanced Configuration

### Redis Connection Options

```javascript
const { createQueue } = require('@mukkaboot/queue');

const queue = createQueue('important-tasks', {}, {
  host: 'redis.example.com',
  port: 6380,
  password: 'securepassword',
  db: 2,
  prefix: 'myapp'
});
```

### Graceful Shutdown

```javascript
const { shutdown } = require('@mukkaboot/queue');

// In your application shutdown handler
process.on('SIGTERM', async () => {
  console.log('Shutting down queue system...');
  await shutdown();
  console.log('Queue system shut down');
  process.exit(0);
});
```

## Integration with OpenTelemetry

This queue module works with the MukkabootAI Telemetry package for distributed tracing of job processing.
