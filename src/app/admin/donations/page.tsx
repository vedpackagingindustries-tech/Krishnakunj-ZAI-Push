'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdmin, getAdminToken } from '@/lib/admin-auth'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Search, Download, Eye, ChevronLeft, ChevronRight, Filter, X, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

// ── Types ───────────────────────────────────────────

interface Donation {
  id: string
  receiptNumber: string
  donorName: string
  mobile: string
  email: string | null
  address: string | null
  city: string | null
  district: string | null
  state: string | null
  pincode: string | null
  amount: number
  currency: string
  paymentMethod: string | null
  paymentOrderId: string | null
  transactionId: string | null
  paymentStatus: string
  createdAt: string
  paidAt: string | null
  receiptGeneratedAt: string | null
}

interface DonationsResponse {
  donations: Donation[]
  total: number
  page: number
  limit: number
  totalPages: number
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
          PENDING
        </span>
      )
    case 'FAILED':
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          FAILED
        </span>
      )
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
          CANCELLED
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

// ── Loading Skeleton ────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-12 w-full" />
        </div>
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

// ── Detail Dialog ───────────────────────────────────

function DonationDetailDialog({
  donation,
  open,
  onOpenChange,
  onVerified,
}: {
  donation: Donation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified?: () => void
}) {
  const [txnId, setTxnId] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const [actionError, setActionError] = useState('')

  if (!donation) return null

  const canVerify = donation.paymentStatus === 'PENDING' || donation.paymentStatus === 'PROCESSING'
  const canReject = donation.paymentStatus !== 'SUCCESS'

  const handleVerify = async () => {
    setActionLoading(true)
    setActionMsg('')
    setActionError('')
    try {
      const res = await fetchAdmin<{ success: boolean; message?: string; error?: string }>(
        `/api/admin/donations/${donation.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action: 'verify', transactionId: txnId.trim() || undefined }),
        }
      )
      if (res.success) {
        setActionMsg(res.message || 'सफलतापूर्वक सत्यापित।')
        onVerified?.()
      } else {
        setActionError(res.error || 'त्रुटि।')
      }
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'त्रुटि हुई।')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    setActionLoading(true)
    setActionMsg('')
    setActionError('')
    try {
      const res = await fetchAdmin<{ success: boolean; message?: string; error?: string }>(
        `/api/admin/donations/${donation.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action: 'reject' }),
        }
      )
      if (res.success) {
        setActionMsg(res.message || 'अस्वीकार किया गया।')
        onVerified?.()
      } else {
        setActionError(res.error || 'त्रुटि।')
      }
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'त्रुटि हुई।')
    } finally {
      setActionLoading(false)
    }
  }

  const details = [
    { label: 'पावती क्रमांक', value: donation.receiptNumber },
    { label: 'दानदाता', value: donation.donorName },
    { label: 'मोबाइल', value: donation.mobile },
    { label: 'ईमेल', value: donation.email || '—' },
    { label: 'पता', value: [donation.address, donation.city, donation.district, donation.state, donation.pincode].filter(Boolean).join(', ') || '—' },
    { label: 'राशि', value: formatCurrency(donation.amount) },
    { label: 'भुगतान माध्यम', value: donation.paymentMethod || '—' },
    { label: 'Transaction ID', value: donation.transactionId || '—' },
    { label: 'स्थिति', value: donation.paymentStatus, badge: true },
    { label: 'निर्माण तिथि', value: formatDate(donation.createdAt) },
    { label: 'भुगतान तिथि', value: donation.paidAt ? formatDate(donation.paidAt) : '—' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-deep-warm-brown">
            दान विवरण
          </DialogTitle>
          <DialogDescription className="text-muted-brown">
            पावती क्रमांक: {donation.receiptNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {details.map((item) => (
            <div
              key={item.label}
              className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 border-b border-light-beige/50 pb-2 last:border-0 last:pb-0"
            >
              <span className="text-xs font-medium text-muted-brown shrink-0 sm:w-32">
                {item.label}
              </span>
              <span className="text-sm text-deep-warm-brown font-medium">
                {item.badge ? getStatusBadge(item.value) : item.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Admin Verification Actions ── */}
        {canVerify && (
          <div className="mt-4 pt-4 border-t border-light-beige space-y-3">
            <p className="text-sm font-semibold text-deep-warm-brown">भुगतान सत्यापन</p>
            <div>
              <label htmlFor="txn-id-input" className="text-xs font-medium text-muted-brown block mb-1">
                Transaction / Reference ID (वैकल्पिक)
              </label>
              <Input
                id="txn-id-input"
                placeholder="बैंक Transaction ID दर्ज करें"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                className="border-light-beige text-deep-warm-brown text-sm"
                maxLength={100}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleVerify}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                सत्यापित (SUCCESS)
              </Button>
              {canReject && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  अस्वीकार (FAILED)
                </Button>
              )}
            </div>
          </div>
        )}

        {donation.paymentStatus === 'SUCCESS' && (
          <div className="mt-4 pt-3 border-t border-light-beige">
            <p className="text-xs text-green-700 font-medium flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              यह दान पहले ही सत्यापित हो चुका है।
            </p>
          </div>
        )}

        {actionMsg && (
          <p className="mt-2 text-xs text-green-700 font-medium">{actionMsg}</p>
        )}
        {actionError && (
          <p className="mt-2 text-xs text-red-600 font-medium">{actionError}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ───────────────────────────────────────

export default function DonationsPage() {
  // State
  const [donations, setDonations] = useState<Donation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const limit = 20

  // ── Fetch donations ──
  const fetchDonations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (amountMin) params.set('amountMin', amountMin)
      if (amountMax) params.set('amountMax', amountMax)
      if (sortBy) params.set('sortBy', sortBy)
      if (sortOrder) params.set('sortOrder', sortOrder)

      const data = await fetchAdmin<DonationsResponse>(
        `/api/admin/donations?${params.toString()}`
      )
      setDonations(data.donations)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      // handled by fetchAdmin
    } finally {
      setLoading(false)
    }
  }, [page, search, status, dateFrom, dateTo, amountMin, amountMax, sortBy, sortOrder])

  useEffect(() => {
    fetchDonations()
  }, [fetchDonations])

  // ── Search handler (debounced via button) ──
  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  // ── Status change ──
  const handleStatusChange = (val: string) => {
    setStatus(val === 'all' ? '' : val)
    setPage(1)
  }

  // ── Export (blob download with auth header) ──
  const handleExport = async (format: 'csv' | 'excel') => {
    const params = new URLSearchParams()
    params.set('format', format)
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    if (amountMin) params.set('amountMin', amountMin)
    if (amountMax) params.set('amountMax', amountMax)
    if (sortBy) params.set('sortBy', sortBy)
    if (sortOrder) params.set('sortOrder', sortOrder)

    try {
      const token = getAdminToken()
      if (!token) return
      const res = await fetch(`/api/admin/donations/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const ext = format === 'excel' ? 'xlsx' : 'csv'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `donations_${new Date().toISOString().slice(0, 10)}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // handled silently
    }
  }

  // ── View detail ──
  const handleView = (donation: Donation) => {
    setSelectedDonation(donation)
    setDetailOpen(true)
  }

  // ── Pagination ──
  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p)
  }

  // ── Active filter count ──
  const activeFilterCount = [search, status, dateFrom, dateTo, amountMin, amountMax].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-deep-warm-brown">
            दान प्रबंधन
          </h2>
          <p className="text-sm text-muted-brown mt-0.5">
            कुल {total.toLocaleString('en-IN')} दान
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-light-beige text-deep-warm-brown hover:bg-light-beige"
            onClick={() => handleExport('csv')}
          >
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-light-beige text-deep-warm-brown hover:bg-light-beige"
            onClick={() => handleExport('excel')}
          >
            <Download className="h-4 w-4 mr-1" />
            Excel
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-light-beige shadow-sm">
        <CardContent className="p-3 lg:p-4">
          <div className="flex flex-col gap-3">
            {/* Search + status row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-brown" />
                <Input
                  placeholder="नाम / मोबाइल / पावती खोजें..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 border-light-beige text-deep-warm-brown placeholder:text-muted-brown"
                />
              </div>
              <Select value={status || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-40 border-light-beige text-deep-warm-brown">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">सभी</SelectItem>
                  <SelectItem value="SUCCESS">सफल</SelectItem>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="FAILED">FAILED</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  size="sm"
                  className={
                    showFilters
                      ? 'bg-elegant-orange hover:bg-elegant-orange/90 text-warm-white border-elegant-orange'
                      : 'border-light-beige text-deep-warm-brown hover:bg-light-beige'
                  }
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">फ़िल्टर</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-soft-saffron text-[10px] font-bold text-warm-white">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-light-beige text-deep-warm-brown hover:bg-light-beige"
                  onClick={handleSearch}
                >
                  खोजें
                </Button>
              </div>
            </div>

            {/* Advanced filters */}
            {showFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-light-beige/50">
                <div>
                  <label className="text-xs text-muted-brown mb-1 block">तारीख से</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                    className="border-light-beige text-deep-warm-brown text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-brown mb-1 block">तारीख तक</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                    className="border-light-beige text-deep-warm-brown text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-brown mb-1 block">न्यूनतम राशि</label>
                  <Input
                    type="number"
                    placeholder="₹"
                    value={amountMin}
                    onChange={(e) => { setAmountMin(e.target.value); setPage(1) }}
                    className="border-light-beige text-deep-warm-brown text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-brown mb-1 block">अधिकतम राशि</label>
                  <Input
                    type="number"
                    placeholder="₹"
                    value={amountMax}
                    onChange={(e) => { setAmountMax(e.target.value); setPage(1) }}
                    className="border-light-beige text-deep-warm-brown text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-brown mb-1 block">क्रमबद्ध</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="border-light-beige text-deep-warm-brown text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">तारीख</SelectItem>
                      <SelectItem value="amount">राशि</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-brown mb-1 block">क्रम</label>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="border-light-beige text-deep-warm-brown text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">नवीनतम</SelectItem>
                      <SelectItem value="asc">पुराना</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-light-beige text-muted-brown hover:bg-light-beige"
                    onClick={() => {
                      setSearchInput('')
                      setSearch('')
                      setStatus('')
                      setDateFrom('')
                      setDateTo('')
                      setAmountMin('')
                      setAmountMax('')
                      setSortBy('createdAt')
                      setSortOrder('desc')
                      setPage(1)
                    }}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    सभी फ़िल्टर हटाएं
                  </Button>
                </div>
              </div>
            )}
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
                    <TableHead className="text-muted-brown font-medium">पावती क्रमांक</TableHead>
                    <TableHead className="text-muted-brown font-medium">दानदाता</TableHead>
                    <TableHead className="text-muted-brown font-medium">मोबाइल</TableHead>
                    <TableHead className="text-muted-brown font-medium">राशि</TableHead>
                    <TableHead className="text-muted-brown font-medium">भुगतान माध्यम</TableHead>
                    <TableHead className="text-muted-brown font-medium">Transaction ID</TableHead>
                    <TableHead className="text-muted-brown font-medium">तारीख</TableHead>
                    <TableHead className="text-muted-brown font-medium">स्थिति</TableHead>
                    <TableHead className="text-muted-brown font-medium">कार्य</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.length > 0 ? (
                    donations.map((d) => (
                      <TableRow
                        key={d.id}
                        className="border-light-beige/50 hover:bg-light-beige/30"
                      >
                        <TableCell className="font-mono text-xs text-deep-warm-brown">
                          {d.receiptNumber}
                        </TableCell>
                        <TableCell className="font-medium text-deep-warm-brown">
                          {d.donorName}
                        </TableCell>
                        <TableCell className="text-muted-brown">
                          {d.mobile}
                        </TableCell>
                        <TableCell className="font-medium text-deep-warm-brown">
                          {formatCurrency(d.amount)}
                        </TableCell>
                        <TableCell className="text-muted-brown">
                          {d.paymentMethod || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-brown">
                          {d.transactionId || '—'}
                        </TableCell>
                        <TableCell className="text-muted-brown">
                          {formatDate(d.createdAt)}
                        </TableCell>
                        <TableCell>{getStatusBadge(d.paymentStatus)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-elegant-orange hover:text-elegant-orange/80 hover:bg-elegant-orange/10"
                            onClick={() => handleView(d)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-brown">
                        कोई दान नहीं मिला।
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
        ) : donations.length > 0 ? (
          <div className="space-y-3">
            {donations.map((d) => (
              <Card key={d.id} className="border-light-beige shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="font-medium text-deep-warm-brown truncate">
                        {d.donorName}
                      </p>
                      <p className="text-xs text-muted-brown font-mono">
                        {d.receiptNumber}
                      </p>
                    </div>
                    {getStatusBadge(d.paymentStatus)}
                  </div>

                  <div className="text-lg font-bold text-elegant-orange mb-2">
                    {formatCurrency(d.amount)}
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-brown">मोबाइल</span>
                      <span className="text-deep-warm-brown">{d.mobile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-brown">भुगतान</span>
                      <span className="text-deep-warm-brown">{d.paymentMethod || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-brown">तारीख</span>
                      <span className="text-deep-warm-brown">{formatDate(d.createdAt)}</span>
                    </div>
                    {d.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-muted-brown">Txn ID</span>
                        <span className="text-deep-warm-brown font-mono text-xs truncate ml-2">
                          {d.transactionId}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-light-beige/50">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-light-beige text-elegant-orange hover:bg-elegant-orange/10"
                      onClick={() => handleView(d)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      विवरण देखें
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-light-beige">
            <CardContent className="p-8 text-center text-muted-brown">
              कोई दान नहीं मिला।
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

      {/* Detail Dialog */}
      <DonationDetailDialog
        donation={selectedDonation}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onVerified={() => { fetchDonations(); setDetailOpen(false); setSelectedDonation(null); }}
      />
    </div>
  )
}
