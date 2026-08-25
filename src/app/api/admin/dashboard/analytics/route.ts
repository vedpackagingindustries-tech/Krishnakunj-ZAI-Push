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

    const range = request.nextUrl.searchParams.get('range') || 'month'

    const now = new Date()
    let startDate: Date
    let days: number

    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        days = 1
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 6)
        startDate.setHours(0, 0, 0, 0)
        days = 7
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        // Calculate days from start of month to today
        days = Math.ceil(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        days = Math.ceil(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        days = Math.ceil(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
    }

    const donations = await db.donation.findMany({
      where: {
        createdAt: { gte: startDate, lte: now },
      },
      select: {
        amount: true,
        paymentStatus: true,
        createdAt: true,
      },
    })

    // Group by date
    const dateMap = new Map<
      string,
      { count: number; amount: number }
    >()

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().split('T')[0]
      dateMap.set(key, { count: 0, amount: 0 })
    }

    for (const donation of donations) {
      const key = donation.createdAt.toISOString().split('T')[0]
      const existing = dateMap.get(key)
      if (existing) {
        existing.count += 1
        if (donation.paymentStatus === 'SUCCESS') {
          existing.amount += donation.amount
        }
      }
    }

    const analytics = Array.from(dateMap.entries()).map(
      ([date, data]) => ({
        date,
        count: data.count,
        amount: data.amount,
      })
    )

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'विश्लेषण डेटा प्राप्त करने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
