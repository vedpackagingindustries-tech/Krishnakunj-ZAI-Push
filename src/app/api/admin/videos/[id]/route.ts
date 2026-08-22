import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { db } from '@/lib/db'

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
    const { url, thumbnailUrl, title, description, category, displayOrder, isPublished } = body

    const existing = await db.video.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'वीडियो नहीं मिला।' },
        { status: 404 }
      )
    }

    const video = await db.video.update({
      where: { id },
      data: {
        ...(url !== undefined ? { url: url.trim() } : {}),
        ...(thumbnailUrl !== undefined ? { thumbnailUrl: thumbnailUrl?.trim() || null } : {}),
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(category !== undefined ? { category: category.trim() } : {}),
        ...(displayOrder !== undefined ? { displayOrder } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
      },
    })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'UPDATE',
        entityType: 'video',
        entityId: id,
        metadata: JSON.stringify(body),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ video })
  } catch (error) {
    console.error('Video update error:', error)
    return NextResponse.json(
      { error: 'वीडियो अपडेट करने में त्रुटि हुई।' },
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

    const existing = await db.video.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'वीडियो नहीं मिला।' },
        { status: 404 }
      )
    }

    await db.video.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'DELETE',
        entityType: 'video',
        entityId: id,
        metadata: JSON.stringify({ title: existing.title }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Video delete error:', error)
    return NextResponse.json(
      { error: 'वीडियो हटाने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}