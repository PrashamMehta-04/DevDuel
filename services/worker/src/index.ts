import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import Docker from 'dockerode';
import dotenv from 'dotenv';
import { SubmissionResultPayload, TestResult, SubmissionPayload } from '@devduel/shared';
import { Readable } from 'stream';

dotenv.config();

const docker = new Docker();
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const RUNTIME_CONFIG: Record<string, { image: string; command: string[] }> = {
  python: {
    image: 'python:3.10-slim',
    command: ['sh', '-c', 'echo $CODE_B64 | base64 -d | python'],
  },
  javascript: {
    image: 'node:18-slim',
    command: ['sh', '-c', 'echo $CODE_B64 | base64 -d | node'],
  },
  cpp: {
    image: 'gcc:12',
    command: ['sh', '-c', 'echo $CODE_B64 | base64 -d > source.cpp && g++ source.cpp && ./a.out'],
  },
  java: {
    image: 'eclipse-temurin:17-jdk',
    command: ['sh', '-c', 'echo $CODE_B64 | base64 -d > Solution.java && javac Solution.java && java Solution'],
  },
};

const MOCK_TEST_CASES = [
  { id: 1, isHidden: false, input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]' },
  { id: 2, isHidden: false, input: 'nums = [3,2,4], target = 6', expected: '[1,2]' },
  { id: 3, isHidden: true, input: 'nums = [3,3], target = 6', expected: '[0,1]' },
];

const worker = new Worker(
  'code-execution',
  async (job: Job<SubmissionPayload>) => {
    const { matchId, userId, code, language, type } = job.data;
    console.log(`\n[Worker] 🛠️  Processing ${type.toUpperCase()} for User: ${userId}`);

    const config = RUNTIME_CONFIG[language];
    if (!config) throw new Error(`Language ${language} not supported.`);

    const activeTests = MOCK_TEST_CASES.filter(t => type === 'submit' || !t.isHidden);
    const testResults: TestResult[] = [];
    let passedCount = 0;

    let container: Docker.Container | null = null;

    try {
      console.log(`[Worker] 📦 Creating container: ${config.image}`);
      const base64Code = Buffer.from(code).toString('base64');
      
      container = await docker.createContainer({
        Image: config.image,
        Cmd: config.command,
        AttachStdout: true,
        AttachStderr: true,
        Env: [`CODE_B64=${base64Code}`],
        HostConfig: {
          Memory: 128 * 1024 * 1024,
          NetworkMode: 'none',
        },
      });

      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      });

      await container.start();

      // Collect output
      let output = '';
      stream.on('data', (chunk) => {
        output += chunk.toString();
      });

      // Wait for container to finish
      const waitPromise = container.wait();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Time Limit Exceeded (5s)')), 5000)
      );
      
      await Promise.race([waitPromise, timeoutPromise]);
      console.log(`[Worker] ✅ Execution finished. Raw Output: ${output.trim()}`);

      // In a real app, we would compare the output against test.expected
      const cleanOutput = output.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();

      for (const test of activeTests) {
        const passed = cleanOutput === test.expected.trim();
        if (passed) passedCount++;

        testResults.push({
          testCaseId: test.id,
          passed,
          output: test.isHidden ? '[Hidden]' : cleanOutput,
          error: passed ? undefined : (cleanOutput.toLowerCase().includes('error') ? 'Compilation/Runtime Error' : 'Wrong Answer'),
          expected: test.expected,
          executionTime: 0,
          isHidden: test.isHidden
        });
      }

    } catch (err: any) {
      console.error(`[Worker] ❌ Error: ${err.message}`);
      testResults.push({
        testCaseId: 0,
        passed: false,
        error: err.message,
        executionTime: 0,
        isHidden: false
      });
    } finally {
      // CRITICAL: Always forcefully kill and remove the container, even on timeout exceptions
      if (container) {
        try {
          await container.remove({ force: true });
        } catch (cleanupErr) {
          console.error(`[Worker] ⚠️ Failed to cleanup container:`, cleanupErr);
        }
      }
    }

    const finalResult: SubmissionResultPayload = {
      matchId,
      userId,
      type,
      success: passedCount === activeTests.length && activeTests.length > 0,
      results: testResults,
      overallProgress: activeTests.length > 0 ? (passedCount / activeTests.length) * 100 : 0,
    };

    console.log(`[Worker] 📤 Sending result back to backend. Success: ${finalResult.success}`);
    return finalResult;
  },
  { connection: redisConnection }
);

console.log('Worker is active (Piping mode enabled).');
