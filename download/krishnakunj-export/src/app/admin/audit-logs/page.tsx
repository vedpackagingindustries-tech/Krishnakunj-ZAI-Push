'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdmin } from '@/lib/admin-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { ScrollText, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

// ── Types ───────────────────────────────────────────

interface AuditLog {
  id: string
  adminId: string | null
  adminName: string
  action: string
  entityType: string | null
  entityId: string | null
  metadata: string | null
  ipAddress: string | null
  createdAt: string
}

interface LogsResponse {
  logs: AuditLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'बनाएं',
  UPDATE: 'अपडेट',
  DELETE: 'हटाएं',
  UPSERT: 'सहेजें',
  UPLOAD: 'अपलोड',
  LOGIN: 'लॉगिन',
  LOGOUT: 'लॉगआउट',
  SETUP: 'सेटअप',
}

const ENTITY_LABELS: Record<string, string> = {
  donation: 'दान',
  official: 'पदाधिकारी',
  media: 'मीडिया',
  video: 'वीडियो',
  content: 'कंटेंट',
  setting: 'सेटिंग',
  admin: 'एडमिन',
  construction: 'निर्माण',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('hi-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getActionBadge(action: string) {
  const colors: Record<string, string> = {
    CREATE: 'bg-elegant-orange/10 text-elegant-orange',
    UPDATE: 'bg-soft-saffron/10 text-soft-saffron',
    DELETE: 'bg-deep-maroon/10 text-deep-maroon',
    UPSERT: 'bg-elegant-orange/10 text-elegant-orange',
    UPLOAD: 'bg-soft-saffron/10 text-soft-saffron',
    LOGIN: 'bg-elegant-orange/10 text-elegant-orange',
    LOGOUT: 'bg-light-beige text-muted-brown',
    SETUP: 'bg-elegant-orange/10 text-elegant-orange',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[action] || 'bg-light-beige text-muted-brown'}`}>
      {ACTION_LABELS[action] || action}
    </span>
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

// ── Main Component ──────────────────────────────────

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')

  const loadLogs = useCallback(async (p: number, action: string, entityType: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (action && action !== 'all') params.set('action', action)
      if (entityType && entityType !== 'all') params.set('entityType', entityType)

      const data = await fetchAdmin<LogsResponse>(`/api/admin/audit-logs?${params.toString()}`)
      setLogs(data.logs)
      setTotalPages(data.totalPages)
      setTotal(data.total)
      setPage(data.page)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLogs(1, actionFilter, entityFilter)
  }, [loadLogs, actionFilter, entityFilter])

  const handleActionChange = (value: string) => {
    setActionFilter(value)
    setPage(1)
  }

  const handleEntityChange = (value: string) => {
    setEntityFilter(value)
    setPage(1)
  }

  const startIndex = (page - 1) * 20

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elegant-orange/10">
            <ScrollText className="h-5 w-5 text-elegant-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep-warm-brown">ऑडिट लॉग</h1>
            <p className="text-sm text-muted-brown">सभी प्रशासनिक गतिविधियों का रिकॉर्ड</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-light-beige">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-brown" />
              <span className="text-sm text-muted-brown">फ़िल्टर:</span>
            </div>
            <Select value={actionFilter} onValueChange={handleActionChange}>
              <SelectTrigger className="w-full border-light-beige sm:w-40">
                <SelectValue placeholder="कार्रवाई" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">सभी कार्रवाई</SelectItem>
                <SelectItem value="CREATE">बनाएं</SelectItem>
                <SelectItem value="UPDATE">अपडेट</SelectItem>
                <SelectItem value="DELETE">हटाएं</SelectItem>
                <SelectItem value="UPLOAD">अपलोड</SelectItem>
                <SelectItem value="LOGIN">लॉगिन</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={handleEntityChange}>
              <SelectTrigger className="w-full border-light-beige sm:w-40">
                <SelectValue placeholder="इकाई" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">सभी इकाई</SelectItem>
                <SelectItem value="donation">दान</SelectItem>
                <SelectItem value="official">पदाधिकारी</SelectItem>
                <SelectItem value="media">मीडिया</SelectItem>
                <SelectItem value="video">वीडियो</SelectItem>
                <SelectItem value="content">कंटेंट</SelectItem>
                <SelectItem value="setting">सेटिंग</SelectItem>
                <SelectItem value="admin">एडमिन</SelectItem>
                <SelectItem value="construction">निर्माण</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-brown">कुल: {total}</span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <Card className="border-light-beige">
          <CardContent className="p-4">
            <TableSkeleton />
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card className="border-light-beige">
          <CardContent className="py-12 text-center">
            <ScrollText className="mx-auto h-12 w-12 text-muted-brown/40" />
            <p className="mt-3 text-muted-brown">कोई ऑडिट लॉग नहीं मिला।</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="border-light-beige hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-light-beige hover:bg-light-beige/50">
                    <TableHead className="text-deep-warm-brown font-semibold">क्रमांक</TableHead>
                    <TableHead className="text-deep-warm-brown font-semibold">एडमिन</TableHead>
                    <TableHead className="text-deep-warm-brown font-semibold">कार्रवाई</TableHead>
                    <TableHead className="text-deep-warm-brown font-semibold">इकाई</TableHead>
                    <TableHead className="text-deep-warm-brown font-semibold">समय</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log, idx) => (
                    <TableRow key={log.id} className="border-light-beige hover:bg-warm-ivory">
                      <TableCell className="text-muted-brown">{startIndex + idx + 1}</TableCell>
                      <TableCell className="font-medium text-deep-warm-brown">{log.adminName || '—'}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="text-muted-brown">
                        {ENTITY_LABELS[log.entityType || ''] || log.entityType || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-brown">{formatDate(log.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {logs.map((log, idx) => (
              <Card key={log.id} className="border-light-beige">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-brown">#{startIndex + idx + 1}</p>
                      <p className="font-medium text-deep-warm-brown">{log.adminName || '—'}</p>
                    </div>
                    {getActionBadge(log.action)}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-muted-brown">
                      {ENTITY_LABELS[log.entityType || ''] || log.entityType || ''}
                    </span>
                    <span className="text-muted-brown">•</span>
                    <span className="text-xs text-muted-brown">{formatDate(log.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => loadLogs(page - 1, actionFilter, entityFilter)}
                className="border-light-beige text-muted-brown"
              >
                <ChevronLeft className="h-4 w-4" />
                पिछला
              </Button>
              <span className="text-sm text-muted-brown">{page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => loadLogs(page + 1, actionFilter, entityFilter)}
                className="border-light-beige text-muted-brown"
              >
                अगला
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}