import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'

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
    if (!token) {
      return NextResponse.json(
        { error: 'अधिकृत नहीं। कृपया लॉगिन करें।' },
        { status: 401 }
      )
    }

    const admin = await validateSession(token)
    if (!admin) {
      return NextResponse.json(
        { error: 'सत्र समाप्त हो गया है। कृपया फिर से लॉगिन करें।' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        whatsapp: admin.whatsapp,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'सत्र जाँच में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
