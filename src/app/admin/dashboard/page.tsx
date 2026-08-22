'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fetchAdmin } from '@/lib/admin-auth'
import {
  IndianRupee,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  CalendarDays,
  CalendarRange,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────

interface DonationStat {
  count: number
  amount: number
}

interface DashboardStats {
  todayDonations: DonationStat
  totalDonations: DonationStat
  monthDonations: DonationStat
  yearDonations: DonationStat
  totalDonors: number
  successfulDonations: number
  pendingPayments: number
  failedPayments: number
}

interface RecentDonation {
  receiptNumber: string
  donorName: string
  amount: number
  paymentStatus: string
  createdAt: string
}

interface AnalyticsPoint {
  date: string
  count: number
  amount: number
}

// ── Helpers ─────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('hi-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('hi-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'SUCCESS':
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          सफल
        </span>
      )
    case 'PENDING':
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
          पेंडिंग
        </span>
      )
    case 'FAILED':
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          विफल
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-light-beige px-2.5 py-0.5 text-xs font-medium text-muted-brown">
          {status}
        </span>
      )
  }
}

// ── Stat Card Component ─────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  iconBg: string
}) {
  return (
    <Card className="border-light-beige shadow-sm">
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-brown sm:text-sm">
              {title}
            </p>
            <p className="mt-1 text-xl font-bold text-deep-warm-brown lg:text-2xl">
              {value}
            </p>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-brown">{subtitle}</p>
            )}
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
          >
            <Icon className="h-5 w-5 text-warm-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Simple Bar Chart ───────────────────────────────

