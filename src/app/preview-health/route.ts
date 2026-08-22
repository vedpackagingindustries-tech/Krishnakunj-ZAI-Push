import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return new NextResponse('Z.AI PREVIEW OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  })
}
