'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdmin } from '@/lib/admin-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Video, ChevronLeft, ChevronRight, Play } from 'lucide-react'

// ── Types ───────────────────────────────────────────

interface VideoItem {
  id: string
  url: string
  thumbnailUrl: string | null
  title: string
  description: string
  category: string
  displayOrder: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface VideosResponse {
  videos: VideoItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface FormData {
  url: string
  thumbnailUrl: string
  title: string
  description: string
  category: string
  displayOrder: number
  isPublished: boolean
}

const emptyForm: FormData = {
  url: '',
  thumbnailUrl: '',
  title: '',
  description: '',
  category: '',
  displayOrder: 0,
  isPublished: true,
}

// ── Main Component ──────────────────────────────────

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadVideos = useCallback(async (p: number) => {
    try {
      setLoading(true)
      const data = await fetchAdmin<VideosResponse>(`/api/admin/videos?page=${p}&limit=20`)
      setVideos(data.videos)
      setTotalPages(data.totalPages)
      setPage(data.page)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVideos(1)
  }, [loadVideos])

  const openAddDialog = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (video: VideoItem) => {
    setEditingId(video.id)
    setForm({
      url: video.url,
      thumbnailUrl: video.thumbnailUrl || '',
      title: video.title,
      description: video.description,
      category: video.category,
      displayOrder: video.displayOrder,
      isPublished: video.isPublished,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.url.trim()) return
    try {
      setSaving(true)
      if (editingId) {
        await fetchAdmin(`/api/admin/videos/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
      } else {
        await fetchAdmin('/api/admin/videos', {
          method: 'POST',
          body: JSON.stringify(form),
        })
      }
      setDialogOpen(false)
      loadVideos(page)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      setDeleting(true)
      await fetchAdmin(`/api/admin/videos/${deletingId}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      loadVideos(page)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const togglePublished = async (video: VideoItem) => {
    try {
      await fetchAdmin(`/api/admin/videos/${video.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished: !video.isPublished }),
      })
      loadVideos(page)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elegant-orange/10">
            <Video className="h-5 w-5 text-elegant-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep-warm-brown">वीडियो प्रबंधन</h1>
            <p className="text-sm text-muted-brown">मंदिर के वीडियो प्रबंधित करें</p>
          </div>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-elegant-orange hover:bg-elegant-orange/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          वीडियो जोड़ें
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-light-beige">
              <CardContent className="flex gap-4 p-4">
                <Skeleton className="h-24 w-40 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <Card className="border-light-beige">
          <CardContent className="py-12 text-center">
            <Video className="mx-auto h-12 w-12 text-muted-brown/40" />
            <p className="mt-3 text-muted-brown">कोई वीडियो नहीं मिला। ऊपर बटन से जोड़ें।</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {videos.map((video) => (
              <Card key={video.id} className="border-light-beige">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {/* Thumbnail */}
                    <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg bg-warm-ivory sm:h-24 sm:w-40">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Play className="h-8 w-8 text-muted-brown/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-deep-warm-brown">{video.title || 'शीर्षक नहीं'}</h3>
                          {video.category && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-light-beige px-2 py-0.5 text-xs font-medium text-muted-brown">
                              {video.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Switch
                            checked={video.isPublished}
                            onCheckedChange={() => togglePublished(video)}
                          />
                        </div>
                      </div>
                      {video.description && (
                        <p className="text-sm text-muted-brown line-clamp-2">{video.description}</p>
                      )}
                      <p className="text-xs text-muted-brown/60 truncate">{video.url}</p>
                      <div className="flex items-center gap-1 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-elegant-orange hover:bg-elegant-orange/10"
                          onClick={() => openEditDialog(video)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          संपादित
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-deep-maroon hover:bg-deep-maroon/10"
                          onClick={() => confirmDelete(video.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          हटाएं
                        </Button>
                      </div>
                    </div>
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
                onClick={() => loadVideos(page - 1)}
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
                onClick={() => loadVideos(page + 1)}
                className="border-light-beige text-muted-brown"
              >
                अगला
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-deep-warm-brown">
              {editingId ? 'वीडियो संपादित करें' : 'नया वीडियो जोड़ें'}
            </DialogTitle>
            <DialogDescription className="text-muted-brown">
              वीडियो की जानकारी भरें।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-url" className="text-deep-warm-brown">वीडियो URL *</Label>
              <Input
                id="video-url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="YouTube या वीडियो URL"
                className="border-light-beige focus:border-elegant-orange"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-thumb" className="text-deep-warm-brown">थंबनेल URL</Label>
              <Input
                id="video-thumb"
                value={form.thumbnailUrl}
                onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                placeholder="थंबनेल छवि URL"
                className="border-light-beige focus:border-elegant-orange"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-title" className="text-deep-warm-brown">शीर्षक</Label>
              <Input
                id="video-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="वीडियो का शीर्षक"
                className="border-light-beige focus:border-elegant-orange"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-desc" className="text-deep-warm-brown">विवरण</Label>
              <Textarea
                id="video-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="border-light-beige focus:border-elegant-orange"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-cat" className="text-deep-warm-brown">श्रेणी</Label>
              <Input
                id="video-cat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="जैसे: आरती, पूजा, उत्सव"
                className="border-light-beige focus:border-elegant-orange"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-order" className="text-deep-warm-brown">क्रम</Label>
              <Input
                id="video-order"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                className="border-light-beige focus:border-elegant-orange"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isPublished}
                onCheckedChange={(c) => setForm({ ...form, isPublished: c })}
              />
              <Label className="text-deep-warm-brown">प्रकाशित</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-light-beige text-muted-brown">
              रद्द करें
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.url.trim()}
              className="bg-elegant-orange hover:bg-elegant-orange/90 text-white"
            >
              {saving ? 'सहेज रहे हैं...' : editingId ? 'अपडेट करें' : 'जोड़ें'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-deep-warm-brown">क्या आप सुनिश्चित हैं?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-brown">
              यह वीडियो स्थायी रूप से हटा दिया जाएगा।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-light-beige text-muted-brown">रद्द करें</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-deep-maroon hover:bg-deep-maroon/90 text-white"
            >
              {deleting ? 'हटा रहे हैं...' : 'हटाएं'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}