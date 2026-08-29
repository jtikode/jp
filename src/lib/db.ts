import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  // Default pg pool size is 10 — too small once dozens of retailers/salesmen
  // hit the app at once, since every concurrent request queues behind
  // whichever connections are already busy. Raised to 20; DATABASE_URL
  // should point at Supabase's pooler (pgbouncer, port 6543) so this stays
  // within whatever your Supabase plan allows on the underlying database.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string, max: 20 });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
