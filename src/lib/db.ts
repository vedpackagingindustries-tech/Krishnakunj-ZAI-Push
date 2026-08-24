import { PrismaClient } from '@prisma/client'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'

// Resolve DATABASE_URL: use env var, fall back to relative path for any environment
function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL
  if (envUrl) return envUrl
  // Default: SQLite file relative to project root (works in any deployment)
  return 'file:./db/custom.db'
}

// Ensure the directory for the SQLite file exists
function ensureDbDirectory(databaseUrl: string): void {
  try {
    // Extract path from "file:./db/custom.db" or "file:/absolute/path/db/custom.db"
    const match = databaseUrl.match(/^file:(?:\.\/|\/)?(.+)$/)
    if (match) {
      const dbPath = match[1]
      const dir = dirname(dbPath)
      if (dir && dir !== '.') {
        mkdirSync(dir, { recursive: true })
      } else if (dir === '.' || !dir) {
        // For "file:./db/custom.db", ensure "db" subdir exists
        const parts = dbPath.split('/')
        if (parts.length > 1) {
          mkdirSync(parts.slice(0, -1).join('/'), { recursive: true })
        }
      }
    }
  } catch {
    // Directory creation failed — Prisma will handle the error
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let _db: PrismaClient
try {
  const databaseUrl = resolveDatabaseUrl()
  ensureDbDirectory(databaseUrl)
  _db = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? [] : ['query'],
  })
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db
} catch {
  // DB not available (e.g. read-only filesystem, missing native engine)
  _db = null as unknown as PrismaClient
}

export const db = _db

export function isDbAvailable(): boolean {
  return db !== null && db !== undefined
}