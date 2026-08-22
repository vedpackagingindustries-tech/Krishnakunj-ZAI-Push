'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminSetupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/admin/auth/check')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasAdmin === true) {
          router.replace('/admin/login')
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
      const res = await fetch('/api/admin/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          password,
          confirmPassword,
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

        <h1 style={styles.heading}>पहला एडमिन खाता बनाएं</h1>
        <p style={styles.subtitle}>
          वेबसाइट और दान प्रबंधन के लिए अपना सुरक्षित एडमिन खाता बनाएं।
        </p>

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
            <label style={styles.label} htmlFor="name">
              पूरा नाम <span style={styles.required}>*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="आपका पूरा नाम"
              required
              style={styles.input}
              autoComplete="name"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="email">
              ईमेल पता <span style={styles.required}>*</span>
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
            <label style={styles.label} htmlFor="whatsapp">
              WhatsApp नंबर <span style={styles.required}>*</span>
            </label>
            <input
              id="whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10 अंकों का मोबाइल नंबर"
              required
              style={styles.input}
              autoComplete="tel"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="password">
              पासवर्ड <span style={styles.required}>*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="कम से कम 8 अक्षर"
              required
              minLength={8}
              style={styles.input}
              autoComplete="new-password"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="confirmPassword">
              पासवर्ड की पुष्टि <span style={styles.required}>*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="पासवर्ड दोबारा दर्ज करें"
              required
              minLength={8}
              style={styles.input}
              autoComplete="new-password"
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
            {loading ? 'खाता बनाया जा रहा है...' : 'एडमिन खाता बनाएं'}
          </button>
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
  required: {
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
