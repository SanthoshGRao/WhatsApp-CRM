const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.whatsAppConfig.findMany();
  console.log("Configs:", configs);

  const logs = await prisma.messageLog.findMany();
  console.log("Logs:", logs);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
