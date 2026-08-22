import { NextResponse } from 'next/server'
import { hasAnyAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const hasAdmin = await hasAnyAdmin()
    return NextResponse.json({ hasAdmin })
  } catch {
    return NextResponse.json(
      { error: 'कुछ त्रुटि हुई। कृपया पुनः प्रयास करें।' },
      { status: 500 }
    )
  }
}
