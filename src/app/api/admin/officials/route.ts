import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
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

    const officials = await db.officialMember.findMany({
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json({ officials })
  } catch (error) {
    console.error('Officials list error:', error)
    return NextResponse.json(
      { error: 'पदाधिकारी सूची प्राप्त करने में त्रुटि हुई।' },
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
    const { name, designation, phone, displayOrder, isActive } = body

    if (!name?.trim() || !designation?.trim()) {
      return NextResponse.json(
        { error: 'नाम और पद अनिवार्य हैं।' },
        { status: 400 }
      )
    }

    const official = await db.officialMember.create({
      data: {
        name: name.trim(),
        designation: designation.trim(),
        phone: phone?.trim() || null,
        displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
        isActive: typeof isActive === 'boolean' ? isActive : true,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'CREATE',
        entityType: 'official',
        entityId: official.id,
        metadata: JSON.stringify({ name: official.name, designation: official.designation }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ official }, { status: 201 })
  } catch (error) {
    console.error('Official create error:', error)
    return NextResponse.json(
      { error: 'पदाधिकारी बनाने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}