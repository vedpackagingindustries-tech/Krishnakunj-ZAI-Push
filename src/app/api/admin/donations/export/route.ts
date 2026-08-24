import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

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

    // ── Parse query params (same filters as list) ──
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
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

    // ── Fetch all matching donations (no pagination for export, but capped at 50k) ──
    const EXPORT_MAX_ROWS = 50000

    // Check unfiltered total for date range requirement
    const unfilteredTotal = await db.donation.count({ where })
    if (unfilteredTotal > EXPORT_MAX_ROWS) {
      // Require date range to narrow down results
      if (!dateFrom || !dateTo) {
        return NextResponse.json(
          { error: `डेटा बहुत अधिक है (${unfilteredTotal} पंक्तियाँ)। कृपया तिथि सीमा निर्दिष्ट करें (अधिकतम 50,000 पंक्तियाँ)।` },
          { status: 400 }
        )
      }
    }

    const donations = await db.donation.findMany({
      where,
      orderBy,
      take: EXPORT_MAX_ROWS,
    })

    // ── CSV generation ──
    const statusMap: Record<string, string> = {
      SUCCESS: 'सफल',
      PENDING: 'पेंडिंग',
      FAILED: 'विफल',
      CANCELLED: 'रद्द',
    }

    const headers = [
      'पावती क्रमांक',
      'दानदाता का नाम',
      'मोबाइल',
      'ईमेल',
      'पता',
      'पिनकोード',
      'राशि (₹)',
      'मुद्रा',
      'भुगतान माध्यम',
      'Transaction ID',
      'स्थिति',
      'निर्माण तिथि',
      'भुगतान तिथि',
    ]

    const escapeCsv = (val: string | null | undefined) => {
      const s = val || ''
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }

    const rows = donations.map((d) => [
      escapeCsv(d.receiptNumber),
      escapeCsv(d.donorName),
      escapeCsv(d.mobile),
      escapeCsv(d.email),
      escapeCsv(d.address),
      escapeCsv(d.pincode),
      String(d.amount),
      escapeCsv(d.currency),
      escapeCsv(d.paymentMethod),
      escapeCsv(d.transactionId),
      statusMap[d.paymentStatus] || d.paymentStatus,
      d.createdAt ? new Date(d.createdAt).toLocaleDateString('hi-IN') : '',
      d.paidAt ? new Date(d.paidAt).toLocaleDateString('hi-IN') : '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n')

    // BOM for UTF-8 CSV so Excel renders Hindi correctly
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent

    const timestamp = new Date().toISOString().slice(0, 10)

    if (format === 'excel') {
      return new NextResponse(csvWithBom, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="donations_${timestamp}.csv"`,
        },
      })
    }

    // Default: CSV
    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="donations_${timestamp}.csv"`,
      },
    })
  } catch (error) {
    console.error('Donations export error:', error)
    return NextResponse.json(
      { error: 'दान निर्यात करने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
