import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { logAdminEvent } from '@/lib/audit'
import { verifyOtp, clearOtp } from '@/lib/otp-store'

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

// Per-IP rate limit for OTP verification attempts
const resetIpAttempts = new Map<string, { count: number; windowStart: number }>()
const RESET_IP_MAX = 10
const RESET_IP_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

// ---------------------------------------------------------------------------
// POST /api/admin/auth/reset-password
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    // Per-IP rate limit
    const now = Date.now()
    const ipRecord = resetIpAttempts.get(ip)
    if (ipRecord) {
      if (now - ipRecord.windowStart > RESET_IP_WINDOW_MS) {
        ipRecord.count = 1
        ipRecord.windowStart = now
      } else if (ipRecord.count >= RESET_IP_MAX) {
        return NextResponse.json(
          { success: false, error: 'बहुत अधिक प्रयास। कृपया 15 मिनट बाद पुनः प्रयास करें।' },
          { status: 429 }
        )
      } else {
        ipRecord.count++
      }
    } else {
      resetIpAttempts.set(ip, { count: 1, windowStart: now })
    }

    const body = await request.json()
    const { email, otp, newPassword } = body

    // Validate inputs
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'कृपया ईमेल दर्ज करें।' },
        { status: 400 }
      )
    }

    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return NextResponse.json(
        { success: false, error: 'कृपया 6 अंकों का OTP दर्ज करें।' },
        { status: 400 }
      )
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Check OTP in memory
    const otpResult = verifyOtp(trimmedEmail, otp.trim())
    if (!otpResult.valid) {
      if (otpResult.locked) {
        return NextResponse.json(
          { success: false, error: 'बहुत अधिक गलत प्रयास। कृपया नया OTP प्राप्त करें।' },
          { status: 429 }
        )
      }
      if (otpResult.expired) {
        return NextResponse.json(
          { success: false, error: 'OTP की समय सीमा समाप्त हो गई है। कृपया नया OTP प्राप्त करें।' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'OTP गलत है। कृपया सही OTP दर्ज करें।' },
        { status: 400 }
      )
    }

    if (!isDbAvailable()) {
      return NextResponse.json(
        { success: false, error: 'डेटाबेस अभी उपलब्ध नहीं है। कृपया बाद में प्रयास करें।' },
        { status: 503 }
      )
    }

    // Find admin
    const admin = await db.admin.findUnique({
      where: { email: trimmedEmail },
    })

    if (!admin) {
      // Clear OTP even if admin not found (security)
      clearOtp(trimmedEmail)
      return NextResponse.json(
        { success: false, error: 'ईमेल पंजीकृत नहीं है।' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update password
    await db.admin.update({
      where: { id: admin.id },
      data: { passwordHash },
    })

    // Clear OTP from memory
    clearOtp(trimmedEmail)

    // Log password reset
    await logAdminEvent({
      adminId: admin.id,
      adminName: admin.name,
      action: 'PASSWORD_RESET_SUCCESS',
      entityType: 'admin',
      entityId: admin.id,
      metadata: { email: trimmedEmail },
      ipAddress: ip,
    })

    return NextResponse.json({
      success: true,
      message: 'पासवर्ड सफलतापूर्वक बदल दिया गया। अब आप नए पासवर्ड से लॉगिन कर सकते हैं।',
    })
  } catch (error) {
    console.error('[reset-password] Error:', error)
    return NextResponse.json(
      { success: false, error: 'पासवर्ड बदलने में त्रुटि हुई। कृपया पुनः प्रयास करें।' },
      { status: 500 }
    )
  }
}
