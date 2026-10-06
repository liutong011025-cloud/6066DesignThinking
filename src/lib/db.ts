import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
const globalDb = globalThis as unknown as { studioDb?: PrismaClient };
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");
  if (!globalDb.studioDb) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: process.env.LOCAL_DATABASE ? 1 : 4, idleTimeoutMillis: 10000 });
    globalDb.studioDb = new PrismaClient({ adapter });
  }
  return globalDb.studioDb;
}
