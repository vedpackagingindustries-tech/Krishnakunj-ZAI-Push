'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdmin } from '@/lib/admin-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Landmark, Save, RefreshCw } from 'lucide-react'

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

const TEMPLE_KEYS = [
  { key: 'temple_name', label: 'मंदिर का नाम', type: 'text' },
  { key: 'temple_address', label: 'पता', type: 'text' },
  { key: 'temple_description', label: 'विवरण', type: 'richtext' },
  { key: 'temple_history', label: 'इतिहास', type: 'richtext' },
  { key: 'temple_deity', label: 'देवता', type: 'text' },
  { key: 'temple_established', label: 'स्थापना वर्ष', type: 'text' },
]

// ── Main Component ──────────────────────────────────

export default function TempleInfoPage() {
  const [contents, setContents] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set())

  const loadContent = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAdmin<{ contents: CmsContent[] }>('/api/admin/content')
      const map: Record<string, string> = {}
      for (const c of data.contents) {
        map[c.key] = c.value
      }
      setContents(map)
      setDirtyKeys(new Set())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  const setValue = (key: string, value: string) => {
    setContents((prev) => ({ ...prev, [key]: value }))
    setDirtyKeys((prev) => new Set(prev).add(key))
  }

  const handleSave = async (key: string) => {
    try {
      setSaving(true)
      await fetchAdmin(`/api/admin/content/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value: contents[key] || '' }),
      })
      setDirtyKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAll = async () => {
    try {
      setSaving(true)
      await Promise.all(
        TEMPLE_KEYS.map(({ key }) =>
          fetchAdmin(`/api/admin/content/${key}`, {
            method: 'PUT',
            body: JSON.stringify({ value: contents[key] || '' }),
          })
        )
      )
      loadContent()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elegant-orange/10">
            <Landmark className="h-5 w-5 text-elegant-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep-warm-brown">मंदिर जानकारी</h1>
            <p className="text-sm text-muted-brown">मंदिर की विस्तृत जानकारी संपादित करें</p>
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
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-elegant-orange hover:bg-elegant-orange/90 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'सहेज रहे हैं...' : 'सभी सहेजें'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Card className="border-light-beige"><CardContent className="p-6 space-y-4">{Array.from({length: 4}).map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
        </div>
      ) : (
        <Card className="border-light-beige">
          <CardContent className="space-y-5 p-6">
            {TEMPLE_KEYS.map(({ key, label, type }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-deep-warm-brown">{label}</Label>
                  {dirtyKeys.has(key) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSave(key)}
                      disabled={saving}
                      className="h-7 text-xs text-elegant-orange hover:bg-elegant-orange/10"
                    >
                      सहेजें
                    </Button>
                  )}
                </div>
                {type === 'richtext' ? (
                  <Textarea
                    value={contents[key] || ''}
                    onChange={(e) => setValue(key, e.target.value)}
                    rows={4}
                    className="border-light-beige focus:border-elegant-orange"
                  />
                ) : (
                  <Input
                    value={contents[key] || ''}
                    onChange={(e) => setValue(key, e.target.value)}
                    className="border-light-beige focus:border-elegant-orange"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}