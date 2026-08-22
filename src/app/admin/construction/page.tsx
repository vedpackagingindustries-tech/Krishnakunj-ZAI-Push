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
import { Plus, Pencil, Trash2, Hammer, CheckCircle2 } from 'lucide-react'

// ── Types ───────────────────────────────────────────

interface Stage {
  id: string
  label: string
  description: string
  progress: number
  displayOrder: number
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

interface FormData {
  label: string
  description: string
  progress: number
  displayOrder: number
  isCompleted: boolean
}

const emptyForm: FormData = {
  label: '',
  description: '',
  progress: 0,
  displayOrder: 0,
  isCompleted: false,
}

// ── Progress Bar ────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-light-beige">
      <div
        className="h-full rounded-full bg-elegant-orange transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

// ── Main Component ──────────────────────────────────

export default function ConstructionPage() {
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadStages = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAdmin<{ stages: Stage[] }>('/api/admin/construction')
      setStages(data.stages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStages()
  }, [loadStages])

  const openAddDialog = () => {
    setEditingId(null)
    setForm({ ...emptyForm, displayOrder: stages.length })
    setDialogOpen(true)
  }

  const openEditDialog = (stage: Stage) => {
    setEditingId(stage.id)
    setForm({
      label: stage.label,
      description: stage.description,
      progress: stage.progress,
      displayOrder: stage.displayOrder,
      isCompleted: stage.isCompleted,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.label.trim()) return
    try {
      setSaving(true)
      if (editingId) {
        await fetchAdmin(`/api/admin/construction/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
      } else {
        await fetchAdmin('/api/admin/construction', {
          method: 'POST',
          body: JSON.stringify(form),
        })
      }
      setDialogOpen(false)
      loadStages()
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
      await fetchAdmin(`/api/admin/construction/${deletingId}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      loadStages()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const toggleCompleted = async (stage: Stage) => {
    try {
      await fetchAdmin(`/api/admin/construction/${stage.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isCompleted: !stage.isCompleted, progress: !stage.isCompleted ? 100 : stage.progress }),
      })
      loadStages()
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
            <Hammer className="h-5 w-5 text-elegant-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep-warm-brown">निर्माण प्रगति</h1>
            <p className="text-sm text-muted-brown">मंदिर निर्माण की प्रगति प्रबंधित करें</p>
          </div>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-elegant-orange hover:bg-elegant-orange/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          चरण जोड़ें
        </Button>
      </div>

      {/* Overall Progress */}
      {!loading && stages.length > 0 && (
        <Card className="border-light-beige">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-deep-warm-brown">कुल प्रगति</span>
              <span className="text-sm font-bold text-elegant-orange">
                {Math.round(stages.reduce((acc, s) => acc + s.progress, 0) / stages.length)}%
              </span>
            </div>
            <ProgressBar value={stages.reduce((acc, s) => acc + s.progress, 0) / stages.length} />
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-light-beige">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stages.length === 0 ? (
        <Card className="border-light-beige">
          <CardContent className="py-12 text-center">
            <Hammer className="mx-auto h-12 w-12 text-muted-brown/40" />
            <p className="mt-3 text-muted-brown">कोई निर्माण चरण नहीं मिला। ऊपर बटन से जोड़ें।</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {stages.map((stage) => (
            <Card key={stage.id} className={`border-light-beige ${stage.isCompleted ? 'bg-elegant-orange/5' : ''}`}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {stage.isCompleted && <CheckCircle2 className="h-5 w-5 text-elegant-orange" />}
                      <h3 className="font-semibold text-deep-warm-brown">{stage.label}</h3>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        stage.isCompleted
                          ? 'bg-elegant-orange/10 text-elegant-orange'
                          : 'bg-light-beige text-muted-brown'
                      }`}>
                        {stage.isCompleted ? 'पूर्ण' : 'जारी'}
                      </span>
                    </div>
                    {stage.description && (
                      <p className="text-sm text-muted-brown">{stage.description}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <ProgressBar value={stage.progress} />
                      </div>
                      <span className="text-sm font-bold text-elegant-orange w-10 text-right">
                        {stage.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch
                      checked={stage.isCompleted}
                      onCheckedChange={() => toggleCompleted(stage)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-elegant-orange hover:bg-elegant-orange/10"
                      onClick={() => openEditDialog(stage)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-deep-maroon hover:bg-deep-maroon/10"
                      onClick={() => confirmDelete(stage.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-deep-warm-brown">
              {editingId ? 'चरण संपादित करें' : 'नया चरण जोड़ें'}
            </DialogTitle>
            <DialogDescription className="text-muted-brown">
              निर्माण चरण की जानकारी भरें।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stage-label" className="text-deep-warm-brown">लेबल *</Label>
              <Input
                id="stage-label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="जैसे: नींव, दीवार, शिखर"
                className="border-light-beige focus:border-elegant-orange"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-desc" className="text-deep-warm-brown">विवरण</Label>
              <Textarea
                id="stage-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="border-light-beige focus:border-elegant-orange"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-progress" className="text-deep-warm-brown">
                प्रगति: {form.progress}%
              </Label>
              <Input
                id="stage-progress"
                type="range"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) })}
                className="accent-elegant-orange"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-order" className="text-deep-warm-brown">क्रम</Label>
              <Input
                id="stage-order"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                className="border-light-beige focus:border-elegant-orange"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isCompleted}
                onCheckedChange={(c) => setForm({ ...form, isCompleted: c, progress: c ? 100 : form.progress })}
              />
              <Label className="text-deep-warm-brown">पूर्ण</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-light-beige text-muted-brown">
              रद्द करें
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.label.trim()}
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
              यह निर्माण चरण स्थायी रूप से हटा दिया जाएगा।
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