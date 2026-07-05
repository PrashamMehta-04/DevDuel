import { Worker, Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import Docker from 'dockerode';
import dotenv from 'dotenv';
import type { SubmissionResultPayload, TestResult, SubmissionPayload } from '@devduel/shared';
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
        print("@@RESULT@@" + json.dumps(result, separators=(',', ':')))
    except Exception as e:
        print("@@RESULT@@Error:", str(e))
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
        console.log("@@RESULT@@" + JSON.stringify(result));
    } catch (e) {
        console.log("@@RESULT@@Error:", e.message);
    }
}
`;
      return ['sh', '-c', `echo $WRAPPER_B64 | base64 -d | node`];
    },
  },
  cpp: {
    image: 'gcc:12',
    getCmd: (code, inputs) => {
      return ['sh', '-c', `echo $WRAPPER_B64 | base64 -d > source.cpp && g++ source.cpp && ./a.out`];
    },
  },
  java: {
    image: 'eclipse-temurin:17-jdk',
    getCmd: (code, inputs) => {
      return ['sh', '-c', `echo $WRAPPER_B64 | base64 -d > Solution.java && echo $MAIN_B64 | base64 -d > Main.java && javac Solution.java Main.java && java Main`];
    },
  },
};

function inferType(val: any): string {
  if (typeof val === 'number') return 'int';
  if (typeof val === 'boolean') return 'bool';
  if (typeof val === 'string') return 'string';
  if (Array.isArray(val)) {
    if (val.length === 0) return 'vector<int>'; // Default fallback for empty arrays
    const innerType = inferType(val[0]);
    return `vector<${innerType}>`;
  }
  return 'string';
}

function inferSignature(testCases: any[]): { args: string[], ret: string } {
  if (!testCases || testCases.length === 0) return { args: ['vector<int>', 'int'], ret: 'vector<int>' };
  try {
    const firstInput = JSON.parse(testCases[0].input);
    const firstExpected = JSON.parse(testCases[0].expected);
    const args = Array.isArray(firstInput) ? firstInput.map((arg: any) => inferType(arg)) : [inferType(firstInput)];
    const ret = inferType(firstExpected);
    return { args, ret };
  } catch (e) {
    return { args: ['vector<int>', 'int'], ret: 'vector<int>' }; // fallback
  }
}

function toCppVal(val: any, type: string): string {
  if (type === 'int') return val.toString();
  if (type === 'bool') return val ? 'true' : 'false';
  if (type === 'string') return `"${val}"`;
  if (type.startsWith('vector<')) {
    const innerType = type.slice(7, -1);
    const innerTypeCpp = innerType.replace(/vector/g, 'std::vector').replace(/string/g, 'std::string');
    return `std::vector<${innerTypeCpp}>{${val.map((v: any) => toCppVal(v, innerType)).join(',')}}`;
  }
  return '';
}

function cppPrint(varName: string, type: string): string {
  return `std::cout << "@@RESULT@@" << to_json(${varName}) << std::endl;`;
}

function javaType(type: string): string {
  if (type === 'int') return 'int';
  if (type === 'bool') return 'boolean';
  if (type === 'string') return 'String';
  if (type.startsWith('vector<')) {
    const innerType = type.slice(7, -1);
    return javaType(innerType) + '[]';
  }
  return type;
}

function toJavaVal(val: any, type: string): string {
  if (type === 'int') return val.toString();
  if (type === 'bool') return val ? 'true' : 'false';
  if (type === 'string') return `"${val}"`;
  if (type.startsWith('vector<')) {
    const innerType = type.slice(7, -1);
    const jType = javaType(type);
    return `new ${jType}{${val.map((v: any) => toJavaVal(v, innerType)).join(',')}}`;
  }
  return '';
}

function javaPrint(varName: string, type: string): string {
  return `System.out.println("@@RESULT@@" + toJson(${varName}));`;
}

const worker = new Worker(
  'code-execution',
  async (job: Job<SubmissionPayload>) => {
    const { matchId, userId, code, language, type, testCases, problemId, timeLimit, memoryLimit } = job.data;
    console.log(`\n[Worker] 🛠️  Processing ${type.toUpperCase()} for User: ${userId}`);

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
      let wrapperCode = code;
      let mainCode = '';
      const sig = inferSignature(activeTests);
      
      if (language === 'python') {
         wrapperCode = `import json\nimport sys\n${code}\n\ninputs = json.loads('''${JSON.stringify(inputs)}''')\nfor inp in inputs:\n    try:\n        args = json.loads(inp)\n        result = solution(*args)\n        print("@@RESULT@@" + json.dumps(result, separators=(',', ':')))\n    except Exception as e:\n        print("@@RESULT@@Error:", str(e))`;
      } else if (language === 'javascript') {
         wrapperCode = `${code}\n\nconst inputs = JSON.parse(\`${JSON.stringify(inputs).replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`);\nfor (const inp of inputs) {\n    try {\n        const args = JSON.parse(inp);\n        const result = solution(...args);\n        console.log("@@RESULT@@" + JSON.stringify(result));\n    } catch (e) {\n        console.log("@@RESULT@@Error:", e.message);\n    }\n}`;
      } else if (language === 'cpp') {
         let mainBody = '\n#include <iostream>\n#include <vector>\n#include <string>\n';
         mainBody += 'std::string to_json(int v) { return std::to_string(v); }\n';
         mainBody += 'std::string to_json(bool v) { return v ? "true" : "false"; }\n';
         mainBody += 'std::string to_json(const std::string& v) { return "\\"" + v + "\\""; }\n';
         mainBody += 'template<typename T> std::string to_json(const std::vector<T>& v) {\n';
         mainBody += '  std::string res = "[";\n  for(size_t i=0; i<v.size(); i++) { res += to_json(v[i]); if(i<v.size()-1) res += ","; }\n  return res + "]";\n}\n';
         mainBody += 'int main() {\n';
         for (let i = 0; i < inputs.length; i++) {
           const args = JSON.parse(inputs[i]);
           mainBody += `    try {\n`;
           const argNames = [];
           for (let j = 0; j < args.length; j++) {
             const cppType = sig.args[j].replace(/vector/g, 'std::vector').replace(/string/g, 'std::string');
             mainBody += `        ${cppType} arg${j} = ${toCppVal(args[j], sig.args[j])};\n`;
             argNames.push(`arg${j}`);
           }
           mainBody += `        auto res = solution(${argNames.join(', ')});\n        ${cppPrint('res', sig.ret)}\n    } catch(...) { std::cout << "@@RESULT@@Error" << std::endl; }\n`;
         }
         mainBody += '    return 0;\n}\n';
         wrapperCode = code + mainBody;
      } else if (language === 'java') {
         mainCode = `class Main {\n`;
         mainCode += `    static String toJson(int v) { return String.valueOf(v); }\n`;
         mainCode += `    static String toJson(boolean v) { return v ? "true" : "false"; }\n`;
         mainCode += `    static String toJson(String v) { return "\\"" + v + "\\""; }\n`;
         mainCode += `    static String toJson(int[] v) { StringBuilder sb = new StringBuilder("["); for(int i=0; i<v.length; i++) { sb.append(toJson(v[i])); if(i<v.length-1) sb.append(","); } return sb.append("]").toString(); }\n`;
         mainCode += `    static String toJson(String[] v) { StringBuilder sb = new StringBuilder("["); for(int i=0; i<v.length; i++) { sb.append(toJson(v[i])); if(i<v.length-1) sb.append(","); } return sb.append("]").toString(); }\n`;
         mainCode += `    static String toJson(Object[] v) { StringBuilder sb = new StringBuilder("["); for(int i=0; i<v.length; i++) { if(v[i] instanceof int[]) sb.append(toJson((int[])v[i])); else if(v[i] instanceof String[]) sb.append(toJson((String[])v[i])); else if(v[i] instanceof Object[]) sb.append(toJson((Object[])v[i])); if(i<v.length-1) sb.append(","); } return sb.append("]").toString(); }\n`;
         mainCode += `    public static void main(String[] args) {\n        Solution sol = new Solution();\n`;
         for (let i = 0; i < inputs.length; i++) {
           const args = JSON.parse(inputs[i]);
           const javaArgs = args.map((a: any, idx: number) => toJavaVal(a, sig.args[idx])).join(', ');
           mainCode += `        try { ${javaType(sig.ret)} res = sol.solution(${javaArgs}); ${javaPrint('res', sig.ret)} } catch(Exception e) { System.out.println("@@RESULT@@Error: " + e.getMessage()); }\n`;
         }
         mainCode += '    }\n}\n';
      }
      
      const wrapperBase64 = Buffer.from(wrapperCode).toString('base64');
      const base64Code = Buffer.from(code).toString('base64');
      const mainBase64 = Buffer.from(mainCode).toString('base64');
      
      const cmd = config.getCmd(code, inputs);

      const memLimitMB = memoryLimit || 128;
      
      container = await docker.createContainer({
        Image: config.image,
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true,
        Env: [`CODE_B64=${base64Code}`, `WRAPPER_B64=${wrapperBase64}`, `MAIN_B64=${mainBase64}`],
        HostConfig: {
          Memory: memLimitMB * 1024 * 1024,
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
      const limit = timeLimit || 5000;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Time Limit Exceeded (${limit/1000}s)`)), limit)
      );
      
      await Promise.race([waitPromise, timeoutPromise]);
      
      // Docker output streams have headers (8 bytes) per chunk. We strip them roughly by parsing lines and filtering out garbage if needed.
      // A more robust way is using docker-modem stream parsing, but for now we'll do simple text cleanup.
      const cleanOutput = output.replace(/[\u0000-\u001F\u007F-\u009F]/g, "\n").split("\n").filter(l => l.trim() !== "");
      
      console.log(`[Worker] ✅ Execution finished. Raw Output Lines: ${cleanOutput.length}`);
      console.log(`[Worker] 📝 Output snippet:`, cleanOutput.slice(0, 10));

      const resultLines = cleanOutput.filter(l => l.includes('@@RESULT@@'));
      const hasExecutionError = resultLines.length === 0 && cleanOutput.length > 0;
      const rawErrorOutput = hasExecutionError ? cleanOutput.slice(0, 10).join('\n') : '';

      for (let i = 0; i < activeTests.length; i++) {
        const test = activeTests[i];
        const actualOut = resultLines[i] ? resultLines[i].substring(resultLines[i].indexOf('@@RESULT@@') + 10).trim() : '';
        
        let passed = false;
        try {
          const parsedActual = JSON.parse(actualOut);
          const parsedExpected = JSON.parse(test.expected);
          
          if (problemId === 'two-sum' && Array.isArray(parsedActual) && Array.isArray(parsedExpected)) {
            passed = JSON.stringify([...parsedActual].sort()) === JSON.stringify([...parsedExpected].sort());
          } else {
            passed = JSON.stringify(parsedActual) === JSON.stringify(parsedExpected);
          }
        } catch (e) {
          passed = actualOut === test.expected.trim();
        }
        
        if (passed) passedCount++;

        let errorMsg = undefined;
        if (!passed) {
          if (hasExecutionError) {
             errorMsg = 'Compiler/Runtime Error:\n' + rawErrorOutput;
          } else if (actualOut.toLowerCase().includes('error')) {
             errorMsg = actualOut;
          } else {
             errorMsg = 'Wrong Answer';
          }
        }

        testResults.push({
          testCaseId: test.id,
          passed,
          output: test.isHidden ? '[Hidden]' : actualOut,
          error: errorMsg,
          expected: test.expected,
          executionTime: 0,
          isHidden: test.isHidden,
          input: test.isHidden ? undefined : test.input
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
           isHidden: test.isHidden,
           input: test.isHidden ? undefined : test.input
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
