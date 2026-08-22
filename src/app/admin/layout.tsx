'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAdminToken, clearAdminToken, fetchAdmin } from '@/lib/admin-auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import { Toaster } from '@/components/ui/sonner'

interface AdminData {
  id: string
  name: string
  email: string
  role: string
  whatsapp?: string
}

interface SessionResponse {
  success: boolean
  admin: AdminData
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Login/setup/entry pages should not use the admin layout chrome
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/setup' || pathname === '/admin'

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false)
      return
    }

    const checkSession = async () => {
      const token = getAdminToken()
      if (!token) {
        router.replace('/admin/login')
        return
      }

      try {
        const data = await fetchAdmin<SessionResponse>(
          '/api/admin/auth/session'
        )
        if (data.success && data.admin) {
          setAdmin(data.admin)
        } else {
          clearAdminToken()
          router.replace('/admin/login')
        }
      } catch {
        clearAdminToken()
        router.replace('/admin/login')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [pathname, router, isAuthPage])

  // Auth pages: render without sidebar/header
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-warm-ivory">
        <Toaster />
        {children}
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-ivory">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-light-beige border-t-elegant-orange"></div>
          <p className="text-sm text-muted-brown">लोड हो रहा है...</p>
        </div>
      </div>
    )
  }

  if (!admin) return null

  return (
    <div className="flex min-h-screen bg-warm-ivory">
      <Toaster />
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <AdminHeader
          adminName={admin.name}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
