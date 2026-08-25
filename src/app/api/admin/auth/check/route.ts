import { NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!isDbAvailable()) {
      // DB URL is invalid or missing — redirect to setup page
      // so the user at least sees the setup form (which will show
      // a clear "database not configured" error on submit)
      return NextResponse.json({ hasAdmin: false })
    }
    const count = await db.admin.count()
    return NextResponse.json({ hasAdmin: count > 0 })
  } catch (err) {
    // Query-time DB error (e.g. connection refused after URL is valid)
    console.error('[auth/check] DB error:', err)
    return NextResponse.json({ hasAdmin: false })
  }
}
