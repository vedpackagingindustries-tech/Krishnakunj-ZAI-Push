import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

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
    const action = searchParams.get('action')?.trim() || ''
    const entityType = searchParams.get('entityType')?.trim() || ''

    const where: Prisma.AuditLogWhereInput = {}

    if (action) {
      where.action = action
    }

    if (entityType) {
      where.entityType = entityType
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({ logs, total, page, limit, totalPages })
  } catch (error) {
    console.error('Audit logs error:', error)
    return NextResponse.json(
      { error: 'ऑडिट लॉग प्राप्त करने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
