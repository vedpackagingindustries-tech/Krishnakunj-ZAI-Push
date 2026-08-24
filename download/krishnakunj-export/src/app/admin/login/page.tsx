'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/admin/auth/check')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasAdmin === false) {
          router.replace('/admin/setup')
        } else {
          setChecking(false)
        }
      })
      .catch(() => setChecking(false))
  }, [router])

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      fetch('/api/admin/auth/session', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) {
            router.replace('/admin/dashboard')
          }
        })
        .catch(() => {})
    }
  }, [router])

  const handleSubmit = async (e: FormEvent) => {
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

  if (checking) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>जाँच हो रही है...</p>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Temple icon */}
        <div style={styles.iconWrapper}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E88A24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        <h1 style={styles.heading}>एडमिन लॉगिन</h1>
        <p style={styles.subtitle}>प्रबंधन पैनल तक पहुँचने के लिए लॉगिन करें</p>

        {error && (
          <div style={styles.errorBox}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7A3B3B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: 2 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="email">
              ईमेल
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              style={styles.input}
              autoComplete="email"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="password">
              पासवर्ड
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'लॉगिन हो रहा है...' : 'लॉगिन करें'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link
              href="/admin/forgot-password"
              style={{ color: '#E88A24', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
            >
              पासवर्ड भूल गए?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(145deg, #FFF9ED 0%, #EDE2D0 100%)',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
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
    margin: '0 0 28px 0',
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
    gap: 20,
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
    padding: '12px 14px',
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
