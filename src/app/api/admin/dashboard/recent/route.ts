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

    const recentDonations = await db.donation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        receiptNumber: true,
        donorName: true,
        amount: true,
        paymentStatus: true,
        createdAt: true,
      },
    })

    return NextResponse.json(recentDonations)
  } catch (error) {
    console.error('Recent donations error:', error)
    return NextResponse.json(
      { error: 'हाल के दान प्राप्त करने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
