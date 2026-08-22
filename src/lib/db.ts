import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let _db: PrismaClient
try {
  _db = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? [] : ['query'],
  })
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db
} catch {
  // DB not available (e.g. Vercel serverless without SQLite)
  _db = null as unknown as PrismaClient
}

export const db = _db

export function isDbAvailable(): boolean {
  return db !== null && db !== undefined
}