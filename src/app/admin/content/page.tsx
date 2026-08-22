'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdmin } from '@/lib/admin-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Save, FileText, RefreshCw } from 'lucide-react'

// ── Types ───────────────────────────────────────────

interface CmsContent {
  id: string
  key: string
  value: string
  type: string
  label: string
  group: string
  createdAt: string
  updatedAt: string
}

const GROUP_LABELS: Record<string, string> = {
  hero: 'हीरो',
  temple: 'मंदिर जानकारी',
  donation: 'दान',
  footer: 'फुटर',
  general: 'सामान्य',
}

const GROUP_COLORS: Record<string, string> = {
  hero: 'bg-elegant-orange/10 text-elegant-orange border-elegant-orange/20',
  temple: 'bg-soft-saffron/10 text-soft-saffron border-soft-saffron/20',
  donation: 'bg-deep-maroon/10 text-deep-maroon border-deep-maroon/20',
  footer: 'bg-muted-brown/10 text-muted-brown border-muted-brown/20',
  general: 'bg-light-beige text-deep-warm-brown border-light-beige',
}

// ── Loading Skeleton ────────────────────────────────

function GroupSkeleton() {
  return (
    <Card className="border-light-beige">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Main Component ──────────────────────────────────

export default function ContentPage() {
  const [contents, setContents] = useState<CmsContent[]>([])
  const [grouped, setGrouped] = useState<Record<string, CmsContent[]>>({})
  const [loading, setLoading] = useState(true)
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())
  const [savingAll, setSavingAll] = useState(false)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})

  const loadContent = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAdmin<{ contents: CmsContent[]; grouped: Record<string, CmsContent[]> }>('/api/admin/content')
      setContents(data.contents)
      setGrouped(data.grouped)
      setEditedValues({})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  const getValue = (item: CmsContent): string => {
    return editedValues[item.key] !== undefined ? editedValues[item.key] : item.value
  }

  const setValue = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }))
  }

  const isDirty = (key: string, item: CmsContent): boolean => {
    return editedValues[key] !== undefined && editedValues[key] !== item.value
  }

  const saveSingle = async (item: CmsContent) => {
    const value = getValue(item)
    if (value === item.value) return

    try {
      setSavingKeys((prev) => new Set(prev).add(item.key))
      await fetchAdmin(`/api/admin/content/${item.key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      })
      loadContent()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev)
        next.delete(item.key)
        return next
      })
    }
  }

  const saveAll = async () => {
    const dirtyKeys = Object.keys(editedValues).filter(
      (key) => {
        const item = contents.find((c) => c.key === key)
        return item && editedValues[key] !== item.value
      }
    )

    if (dirtyKeys.length === 0) return

    try {
      setSavingAll(true)
      await Promise.all(
        dirtyKeys.map((key) =>
          fetchAdmin(`/api/admin/content/${key}`, {
            method: 'PUT',
            body: JSON.stringify({ value: editedValues[key] }),
          })
        )
      )
      loadContent()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingAll(false)
    }
  }

  const totalDirty = Object.keys(editedValues).filter((key) => {
    const item = contents.find((c) => c.key === key)
    return item && editedValues[key] !== item.value
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elegant-orange/10">
            <FileText className="h-5 w-5 text-elegant-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep-warm-brown">वेबसाइट कंटेंट</h1>
            <p className="text-sm text-muted-brown">वेबसाइट के सभी टेक्स्ट कंटेंट का प्रबंधन करें</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadContent}
            className="border-light-beige text-muted-brown hover:bg-warm-ivory"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            रीलोड
          </Button>
          <Button
            onClick={saveAll}
            disabled={savingAll || totalDirty === 0}
            className="bg-elegant-orange hover:bg-elegant-orange/90 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {savingAll ? 'सहेज रहे हैं...' : `सभी सहेजें (${totalDirty})`}
          </Button>
        </div>
      </div>

      {/* Content Groups */}
      {loading ? (
        <div className="space-y-6">
          <GroupSkeleton />
          <GroupSkeleton />
        </div>
      ) : contents.length === 0 ? (
        <Card className="border-light-beige">
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-brown/40" />
            <p className="mt-3 text-muted-brown">कोई कंटेंट नहीं मिला। CMS कुंजियाँ सीड की जानी हैं।</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([group, items]) => (
          <Card key={group} className="border-light-beige">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${
                    GROUP_COLORS[group] || GROUP_COLORS.general
                  }`}
                >
                  {GROUP_LABELS[group] || group}
                </span>
                <span className="text-xs text-muted-brown">({items.length} आइटम)</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-deep-warm-brown">{item.label || item.key}</Label>
                    {isDirty(item.key, item) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => saveSingle(item)}
                        disabled={savingKeys.has(item.key)}
                        className="h-7 text-xs text-elegant-orange hover:bg-elegant-orange/10"
                      >
                        {savingKeys.has(item.key) ? 'सहेज रहे...' : 'सहेजें'}
                      </Button>
                    )}
                  </div>
                  {item.type === 'richtext' || item.value.length > 100 ? (
                    <Textarea
                      value={getValue(item)}
                      onChange={(e) => setValue(item.key, e.target.value)}
                      rows={4}
                      className="border-light-beige focus:border-elegant-orange text-sm"
                    />
                  ) : (
                    <Input
                      value={getValue(item)}
                      onChange={(e) => setValue(item.key, e.target.value)}
                      className="border-light-beige focus:border-elegant-orange text-sm"
                    />
                  )}
                  <p className="text-[10px] text-muted-brown/60">{item.key}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}