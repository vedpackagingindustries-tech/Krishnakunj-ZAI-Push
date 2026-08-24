'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdmin } from '@/lib/admin-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react'

// ── Types ───────────────────────────────────────────

interface Donation {
  id: string
  donorName: string
  mobile: string
  amount: number
  paymentStatus: string
  createdAt: string
}

interface DonationsResponse {
  donations: Donation[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface DonorGroup {
  name: string
  mobile: string
  totalDonations: number
  successCount: number
  totalAmount: number
  lastDonationDate: string
}

// ── Helpers ─────────────────────────────────────────

function formatCurrency(n: number): string {
  return '₹' + n.toLocaleString('en-IN')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('hi-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── Loading Skeleton ────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

function MobileCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="border-light-beige">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Main Page ───────────────────────────────────────

export default function DonorsPage() {
  const [donors, setDonors] = useState<DonorGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const perPage = 20

  // ── Fetch all donations and group client-side ──
  const fetchDonors = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all successful donations (large limit for grouping)
      const params = new URLSearchParams()
      params.set('limit', '10000')
      if (search) params.set('search', search)

      const data = await fetchAdmin<DonationsResponse>(
        `/api/admin/donations?${params.toString()}`
      )

      // Group by mobile
      const map = new Map<string, DonorGroup>()

      for (const d of data.donations) {
        const key = d.mobile
        const existing = map.get(key)
        if (existing) {
          existing.totalDonations++
          if (d.paymentStatus === 'SUCCESS') {
            existing.successCount++
            existing.totalAmount += d.amount
          }
          if (d.createdAt > existing.lastDonationDate) {
            existing.lastDonationDate = d.createdAt
            existing.name = d.donorName // use latest name
          }
        } else {
          map.set(key, {
            name: d.donorName,
            mobile: key,
            totalDonations: 1,
            successCount: d.paymentStatus === 'SUCCESS' ? 1 : 0,
            totalAmount: d.paymentStatus === 'SUCCESS' ? d.amount : 0,
            lastDonationDate: d.createdAt,
          })
        }
      }

      // Sort by totalAmount desc
      const grouped = Array.from(map.values()).sort(
        (a, b) => b.totalAmount - a.totalAmount
      )

      setTotalPages(Math.ceil(grouped.length / perPage))
      setDonors(grouped.slice((page - 1) * perPage, page * perPage))
    } catch {
      // handled by fetchAdmin
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    fetchDonors()
  }, [fetchDonors])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p)
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-deep-warm-brown flex items-center gap-2">
          <Users className="h-6 w-6 text-elegant-orange" />
          दानदाता सूची
        </h2>
        <p className="text-sm text-muted-brown mt-0.5">
          दानदाताओं का सारांश — मोबाइल के अनुसार समूहबद्ध
        </p>
      </div>

      {/* Search */}
      <Card className="border-light-beige shadow-sm">
        <CardContent className="p-3 lg:p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-brown" />
              <Input
                placeholder="नाम / मोबाइल खोजें..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 border-light-beige text-deep-warm-brown placeholder:text-muted-brown"
              />
            </div>
            <Button
              size="sm"
              className="bg-elegant-orange hover:bg-elegant-orange/90 text-warm-white border-elegant-orange"
              onClick={handleSearch}
            >
              खोजें
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="border-light-beige shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4">
                <TableSkeleton />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-light-beige bg-light-beige/50 hover:bg-light-beige/50">
                    <TableHead className="text-muted-brown font-medium">नाम</TableHead>
                    <TableHead className="text-muted-brown font-medium">मोबाइल</TableHead>
                    <TableHead className="text-muted-brown font-medium text-center">कुल दान</TableHead>
                    <TableHead className="text-muted-brown font-medium text-right">कुल राशि (सफल)</TableHead>
                    <TableHead className="text-muted-brown font-medium">अंतिम दान तारीख</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donors.length > 0 ? (
                    donors.map((d, idx) => (
                      <TableRow
                        key={d.mobile}
                        className="border-light-beige/50 hover:bg-light-beige/30"
                      >
                        <TableCell className="font-medium text-deep-warm-brown">
                          {d.name}
                        </TableCell>
                        <TableCell className="text-muted-brown font-mono">
                          {d.mobile}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-deep-warm-brown">
                              {d.totalDonations}
                            </span>
                            <span className="text-xs text-muted-brown">
                              {d.successCount} सफल
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-elegant-orange">
                          {formatCurrency(d.totalAmount)}
                        </TableCell>
                        <TableCell className="text-muted-brown">
                          {formatDate(d.lastDonationDate)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-brown">
                        कोई दानदाता नहीं मिला।
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {loading ? (
          <MobileCardSkeleton />
        ) : donors.length > 0 ? (
          <div className="space-y-3">
            {donors.map((d) => (
              <Card key={d.mobile} className="border-light-beige shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="font-medium text-deep-warm-brown truncate">
                        {d.name}
                      </p>
                      <p className="text-xs text-muted-brown font-mono">
                        {d.mobile}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-elegant-orange">
                        {formatCurrency(d.totalAmount)}
                      </p>
                      <p className="text-xs text-muted-brown">
                        {d.successCount} सफल
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-brown">कुल दान</span>
                      <span className="text-deep-warm-brown font-medium">{d.totalDonations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-brown">अंतिम दान</span>
                      <span className="text-deep-warm-brown">{formatDate(d.lastDonationDate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-light-beige">
            <CardContent className="p-8 text-center text-muted-brown">
              कोई दानदाता नहीं मिला।
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-brown">
            पृष्ठ {page} / {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="border-light-beige text-deep-warm-brown hover:bg-light-beige"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">पिछला</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-light-beige text-deep-warm-brown hover:bg-light-beige"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              <span className="hidden sm:inline mr-1">अगला</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
