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

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    // Use aggregate queries instead of findMany to prevent OOM
    const [
      todayAgg,
      totalAgg,
      monthAgg,
      yearAgg,
      totalDonorsGrouped,
      successfulCount,
      pendingCount,
      failedCount,
      cancelledCount,
      refundedCount,
    ] = await Promise.all([
      db.donation.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { createdAt: { gte: todayStart }, paymentStatus: 'SUCCESS' },
      }),
      db.donation.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { paymentStatus: 'SUCCESS' },
      }),
      db.donation.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { createdAt: { gte: monthStart }, paymentStatus: 'SUCCESS' },
      }),
      db.donation.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { createdAt: { gte: yearStart }, paymentStatus: 'SUCCESS' },
      }),
      db.donation.groupBy({
        by: ['mobile'],
      }),
      db.donation.count({ where: { paymentStatus: 'SUCCESS' } }),
      db.donation.count({ where: { paymentStatus: 'PENDING' } }),
      db.donation.count({ where: { paymentStatus: 'FAILED' } }),
      db.donation.count({ where: { paymentStatus: 'CANCELLED' } }),
      db.donation.count({ where: { paymentStatus: 'REFUNDED' } }),
    ])

    // Pending/failed/cancelled/refunded amounts
    const [pendingAmountAgg, failedAmountAgg, cancelledAmountAgg, refundedAmountAgg] =
      await Promise.all([
        db.donation.aggregate({
          _sum: { amount: true },
          where: { paymentStatus: 'PENDING' },
        }),
        db.donation.aggregate({
          _sum: { amount: true },
          where: { paymentStatus: 'FAILED' },
        }),
        db.donation.aggregate({
          _sum: { amount: true },
          where: { paymentStatus: 'CANCELLED' },
        }),
        db.donation.aggregate({
          _sum: { amount: true },
          where: { paymentStatus: 'REFUNDED' },
        }),
      ])

    const netReceived = (totalAgg._sum.amount || 0) - (refundedAmountAgg._sum.amount || 0)

    return NextResponse.json({
      todayDonations: {
        count: todayAgg._count,
        amount: todayAgg._sum.amount || 0,
      },
      totalDonations: {
        count: totalAgg._count,
        amount: totalAgg._sum.amount || 0,
      },
      monthDonations: {
        count: monthAgg._count,
        amount: monthAgg._sum.amount || 0,
      },
      yearDonations: {
        count: yearAgg._count,
        amount: yearAgg._sum.amount || 0,
      },
      totalDonors: totalDonorsGrouped.length,
      successfulDonations: successfulCount,
      pendingPayments: pendingCount,
      failedPayments: failedCount,
      cancelledPayments: cancelledCount,
      refundedPayments: refundedCount,
      pendingAmount: pendingAmountAgg._sum.amount || 0,
      failedAmount: failedAmountAgg._sum.amount || 0,
      cancelledAmount: cancelledAmountAgg._sum.amount || 0,
      refundedAmount: refundedAmountAgg._sum.amount || 0,
      netReceived,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'आँकड़े प्राप्त करने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
