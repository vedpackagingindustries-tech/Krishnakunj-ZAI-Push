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

    const contents = await db.cmsContent.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    })

    // Group by group field
    const grouped: Record<string, typeof contents> = {}
    for (const item of contents) {
      const g = item.group || 'general'
      if (!grouped[g]) grouped[g] = []
      grouped[g].push(item)
    }

    return NextResponse.json({ contents, grouped })
  } catch (error) {
    console.error('Content list error:', error)
    return NextResponse.json(
      { error: 'कंटेंट सूची प्राप्त करने में त्रुटि हुई।' },
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
    const { key, value, type, label, group } = body

    if (!key?.trim()) {
      return NextResponse.json(
        { error: 'कुंजी (key) अनिवार्य है।' },
        { status: 400 }
      )
    }

    const content = await db.cmsContent.upsert({
      where: { key: key.trim() },
      update: {
        ...(value !== undefined ? { value } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(label !== undefined ? { label } : {}),
        ...(group !== undefined ? { group } : {}),
      },
      create: {
        key: key.trim(),
        value: value || '',
        type: type || 'text',
        label: label || key.trim(),
        group: group || 'general',
      },
    })

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'UPSERT',
        entityType: 'content',
        entityId: content.id,
        metadata: JSON.stringify({ key: content.key }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ content }, { status: 201 })
  } catch (error) {
    console.error('Content upsert error:', error)
    return NextResponse.json(
      { error: 'कंटेंट सहेजने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
