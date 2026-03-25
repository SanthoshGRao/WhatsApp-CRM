const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Usage: node add_admin.js <email> <password> [name]");
    process.exit(1);
  }

  const [email, password, name = "Admin"] = args;

  try {
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      console.log(`❌ Admin with email ${email} already exists.`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
        data: {
            email,
            password: hashedPassword,
            name,
        }
    });
    console.log(`✅ Success! Admin created: ${admin.email}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
