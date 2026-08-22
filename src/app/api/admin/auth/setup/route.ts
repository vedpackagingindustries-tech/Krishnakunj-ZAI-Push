import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'

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

    // ---- Atomic: transaction guarantees only ONE first admin ----
    const passwordHash = await hashPassword(password)
    const { generateSessionToken } = await import('@/lib/auth')
    const token = generateSessionToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const created = await db.$transaction(async (tx) => {
      // 1. Count admins inside the transaction (serialized isolation)
      const adminCount = await tx.admin.count()
      if (adminCount > 0) {
        return null
      }

      // 2. Create the SUPER_ADMIN
      const admin = await tx.admin.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          passwordHash,
          whatsapp: cleanWhatsapp,
          role: 'SUPER_ADMIN',
        },
      })

      // 3. Create a session (still inside transaction)
      await tx.adminSession.create({
        data: { adminId: admin.id, token, expiresAt },
      })

      return admin
    })

    if (!created) {
      return NextResponse.json(
        { error: 'एडमिन खाता पहले से मौजूद है। कृपया लॉगिन करें।' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
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
    return NextResponse.json(
      { error: 'खाता बनाने में त्रुटि हुई। कृपया पुनः प्रयास करें।' },
      { status: 500 }
    )
  }
}
