const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reg = await prisma.registration.findFirst({
    orderBy: { createdAt: 'desc' },
  });
  console.log("Latest Registration:", reg);
}

main().catch(console.error).finally(() => prisma.$disconnect());
