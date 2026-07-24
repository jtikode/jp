import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const db = new PrismaClient({ adapter });

async function main() {
  const ramesh = await db.user.findUnique({ where: { username: "ramesh" } });
  const route = await db.route.findUnique({ where: { name: "Route A - City Center" } });
  if (!ramesh || !route) {
    console.log("Expected 'ramesh' user and 'Route A - City Center' route to exist already.");
    return;
  }

  const stores = [
    { externalCode: "S001", name: "City Medical Store", address: "12 MG Road", phone: "9876543210", routeId: route.id },
    { externalCode: "S002", name: "Sunrise Chemist", address: "45 Station Road", phone: "9876543211", routeId: route.id },
    { externalCode: "S003", name: "Green Cross Pharmacy", address: "7 Market Lane", phone: "9876543212", routeId: route.id },
  ];
  for (const s of stores) {
    await db.store.upsert({ where: { externalCode: s.externalCode }, update: s, create: s });
  }

  const now = new Date();
  await db.target.upsert({
    where: { userId_periodMonth_periodYear: { userId: ramesh.id, periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() } },
    update: {},
    create: {
      userId: ramesh.id,
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
      monthlyTarget: 150000,
      todayTarget: 5000,
      perRetailerTarget: 2000,
    },
  });

  console.log("Seeded 3 stores on Route A and a target for ramesh.");
}

main().finally(() => db.$disconnect());
