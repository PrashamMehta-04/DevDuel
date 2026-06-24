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

const RUNTIME_CONFIG: Record<string, { image: string; getCmd: (code: string, inputs: string[]) => string[] }> = {
  python: {
    image: 'python:3.10-slim',
    getCmd: (code, inputs) => {
      const wrapper = `
import json
import sys
${code}

inputs = json.loads('''${JSON.stringify(inputs)}''')
for inp in inputs:
    try:
        args = json.loads(inp)
        result = solution(*args)
        print(json.dumps(result, separators=(',', ':')))
    except Exception as e:
        print("Error:", str(e))
`;
      return ['sh', '-c', `echo $WRAPPER_B64 | base64 -d | python`];
    },
  },
  javascript: {
    image: 'node:18-slim',
    getCmd: (code, inputs) => {
      const wrapper = `
${code}

const inputs = JSON.parse(\`${JSON.stringify(inputs).replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`);
for (const inp of inputs) {
    try {
        const args = JSON.parse(inp);
        const result = solution(...args);
        console.log(JSON.stringify(result));
    } catch (e) {
        console.log("Error:", e.message);
    }
}
`;
      return ['sh', '-c', `echo $WRAPPER_B64 | base64 -d | node`];
    },
  },
  cpp: {
    image: 'gcc:12',
    getCmd: (code, inputs) => {
      // For C++, we just run the code once per test case via a bash script
      const testCasesArray = inputs.map(i => `'${i.replace(/'/g, "'\\''")}'`).join(' ');
      return ['sh', '-c', `echo $CODE_B64 | base64 -d > source.cpp && g++ source.cpp && for inp in ${testCasesArray}; do ./a.out "$inp"; done`];
    },
  },
  java: {
    image: 'eclipse-temurin:17-jdk',
    getCmd: (code, inputs) => {
      const testCasesArray = inputs.map(i => `'${i.replace(/'/g, "'\\''")}'`).join(' ');
      return ['sh', '-c', `echo $CODE_B64 | base64 -d > Solution.java && javac Solution.java && for inp in ${testCasesArray}; do java Solution "$inp"; done`];
    },
  },
};

const worker = new Worker(
  'code-execution',
  async (job: Job<SubmissionPayload>) => {
    const { matchId, userId, code, language, type, testCases } = job.data;
    console.log(`\\n[Worker] 🛠️  Processing ${type.toUpperCase()} for User: ${userId}`);

    const config = RUNTIME_CONFIG[language];
    if (!config) throw new Error(`Language ${language} not supported.`);

    const tests = testCases || [];
    const activeTests = tests.filter(t => type === 'submit' || !t.isHidden);
    const testResults: TestResult[] = [];
    let passedCount = 0;

    let container: Docker.Container | null = null;

    try {
      console.log(`[Worker] 📦 Creating container: ${config.image}`);
      
      const inputs = activeTests.map(t => t.input);
      
      // Generate wrapper based on language
      let wrapperCode = code;
      if (language === 'python') {
         wrapperCode = `import json\\nimport sys\\n${code}\\n\\ninputs = json.loads('''${JSON.stringify(inputs)}''')\\nfor inp in inputs:\\n    try:\\n        args = json.loads(inp)\\n        result = solution(*args)\\n        print(json.dumps(result, separators=(',', ':')))\\n    except Exception as e:\\n        print("Error:", str(e))`;
      } else if (language === 'javascript') {
         wrapperCode = `${code}\\n\\nconst inputs = JSON.parse(\`${JSON.stringify(inputs).replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`);\\nfor (const inp of inputs) {\\n    try {\\n        const args = JSON.parse(inp);\\n        const result = solution(...args);\\n        console.log(JSON.stringify(result));\\n    } catch (e) {\\n        console.log("Error:", e.message);\\n    }\\n}`;
      }
      
      const wrapperBase64 = Buffer.from(wrapperCode).toString('base64');
      const base64Code = Buffer.from(code).toString('base64');
      
      const cmd = config.getCmd(code, inputs);

      container = await docker.createContainer({
        Image: config.image,
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true,
        Env: [`CODE_B64=${base64Code}`, `WRAPPER_B64=${wrapperBase64}`],
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

      let output = '';
      stream.on('data', (chunk) => {
        output += chunk.toString();
      });

      const waitPromise = container.wait();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Time Limit Exceeded (5s)')), 5000)
      );
      
      await Promise.race([waitPromise, timeoutPromise]);
      
      // Docker output streams have headers (8 bytes) per chunk. We strip them roughly by parsing lines and filtering out garbage if needed.
      // A more robust way is using docker-modem stream parsing, but for now we'll do simple text cleanup.
      const cleanOutput = output.replace(/[\\u0000-\\u001F\\u007F-\\u009F]/g, "\\n").split("\\n").filter(l => l.trim() !== "");
      
      console.log(`[Worker] ✅ Execution finished. Raw Output Lines: ${cleanOutput.length}`);

      for (let i = 0; i < activeTests.length; i++) {
        const test = activeTests[i];
        const actualOut = cleanOutput[i] ? cleanOutput[i].trim() : '';
        const passed = actualOut === test.expected.trim();
        if (passed) passedCount++;

        testResults.push({
          testCaseId: test.id,
          passed,
          output: test.isHidden ? '[Hidden]' : actualOut,
          error: passed ? undefined : (actualOut.toLowerCase().includes('error') ? actualOut : 'Wrong Answer'),
          expected: test.expected,
          executionTime: 0,
          isHidden: test.isHidden
        });
      }

    } catch (err: any) {
      console.error(`[Worker] ❌ Error: ${err.message}`);
      // Mark all tests as failed
      for (const test of activeTests) {
         testResults.push({
           testCaseId: test.id,
           passed: false,
           error: err.message,
           output: '',
           expected: test.expected,
           executionTime: 0,
           isHidden: test.isHidden
         });
      }
    } finally {
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
