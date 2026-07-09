import { hash } from "bcryptjs";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, UserRole } from "../src/generated/prisma/client";
import { env } from "../src/lib/env";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME ?? "Ali";
  const dataEntryEmail = process.env.SEED_DATA_ENTRY_EMAIL?.toLowerCase();
  const dataEntryPassword = process.env.SEED_DATA_ENTRY_PASSWORD;
  const dataEntryName = process.env.SEED_DATA_ENTRY_NAME ?? "Data Entry";

  if (adminEmail && adminPassword) {
    const passwordHash = await hash(adminPassword, 12);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        name: adminName,
        role: UserRole.ADMIN,
        active: true,
        passwordHash,
      },
      create: {
        name: adminName,
        email: adminEmail,
        role: UserRole.ADMIN,
        active: true,
        passwordHash,
      },
    });

    console.log(`Seeded admin user ${adminEmail}.`);
  } else {
    console.log("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to seed an initial admin user.");
  }

  if (dataEntryEmail && dataEntryPassword) {
    const passwordHash = await hash(dataEntryPassword, 12);

    await prisma.user.upsert({
      where: { email: dataEntryEmail },
      update: {
        name: dataEntryName,
        role: UserRole.DATA_ENTRY,
        active: true,
        passwordHash,
      },
      create: {
        name: dataEntryName,
        email: dataEntryEmail,
        role: UserRole.DATA_ENTRY,
        active: true,
        passwordHash,
      },
    });

    console.log(`Seeded data-entry user ${dataEntryEmail}.`);
  } else {
    console.log(
      "Set SEED_DATA_ENTRY_EMAIL and SEED_DATA_ENTRY_PASSWORD to seed a data-entry user.",
    );
  }

  console.log("Team seed data awaits confirmed 6 active team names.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
