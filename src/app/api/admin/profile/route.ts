import { NextRequest, NextResponse } from 'next/server'
import { validateSession, verifyPassword, hashPassword, generateSessionToken } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'अधिकृत नहीं। कृपया लॉगिन करें।' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7).trim()
    const admin = await validateSession(token)
    if (!admin) {
      return NextResponse.json(
        { error: 'सत्र समाप्त हो गया है। कृपया फिर से लॉगिन करें।' },
        { status: 401 }
      )
    }

    const { passwordHash, ...safeAdmin } = admin

    // Get session count
    const sessionCount = await db.adminSession.count({
      where: { adminId: admin.id, expiresAt: { gt: new Date() } },
    })

    return NextResponse.json({ admin: safeAdmin, sessionCount })
  } catch (error) {
    console.error('Profile get error:', error)
    return NextResponse.json(
      { error: 'प्रोफाइल प्राप्त करने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'अधिकृत नहीं। कृपया लॉगिन करें।' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7).trim()
    const admin = await validateSession(token)
    if (!admin) {
      return NextResponse.json(
        { error: 'सत्र समाप्त हो गया है। कृपया फिर से लॉगिन करें।' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, whatsapp } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'नाम अनिवार्य है।' },
        { status: 400 }
      )
    }

    const updatedAdmin = await db.admin.update({
      where: { id: admin.id },
      data: {
        name: name.trim(),
        ...(email !== undefined ? { email: email.trim() } : {}),
        ...(whatsapp !== undefined ? { whatsapp: whatsapp?.trim() || null } : {}),
      },
    })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'UPDATE',
        entityType: 'admin',
        entityId: admin.id,
        metadata: JSON.stringify({ field: 'profile' }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    const { passwordHash, ...safeAdmin } = updatedAdmin
    return NextResponse.json({ admin: safeAdmin })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'प्रोफाइल अपडेट करने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'अधिकृत नहीं। कृपया लॉगिन करें।' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7).trim()
    const admin = await validateSession(token)
    if (!admin) {
      return NextResponse.json(
        { error: 'सत्र समाप्त हो गया है। कृपया फिर से लॉगिन करें।' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'दोनों पासवर्ड अनिवार्य हैं।' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'नया पासवर्ड कम से कम 8 अक्षर का होना चाहिए।' },
        { status: 400 }
      )
    }

    const isValid = await verifyPassword(currentPassword, admin.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'वर्तमान पासवर्ड गलत है।' },
        { status: 400 }
      )
    }

    const newHash = await hashPassword(newPassword)
    await db.admin.update({
      where: { id: admin.id },
      data: { passwordHash: newHash },
    })

    // Create new session, invalidate old ones
    await db.adminSession.deleteMany({ where: { adminId: admin.id } })
    const newToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await db.adminSession.create({
      data: { adminId: admin.id, token: newToken, expiresAt },
    })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'UPDATE',
        entityType: 'admin',
        entityId: admin.id,
        metadata: JSON.stringify({ field: 'password' }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ success: true, newToken })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: 'पासवर्ड बदलने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}