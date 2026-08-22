import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { unlink } from 'fs/promises'
import path from 'path'

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
    const { title, description, displayOrder, isPublished, isHero, category } = body

    const existing = await db.media.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'मीडिया नहीं मिला।' },
        { status: 404 }
      )
    }

    const media = await db.media.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(displayOrder !== undefined ? { displayOrder } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
        ...(isHero !== undefined ? { isHero } : {}),
        ...(category !== undefined ? { category: category.trim() } : {}),
      },
    })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'UPDATE',
        entityType: 'media',
        entityId: id,
        metadata: JSON.stringify(body),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ media })
  } catch (error) {
    console.error('Media update error:', error)
    return NextResponse.json(
      { error: 'मीडिया अपडेट करने में त्रुटि हुई।' },
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

    const existing = await db.media.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'मीडिया नहीं मिला।' },
        { status: 404 }
      )
    }

    // Delete file from disk if it's a local upload
    if (existing.url.startsWith('/uploads/')) {
      try {
        const filePath = path.join(process.cwd(), 'public', existing.url)
        await unlink(filePath)
      } catch {
        // File might not exist, continue
      }
    }

    await db.media.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'DELETE',
        entityType: 'media',
        entityId: id,
        metadata: JSON.stringify({ title: existing.title, url: existing.url }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Media delete error:', error)
    return NextResponse.json(
      { error: 'मीडिया हटाने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
