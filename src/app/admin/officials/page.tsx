'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdmin } from '@/lib/admin-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
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
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Users } from 'lucide-react'

// ── Types ───────────────────────────────────────────

interface Official {
  id: string
  name: string
  designation: string
  phone: string | null
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface FormData {
  name: string
  designation: string
  phone: string
  displayOrder: number
  isActive: boolean
}

const emptyForm: FormData = {
  name: '',
  designation: '',
  phone: '',
  displayOrder: 0,
  isActive: true,
}

// ── Loading Skeleton ────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  )
}

function MobileCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
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

// ── Main Component ──────────────────────────────────

export default function OfficialsPage() {
  const [officials, setOfficials] = useState<Official[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadOfficials = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAdmin<{ officials: Official[] }>('/api/admin/officials')
      setOfficials(data.officials)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOfficials()
  }, [loadOfficials])

  const openAddDialog = () => {
    setEditingId(null)
    setForm({ ...emptyForm, displayOrder: officials.length })
    setDialogOpen(true)
  }

  const openEditDialog = (official: Official) => {
    setEditingId(official.id)
    setForm({
      name: official.name,
      designation: official.designation,
      phone: official.phone || '',
      displayOrder: official.displayOrder,
      isActive: official.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.designation.trim()) return

    try {
      setSaving(true)
      if (editingId) {
        await fetchAdmin(`/api/admin/officials/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
      } else {
        await fetchAdmin('/api/admin/officials', {
          method: 'POST',
          body: JSON.stringify(form),
        })
      }
      setDialogOpen(false)
      loadOfficials()
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
      await fetchAdmin(`/api/admin/officials/${deletingId}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      loadOfficials()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const newOfficials = [...officials]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newOfficials.length) return

    const temp = newOfficials[index].displayOrder
    newOfficials[index].displayOrder = newOfficials[swapIndex].displayOrder
    newOfficials[swapIndex].displayOrder = temp

    try {
      await Promise.all([
        fetchAdmin(`/api/admin/officials/${newOfficials[index].id}`, {
          method: 'PUT',
          body: JSON.stringify({ displayOrder: newOfficials[index].displayOrder }),
        }),
        fetchAdmin(`/api/admin/officials/${newOfficials[swapIndex].id}`, {
          method: 'PUT',
          body: JSON.stringify({ displayOrder: newOfficials[swapIndex].displayOrder }),
        }),
      ])
      loadOfficials()
    } catch (err) {
      console.error(err)
    }
  }

  const toggleActive = async (official: Official) => {
    try {
      await fetchAdmin(`/api/admin/officials/${official.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !official.isActive }),
      })
      loadOfficials()
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
            <Users className="h-5 w-5 text-elegant-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep-warm-brown">पदाधिकारी प्रबंधन</h1>
            <p className="text-sm text-muted-brown">मंदिर के पदाधिकारियों का प्रबंधन करें</p>
          </div>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-elegant-orange hover:bg-elegant-orange/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          पदाधिकारी जोड़ें
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <>
          <div className="hidden md:block">
            <Card className="border-light-beige">
              <CardContent className="p-4">
                <TableSkeleton />
              </CardContent>
            </Card>
          </div>
          <div className="md:hidden">
            <MobileCardSkeleton />
          </div>
        </>
      ) : officials.length === 0 ? (
        <Card className="border-light-beige">
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-brown/40" />
            <p className="mt-3 text-muted-brown">कोई पदाधिकारी नहीं मिला। ऊपर बटन से जोड़ें।</p>
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
                    <TableHead className="text-deep-warm-brown font-semibold">नाम</TableHead>
                    <TableHead className="text-deep-warm-brown font-semibold">पद</TableHead>
                    <TableHead className="text-deep-warm-brown font-semibold">फोन</TableHead>
                    <TableHead className="text-deep-warm-brown font-semibold text-center">क्रम</TableHead>
                    <TableHead className="text-deep-warm-brown font-semibold text-center">सक्रिय</TableHead>
                    <TableHead className="text-deep-warm-brown font-semibold text-right">कार्रवाई</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {officials.map((official, idx) => (
                    <TableRow key={official.id} className="border-light-beige hover:bg-warm-ivory">
                      <TableCell className="font-medium text-deep-warm-brown">{official.name}</TableCell>
                      <TableCell className="text-muted-brown">{official.designation}</TableCell>
                      <TableCell className="text-muted-brown">{official.phone || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={idx === 0}
                            onClick={() => moveOrder(idx, 'up')}
                          >
                            <ChevronUp className="h-4 w-4 text-elegant-orange" />
                          </Button>
                          <span className="text-sm text-muted-brown w-6 text-center">{idx + 1}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={idx === officials.length - 1}
                            onClick={() => moveOrder(idx, 'down')}
                          >
                            <ChevronDown className="h-4 w-4 text-elegant-orange" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={official.isActive}
                          onCheckedChange={() => toggleActive(official)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-elegant-orange hover:bg-elegant-orange/10"
                            onClick={() => openEditDialog(official)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-deep-maroon hover:bg-deep-maroon/10"
                            onClick={() => confirmDelete(official.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {officials.map((official, idx) => (
              <Card key={official.id} className="border-light-beige">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-deep-warm-brown">{official.name}</h3>
                      <p className="text-sm text-muted-brown">{official.designation}</p>
                      {official.phone && (
                        <p className="text-sm text-muted-brown">📞 {official.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          official.isActive
                            ? 'bg-soft-saffron/20 text-elegant-orange'
                            : 'bg-light-beige text-muted-brown'
                        }`}
                      >
                        {official.isActive ? 'सक्रिय' : 'निष्क्रिय'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-light-beige pt-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={idx === 0}
                        onClick={() => moveOrder(idx, 'up')}
                      >
                        <ChevronUp className="h-4 w-4 text-elegant-orange" />
                      </Button>
                      <span className="text-xs text-muted-brown">{idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={idx === officials.length - 1}
                        onClick={() => moveOrder(idx, 'down')}
                      >
                        <ChevronDown className="h-4 w-4 text-elegant-orange" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={official.isActive}
                        onCheckedChange={() => toggleActive(official)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-elegant-orange hover:bg-elegant-orange/10"
                        onClick={() => openEditDialog(official)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-deep-maroon hover:bg-deep-maroon/10"
                        onClick={() => confirmDelete(official.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-deep-warm-brown">
              {editingId ? 'पदाधिकारी संपादित करें' : 'नया पदाधिकारी जोड़ें'}
            </DialogTitle>
            <DialogDescription className="text-muted-brown">
              पदाधिकारी की जानकारी भरें।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-deep-warm-brown">नाम *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="पदाधिकारी का नाम"
                className="border-light-beige focus:border-elegant-orange"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation" className="text-deep-warm-brown">पद *</Label>
              <Input
                id="designation"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="जैसे: अध्यक्ष, सचिव"
                className="border-light-beige focus:border-elegant-orange"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-deep-warm-brown">फोन</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="फोन नंबर"
                className="border-light-beige focus:border-elegant-orange"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order" className="text-deep-warm-brown">क्रम</Label>
              <Input
                id="order"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                className="border-light-beige focus:border-elegant-orange"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label className="text-deep-warm-brown">सक्रिय</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-light-beige text-muted-brown">
              रद्द करें
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.designation.trim()}
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
              यह पदाधिकारी स्थायी रूप से हटा दिया जाएगा। यह क्रिया पूर्ववत नहीं की जा सकती।
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