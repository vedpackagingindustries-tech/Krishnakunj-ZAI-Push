import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // ── Get donation by ID ──
    const { id } = await params

    const donation = await db.donation.findUnique({
      where: { id },
    })

    if (!donation) {
      return NextResponse.json(
        { error: 'दान रिकॉर्ड नहीं मिला।' },
        { status: 404 }
      )
    }

    return NextResponse.json(donation)
  } catch (error) {
    console.error('Donation detail error:', error)
    return NextResponse.json(
      { error: 'दान विवरण प्राप्त करने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
