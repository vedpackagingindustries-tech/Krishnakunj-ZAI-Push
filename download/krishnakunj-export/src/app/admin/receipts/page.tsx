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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Eye, Printer, ChevronLeft, ChevronRight, FileText } from 'lucide-react'

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
  transactionId: string | null
  paymentStatus: string
  createdAt: string
  paidAt: string | null
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

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('hi-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatAmountWords(n: number): string {
  // Simple Hindi number words
  const ones = ['', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ',
    'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
    'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस',
    'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
    'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
    'इक्यावन', 'बावन', 'तिरपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
    'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सड़सठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
    'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी', 'अस्सी',
    'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
    'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे'
  ]

  if (n <= 99) return (ones[n] || String(n)) + ' रुपये'

  // For larger amounts, use English-style with Hindi suffix
  if (n >= 10000000) {
    const crore = Math.floor(n / 10000000)
    const remainder = n % 10000000
    if (remainder === 0) return `${crore} करोड़ रुपये`
    return `${crore} करोड़ ${formatAmountWords(remainder).replace(' रुपये', '')} रुपये`
  }
  if (n >= 100000) {
    const lakh = Math.floor(n / 100000)
    const remainder = n % 100000
    if (remainder === 0) return `${lakh} लाख रुपये`
    return `${lakh} लाख ${formatAmountWords(remainder).replace(' रुपये', '')} रुपये`
  }
  if (n >= 1000) {
    const thousand = Math.floor(n / 1000)
    const remainder = n % 1000
    if (remainder === 0) return `${thousand} हज़ार रुपये`
    return `${thousand} हज़ार ${formatAmountWords(remainder).replace(' रुपये', '')} रुपये`
  }
  const hundred = Math.floor(n / 100)
  const remainder = n % 100
  if (remainder === 0) return `${hundred} सौ रुपये`
  return `${hundred} सौ ${formatAmountWords(remainder).replace(' रुपये', '')} रुपये`
}

// ── Receipt Component ───────────────────────────────

