'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdmin } from '@/lib/admin-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Save, RefreshCw, Eye } from 'lucide-react'

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

const FOOTER_KEYS = [
  { key: 'footer_text', label: 'फुटर टेक्स्ट', type: 'richtext' },
  { key: 'footer_copyright', label: 'कॉपीराइट', type: 'text' },
  { key: 'footer_link1_text', label: 'लिंक 1 टेक्स्ट', type: 'text' },
  { key: 'footer_link1_url', label: 'लिंक 1 URL', type: 'text' },
  { key: 'footer_link2_text', label: 'लिंक 2 टेक्स्ट', type: 'text' },
  { key: 'footer_link2_url', label: 'लिंक 2 URL', type: 'text' },
  { key: 'footer_link3_text', label: 'लिंक 3 टेक्स्ट', type: 'text' },
  { key: 'footer_link3_url', label: 'लिंक 3 URL', type: 'text' },
]

// ── Main Component ──────────────────────────────────

export default function FooterPage() {
  const [contents, setContents] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set())
  const [showPreview, setShowPreview] = useState(false)

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

  const handleSaveAll = async () => {
    try {
      setSaving(true)
      await Promise.all(
        FOOTER_KEYS.map(({ key }) =>
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

  // Get links for preview
  const getLinks = () => {
    const links: { text: string; url: string }[] = []
    for (let i = 1; i <= 3; i++) {
      const text = contents[`footer_link${i}_text`]?.trim()
      const url = contents[`footer_link${i}_url`]?.trim()
      if (text && url) {
        links.push({ text, url })
      }
    }
    return links
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elegant-orange/10">
            <Save className="h-5 w-5 text-elegant-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep-warm-brown">फुटर प्रबंधन</h1>
            <p className="text-sm text-muted-brown">वेबसाइट फुटर संपादित करें</p>
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
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="border-light-beige text-muted-brown hover:bg-warm-ivory"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'संपादन' : 'पूर्वावलोकन'}
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-elegant-orange hover:bg-elegant-orange/90 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'सहेज रहे हैं...' : 'सहेजें'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Card className="border-light-beige"><CardContent className="p-6 space-y-4">{Array.from({length: 6}).map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
        </div>
      ) : showPreview ? (
        /* Preview */
        <Card className="border-light-beige">
          <CardHeader className="pb-3">
            <CardTitle className="text-deep-warm-brown">फुटर पूर्वावलोकन</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-deep-warm-brown p-6 text-center">
              {contents['footer_text'] && (
                <p className="text-sm text-light-beige/80 mb-4 whitespace-pre-line">{contents['footer_text']}</p>
              )}
              <div className="flex items-center justify-center gap-4 mb-4">
                {getLinks().map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-soft-saffron hover:text-light-saffron underline"
                  >
                    {link.text}
                  </a>
                ))}
              </div>
              <Separator className="bg-deep-warm-brown/50 mb-4" />
              <p className="text-xs text-light-beige/60">
                {contents['footer_copyright'] || '© 2024 मंदिर' }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-light-beige">
          <CardContent className="space-y-5 p-6">
            {FOOTER_KEYS.map(({ key, label, type }) => (
              <div key={key} className="space-y-2">
                <Label className="text-deep-warm-brown">{label}</Label>
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