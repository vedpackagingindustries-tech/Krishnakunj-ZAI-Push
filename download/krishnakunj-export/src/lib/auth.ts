import crypto from 'crypto'
import { db } from '@/lib/db'

// scrypt parameters (same as Node.js defaults for scrypt)
const SCRYPT_KEYLEN = 64
const SCRYPT_COST = 16384
const SCRYPT_BLOCK_SIZE = 8
const SCRYPT_PARALLELIZATION = 1

/**
 * Hash a password using Node.js crypto scrypt.
 * Format: <salt-hex>$<hash-hex>
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16)
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      SCRYPT_KEYLEN,
      {
        cost: SCRYPT_COST,
        blockSize: SCRYPT_BLOCK_SIZE,
        parallelization: SCRYPT_PARALLELIZATION,
      },
      (err, key) => (err ? reject(err) : resolve(key))
    )
  })
  return `${salt.toString('hex')}$${derivedKey.toString('hex')}`
}

/**
 * Verify a password against a stored hash.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split('$')
  if (!saltHex || !hashHex) return false

  const salt = Buffer.from(saltHex, 'hex')
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      SCRYPT_KEYLEN,
      {
        cost: SCRYPT_COST,
        blockSize: SCRYPT_BLOCK_SIZE,
        parallelization: SCRYPT_PARALLELIZATION,
      },
      (err, key) => (err ? reject(err) : resolve(key))
    )
  })
  return crypto.timingSafeEqual(
    Buffer.from(hashHex, 'hex'),
    derivedKey
  )
}

/**
 * Generate a cryptographically secure session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create an AdminSession in the DB and return the token.
 * Session expires in 7 days.
 */
export async function createSession(
  adminId: string
): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await db.adminSession.create({
    data: {
      adminId,
      token,
      expiresAt,
    },
  })

  return token
}

/**
 * Validate a session token. Returns the admin record or null.
 * Also cleans up expired sessions for this token.
 */
export async function validateSession(token: string) {
  const session = await db.adminSession.findUnique({
    where: { token },
    include: { admin: true },
  })

  if (!session) return null

  // Check if session has expired
  if (session.expiresAt < new Date()) {
    await db.adminSession.delete({ where: { id: session.id } })
    return null
  }

  // Check if admin is still active
  if (!session.admin.isActive) return null

  return session.admin
}

/**
 * Destroy a session by token.
 */
export async function destroySession(token: string): Promise<void> {
  await db.adminSession.deleteMany({ where: { token } })
}

/**
 * Get the total count of admin accounts.
 */
export async function getAdminCount(): Promise<number> {
  return db.admin.count()
}

/**
 * Check if any admin account exists.
 */
export async function hasAnyAdmin(): Promise<boolean> {
  const count = await getAdminCount()
  return count > 0
}
