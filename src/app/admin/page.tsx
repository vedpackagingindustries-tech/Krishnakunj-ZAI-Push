'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

/* ============================================================
   Unified Admin Entry Page
   - Checks backend: does any admin exist?
   - Fresh DB (no admin)  → First Super Admin Setup form
   - Admin exists          → Normal Email+Password login
   - Already logged in     → Redirect to dashboard
   ============================================================ */

type Screen = 'loading' | 'setup' | 'login'

export default function AdminEntryPage() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>('loading')

  // ---- Shared state ----
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ---- Login fields ----
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // ---- Setup fields ----
  const [setupName, setSetupName] = useState('')
  const [setupEmail, setSetupEmail] = useState('')
  const [setupWhatsapp, setSetupWhatsapp] = useState('')
  const [setupPassword, setSetupPassword] = useState('')
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('')

  // ---- Bootstrap: check session first, then admin existence ----
  useEffect(() => {
    async function init() {
      try {
        // 1. Check if already logged in
        const token = localStorage.getItem('admin_token')
        if (token) {
          const sessionRes = await fetch('/api/admin/auth/session', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (sessionRes.ok) {
            router.replace('/admin/dashboard')
            return
          }
        }

        // 2. Ask the backend whether an admin account exists
        const checkRes = await fetch('/api/admin/auth/check')
        const data = await checkRes.json()

        if (data.hasAdmin === false) {
          setScreen('setup')
        } else {
          setScreen('login')
        }
      } catch {
        // Network error — default to login so user isn't stuck
        setScreen('login')
      }
    }
    init()
  }, [router])

  // ---- Login submit ----
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'लॉगिन विफल। कृपया पुनः प्रयास करें।')
        return
      }
      localStorage.setItem('admin_token', data.token)
      router.push('/admin/dashboard')
    } catch {
      setError('नेटवर्क त्रुटि। कृपया इंटरनेट कनेक्शन जाँचें।')
    } finally {
      setLoading(false)
    }
  }

  // ---- Setup submit ----
  const handleSetup = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: setupName.trim(),
          email: setupEmail.trim(),
          whatsapp: setupWhatsapp.trim(),
          password: setupPassword,
          confirmPassword: setupConfirmPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'खाता बनाने में त्रुटि।')
        return
      }
      localStorage.setItem('admin_token', data.token)
      router.push('/admin/dashboard')
    } catch {
      setError('नेटवर्क त्रुटि। कृपया इंटरनेट कनेक्शन जाँचें।')
    } finally {
      setLoading(false)
    }
  }

  // ---- Loading screen ----
  if (screen === 'loading') {
    return (
      <div style={S.page}>
        <div style={S.spinner} />
        <p style={S.loadingText}>जाँच हो रही है...</p>
      </div>
    )
  }

  // ---- Shared icon ----
  const templeIcon = (
    <div style={S.iconWrapper}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E88A24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  )

  const errorBox = error ? (
    <div style={S.errorBox}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A3B3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <span>{error}</span>
    </div>
  ) : null

  // ======================== SETUP SCREEN ========================
  if (screen === 'setup') {
    return (
      <div style={S.page}>
        <div style={S.card}>
          {templeIcon}
          <h1 style={S.heading}>पहला एडमिन खाता बनाएं</h1>
          <p style={S.subtitle}>वेबसाइट और दान प्रबंधन के लिए अपना सुरक्षित एडमिन खाता बनाएं।</p>
          {errorBox}
          <form onSubmit={handleSetup} style={S.form}>
            <div style={S.fieldGroup}>
              <label style={S.label} htmlFor="s-name">पूरा नाम <span style={S.req}>*</span></label>
              <input id="s-name" type="text" value={setupName} onChange={(e) => setSetupName(e.target.value)} placeholder="आपका पूरा नाम" required style={S.input} autoComplete="name" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label} htmlFor="s-email">ईमेल पता <span style={S.req}>*</span></label>
              <input id="s-email" type="email" value={setupEmail} onChange={(e) => setSetupEmail(e.target.value)} placeholder="admin@example.com" required style={S.input} autoComplete="email" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label} htmlFor="s-wa">WhatsApp नंबर <span style={S.req}>*</span></label>
              <input id="s-wa" type="tel" value={setupWhatsapp} onChange={(e) => setSetupWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10 अंकों का मोबाइल नंबर" required style={S.input} autoComplete="tel" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label} htmlFor="s-pw">पासवर्ड <span style={S.req}>*</span></label>
              <input id="s-pw" type="password" value={setupPassword} onChange={(e) => setSetupPassword(e.target.value)} placeholder="कम से कम 8 अक्षर" required minLength={8} style={S.input} autoComplete="new-password" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label} htmlFor="s-cpw">पासवर्ड की पुष्टि <span style={S.req}>*</span></label>
              <input id="s-cpw" type="password" value={setupConfirmPassword} onChange={(e) => setSetupConfirmPassword(e.target.value)} placeholder="पासवर्ड दोबारा दर्ज करें" required minLength={8} style={S.input} autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'खाता बनाया जा रहा है...' : 'एडमिन खाता बनाएं'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ======================== LOGIN SCREEN ========================
  return (
    <div style={S.page}>
      <div style={S.card}>
        {templeIcon}
        <h1 style={S.heading}>एडमिन लॉगिन</h1>
        <p style={S.subtitle}>प्रबंधन पैनल तक पहुँचने के लिए लॉगिन करें</p>
        {errorBox}
        <form onSubmit={handleLogin} style={S.form}>
          <div style={S.fieldGroup}>
            <label style={S.label} htmlFor="l-email">ईमेल</label>
            <input id="l-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required style={S.input} autoComplete="email" />
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label} htmlFor="l-pw">पासवर्ड</label>
            <input id="l-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={S.input} autoComplete="current-password" />
          </div>
          <button type="submit" disabled={loading} style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'लॉगिन हो रहा है...' : 'लॉगिन करें'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ============================================================
   Shared Styles — warm temple palette, NO black (#000000)
   ============================================================ */
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(145deg, #FFF9ED 0%, #EDE2D0 100%)',
    padding: '20px',
    fontFamily: "'Noto Sans Devanagari', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(145deg, #FFF9ED 0%, #EDE2D0 100%)',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid #EDE2D0',
    borderTop: '3px solid #E88A24',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#5A3A24',
    marginTop: 16,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFF9ED',
    borderRadius: 16,
    padding: '36px 32px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 8px 32px rgba(90, 58, 36, 0.12)',
    border: '1px solid rgba(128, 107, 89, 0.15)',
  },
  iconWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heading: {
    color: '#5A3A24',
    fontSize: 26,
    fontWeight: 700,
    textAlign: 'center',
    margin: '0 0 6px 0',
  },
  subtitle: {
    color: '#806B59',
    fontSize: 14,
    textAlign: 'center',
    margin: '0 0 24px 0',
    lineHeight: 1.6,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FDF0F0',
    border: '1px solid #E8C8C8',
    borderRadius: 10,
    padding: '12px 16px',
    marginBottom: 20,
    color: '#7A3B3B',
    fontSize: 14,
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    color: '#5A3A24',
    fontSize: 14,
    fontWeight: 600,
  },
  req: {
    color: '#7A3B3B',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: '1px solid rgba(128, 107, 89, 0.25)',
    backgroundColor: '#FFF9ED',
    color: '#5A3A24',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  submitBtn: {
    width: '100%',
    padding: '13px 20px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#E88A24',
    color: '#FFF9ED',
    fontSize: 16,
    fontWeight: 700,
    marginTop: 4,
    transition: 'background-color 0.2s',
  },
}
