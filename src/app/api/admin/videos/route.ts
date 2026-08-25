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

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    const [videos, total] = await Promise.all([
      db.video.findMany({
        orderBy: { displayOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.video.count(),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({ videos, total, page, limit, totalPages })
  } catch (error) {
    console.error('Videos list error:', error)
    return NextResponse.json(
      { error: 'वीडियो सूची प्राप्त करने में त्रुटि हुई।' },
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
    const { url, thumbnailUrl, title, description, category, displayOrder, isPublished } = body

    if (!url?.trim()) {
      return NextResponse.json(
        { error: 'वीडियो URL अनिवार्य है।' },
        { status: 400 }
      )
    }

    const video = await db.video.create({
      data: {
        url: url.trim(),
        thumbnailUrl: thumbnailUrl?.trim() || null,
        title: title?.trim() || '',
        description: description?.trim() || '',
        category: category?.trim() || '',
        displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
        isPublished: typeof isPublished === 'boolean' ? isPublished : true,
      },
    })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'CREATE',
        entityType: 'video',
        entityId: video.id,
        metadata: JSON.stringify({ title: video.title }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ video }, { status: 201 })
  } catch (error) {
    console.error('Video create error:', error)
    return NextResponse.json(
      { error: 'वीडियो बनाने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
