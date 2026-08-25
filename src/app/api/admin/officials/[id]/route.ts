import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { name, designation, phone, displayOrder, isActive } = body

    const existing = await db.officialMember.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'पदाधिकारी नहीं मिला।' },
        { status: 404 }
      )
    }

    const official = await db.officialMember.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(designation !== undefined ? { designation: designation.trim() } : {}),
        ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
        ...(displayOrder !== undefined ? { displayOrder } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'UPDATE',
        entityType: 'official',
        entityId: id,
        metadata: JSON.stringify(body),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ official })
  } catch (error) {
    console.error('Official update error:', error)
    return NextResponse.json(
      { error: 'पदाधिकारी अपडेट करने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const existing = await db.officialMember.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'पदाधिकारी नहीं मिला।' },
        { status: 404 }
      )
    }

    await db.officialMember.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'DELETE',
        entityType: 'official',
        entityId: id,
        metadata: JSON.stringify({ name: existing.name, designation: existing.designation }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Official delete error:', error)
    return NextResponse.json(
      { error: 'पदाधिकारी हटाने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
