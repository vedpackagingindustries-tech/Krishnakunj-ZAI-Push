import { NextRequest, NextResponse } from 'next/server'
import { hasAnyAdmin, hashPassword, createSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Check if any admin already exists
    const anyAdmin = await hasAnyAdmin()
    if (anyAdmin) {
      return NextResponse.json(
        { error: 'एडमिन खाता पहले से मौजूद है। कृपया लॉगिन करें।' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, whatsapp, password, confirmPassword } = body

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'कृपया अपना नाम दर्ज करें (कम से कम 2 अक्षर)।' },
        { status: 400 }
      )
    }

    // Validate email
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json(
        { error: 'कृपया ईमेल दर्ज करें।' },
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

    // Validate whatsapp (optional but if provided, must be 10 digits)
    if (whatsapp && typeof whatsapp === 'string') {
      const cleanWhatsapp = whatsapp.replace(/\D/g, '')
      if (cleanWhatsapp.length !== 10) {
        return NextResponse.json(
          { error: 'व्हाट्सएप नंबर 10 अंकों का होना चाहिए।' },
          { status: 400 }
        )
      }
    }

    // Validate password
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।' },
        { status: 400 }
      )
    }

    // Validate password match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।' },
        { status: 400 }
      )
    }

    // Double-check email uniqueness
    const existingAdmin = await db.admin.findUnique({
      where: { email: email.trim().toLowerCase() },
    })
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'यह ईमेल पहले से पंजीकृत है।' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create admin
    const admin = await db.admin.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        whatsapp: whatsapp ? whatsapp.replace(/\D/g, '') : null,
        role: 'SUPER_ADMIN',
      },
    })

    // Create session
    const token = await createSession(admin.id)

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
      { error: 'खाता बनाने में त्रुटि हुई। कृपया पुनः प्रयास करें।' },
      { status: 500 }
    )
  }
}
