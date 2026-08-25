import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Validate that DATABASE_URL has the correct protocol for the configured provider.
 * Prisma lazily validates the URL at query time, not at construction time,
 * so we must check the format ourselves to avoid isDbAvailable() returning true
 * when the URL is invalid.
 */
function isValidDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL
  if (!url) return false
  // Schema declares provider = "postgresql", so URL must start with postgresql:// or postgres://
  return url.startsWith('postgresql://') || url.startsWith('postgres://')
}

let _db: PrismaClient
let _dbValid = false

if (isValidDatabaseUrl()) {
  try {
    _db = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'production' ? [] : ['query'],
    })
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db
    _dbValid = true
  } catch {
    // PrismaClient construction failed (e.g. completely malformed URL)
    _db = null as unknown as PrismaClient
    _dbValid = false
  }
} else {
  // DATABASE_URL is missing or has wrong protocol — don't even construct PrismaClient
  _db = null as unknown as PrismaClient
  _dbValid = false
}

export const db = _db

/**
 * Returns true ONLY if DATABASE_URL is a valid PostgreSQL URL AND
 * PrismaClient was constructed successfully.
 *
 * Previous implementation only checked if PrismaClient was non-null,
 * but Prisma doesn't validate the URL at construction time — it fails
 * at query time. This led to isDbAvailable() returning true even
 * when the URL was a file:// or completely invalid.
 */
export function isDbAvailable(): boolean {
  return _dbValid
}
