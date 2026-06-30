import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.match.updateMany({
    where: { 
      winnerId: null, 
      id: "match-bot-1782827571450" // Only update the known bad one for safety
    },
    data: { winnerId: 'Bot_CodeMaster_Fix' }
  });
  console.log('Updated matches', result);
}
main().catch(console.error).finally(() => prisma.$disconnect());
