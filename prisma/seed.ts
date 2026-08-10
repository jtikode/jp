import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/auth";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const db = new PrismaClient({ adapter });

async function main() {
  const orgName = "J.P. Traders";
  const orgSlug = "jptraders";
  const adminUsername = "admin";
  const adminPassword = "changeme123";

  const org = await db.organization.upsert({
    where: { slug: orgSlug },
    update: {},
    create: { name: orgName, slug: orgSlug },
  });

  const existing = await db.user.findUnique({
    where: { orgId_username: { orgId: org.id, username: adminUsername } },
  });
  if (existing) {
    console.log(`Admin user "${adminUsername}" already exists, skipping.`);
    return;
  }

  await db.user.create({
    data: {
      orgId: org.id,
      username: adminUsername,
      passwordHash: await hashPassword(adminPassword),
      name: "Owner",
      role: "ADMIN",
    },
  });

  console.log(`Seeded admin user -> business code: "${orgSlug}", username: "${adminUsername}", password: "${adminPassword}"`);
  console.log("Change this password (or create a new admin) before going live.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
