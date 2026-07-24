import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function update() {
  const problems = [
    {
      id: 'two-sum',
      defaultCode: {
        python: 'def solution(nums, target):\n    # Write your code here\n    pass',
        javascript: 'function solution(nums, target) {\n    // Write your code here\n    \n}',
        cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> solution(vector<int>& nums, int target) {\n        // Write your code here\n        \n    }\n};',
        java: 'import java.util.*;\nclass Solution {\n    public int[] solution(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}'
      }
    },
    {
      id: 'reverse-string',
      defaultCode: {
        python: 'def solution(s):\n    # Write your code here\n    pass',
        javascript: 'function solution(s) {\n    // Write your code here\n    \n}',
        cpp: '#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    vector<string> solution(vector<string>& s) {\n        // Write your code here\n        \n    }\n};',
        java: 'import java.util.*;\nclass Solution {\n    public String[] solution(String[] s) {\n        // Write your code here\n        return new String[]{};\n    }\n}'
      }
    },
    {
      id: 'valid-palindrome',
      defaultCode: {
        python: 'def solution(s):\n    # Write your code here\n    pass',
        javascript: 'function solution(s) {\n    // Write your code here\n    \n}',
        cpp: '#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    bool solution(string s) {\n        // Write your code here\n        \n    }\n};',
        java: 'class Solution {\n    public boolean solution(String s) {\n        // Write your code here\n        return false;\n    }\n}'
      }
    },
    {
      id: 'contains-duplicate',
      defaultCode: {
        python: 'def solution(nums):\n    # Write your code here\n    pass',
        javascript: 'function solution(nums) {\n    // Write your code here\n    \n}',
        cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool solution(vector<int>& nums) {\n        // Write your code here\n        \n    }\n};',
        java: 'import java.util.*;\nclass Solution {\n    public boolean solution(int[] nums) {\n        // Write your code here\n        return false;\n    }\n}'
      }
    },
    {
      id: 'fizz-buzz',
      defaultCode: {
        python: 'def solution(n):\n    # Write your code here\n    pass',
        javascript: 'function solution(n) {\n    // Write your code here\n    \n}',
        cpp: '#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    vector<string> solution(int n) {\n        // Write your code here\n        \n    }\n};',
        java: 'import java.util.*;\nclass Solution {\n    public String[] solution(int n) {\n        // Write your code here\n        return new String[]{};\n    }\n}'
      }
    },
    {
      id: 'valid-parentheses',
      defaultCode: {
        python: 'def solution(s):\n    # Write your code here\n    pass',
        javascript: 'function solution(s) {\n    // Write your code here\n    \n}',
        cpp: '#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    bool solution(string s) {\n        // Write your code here\n        \n    }\n};',
        java: 'class Solution {\n    public boolean solution(String s) {\n        // Write your code here\n        return false;\n    }\n}'
      }
    },
    {
      id: 'missing-number',
      defaultCode: {
        python: 'def solution(nums):\n    # Write your code here\n    pass',
        javascript: 'function solution(nums) {\n    // Write your code here\n    \n}',
        cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int solution(vector<int>& nums) {\n        // Write your code here\n        \n    }\n};',
        java: 'import java.util.*;\nclass Solution {\n    public int solution(int[] nums) {\n        // Write your code here\n        return 0;\n    }\n}'
      }
    }
  ];

  for (const p of problems) {
    await prisma.problem.updateMany({
      where: { id: p.id },
      data: { defaultCode: p.defaultCode }
    });
  }
  console.log('Updated defaultCode values for existing seeded problems');
}
update().catch(console.error).finally(() => prisma.$disconnect());
