import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { logAdminEvent } from '@/lib/audit'
import { generateOtp, storeOtp } from '@/lib/otp-store'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// In-memory rate limiters
// ---------------------------------------------------------------------------

// email → timestamp[] (max 3 per 15 minutes)
const emailRateMap = new Map<string, number[]>()
const EMAIL_RATE_MAX = 3
const EMAIL_RATE_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

// ip → timestamp[] (max 10 per hour)
const ipRateMap = new Map<string, number[]>()
const IP_RATE_MAX = 10
const IP_RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function isRateLimited(map: Map<string, number[]>, key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = map.get(key) || []
  const recent = timestamps.filter((t) => now - t < windowMs)
  map.set(key, recent)
  return recent.length >= max
}

function recordRequest(map: Map<string, number[]>, key: string): void {
  const now = Date.now()
  const timestamps = map.get(key) || []
  timestamps.push(now)
  map.set(key, timestamps)
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

// ---------------------------------------------------------------------------
// POST /api/admin/auth/forgot-password
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    // IP rate limit check
    if (isRateLimited(ipRateMap, ip, IP_RATE_MAX, IP_RATE_WINDOW_MS)) {
      return NextResponse.json(
        { success: false, error: 'बहुत अधिक अनुरोध। कृपया कुछ समय बाद पुनः प्रयास करें।' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, whatsapp } = body

    // Basic validation
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'कृपया ईमेल दर्ज करें।' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Email rate limit check
    if (isRateLimited(emailRateMap, trimmedEmail, EMAIL_RATE_MAX, EMAIL_RATE_WINDOW_MS)) {
      return NextResponse.json(
        { success: false, error: 'बहुत अधिक OTP अनुरोध। कृपया कुछ समय बाद पुनः प्रयास करें।' },
        { status: 429 }
      )
    }

    // Record this request
    recordRequest(emailRateMap, trimmedEmail)
    recordRequest(ipRateMap, ip)

    // Always return success to avoid revealing which emails exist
    // But only generate OTP if the email is found
    if (isDbAvailable()) {
      try {
        const admin = await db.admin.findUnique({
          where: { email: trimmedEmail },
        })

        if (admin) {
          const otp = generateOtp()
          storeOtp(trimmedEmail, otp)

          // In production, OTP would be sent via WhatsApp API

          await logAdminEvent({
            adminId: admin.id,
            adminName: admin.name,
            action: 'PASSWORD_RESET_OTP_GENERATED',
            entityType: 'admin',
            entityId: admin.id,
            metadata: { email: trimmedEmail, whatsapp: whatsapp || null },
            ipAddress: ip,
          })
        }
      } catch {
        // DB error — still return success for security
      }
    }

    return NextResponse.json({
      success: true,
      message: 'OTP आपके WhatsApp पर भेजा गया।',
    })
  } catch {
    return NextResponse.json(
      { success: true, message: 'OTP आपके WhatsApp पर भेजा गया।' },
      { status: 200 }
    )
  }
}
