'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  IndianRupee,
  Users,
  FileText,
  Building2,
  Image,
  Video,
  GalleryHorizontalEnd,
  Landmark,
  FileEdit,
  UserCog,
  PanelBottom,
  CreditCard,
  Settings,
  UserCircle,
  Shield,
  ScrollText,
  LogOut,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { clearAdminToken, getAdminToken } from '@/lib/admin-auth'
import { ScrollArea } from '@/components/ui/scroll-area'

type SidebarItem = {
  label: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  isLogout?: boolean
}

const sidebarItems: SidebarItem[] = [
  { label: 'डैशबोर्ड', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'दान प्रबंधन', href: '/admin/donations', icon: IndianRupee },
  { label: 'दानदाता', href: '/admin/donors', icon: Users },
  { label: 'दान पावती', href: '/admin/receipts', icon: FileText },
  { label: 'निर्माण प्रगति', href: '/admin/construction', icon: Building2 },
  { label: 'फोटो प्रबंधन', href: '/admin/photos', icon: Image },
  { label: 'वीडियो प्रबंधन', href: '/admin/videos', icon: Video },
  { label: 'गैलरी', href: '/admin/gallery', icon: GalleryHorizontalEnd },
  { label: 'मंदिर जानकारी', href: '/admin/temple-info', icon: Landmark },
  { label: 'वेबसाइट कंटेंट', href: '/admin/content', icon: FileEdit },
  { label: 'पदाधिकारी प्रबंधन', href: '/admin/officials', icon: UserCog },
  { label: 'फुटर प्रबंधन', href: '/admin/footer', icon: PanelBottom },
  { label: 'भुगतान सेटिंग', href: '/admin/payment-settings', icon: CreditCard },
  { label: 'वेबसाइट सेटिंग', href: '/admin/settings', icon: Settings },
  { label: 'मेरा प्रोफाइल', href: '/admin/profile', icon: UserCircle },
  { label: 'सुरक्षा', href: '/admin/security', icon: Shield },
  { label: 'ऑडिट लॉग', href: '/admin/audit-logs', icon: ScrollText },
]

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
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
      // Ignore errors on logout
    }
    clearAdminToken()
    router.push('/admin/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-deep-warm-brown/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-light-beige bg-warm-white transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-light-beige px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-elegant-orange">
              <Landmark className="h-5 w-5 text-warm-white" />
            </div>
            <span className="text-sm font-bold text-deep-warm-brown">
              कृष्णकुंज
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-deep-warm-brown hover:bg-light-beige"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation items */}
        <ScrollArea className="flex-1 px-3 py-3">
          <nav className="flex flex-col gap-1">
            {sidebarItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin/dashboard' &&
                  pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose()}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-elegant-orange text-warm-white'
                      : 'text-deep-warm-brown hover:bg-light-beige'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Logout button at bottom */}
        <div className="border-t border-light-beige p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-deep-maroon transition-colors hover:bg-soft-maroon/10"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>लॉगआउट</span>
          </button>
        </div>
      </aside>
    </>
  )
}
