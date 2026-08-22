'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdmin } from '@/lib/admin-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Save, Building2, Smartphone } from 'lucide-react'

// ── Types ───────────────────────────────────────────

interface PaymentSettings {
  upiId: string
  accountHolder: string
  bankName: string
  ifsc: string
  accountNumber: string
  showUpi: string
  showBank: string
}

const defaultSettings: PaymentSettings = {
  upiId: '',
  accountHolder: '',
  bankName: '',
  ifsc: '',
  accountNumber: '',
  showUpi: 'false',
  showBank: 'false',
}

// ── Main Component ──────────────────────────────────

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAdmin<{ settings: Record<string, string> }>('/api/admin/payment-settings')
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
      await fetchAdmin('/api/admin/payment-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const updateField = (key: keyof PaymentSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elegant-orange/10">
            <CreditCard className="h-5 w-5 text-elegant-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep-warm-brown">भुगतान सेटिंग</h1>
            <p className="text-sm text-muted-brown">दान भुगतान की जानकारी प्रबंधित करें</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Card className="border-light-beige"><CardContent className="p-6 space-y-4">{Array.from({length: 4}).map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
          <Card className="border-light-beige"><CardContent className="p-6 space-y-4">{Array.from({length: 4}).map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
        </div>
      ) : (
        <>
          {/* UPI Section */}
          <Card className="border-light-beige">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-elegant-orange" />
                  <CardTitle className="text-deep-warm-brown">UPI जानकारी</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.showUpi === 'true'}
                    onCheckedChange={(c) => updateField('showUpi', c ? 'true' : 'false')}
                  />
                  <Label className="text-sm text-muted-brown">दिखाएं</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upiId" className="text-deep-warm-brown">UPI ID</Label>
                <Input
                  id="upiId"
                  value={settings.upiId}
                  onChange={(e) => updateField('upiId', e.target.value)}
                  placeholder="जैसे: temple@upi"
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
            </CardContent>
          </Card>

          {/* Bank Section */}
          <Card className="border-light-beige">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-elegant-orange" />
                  <CardTitle className="text-deep-warm-brown">बैंक जानकारी</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.showBank === 'true'}
                    onCheckedChange={(c) => updateField('showBank', c ? 'true' : 'false')}
                  />
                  <Label className="text-sm text-muted-brown">दिखाएं</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountHolder" className="text-deep-warm-brown">खाताधारक नाम</Label>
                <Input
                  id="accountHolder"
                  value={settings.accountHolder}
                  onChange={(e) => updateField('accountHolder', e.target.value)}
                  placeholder="खाताधारक का नाम"
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName" className="text-deep-warm-brown">बैंक का नाम</Label>
                <Input
                  id="bankName"
                  value={settings.bankName}
                  onChange={(e) => updateField('bankName', e.target.value)}
                  placeholder="बैंक का नाम"
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="text-deep-warm-brown">खाता नंबर</Label>
                <Input
                  id="accountNumber"
                  value={settings.accountNumber}
                  onChange={(e) => updateField('accountNumber', e.target.value)}
                  placeholder="बैंक खाता नंबर"
                  className="border-light-beige focus:border-elegant-orange"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc" className="text-deep-warm-brown">IFSC कोड</Label>
                <Input
                  id="ifsc"
                  value={settings.ifsc}
                  onChange={(e) => updateField('ifsc', e.target.value)}
                  placeholder="IFSC कोड"
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