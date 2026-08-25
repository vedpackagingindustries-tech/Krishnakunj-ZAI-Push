import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createSession } from '@/lib/auth'
import { db, isDbAvailable } from '@/lib/db'
import { logAdminEvent } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// In-memory rate limiting: IP -> { count, firstAttemptAt }
const loginAttempts = new Map<string, { count: number; firstAttemptAt: number }>()

// In-memory account lockout: username (email) -> { count, lockedUntil }
const accountLockouts = new Map<string, { count: number; lockedUntil: number | null }>()

const MAX_IP_ATTEMPTS = 5
const IP_LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

const MAX_ACCOUNT_ATTEMPTS = 10
const ACCOUNT_LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 minutes

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

function isIpLocked(ip: string): boolean {
  const record = loginAttempts.get(ip)
  if (!record) return false
  if (record.count >= MAX_IP_ATTEMPTS) {
    const elapsed = Date.now() - record.firstAttemptAt
    if (elapsed < IP_LOCKOUT_DURATION_MS) {
      return true
    }
    // Lockout expired, reset
    loginAttempts.delete(ip)
    return false
  }
  return false
}

function recordFailedAttempt(ip: string): void {
  const existing = loginAttempts.get(ip)
  if (existing) {
    existing.count += 1
  } else {
    loginAttempts.set(ip, { count: 1, firstAttemptAt: Date.now() })
  }
}

function clearFailedAttempts(ip: string): void {
  loginAttempts.delete(ip)
}

function isAccountLocked(email: string): boolean {
  const record = accountLockouts.get(email)
  if (!record) return false
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    return true
  }
  // Lockout expired or not locked
  if (record.lockedUntil) {
    accountLockouts.delete(email)
  }
  return false
}

function recordAccountFailedAttempt(email: string): void {
  const existing = accountLockouts.get(email)
  if (existing) {
    existing.count += 1
    if (existing.count >= MAX_ACCOUNT_ATTEMPTS) {
      existing.lockedUntil = Date.now() + ACCOUNT_LOCKOUT_DURATION_MS
    }
  } else {
    accountLockouts.set(email, { count: 1, lockedUntil: null })
  }
}

function clearAccountLockout(email: string): void {
  accountLockouts.delete(email)
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    // Rate limit check (IP-based)
    if (isIpLocked(ip)) {
      const record = loginAttempts.get(ip)
      const remainingMs = record
        ? IP_LOCKOUT_DURATION_MS - (Date.now() - record.firstAttemptAt)
        : 0
      const remainingMin = Math.ceil(remainingMs / 60000)
      return NextResponse.json(
        {
          error: `बहुत अधिक असफल प्रयास। कृपया ${remainingMin} मिनट बाद पुनः प्रयास करें।`,
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    // Validate email
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json(
        { error: 'कृपया ईमेल दर्ज करें।' },
        { status: 400 }
      )
    }

    // Validate password
    if (!password || typeof password !== 'string' || password.length === 0) {
      return NextResponse.json(
        { error: 'कृपया पासवर्ड दर्ज करें।' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Account lockout check
    if (isAccountLocked(trimmedEmail)) {
      const record = accountLockouts.get(trimmedEmail)
      const remainingMs = record?.lockedUntil
        ? record.lockedUntil - Date.now()
        : 0
      const remainingMin = Math.ceil(remainingMs / 60000)
      return NextResponse.json(
        {
          error: `इस खाते को अस्थायी रूप से लॉक किया गया है। कृपया ${remainingMin} मिनट बाद पुनः प्रयास करें।`,
        },
        { status: 429 }
      )
    }

    if (!isDbAvailable()) {
      return NextResponse.json(
        { error: 'डेटाबेस अभी उपलब्ध नहीं है। कृपया बाद में प्रयास करें।' },
        { status: 503 }
      )
    }

    // Find admin by email
    let admin: Awaited<ReturnType<typeof db.admin.findUnique>> | null = null
    try {
      admin = await db.admin.findUnique({
        where: { email: trimmedEmail },
      })
    } catch (dbErr) {
      console.error('[login] DB findUnique error:', dbErr)
      // If DB query fails, return 401 (don't leak DB errors to client)
      recordFailedAttempt(ip)
      return NextResponse.json(
        { error: 'ईमेल या पासवर्ड गलत है।' },
        { status: 401 }
      )
    }

    if (!admin) {
      recordFailedAttempt(ip)
      try {
        await logAdminEvent({
          adminId: '',
          adminName: '',
          action: 'LOGIN_FAILED',
          entityType: 'admin',
          metadata: { reason: 'email_not_found', email: trimmedEmail },
          ipAddress: ip,
        })
      } catch {
        // Audit logging failure should not block login response
      }
      return NextResponse.json(
        { error: 'ईमेल या पासवर्ड गलत है।' },
        { status: 401 }
      )
    }

    // Check if admin is active
    if (!admin.isActive) {
      recordFailedAttempt(ip)
      await logAdminEvent({
        adminId: admin.id,
        adminName: admin.name,
        action: 'LOGIN_FAILED',
        entityType: 'admin',
        entityId: admin.id,
        metadata: { reason: 'account_inactive', email: trimmedEmail },
        ipAddress: ip,
      })
      return NextResponse.json(
        { error: 'यह खाता निष्क्रिय कर दिया गया है। कृपया प्रबंधन से संपर्क करें।' },
        { status: 403 }
      )
    }

    // Verify password
    const valid = await verifyPassword(password, admin.passwordHash)
    if (!valid) {
      recordFailedAttempt(ip)
      recordAccountFailedAttempt(trimmedEmail)
      await logAdminEvent({
        adminId: admin.id,
        adminName: admin.name,
        action: 'LOGIN_FAILED',
        entityType: 'admin',
        entityId: admin.id,
        metadata: { reason: 'wrong_password', email: trimmedEmail },
        ipAddress: ip,
      })
      return NextResponse.json(
        { error: 'ईमेल या पासवर्ड गलत है।' },
        { status: 401 }
      )
    }

    // Clear failed attempts on success
    clearFailedAttempts(ip)
    clearAccountLockout(trimmedEmail)

    // Create session
    const token = await createSession(admin.id)

    // Update last login
    await db.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    })

    // Log successful login
    await logAdminEvent({
      adminId: admin.id,
      adminName: admin.name,
      action: 'LOGIN_SUCCESS',
      entityType: 'admin',
      entityId: admin.id,
      metadata: { email: trimmedEmail, role: admin.role },
      ipAddress: ip,
    })

    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error('[login] Error:', error)
    return NextResponse.json(
      { error: 'लॉगिन में त्रुटि हुई। कृपया पुनः प्रयास करें।' },
      { status: 500 }
    )
  }
}
