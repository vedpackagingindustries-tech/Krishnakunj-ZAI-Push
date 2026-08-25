import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, generateSessionToken } from '@/lib/auth'
import { db, isDbAvailable } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, whatsapp, password, confirmPassword } = body

    // ---- Input validation (before any DB work) ----

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'कृपया अपना पूरा नाम दर्ज करें (कम से कम 2 अक्षर)।' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json(
        { error: 'कृपया ईमेल पता दर्ज करें।' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'कृपया सही ईमेल पता दर्ज करें।' },
        { status: 400 }
      )
    }

    // WhatsApp is required for first admin
    if (!whatsapp || typeof whatsapp !== 'string') {
      return NextResponse.json(
        { error: 'कृपया WhatsApp नंबर दर्ज करें।' },
        { status: 400 }
      )
    }
    const cleanWhatsapp = whatsapp.replace(/\D/g, '')
    if (cleanWhatsapp.length !== 10) {
      return NextResponse.json(
        { error: 'WhatsApp नंबर 10 अंकों का होना चाहिए।' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।' },
        { status: 400 }
      )
    }

    if (!isDbAvailable()) {
      return NextResponse.json(
        { error: 'डेटाबेस अभी उपलब्ध नहीं है। कृपया बाद में प्रयास करें।' },
        { status: 503 }
      )
    }

    // ---- Step 1: Check if any admin already exists ----
    const adminCount = await db.admin.count()
    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'एडमिन खाता पहले से मौजूद है। कृपया लॉगिन करें।' },
        { status: 403 }
      )
    }

    // ---- Step 2: Hash password ----
    const passwordHash = await hashPassword(password)

    // ---- Step 3: Create the SUPER_ADMIN ----
    // Unique constraint on email prevents race conditions
    const admin = await db.admin.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        whatsapp: cleanWhatsapp,
        role: 'SUPER_ADMIN',
      },
    })

    // ---- Step 4: Create session ----
    const token = generateSessionToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await db.adminSession.create({
      data: { adminId: admin.id, token, expiresAt },
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
  } catch (err: unknown) {
    // Prisma unique constraint violation (P2002) — another request won the race
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'एडमिन खाता पहले से मौजूद है। कृपया लॉगिन करें।' },
        { status: 403 }
      )
    }
    console.error('[setup] Error:', err)
    return NextResponse.json(
      { error: 'खाता बनाने में त्रुटि हुई। कृपया पुनः प्रयास करें।' },
      { status: 500 }
    )
  }
}
