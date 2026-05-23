import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set for Prisma Client.");
}

function getAdapterConnectionString(connectionString: string) {
  const url = new URL(connectionString);
  if (url.protocol === "postgres:" || url.protocol === "postgresql:") {
    url.searchParams.set("sslmode", "no-verify");
  }
  return url.toString();
}

const adapter = new PrismaPg(getAdapterConnectionString(databaseUrl));

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
