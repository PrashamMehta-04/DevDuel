import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const matches = await prisma.match.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { players: true }
  });
  console.log(JSON.stringify(matches, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
