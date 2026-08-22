'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
import { Plus, Pencil, Trash2, Star, Upload, Image, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { getAdminToken } from '@/lib/admin-auth'

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
  fileSize: number | null
  mimeType: string | null
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

interface EditForm {
  title: string
  description: string
  category: string
  displayOrder: number
  isPublished: boolean
  isHero: boolean
}

// ── Main Component ──────────────────────────────────

export default function PhotosPage() {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Media | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<EditForm>({
    title: '',
    description: '',
    category: '',
    displayOrder: 0,
    isPublished: true,
    isHero: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadMedia = useCallback(async (p: number) => {
    try {
      setLoading(true)
      const data = await fetchAdmin<MediaResponse>(`/api/admin/media?page=${p}&limit=12`)
      setMedia(data.media)
      setTotalPages(data.totalPages)
      setPage(data.page)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMedia(1)
  }, [loadMedia])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('केवल JPEG, PNG, और WebP फ़ाइलें अनुमत हैं।')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('फ़ाइल का आकार 5MB से अधिक नहीं होना चाहिए।')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const token = getAdminToken()
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'अपलोड विफल')
      }

      loadMedia(page)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      alert(err instanceof Error ? err.message : 'अपलोड में त्रुटि')
    } finally {
      setUploading(false)
    }
  }

  const openEditDialog = (item: Media) => {
    setEditingItem(item)
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      displayOrder: item.displayOrder,
      isPublished: item.isPublished,
      isHero: item.isHero,
    })
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingItem) return
    try {
      setSaving(true)
      await fetchAdmin(`/api/admin/media/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      setEditDialogOpen(false)
      loadMedia(page)
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
      await fetchAdmin(`/api/admin/media/${deletingId}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      loadMedia(page)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const togglePublished = async (item: Media) => {
    try {
      await fetchAdmin(`/api/admin/media/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished: !item.isPublished }),
      })
      loadMedia(page)
    } catch (err) {
      console.error(err)
    }
  }

  const toggleHero = async (item: Media) => {
    try {
      await fetchAdmin(`/api/admin/media/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isHero: !item.isHero }),
      })
      loadMedia(page)
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
            <Image className="h-5 w-5 text-elegant-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep-warm-brown">फोटो प्रबंधन</h1>
            <p className="text-sm text-muted-brown">मंदिर की फोटो और छवियाँ प्रबंधित करें</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-elegant-orange hover:bg-elegant-orange/90 text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'अपलोड हो रहा है...' : 'फोटो अपलोड'}
          </Button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-light-beige overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <CardContent className="p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : media.length === 0 ? (
        <Card className="border-light-beige">
          <CardContent className="py-12 text-center">
            <Image className="mx-auto h-12 w-12 text-muted-brown/40" />
            <p className="mt-3 text-muted-brown">कोई फोटो नहीं मिली। ऊपर बटन से अपलोड करें।</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {media.map((item) => (
              <Card key={item.id} className="border-light-beige overflow-hidden group">
                <div className="relative aspect-square overflow-hidden bg-warm-ivory">
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Hero star */}
                  {item.isHero && (
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-soft-saffron px-2 py-0.5 text-xs font-medium text-deep-warm-brown">
                        <Star className="h-3 w-3 fill-soft-saffron text-soft-saffron" />
                        हीरो
                      </span>
                    </div>
                  )}
                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    {item.isPublished ? (
                      <span className="inline-flex items-center rounded-full bg-elegant-orange/90 px-2 py-0.5 text-xs font-medium text-white">
                        प्रकाशित
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-light-beige/90 px-2 py-0.5 text-xs font-medium text-muted-brown">
                        अप्रकाशित
                      </span>
                    )}
                  </div>
                  {/* Overlay actions */}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-deep-warm-brown/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => toggleHero(item)}
                    >
                      <Star className={`h-4 w-4 ${item.isHero ? 'fill-soft-saffron text-soft-saffron' : ''}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => togglePublished(item)}
                    >
                      {item.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-deep-maroon/60"
                      onClick={() => confirmDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="truncate text-sm font-medium text-deep-warm-brown">{item.title || 'शीर्षक नहीं'}</h3>
                  {item.category && (
                    <p className="mt-1 text-xs text-muted-brown">{item.category}</p>
                  )}
                  {/* Mobile action buttons */}
                  <div className="mt-2 flex items-center gap-1 sm:hidden">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-light-beige text-muted-brown"
                      onClick={() => togglePublished(item)}
                    >
                      {item.isPublished ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                      {item.isPublished ? 'छुपाएं' : 'प्रकाशित'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-7 text-xs border-light-beige ${item.isHero ? 'text-soft-saffron' : 'text-muted-brown'}`}
                      onClick={() => toggleHero(item)}
                    >
                      <Star className={`h-3 w-3 mr-1 ${item.isHero ? 'fill-soft-saffron' : ''}`} />
                      हीरो
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-light-beige text-elegant-orange"
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      संपादित
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-light-beige text-deep-maroon"
                      onClick={() => confirmDelete(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
                onClick={() => loadMedia(page - 1)}
                className="border-light-beige text-muted-brown"
              >
                <ChevronLeft className="h-4 w-4" />
                पिछला
              </Button>
              <span className="text-sm text-muted-brown">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => loadMedia(page + 1)}
                className="border-light-beige text-muted-brown"
              >
                अगला
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-deep-warm-brown">फोटो संपादित करें</DialogTitle>
            <DialogDescription className="text-muted-brown">फोटो की जानकारी अपडेट करें।</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-warm-ivory">
                <img src={editingItem.url} alt={editingItem.title} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media-title" className="text-deep-warm-brown">शीर्षक</Label>
                <Input
                  id="media-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media-desc" className="text-deep-warm-brown">विवरण</Label>
                <Textarea
                  id="media-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media-cat" className="text-deep-warm-brown">श्रेणी</Label>
                <Input
                  id="media-cat"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="जैसे: मंदिर, पूजा, उत्सव"
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media-order" className="text-deep-warm-brown">क्रम</Label>
                <Input
                  id="media-order"
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isPublished}
                    onCheckedChange={(c) => setForm({ ...form, isPublished: c })}
                  />
                  <Label className="text-deep-warm-brown">प्रकाशित</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isHero}
                    onCheckedChange={(c) => setForm({ ...form, isHero: c })}
                  />
                  <Label className="text-deep-warm-brown">हीरो फोटो</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-light-beige text-muted-brown">
              रद्द करें
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-elegant-orange hover:bg-elegant-orange/90 text-white">
              {saving ? 'सहेज रहे हैं...' : 'अपडेट करें'}
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
              यह फोटो स्थायी रूप से हटा दी जाएगी। यह क्रिया पूर्ववत नहीं की जा सकती।
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