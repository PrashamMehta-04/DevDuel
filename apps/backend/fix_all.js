import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.match.updateMany({
    where: { 
      winnerId: null,
      status: 'COMPLETED'
    },
    data: { winnerId: 'Bot_CodeMaster_Fix' }
  });
  console.log('Updated matches', result);
}
main().catch(console.error).finally(() => prisma.$disconnect());
