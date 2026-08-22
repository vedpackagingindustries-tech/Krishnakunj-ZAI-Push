'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdmin } from '@/lib/admin-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Settings, Save, Globe, Phone, Mail } from 'lucide-react'

// ── Types ───────────────────────────────────────────

interface SiteSettings {
  siteTitle: string
  metaTitle: string
  metaDescription: string
  contactPhone: string
  contactWhatsApp: string
  contactEmail: string
  minDonationAmount: string
}

const defaultSettings: SiteSettings = {
  siteTitle: '',
  metaTitle: '',
  metaDescription: '',
  contactPhone: '',
  contactWhatsApp: '',
  contactEmail: '',
  minDonationAmount: '0',
}

// ── Main Component ──────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAdmin<{ settings: Record<string, string> }>('/api/admin/settings')
      setSettings({ ...defaultSettings, ...data.settings })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    try {
      setSaving(true)
      await fetchAdmin('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const updateField = (key: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elegant-orange/10">
            <Settings className="h-5 w-5 text-elegant-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep-warm-brown">वेबसाइट सेटिंग</h1>
            <p className="text-sm text-muted-brown">वेबसाइट की सामान्य सेटिंग प्रबंधित करें</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Card className="border-light-beige"><CardContent className="p-6 space-y-4">{Array.from({length: 5}).map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
          <Card className="border-light-beige"><CardContent className="p-6 space-y-4">{Array.from({length: 3}).map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
        </div>
      ) : (
        <>
          {/* Site Info */}
          <Card className="border-light-beige">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-elegant-orange" />
                <CardTitle className="text-deep-warm-brown">साइट जानकारी</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteTitle" className="text-deep-warm-brown">साइट शीर्षक</Label>
                <Input
                  id="siteTitle"
                  value={settings.siteTitle}
                  onChange={(e) => updateField('siteTitle', e.target.value)}
                  placeholder="मंदिर का नाम"
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaTitle" className="text-deep-warm-brown">मेटा शीर्षक</Label>
                <Input
                  id="metaTitle"
                  value={settings.metaTitle}
                  onChange={(e) => updateField('metaTitle', e.target.value)}
                  placeholder="ब्राउज़र टैब में दिखने वाला शीर्षक"
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription" className="text-deep-warm-brown">मेटा विवरण</Label>
                <Textarea
                  id="metaDescription"
                  value={settings.metaDescription}
                  onChange={(e) => updateField('metaDescription', e.target.value)}
                  rows={3}
                  placeholder="SEO विवरण"
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="border-light-beige">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-elegant-orange" />
                <CardTitle className="text-deep-warm-brown">संपर्क जानकारी</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-deep-warm-brown">फोन नंबर</Label>
                <Input
                  id="contactPhone"
                  value={settings.contactPhone}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  placeholder="संपर्क फोन नंबर"
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactWhatsApp" className="text-deep-warm-brown">WhatsApp नंबर</Label>
                <Input
                  id="contactWhatsApp"
                  value={settings.contactWhatsApp}
                  onChange={(e) => updateField('contactWhatsApp', e.target.value)}
                  placeholder="WhatsApp नंबर (देश कोड सहित)"
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="text-deep-warm-brown">ईमेल</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  placeholder="संपर्क ईमेल"
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
            </CardContent>
          </Card>

          {/* Donation Settings */}
          <Card className="border-light-beige">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-elegant-orange" />
                <CardTitle className="text-deep-warm-brown">दान सेटिंग</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minDonationAmount" className="text-deep-warm-brown">न्यूनतम दान राशि (₹)</Label>
                <Input
                  id="minDonationAmount"
                  type="number"
                  value={settings.minDonationAmount}
                  onChange={(e) => updateField('minDonationAmount', e.target.value)}
                  placeholder="0"
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-elegant-orange hover:bg-elegant-orange/90 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'सहेज रहे हैं...' : 'सेटिंग सहेजें'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}