import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  'code-execution',
  async (job) => {
    console.log(`Processing job ${job.id} for user ${job.data.userId}`);
    // Code execution logic will go here
    return { success: true, output: 'Compiled successfully' };
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed: ${err.message}`);
});

console.log('Worker started and listening for jobs...');
