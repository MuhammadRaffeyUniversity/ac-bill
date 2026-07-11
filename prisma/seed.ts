import { hash } from "bcryptjs";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, UserRole } from "../src/generated/prisma/client";
import { env } from "../src/lib/env";
import {
  initialCommissionRules,
  initialTeamRoster,
} from "../src/lib/team-setup/initial-roster";

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

  for (const teamSeed of initialTeamRoster) {
    const teamData = {
      name: teamSeed.name,
      region: teamSeed.region,
      serviceAreaTags: [...teamSeed.serviceAreaTags],
      compensationType: teamSeed.compensationType,
      active: true,
      defaultMembers: [...teamSeed.members],
    };
    const team = await prisma.team.upsert({
      where: { name: teamSeed.name },
      update: teamData,
      create: teamData,
    });

    for (const memberName of teamSeed.members) {
      await prisma.teamMember.upsert({
        where: { teamId_name: { teamId: team.id, name: memberName } },
        update: { active: true },
        create: { name: memberName, teamId: team.id, active: true },
      });
    }
  }

  for (const ruleSeed of initialCommissionRules) {
    const ruleData = {
      compensationType: ruleSeed.compensationType,
      teamRate: ruleSeed.teamRate.toString(),
      partnerRate: ruleSeed.partnerRate.toString(),
      companyRate: ruleSeed.companyRate.toString(),
      effectiveTo: null,
    };

    await prisma.commissionRule.upsert({
      where: { seedKey: ruleSeed.seedKey },
      update: ruleData,
      create: { ...ruleData, seedKey: ruleSeed.seedKey },
    });
  }

  console.log("Seeded the initial team roster and commission rules.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
