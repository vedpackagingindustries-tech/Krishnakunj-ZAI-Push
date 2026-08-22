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

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    const successWhere = { paymentStatus: 'SUCCESS' }

    // Today donations (SUCCESS only for amounts)
    const todayDonations = await db.donation.findMany({
      where: {
        createdAt: { gte: todayStart },
      },
      select: { amount: true, paymentStatus: true },
    })
    const todaySuccess = todayDonations.filter((d) => d.paymentStatus === 'SUCCESS')

    // Total donations (SUCCESS only for amounts)
    const totalDonations = await db.donation.findMany({
      select: { amount: true, paymentStatus: true },
    })
    const totalSuccess = totalDonations.filter((d) => d.paymentStatus === 'SUCCESS')

    // Month donations
    const monthDonations = await db.donation.findMany({
      where: {
        createdAt: { gte: monthStart },
      },
      select: { amount: true, paymentStatus: true },
    })
    const monthSuccess = monthDonations.filter((d) => d.paymentStatus === 'SUCCESS')

    // Year donations
    const yearDonations = await db.donation.findMany({
      where: {
        createdAt: { gte: yearStart },
      },
      select: { amount: true, paymentStatus: true },
    })
    const yearSuccess = yearDonations.filter((d) => d.paymentStatus === 'SUCCESS')

    // Total unique donors (by mobile)
    const totalDonors = await db.donation.groupBy({
      by: ['mobile'],
    })

    // Counts by status
    const successfulCount = await db.donation.count({
      where: { paymentStatus: 'SUCCESS' },
    })
    const pendingCount = await db.donation.count({
      where: { paymentStatus: 'PENDING' },
    })
    const failedCount = await db.donation.count({
      where: { paymentStatus: 'FAILED' },
    })

    return NextResponse.json({
      todayDonations: {
        count: todayDonations.length,
        amount: todaySuccess.reduce((sum, d) => sum + d.amount, 0),
      },
      totalDonations: {
        count: totalDonations.length,
        amount: totalSuccess.reduce((sum, d) => sum + d.amount, 0),
      },
      monthDonations: {
        count: monthDonations.length,
        amount: monthSuccess.reduce((sum, d) => sum + d.amount, 0),
      },
      yearDonations: {
        count: yearDonations.length,
        amount: yearSuccess.reduce((sum, d) => sum + d.amount, 0),
      },
      totalDonors: totalDonors.length,
      successfulDonations: successfulCount,
      pendingPayments: pendingCount,
      failedPayments: failedCount,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'आँकड़े प्राप्त करने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
