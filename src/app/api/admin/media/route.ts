import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { db } from '@/lib/db'

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

    const [media, total] = await Promise.all([
      db.media.findMany({
        orderBy: { displayOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.media.count(),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({ media, total, page, limit, totalPages })
  } catch (error) {
    console.error('Media list error:', error)
    return NextResponse.json(
      { error: 'मीडिया सूची प्राप्त करने में त्रुटि हुई।' },
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
    const { url, thumbnailUrl, title, description, category, displayOrder, isPublished, isHero, fileSize, mimeType } = body

    if (!url?.trim()) {
      return NextResponse.json(
        { error: 'URL अनिवार्य है।' },
        { status: 400 }
      )
    }

    const media = await db.media.create({
      data: {
        type: 'photo',
        url: url.trim(),
        thumbnailUrl: thumbnailUrl?.trim() || null,
        title: title?.trim() || '',
        description: description?.trim() || '',
        category: category?.trim() || '',
        displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
        isPublished: typeof isPublished === 'boolean' ? isPublished : true,
        isHero: typeof isHero === 'boolean' ? isHero : false,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
      },
    })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'CREATE',
        entityType: 'media',
        entityId: media.id,
        metadata: JSON.stringify({ title: media.title }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ media }, { status: 201 })
  } catch (error) {
    console.error('Media create error:', error)
    return NextResponse.json(
      { error: 'मीडिया बनाने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}