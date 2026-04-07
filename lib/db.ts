import { PrismaClient } from "@/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaVersion: string | undefined
}

// Bump this when schema changes to invalidate the cached client in dev
const SCHEMA_VERSION = "3"

function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

if (process.env.NODE_ENV !== "production" && globalForPrisma.prismaVersion !== SCHEMA_VERSION) {
  globalForPrisma.prisma = undefined
  globalForPrisma.prismaVersion = SCHEMA_VERSION
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
