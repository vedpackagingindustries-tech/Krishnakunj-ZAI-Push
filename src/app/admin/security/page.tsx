'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdmin } from '@/lib/admin-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, Lock, Clock, Smartphone, CheckCircle2, AlertTriangle, KeyRound, Monitor } from 'lucide-react'

// ── Types ───────────────────────────────────────────

interface Admin {
  id: string
  name: string
  email: string
  role: string
  lastLoginAt: string | null
  createdAt: string
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

export default function SecurityPage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [sessionCount, setSessionCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAdmin<{ admin: Admin; sessionCount: number }>('/api/admin/profile')
      setAdmin(data.admin)
      setSessionCount(data.sessionCount)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elegant-orange/10">
          <Shield className="h-5 w-5 text-elegant-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-deep-warm-brown">सुरक्षा</h1>
          <p className="text-sm text-muted-brown">आपके खाते की सुरक्षा जानकारी</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Card className="border-light-beige"><CardContent className="p-6 space-y-4">{Array.from({length: 3}).map((_,i) => <Skeleton key={i} className="h-16 w-full" />)}</CardContent></Card>
        </div>
      ) : admin ? (
        <>
          {/* Session Info */}
          <Card className="border-light-beige">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-elegant-orange" />
                <CardTitle className="text-deep-warm-brown">सक्रिय सत्र</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-warm-ivory p-4">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-elegant-orange" />
                    <p className="text-sm text-muted-brown">सक्रिय सत्र</p>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-deep-warm-brown">{sessionCount}</p>
                </div>
                <div className="rounded-lg bg-warm-ivory p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-elegant-orange" />
                    <p className="text-sm text-muted-brown">अंतिम लॉगिन</p>
                  </div>
                  <p className="mt-1 text-sm font-medium text-deep-warm-brown">
                    {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : 'ज्ञात नहीं'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Measures */}
          <Card className="border-light-beige">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-elegant-orange" />
                <CardTitle className="text-deep-warm-brown">सुरक्षा उपाय</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-warm-ivory p-3">
                <CheckCircle2 className="h-5 w-5 text-elegant-orange mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-deep-warm-brown">scrypt हैशिंग</p>
                  <p className="text-sm text-muted-brown">पासवर्ड scrypt एल्गोरिदम से सुरक्षित हैं जो ब्रूट-फोर्स हमलों के खिलाफ मजबूत है।</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-warm-ivory p-3">
                <CheckCircle2 className="h-5 w-5 text-elegant-orange mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-deep-warm-brown">टोकन-आधारित प्रमाणीकरण</p>
                  <p className="text-sm text-muted-brown">प्रत्येक सत्र एक अद्वितीय क्रिप्टोग्राफिक टोकन का उपयोग करता है।</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-warm-ivory p-3">
                <CheckCircle2 className="h-5 w-5 text-elegant-orange mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-deep-warm-brown">सत्र समाप्ति</p>
                  <p className="text-sm text-muted-brown">सभी सत्र 7 दिन में स्वचालित रूप से समाप्त हो जाते हैं।</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-warm-ivory p-3">
                <CheckCircle2 className="h-5 w-5 text-elegant-orange mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-deep-warm-brown">ऑडिट लॉगिंग</p>
                  <p className="text-sm text-muted-brown">सभी प्रशासनिक क्रियाओं का रिकॉर्ड रखा जाता है।</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-warm-ivory p-3">
                <CheckCircle2 className="h-5 w-5 text-elegant-orange mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-deep-warm-brown">पासवर्ड बदलने पर सत्र अमान्य</p>
                  <p className="text-sm text-muted-brown">पासवर्ड बदलने पर सभी पुराने सत्र स्वचालित रूप से अमान्य हो जाते हैं।</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-light-beige">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-deep-maroon" />
                <CardTitle className="text-deep-warm-brown">सुरक्षा क्रियाएं</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => (window.location.href = '/admin/profile')}
                className="w-full justify-start bg-elegant-orange hover:bg-elegant-orange/90 text-white"
              >
                <Lock className="h-4 w-4 mr-2" />
                पासवर्ड बदलें
              </Button>
              {sessionCount > 1 && (
                <div className="flex items-start gap-2 rounded-lg border border-deep-maroon/20 bg-deep-maroon/5 p-3">
                  <AlertTriangle className="h-5 w-5 text-deep-maroon mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-deep-maroon">ध्यान दें</p>
                    <p className="text-sm text-muted-brown">
                      आपके {sessionCount} सक्रिय सत्र हैं। यदि आपने अपना खाता साझा नहीं किया है, तो पासवर्ड बदलें।
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}