function BarChart({ data }: { data: AnalyticsPoint[] }) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1)

  return (
    <div className="flex items-end gap-1 sm:gap-2" style={{ height: '200px' }}>
      {data.map((point, idx) => {
        const heightPercent = (point.amount / maxAmount) * 100
        return (
          <div
            key={point.date}
            className="group relative flex flex-1 flex-col items-center"
          >
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-deep-warm-brown px-2 py-1 text-xs text-warm-white group-hover:block">
              {formatCurrency(point.amount)}
            </div>
            {/* Bar */}
            <div
              className="w-full min-w-[6px] max-w-[40px] rounded-t-md bg-elegant-orange transition-all hover:bg-soft-saffron"
              style={{ height: `${Math.max(heightPercent, 2)}%` }}
            />
            {/* Date label */}
            <span className="mt-1.5 hidden text-[10px] text-muted-brown sm:block lg:block">
              {data.length <= 7
                ? formatShortDate(point.date)
                : idx % Math.ceil(data.length / 10) === 0
                  ? formatShortDate(point.date)
                  : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Dashboard Page ─────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<RecentDonation[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsPoint[]>([])
  const [range, setRange] = useState<string>('month')
  const [adminName, setAdminName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const loadSession = useCallback(async () => {
    try {
      const data = await fetchAdmin<{
        success: boolean
        admin: { name: string }
      }>('/api/admin/auth/session')
      if (data.success && data.admin) {
        setAdminName(data.admin.name)
      }
    } catch {
      // handled by layout
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchAdmin<DashboardStats>(
        '/api/admin/dashboard/stats'
      )
      setStats(data)
    } catch {
      // handled by fetchAdmin
    }
  }, [])

  const loadRecent = useCallback(async () => {
    try {
      const data = await fetchAdmin<RecentDonation[]>(
        '/api/admin/dashboard/recent'
      )
      setRecent(data)
    } catch {
      // handled by fetchAdmin
    }
  }, [])

  const loadAnalytics = useCallback(async (r: string) => {
    try {
      const data = await fetchAdmin<AnalyticsPoint[]>(
        `/api/admin/dashboard/analytics?range=${r}`
      )
      setAnalytics(data)
    } catch {
      // handled by fetchAdmin
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadSession(), loadStats(), loadRecent()])
      await loadAnalytics('month')
      setLoading(false)
    }
    init()
  }, [loadSession, loadStats, loadRecent, loadAnalytics])

  const handleRangeChange = (newRange: string) => {
    setRange(newRange)
    loadAnalytics(newRange)
  }

  const rangeButtons = [
    { key: 'today', label: 'आज' },
    { key: 'week', label: 'इस सप्ताह' },
    { key: 'month', label: 'इस महीने' },
    { key: 'year', label: 'इस वर्ष' },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-light-beige border-t-elegant-orange"></div>
          <p className="text-sm text-muted-brown">डेटा लोड हो रहा है...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-deep-warm-brown">
          नमस्ते, {adminName} 🙏
        </h2>
        <p className="mt-1 text-sm text-muted-brown">
          मंदिर के दान और गतिविधियों का अवलोकन
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          title="आज प्राप्त दान"
          value={formatCurrency(stats?.todayDonations.amount ?? 0)}
          subtitle={`${stats?.todayDonations.count ?? 0} लेनदेन`}
          icon={IndianRupee}
          iconBg="bg-elegant-orange"
        />
        <StatCard
          title="कुल प्राप्त दान"
          value={formatCurrency(stats?.totalDonations.amount ?? 0)}
          subtitle={`${stats?.totalDonations.count ?? 0} लेनदेन`}
          icon={TrendingUp}
          iconBg="bg-soft-saffron"
        />
        <StatCard
          title="इस महीने का दान"
          value={formatCurrency(stats?.monthDonations.amount ?? 0)}
          subtitle={`${stats?.monthDonations.count ?? 0} लेनदेन`}
          icon={CalendarDays}
          iconBg="bg-light-gold"
        />
        <StatCard
          title="इस वर्ष का दान"
          value={formatCurrency(stats?.yearDonations.amount ?? 0)}
          subtitle={`${stats?.yearDonations.count ?? 0} लेनदेन`}
          icon={CalendarRange}
          iconBg="bg-deep-maroon"
        />
        <StatCard
          title="कुल दानदाता"
          value={String(stats?.totalDonors ?? 0)}
          icon={Users}
          iconBg="bg-muted-brown"
        />
        <StatCard
          title="कुल सफल दान"
          value={String(stats?.successfulDonations ?? 0)}
          icon={CheckCircle2}
          iconBg="bg-green-600"
        />
        <StatCard
          title="Pending Payment"
          value={String(stats?.pendingPayments ?? 0)}
          icon={Clock}
          iconBg="bg-yellow-500"
        />
        <StatCard
          title="Failed Payment"
          value={String(stats?.failedPayments ?? 0)}
          icon={XCircle}
          iconBg="bg-red-500"
        />
      </div>

      {/* Analytics Section */}
      <Card className="border-light-beige shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-deep-warm-brown">
              दान विश्लेषण
            </CardTitle>
            <div className="flex gap-1">
              {rangeButtons.map((btn) => (
                <Button
                  key={btn.key}
                  variant={range === btn.key ? 'default' : 'outline'}
                  size="sm"
                  className={
                    range === btn.key
                      ? 'bg-elegant-orange hover:bg-elegant-orange/90 text-warm-white border-elegant-orange'
                      : 'border-light-beige text-deep-warm-brown hover:bg-light-beige'
                  }
                  onClick={() => handleRangeChange(btn.key)}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {analytics.length > 0 ? (
            <BarChart data={analytics} />
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-sm text-muted-brown">
                इस अवधि में कोई डेटा उपलब्ध नहीं है।
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Donations Table */}
      <Card className="border-light-beige shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-deep-warm-brown">
            हाल के दान
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light-beige bg-light-beige/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-brown">
                    पावती क्रमांक
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-brown">
                    दानदाता
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-brown">
                    राशि
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-brown">
                    स्थिति
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-brown">
                    तारीख
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.length > 0 ? (
                  recent.map((donation) => (
                    <tr
                      key={donation.receiptNumber}
                      className="border-b border-light-beige/50 last:border-b-0 hover:bg-light-beige/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-deep-warm-brown">
                        {donation.receiptNumber}
                      </td>
                      <td className="px-4 py-3 text-deep-warm-brown">
                        {donation.donorName}
                      </td>
                      <td className="px-4 py-3 font-medium text-deep-warm-brown">
                        {formatCurrency(donation.amount)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(donation.paymentStatus)}
                      </td>
                      <td className="px-4 py-3 text-muted-brown">
                        {formatDate(donation.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-brown"
                    >
                      अभी कोई दान नहीं हुआ है।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
