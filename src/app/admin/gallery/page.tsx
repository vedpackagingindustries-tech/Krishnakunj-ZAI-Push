'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdmin } from '@/lib/admin-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Image, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react'

// ── Types ───────────────────────────────────────────

interface Media {
  id: string
  type: string
  url: string
  thumbnailUrl: string | null
  title: string
  description: string
  category: string
  displayOrder: number
  isPublished: boolean
  isHero: boolean
  createdAt: string
  updatedAt: string
}

interface MediaResponse {
  media: Media[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ── Main Component ──────────────────────────────────

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true)
      // Load all published photos for gallery management
      let allPhotos: Media[] = []
      let page = 1
      let hasMore = true
      while (hasMore) {
        const data = await fetchAdmin<MediaResponse>(`/api/admin/media?page=${page}&limit=50`)
        allPhotos = [...allPhotos, ...data.media]
        hasMore = page < data.totalPages
        page++
      }
      setPhotos(allPhotos)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  const togglePublish = async (item: Media) => {
    try {
      setSaving(true)
      await fetchAdmin(`/api/admin/media/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished: !item.isPublished }),
      })
      loadPhotos()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...photos]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newPhotos.length) return

    const temp = newPhotos[index].displayOrder
    newPhotos[index].displayOrder = newPhotos[swapIndex].displayOrder
    newPhotos[swapIndex].displayOrder = temp

    try {
      setSaving(true)
      await Promise.all([
        fetchAdmin(`/api/admin/media/${newPhotos[index].id}`, {
          method: 'PUT',
          body: JSON.stringify({ displayOrder: newPhotos[index].displayOrder }),
        }),
        fetchAdmin(`/api/admin/media/${newPhotos[swapIndex].id}`, {
          method: 'PUT',
          body: JSON.stringify({ displayOrder: newPhotos[swapIndex].displayOrder }),
        }),
      ])
      loadPhotos()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const publishedPhotos = photos.filter((p) => p.isPublished)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elegant-orange/10">
            <Image className="h-5 w-5 text-elegant-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep-warm-brown">गैलरी</h1>
            <p className="text-sm text-muted-brown">प्रकाशित फोटो का क्रम और दृश्यता प्रबंधित करें ({publishedPhotos.length} फोटो)</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-light-beige overflow-hidden">
              <Skeleton className="aspect-square w-full" />
            </Card>
          ))}
        </div>
      ) : publishedPhotos.length === 0 ? (
        <Card className="border-light-beige">
          <CardContent className="py-12 text-center">
            <Image className="mx-auto h-12 w-12 text-muted-brown/40" />
            <p className="mt-3 text-muted-brown">कोई प्रकाशित फोटो नहीं मिली। फोटो प्रबंधन से फोटो अपलोड और प्रकाशित करें।</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {publishedPhotos.map((item, idx) => (
            <Card key={item.id} className="border-light-beige overflow-hidden">
              <div className="relative aspect-square overflow-hidden bg-warm-ivory">
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center rounded-full bg-elegant-orange/90 px-2 py-0.5 text-xs font-medium text-white">
                    #{idx + 1}
                  </span>
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="truncate text-sm font-medium text-deep-warm-brown">{item.title || 'शीर्षक नहीं'}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={idx === 0 || saving}
                      onClick={() => moveOrder(idx, 'up')}
                    >
                      <ChevronUp className="h-4 w-4 text-elegant-orange" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={idx === publishedPhotos.length - 1 || saving}
                      onClick={() => moveOrder(idx, 'down')}
                    >
                      <ChevronDown className="h-4 w-4 text-elegant-orange" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.isPublished}
                      onCheckedChange={() => togglePublish(item)}
                      disabled={saving}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}