import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // ── Admin auth validation ──
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

    // ── Parse query params ──
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const search = searchParams.get('search')?.trim() || ''
    const status = searchParams.get('status')?.trim() || ''
    const paymentMethod = searchParams.get('paymentMethod')?.trim() || ''
    const dateFrom = searchParams.get('dateFrom')?.trim() || ''
    const dateTo = searchParams.get('dateTo')?.trim() || ''
    const amountMin = searchParams.get('amountMin')?.trim() || ''
    const amountMax = searchParams.get('amountMax')?.trim() || ''
    const sortBy = searchParams.get('sortBy') === 'amount' ? 'amount' : 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    // ── Build where clause ──
    const where: Prisma.DonationWhereInput = {}

    if (search) {
      where.OR = [
        { donorName: { contains: search } },
        { mobile: { contains: search } },
        { receiptNumber: { contains: search } },
      ]
    }

    if (status && status !== 'सभी') {
      where.paymentStatus = status
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }

    if (dateFrom || dateTo) {
      const dateFilter: Prisma.DateTimeFilter<"Donation"> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        dateFilter.lte = toDate
      }
      where.createdAt = dateFilter
    }

    if (amountMin || amountMax) {
      const amountFilter: Prisma.IntFilter<"Donation"> = {}
      if (amountMin) amountFilter.gte = parseInt(amountMin, 10)
      if (amountMax) amountFilter.lte = parseInt(amountMax, 10)
      where.amount = amountFilter
    }

    // ── Build orderBy ──
    const orderBy: Prisma.DonationOrderByWithRelationInput = {}
    if (sortBy === 'amount') {
      orderBy.amount = sortOrder as 'asc' | 'desc'
    } else {
      orderBy.createdAt = sortOrder as 'asc' | 'desc'
    }

    // ── Query ──
    const [donations, total] = await Promise.all([
      db.donation.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.donation.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      donations,
      total,
      page,
      limit,
      totalPages,
    })
  } catch (error) {
    console.error('Donations list error:', error)
    return NextResponse.json(
      { error: 'दान सूची प्राप्त करने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