function ReceiptContent({ donation }: { donation: Donation }) {
  const fullAddress = [donation.address, donation.city, donation.district, donation.state, donation.pincode]
    .filter(Boolean)
    .join(', ')

  return (
    <div id="receipt-print" className="bg-warm-white rounded-lg border-2 border-elegant-orange/30 p-6 sm:p-8 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-elegant-orange/10 flex items-center justify-center">
          <span className="text-3xl">🪷</span>
        </div>
        <h3 className="text-xl font-bold text-deep-warm-brown">
          श्री राधे कृष्ण मंदिर
        </h3>
        <p className="text-xs text-muted-brown mt-1">
          मंदिर पता — यहाँ मंदिर का पता आएगा
        </p>
        <div className="mt-2 h-px bg-gradient-to-r from-transparent via-elegant-orange to-transparent" />
        <p className="text-sm font-semibold text-elegant-orange mt-2">
          दान पावती / Donation Receipt
        </p>
      </div>

      {/* Receipt Number + Date */}
      <div className="flex justify-between items-center mb-4 text-xs text-muted-brown border-b border-light-beige/50 pb-2">
        <span>पावती क्र.: <span className="font-mono text-deep-warm-brown">{donation.receiptNumber}</span></span>
        <span>तारीख: <span className="text-deep-warm-brown">{formatFullDate(donation.paidAt || donation.createdAt)}</span></span>
      </div>

      {/* Donor Details */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex gap-2">
          <span className="text-muted-brown shrink-0 w-24">दानदाता:</span>
          <span className="font-medium text-deep-warm-brown">{donation.donorName}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-brown shrink-0 w-24">मोबाइल:</span>
          <span className="text-deep-warm-brown">{donation.mobile}</span>
        </div>
        {donation.email && (
          <div className="flex gap-2">
            <span className="text-muted-brown shrink-0 w-24">ईमेल:</span>
            <span className="text-deep-warm-brown">{donation.email}</span>
          </div>
        )}
        {fullAddress && (
          <div className="flex gap-2">
            <span className="text-muted-brown shrink-0 w-24">पता:</span>
            <span className="text-deep-warm-brown">{fullAddress}</span>
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="bg-elegant-orange/5 rounded-lg p-4 mb-4 border border-elegant-orange/20">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-brown">दान राशि</span>
          <span className="text-2xl font-bold text-elegant-orange">
            {formatCurrency(donation.amount)}
          </span>
        </div>
        <p className="text-xs text-muted-brown mt-1 italic">
          ({formatAmountWords(donation.amount)})
        </p>
      </div>

      {/* Transaction Details */}
      <div className="space-y-2 mb-6 text-sm">
        <div className="flex gap-2">
          <span className="text-muted-brown shrink-0 w-24">भुगतान:</span>
          <span className="text-deep-warm-brown">{donation.paymentMethod || 'ऑनलाइन'}</span>
        </div>
        {donation.transactionId && (
          <div className="flex gap-2">
            <span className="text-muted-brown shrink-0 w-24">Txn ID:</span>
            <span className="text-deep-warm-brown font-mono text-xs">{donation.transactionId}</span>
          </div>
        )}
      </div>

      {/* Blessing */}
      <div className="text-center border-t border-light-beige/50 pt-4">
        <p className="text-sm text-deep-warm-brown italic">
          आपके दान के लिए हार्दिक धन्यवाद।
        </p>
        <p className="text-sm text-deep-warm-brown italic">
          भगवान आपको सदैव सुख-समृद्धि प्रदान करें।
        </p>
        <p className="mt-3 text-lg font-bold text-elegant-orange">
          जय श्री कृष्ण / जय श्री राधे 🙏
        </p>
      </div>
    </div>
  )
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
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Main Page ───────────────────────────────────────

export default function ReceiptsPage() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const limit = 20

  const fetchReceipts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('status', 'SUCCESS')
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)

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
  }, [page, search])

  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleViewReceipt = (d: Donation) => {
    setSelectedDonation(d)
    setDialogOpen(true)
  }

  const handlePrint = () => {
    window.print()
  }

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p)
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-deep-warm-brown flex items-center gap-2">
          <FileText className="h-6 w-6 text-elegant-orange" />
          पावती दर्शक
        </h2>
        <p className="text-sm text-muted-brown mt-0.5">
          सफल दान पावतियाँ देखें और प्रिंट करें
        </p>
      </div>

      {/* Search */}
      <Card className="border-light-beige shadow-sm">
        <CardContent className="p-3 lg:p-4">
          <div className="flex gap-2">
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
                    <TableHead className="text-muted-brown font-medium">पावती क्रमांक</TableHead>
                    <TableHead className="text-muted-brown font-medium">दानदाता</TableHead>
                    <TableHead className="text-muted-brown font-medium">मोबाइल</TableHead>
                    <TableHead className="text-muted-brown font-medium text-right">राशि</TableHead>
                    <TableHead className="text-muted-brown font-medium">तारीख</TableHead>
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
                        <TableCell className="text-right font-medium text-elegant-orange">
                          {formatCurrency(d.amount)}
                        </TableCell>
                        <TableCell className="text-muted-brown">
                          {formatDate(d.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-elegant-orange hover:text-elegant-orange/80 hover:bg-elegant-orange/10"
                            onClick={() => handleViewReceipt(d)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            पावती
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-brown">
                        कोई सफल दान पावती नहीं मिली।
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
                    <div className="text-lg font-bold text-elegant-orange shrink-0">
                      {formatCurrency(d.amount)}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-brown">मोबाइल</span>
                      <span className="text-deep-warm-brown">{d.mobile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-brown">तारीख</span>
                      <span className="text-deep-warm-brown">{formatDate(d.createdAt)}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-light-beige/50">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-light-beige text-elegant-orange hover:bg-elegant-orange/10"
                      onClick={() => handleViewReceipt(d)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      पावती देखें
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-light-beige">
            <CardContent className="p-8 text-center text-muted-brown">
              कोई सफल दान पावती नहीं मिली।
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

      {/* Receipt Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto print:p-0 print:max-w-full print:rounded-none print:border-0">
          <DialogHeader className="print:hidden">
            <DialogTitle className="text-deep-warm-brown">
              दान पावती
            </DialogTitle>
          </DialogHeader>
          {selectedDonation && <ReceiptContent donation={selectedDonation} />}
          <div className="flex justify-end gap-2 mt-4 print:hidden">
            <Button
              variant="outline"
              className="border-light-beige text-deep-warm-brown hover:bg-light-beige"
              onClick={() => setDialogOpen(false)}
            >
              बंद करें
            </Button>
            <Button
              className="bg-elegant-orange hover:bg-elegant-orange/90 text-warm-white border-elegant-orange"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-1" />
              प्रिंट करें
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
