import { redirect } from 'next/navigation'
import { db, isDbAvailable } from '@/lib/db'
import AdminLoginForm from './login-client'

/* ============================================================
   Admin Entry Page — SERVER COMPONENT

   1. Server-side checks whether any Admin account exists.
   2. If Admin count = 0 → redirect to /admin/setup
   3. If Admin count > 0 → render the normal Admin Login form
   ============================================================ */

export default async function AdminEntryPage() {
  // Server-side admin existence check
  if (isDbAvailable()) {
    try {
      const adminCount = await db.admin.count()
      if (adminCount === 0) {
        redirect('/admin/setup')
      }
    } catch {
      // DB error — fall through to login page so the user isn't stuck
    }
  }

  // At least one admin exists (or DB unavailable) → show login
  return <AdminLoginForm />
}
