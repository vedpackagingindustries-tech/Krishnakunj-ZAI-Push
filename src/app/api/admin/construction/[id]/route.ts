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
    const { label, description, progress, displayOrder, isCompleted } = body

    const existing = await db.constructionStage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'निर्माण चरण नहीं मिला।' },
        { status: 404 }
      )
    }

    const stage = await db.constructionStage.update({
      where: { id },
      data: {
        ...(label !== undefined ? { label: label.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(progress !== undefined ? { progress: Math.min(100, Math.max(0, progress)) } : {}),
        ...(displayOrder !== undefined ? { displayOrder } : {}),
        ...(isCompleted !== undefined ? { isCompleted } : {}),
      },
    })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'UPDATE',
        entityType: 'construction',
        entityId: id,
        metadata: JSON.stringify(body),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ stage })
  } catch (error) {
    console.error('Construction update error:', error)
    return NextResponse.json(
      { error: 'निर्माण चरण अपडेट करने में त्रुटि हुई।' },
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

    const existing = await db.constructionStage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'निर्माण चरण नहीं मिला।' },
        { status: 404 }
      )
    }

    await db.constructionStage.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'DELETE',
        entityType: 'construction',
        entityId: id,
        metadata: JSON.stringify({ label: existing.label }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Construction delete error:', error)
    return NextResponse.json(
      { error: 'निर्माण चरण हटाने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}