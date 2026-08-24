import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { logAdminEvent } from '@/lib/audit'
import { generateOtp, storeOtp } from '@/lib/otp-store'

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

          // Log the OTP to console for testing (in production, WhatsApp API would send it)
          console.log(`[OTP] Password reset OTP for ${trimmedEmail}: ${otp}`)

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
