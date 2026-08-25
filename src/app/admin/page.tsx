import { redirect } from 'next/navigation'
import { db, isDbAvailable } from '@/lib/db'
import AdminLoginForm from './login-client'

export const dynamic = 'force-dynamic'

/* ============================================================
   Admin Entry Page — SERVER COMPONENT

   1. Server-side checks whether any Admin account exists.
   2. If Admin count = 0 → redirect to /admin/setup
   3. If Admin count > 0 → render the normal Admin Login form
   ============================================================ */

export default async function AdminEntryPage() {
  // Server-side admin existence check
  // NOTE: redirect() must be OUTSIDE try/catch — it throws NEXT_REDIRECT
  // which would be swallowed by catch, preventing the redirect.
  let adminCount = -1
  if (isDbAvailable()) {
    try {
      adminCount = await db.admin.count()
    } catch {
      // DB error — fall through to login page so the user isn't stuck
    }
  }

  // Redirect to setup OUTSIDE the try/catch block
  if (adminCount === 0) {
    redirect('/admin/setup')
  }

  // At least one admin exists (or DB unavailable) → show login
  return <AdminLoginForm />
}
