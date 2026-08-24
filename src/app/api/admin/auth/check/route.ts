import { NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // If DB is not available, default to hasAdmin: false (shows login page)
    if (!isDbAvailable()) {
      return NextResponse.json({ hasAdmin: false })
    }
    const count = await db.admin.count()
    return NextResponse.json({ hasAdmin: count > 0 })
  } catch {
    // On any error, default to hasAdmin: false (safe fallback)
    return NextResponse.json({ hasAdmin: false })
  }
}
