import { PrismaClient } from "@prisma/client";

declare global {
  var __prismaClient: PrismaClient | undefined;
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

export const prisma: PrismaClient =
  globalThis.__prismaClient ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaClient = prisma;
}
