import { NextResponse } from 'next/server'
import { hashPassword, generateSessionToken } from '@/lib/auth'
import { db, isDbAvailable } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// TEMPORARY diagnostic endpoint — remove after fixing setup
export async function GET() {
  const steps: Record<string, { ok: boolean; detail: string }> = {}

  // Step 1: DB availability
  steps['db_available'] = {
    ok: isDbAvailable(),
    detail: isDbAvailable() ? 'PrismaClient initialized' : 'PrismaClient is null',
  }

  // Step 2: DB connection test (count)
  try {
    if (isDbAvailable()) {
      const count = await db.admin.count()
      steps['db_count'] = { ok: true, detail: `admin count = ${count}` }
    } else {
      steps['db_count'] = { ok: false, detail: 'skipped (db not available)' }
    }
  } catch (e: unknown) {
    steps['db_count'] = { ok: false, detail: String(e) }
  }

  // Step 3: crypto.randomBytes
  try {
    const bytes = crypto.randomBytes(16)
    steps['crypto_randomBytes'] = { ok: true, detail: `got ${bytes.length} bytes` }
  } catch (e: unknown) {
    steps['crypto_randomBytes'] = { ok: false, detail: String(e) }
  }

  // Step 4: crypto.scrypt
  try {
    const salt = crypto.randomBytes(16)
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt('test-password', salt, 64, { cost: 16384, blockSize: 8, parallelization: 1 }, (err, key) =>
        err ? reject(err) : resolve(key)
      )
    })
    steps['crypto_scrypt'] = { ok: true, detail: `hash length = ${derivedKey.length}` }
  } catch (e: unknown) {
    steps['crypto_scrypt'] = { ok: false, detail: String(e) }
  }

  // Step 5: hashPassword function
  try {
    const hash = await hashPassword('test-password')
    steps['hashPassword'] = { ok: true, detail: `hash format ok, length = ${hash.length}` }
  } catch (e: unknown) {
    steps['hashPassword'] = { ok: false, detail: String(e) }
  }

  // Step 6: generateSessionToken
  try {
    const token = generateSessionToken()
    steps['generateSessionToken'] = { ok: true, detail: `token length = ${token.length}` }
  } catch (e: unknown) {
    steps['generateSessionToken'] = { ok: false, detail: String(e) }
  }

  // Step 7: DB raw query
  try {
    if (isDbAvailable()) {
      await db.$queryRaw`SELECT 1 as ok`
      steps['db_raw_query'] = { ok: true, detail: 'raw query succeeded' }
    } else {
      steps['db_raw_query'] = { ok: false, detail: 'skipped' }
    }
  } catch (e: unknown) {
    steps['db_raw_query'] = { ok: false, detail: String(e) }
  }

  return NextResponse.json(steps)
}
