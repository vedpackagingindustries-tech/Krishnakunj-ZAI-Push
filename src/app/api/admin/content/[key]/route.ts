import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
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

    const { key } = await params
    const body = await request.json()
    const { value, type, label, group } = body

    const existing = await db.cmsContent.findUnique({ where: { key } })
    if (!existing) {
      return NextResponse.json(
        { error: 'कंटेंट नहीं मिला।' },
        { status: 404 }
      )
    }

    const content = await db.cmsContent.update({
      where: { key },
      data: {
        ...(value !== undefined ? { value } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(label !== undefined ? { label } : {}),
        ...(group !== undefined ? { group } : {}),
      },
    })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'UPDATE',
        entityType: 'content',
        entityId: content.id,
        metadata: JSON.stringify({ key }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Content update error:', error)
    return NextResponse.json(
      { error: 'कंटेंट अपडेट करने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
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

    const { key } = await params

    const existing = await db.cmsContent.findUnique({ where: { key } })
    if (!existing) {
      return NextResponse.json(
        { error: 'कंटेंट नहीं मिला।' },
        { status: 404 }
      )
    }

    await db.cmsContent.delete({ where: { key } })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'DELETE',
        entityType: 'content',
        entityId: existing.id,
        metadata: JSON.stringify({ key }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Content delete error:', error)
    return NextResponse.json(
      { error: 'कंटेंट हटाने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}