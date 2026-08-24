'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/* ============================================================
   Admin Login Form — client component rendered by /admin
   when at least one admin account exists.
   ============================================================ */

export default function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(true)

  // If already logged in, redirect to dashboard
  useEffect(() => {
    async function checkSession() {
      const token = localStorage.getItem('admin_token')
      if (token) {
        try {
          const res = await fetch('/api/admin/auth/session', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            router.replace('/admin/dashboard')
            return
          }
        } catch {
          // ignore
        }
      }
      setRedirecting(false)
    }
    checkSession()
  }, [router])

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

  // Loading while checking session
  if (redirecting) {
    return (
      <div style={S.page}>
        <div style={S.spinner} />
        <p style={S.loadingText}>जाँच हो रही है...</p>
      </div>
    )
  }

  const templeIcon = (
    <div style={S.iconWrapper}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E88A24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  )

  return (
    <div style={S.page}>
      <div style={S.card}>
        {templeIcon}
        <h1 style={S.heading}>एडमिन लॉगिन</h1>
        <p style={S.subtitle}>प्रबंधन पैनल तक पहुँचने के लिए लॉगिन करें</p>
        {error ? (
          <div style={S.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A3B3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        ) : null}
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
          <div className='text-center mt-4'>
            <Link href='/admin/forgot-password' className='text-sm text-[#C17A2A] hover:underline'>भूल गए पासवर्ड?</Link>
          </div>
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
