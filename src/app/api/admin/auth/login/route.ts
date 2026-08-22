import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createSession } from '@/lib/auth'
import { db } from '@/lib/db'

// In-memory rate limiting: IP -> { count, firstAttemptAt }
const loginAttempts = new Map<string, { count: number; firstAttemptAt: number }>()

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

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
  if (record.count >= MAX_ATTEMPTS) {
    const elapsed = Date.now() - record.firstAttemptAt
    if (elapsed < LOCKOUT_DURATION_MS) {
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

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    // Rate limit check
    if (isIpLocked(ip)) {
      const record = loginAttempts.get(ip)
      const remainingMs = record
        ? LOCKOUT_DURATION_MS - (Date.now() - record.firstAttemptAt)
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

    // Find admin by email
    const admin = await db.admin.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!admin) {
      recordFailedAttempt(ip)
      return NextResponse.json(
        { error: 'ईमेल या पासवर्ड गलत है।' },
        { status: 401 }
      )
    }

    // Check if admin is active
    if (!admin.isActive) {
      recordFailedAttempt(ip)
      return NextResponse.json(
        { error: 'यह खाता निष्क्रिय कर दिया गया है। कृपया प्रबंधन से संपर्क करें।' },
        { status: 403 }
      )
    }

    // Verify password
    const valid = await verifyPassword(password, admin.passwordHash)
    if (!valid) {
      recordFailedAttempt(ip)
      return NextResponse.json(
        { error: 'ईमेल या पासवर्ड गलत है।' },
        { status: 401 }
      )
    }

    // Clear failed attempts on success
    clearFailedAttempts(ip)

    // Create session
    const token = await createSession(admin.id)

    // Update last login
    await db.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
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
  } catch {
    return NextResponse.json(
      { error: 'लॉगिन में त्रुटि हुई। कृपया पुनः प्रयास करें।' },
      { status: 500 }
    )
  }
}
