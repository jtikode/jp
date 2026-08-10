import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const db = new PrismaClient({ adapter });

async function main() {
  const active = process.argv[2] === "true";
  const user = await db.user.findFirst({ where: { username: "testsales" } });
  if (!user) {
    console.log("No 'testsales' user found.");
    return;
  }
  await db.user.update({ where: { id: user.id }, data: { active } });
  console.log(`testsales active = ${active}`);
}

main().finally(() => db.$disconnect());
