import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || "santhosh@gmail.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "santhosh@123";

  const hashedPassword = await bcrypt.hash(password, 12);

  // Upsert super admin
  await prisma.admin.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: {
      email,
      password: hashedPassword,
      name: "Super Admin",
    },
  });
  console.log(`✅ Admin user seeded: ${email}`);

  // Seed default WhatsApp config
  const existingConfig = await prisma.whatsAppConfig.findFirst({
    where: { isActive: true },
  });

  if (!existingConfig) {
    await prisma.whatsAppConfig.create({
      data: {
        wabaId: process.env.META_WABA_ID || "",
        phoneNumberId: process.env.META_PHONE_NUMBER_ID || "",
        accessToken: process.env.META_ACCESS_TOKEN || "",
        appId: process.env.META_APP_ID || "",
        appSecret: process.env.META_APP_SECRET || "",
        verifyToken: process.env.META_VERIFY_TOKEN || "",
        graphBaseUrl: process.env.META_GRAPH_BASE_URL || "https://graph.facebook.com/v24.0",
        apiVersion: process.env.WHATSAPP_API_VERSION || "v24.0",
        templateName: "welcome_registration",
        isActive: true,
      },
    });
    console.log("✅ WhatsApp config seeded");
  } else {
    console.log("ℹ️  WhatsApp config already exists, skipping");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
