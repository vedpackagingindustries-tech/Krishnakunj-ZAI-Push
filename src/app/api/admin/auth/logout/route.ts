import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'अधिकृत नहीं।' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7).trim()
    if (token) {
      await destroySession(token)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'लॉगआउट में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
