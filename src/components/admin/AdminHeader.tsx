'use client'

import { LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clearAdminToken, getAdminToken } from '@/lib/admin-auth'
import { useRouter } from 'next/navigation'

interface AdminHeaderProps {
  adminName: string
  onMenuClick: () => void
}

export default function AdminHeader({
  adminName,
  onMenuClick,
}: AdminHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const token = getAdminToken()
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
      // Ignore errors
    }
    clearAdminToken()
    router.push('/admin/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-light-beige bg-warm-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-deep-warm-brown hover:bg-light-beige"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-bold text-deep-warm-brown sm:text-lg">
          कृष्णकुंज माँ कर्मा धाम — एडमिन
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-soft-saffron">
            <span className="text-sm font-bold text-warm-white">
              {adminName?.charAt(0)?.toUpperCase() || 'अ'}
            </span>
          </div>
          <span className="text-sm font-medium text-deep-warm-brown">
            {adminName}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-deep-maroon/30 text-deep-maroon hover:bg-soft-maroon/10 hover:text-deep-maroon"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">लॉगआउट</span>
        </Button>
      </div>
    </header>
  )
}
