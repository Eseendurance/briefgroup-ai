import { PrismaClient } from "@prisma/client";

const prismaGlobal = globalThis as typeof globalThis & {
  briefGroupPrisma?: PrismaClient;
};

export function getPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for workspace and billing features.");
  }

  prismaGlobal.briefGroupPrisma ??= new PrismaClient();
  return prismaGlobal.briefGroupPrisma;
}
