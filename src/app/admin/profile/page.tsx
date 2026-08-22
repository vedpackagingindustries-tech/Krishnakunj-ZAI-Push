'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdmin, setAdminToken } from '@/lib/admin-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { User, Save, Lock, Shield, Clock } from 'lucide-react'

// ── Types ───────────────────────────────────────────

interface Admin {
  id: string
  name: string
  email: string
  whatsapp: string | null
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
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

// ── Main Component ──────────────────────────────────

export default function ProfilePage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [sessionCount, setSessionCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Profile form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAdmin<{ admin: Admin; sessionCount: number }>('/api/admin/profile')
      setAdmin(data.admin)
      setSessionCount(data.sessionCount)
      setName(data.admin.name)
      setEmail(data.admin.email)
      setWhatsapp(data.admin.whatsapp || '')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleSaveProfile = async () => {
    if (!name.trim()) return
    try {
      setSaving(true)
      await fetchAdmin('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email, whatsapp }),
      })
      loadProfile()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('सभी फ़ील्ड भरें।')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('नया पासवर्ड कम से कम 8 अक्षर का होना चाहिए।')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।')
      return
    }
    try {
      setChangingPassword(true)
      const data = await fetchAdmin<{ newToken?: string }>('/api/admin/profile', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      // Update token if returned (password change invalidates sessions)
      if (data.newToken) {
        setAdminToken(data.newToken)
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      loadProfile()
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'पासवर्ड बदलने में त्रुटि')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elegant-orange/10">
          <User className="h-5 w-5 text-elegant-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-deep-warm-brown">मेरा प्रोफाइल</h1>
          <p className="text-sm text-muted-brown">आपकी खाता जानकारी</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Card className="border-light-beige"><CardContent className="p-6 space-y-4">{Array.from({length: 4}).map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
        </div>
      ) : admin ? (
        <>
          {/* Info Card */}
          <Card className="border-light-beige">
            <CardHeader className="pb-3">
              <CardTitle className="text-deep-warm-brown">खाता जानकारी</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-warm-ivory p-3">
                  <p className="text-xs text-muted-brown">नाम</p>
                  <p className="font-medium text-deep-warm-brown">{admin.name}</p>
                </div>
                <div className="rounded-lg bg-warm-ivory p-3">
                  <p className="text-xs text-muted-brown">ईमेल</p>
                  <p className="font-medium text-deep-warm-brown">{admin.email}</p>
                </div>
                <div className="rounded-lg bg-warm-ivory p-3">
                  <p className="text-xs text-muted-brown">भूमिका</p>
                  <p className="font-medium text-elegant-orange">{admin.role}</p>
                </div>
                <div className="rounded-lg bg-warm-ivory p-3">
                  <p className="text-xs text-muted-brown">अंतिम लॉगिन</p>
                  <p className="font-medium text-deep-warm-brown">{admin.lastLoginAt ? formatDate(admin.lastLoginAt) : '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile */}
          <Card className="border-light-beige">
            <CardHeader className="pb-3">
              <CardTitle className="text-deep-warm-brown">प्रोफाइल संपादित करें</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-deep-warm-brown">नाम *</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email" className="text-deep-warm-brown">ईमेल</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-whatsapp" className="text-deep-warm-brown">WhatsApp</Label>
                <Input
                  id="profile-whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving || !name.trim()}
                  className="bg-elegant-orange hover:bg-elegant-orange/90 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'सहेज रहे हैं...' : 'प्रोफाइल अपडेट करें'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border-light-beige">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-deep-maroon" />
                <CardTitle className="text-deep-warm-brown">पासवर्ड बदलें</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-pass" className="text-deep-warm-brown">वर्तमान पासवर्ड</Label>
                <Input
                  id="current-pass"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pass" className="text-deep-warm-brown">नया पासवर्ड</Label>
                <Input
                  id="new-pass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pass" className="text-deep-warm-brown">नया पासवर्ड पुष्टि करें</Label>
                <Input
                  id="confirm-pass"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              {passwordError && (
                <p className="text-sm text-deep-maroon">{passwordError}</p>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="bg-deep-maroon hover:bg-deep-maroon/90 text-white"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {changingPassword ? 'बदल रहे हैं...' : 'पासवर्ड बदलें'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}