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

    const stages = await db.constructionStage.findMany({
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json({ stages })
  } catch (error) {
    console.error('Construction list error:', error)
    return NextResponse.json(
      { error: 'निर्माण सूची प्राप्त करने में त्रुटि हुई।' },
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
    const { label, description, progress, displayOrder, isCompleted } = body

    if (!label?.trim()) {
      return NextResponse.json(
        { error: 'लेबल अनिवार्य है।' },
        { status: 400 }
      )
    }

    const stage = await db.constructionStage.create({
      data: {
        label: label.trim(),
        description: description?.trim() || '',
        progress: typeof progress === 'number' ? Math.min(100, Math.max(0, progress)) : 0,
        displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
        isCompleted: typeof isCompleted === 'boolean' ? isCompleted : false,
      },
    })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'CREATE',
        entityType: 'construction',
        entityId: stage.id,
        metadata: JSON.stringify({ label: stage.label }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ stage }, { status: 201 })
  } catch (error) {
    console.error('Construction create error:', error)
    return NextResponse.json(
      { error: 'निर्माण चरण बनाने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}