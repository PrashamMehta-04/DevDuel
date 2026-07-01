import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function update() {
  const problems = [
    {
      id: 'two-sum',
      constraints: '- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9\n- -10^9 <= target <= 10^9\n- Only one valid answer exists.'
    },
    {
      id: 'reverse-string',
      constraints: '- 1 <= s.length <= 10^5\n- s[i] is a printable ascii character.'
    },
    {
      id: 'valid-palindrome',
      constraints: '- 1 <= s.length <= 2 * 10^5\n- s consists only of printable ASCII characters.'
    },
    {
      id: 'contains-duplicate',
      constraints: '- 1 <= nums.length <= 10^5\n- -10^9 <= nums[i] <= 10^9'
    },
    {
      id: 'fizz-buzz',
      constraints: '- 1 <= n <= 10^4'
    },
    {
      id: 'valid-parentheses',
      constraints: '- 1 <= s.length <= 10^4\n- s consists of parentheses only \'()[]{}\'.'
    },
    {
      id: 'missing-number',
      constraints: '- n == nums.length\n- 1 <= n <= 10^4\n- 0 <= nums[i] <= n\n- All the numbers of nums are unique.'
    }
  ];

  for (const p of problems) {
    await prisma.problem.updateMany({
      where: { id: p.id },
      data: { constraints: p.constraints }
    });
  }
  console.log('Updated constraints');
}
update().catch(console.error).finally(() => prisma.$disconnect());
