const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const regs = await prisma.registration.findMany({ orderBy: { createdAt: 'desc' }, take: 1 });
  console.log(JSON.stringify(regs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
