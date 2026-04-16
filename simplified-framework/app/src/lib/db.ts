import { PrismaClient } from "@prisma/client";

declare global {
  var __prismaClient: PrismaClient | undefined;
}

if (!process.env.DATABASE_URL) {
  // Match the documented local default so Prisma can boot without a checked-in .env.
  process.env.DATABASE_URL = "file:./dev.db";
}

export const prisma: PrismaClient =
  globalThis.__prismaClient ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaClient = prisma;
}
