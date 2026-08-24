'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Styles (consistent with admin login page warm theme)
// ---------------------------------------------------------------------------

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
    lineHeight: 1.5,
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
  successBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: 10,
    padding: '12px 16px',
    marginBottom: 20,
    color: '#2D5A3D',
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
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  link: {
    color: '#E88A24',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  otpContainer: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    margin: '4px 0',
  },
  otpInput: {
    width: 48,
    height: 52,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 700,
    borderRadius: 10,
    border: '1px solid rgba(128, 107, 89, 0.25)',
    backgroundColor: '#FFF9ED',
    color: '#5A3A24',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: "'Segoe UI', monospace",
  },
  backLink: {
    textAlign: 'center',
    marginTop: 24,
    color: '#806B59',
    fontSize: 14,
  },
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
}

const getStepDotStyle = (active: boolean, completed: boolean): React.CSSProperties => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: completed ? '#2D5A3D' : active ? '#E88A24' : '#EDE2D0',
  transition: 'background-color 0.3s',
})

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Step = 'email' | 'otp' | 'password' | 'success'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus first OTP input when step changes
  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      otpRefs.current[0]?.focus()
    }
  }, [step])

  // --- Step 1: Submit email ---
  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email.trim()) {
      setError('कृपया ईमेल दर्ज करें।')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), whatsapp: whatsapp.trim() }),
      })
      const data = await res.json()

      if (data.success) {
        setStep('otp')
      } else {
        setError(data.error || 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।')
      }
    } catch {
      setError('नेटवर्क त्रुटि। कृपया इंटरनेट कनेक्शन जाँचें।')
    } finally {
      setLoading(false)
    }
  }

  // --- OTP input handling ---
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only digits
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only last char
    setOtp(newOtp)

    // Auto-advance to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newOtp = pasted.split('')
      setOtp(newOtp)
      otpRefs.current[5]?.focus()
    }
  }

  // --- Step 2: Verify OTP ---
  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const otpValue = otp.join('')
    if (otpValue.length !== 6) {
      setError('कृपया 6 अंकों का पूरा OTP दर्ज करें।')
      return
    }

    // OTP verification happens at reset-password step
    setStep('password')
  }

  // --- Step 3: Reset password ---
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (newPassword.length < 6) {
      setError('पासवर्ड कम से कम 6 अक्षर का होना चाहिए।')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.join(''),
          newPassword,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setStep('success')
      } else {
        setError(data.error || 'पासवर्ड बदलने में त्रुटि हुई।')
      }
    } catch {
      setError('नेटवर्क त्रुटि। कृपया इंटरनेट कनेक्शन जाँचें।')
    } finally {
      setLoading(false)
    }
  }

  // --- Step labels ---
  const getStepLabels = (): string[] => {
    const labels: Record<Step, string> = {
      email: 'ईमेल दर्ज करें',
      otp: 'OTP सत्यापन',
      password: 'नया पासवर्ड',
      success: 'सफल',
    }
    return Object.values(labels)
  }

  const stepOrder: Step[] = ['email', 'otp', 'password', 'success']
  const currentStepIndex = stepOrder.indexOf(step)

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
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 style={styles.heading}>पासवर्ड भूल गए</h1>
        <p style={styles.subtitle}>
          {step === 'email' && 'अपना ईमेल और WhatsApp नंबर दर्ज करें। OTP आपके WhatsApp पर भेजा जाएगा।'}
          {step === 'otp' && 'अपने WhatsApp पर प्राप्त 6 अंकों का OTP दर्ज करें।'}
          {step === 'password' && 'अपना नया पासवर्ड सेट करें।'}
          {step === 'success' && ''}
        </p>

        {/* Step indicator dots */}
        {step !== 'success' && (
          <div style={styles.stepIndicator}>
            {stepOrder.slice(0, 3).map((s, i) => (
              <div
                key={s}
                style={getStepDotStyle(
                  s === step,
                  i < currentStepIndex
                )}
              />
            ))}
          </div>
        )}

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

        {/* ======== STEP 1: Email + WhatsApp ======== */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="fp-email">
                ईमेल
              </label>
              <input
                id="fp-email"
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
              <label style={styles.label} htmlFor="fp-whatsapp">
                WhatsApp नंबर
              </label>
              <input
                id="fp-whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="9589781615"
                style={styles.input}
                autoComplete="tel"
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
              {loading ? 'भेजा जा रहा है...' : 'OTP भेजें'}
            </button>
          </form>
        )}

        {/* ======== STEP 2: OTP ======== */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>6 अंकों का OTP</label>
              <div style={styles.otpContainer}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    style={styles.otpInput}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={styles.submitBtn}
            >
              सत्यापित करें
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleEmailSubmit}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#E88A24',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                OTP दोबारा भेजें
              </button>
            </div>
          </form>
        )}

        {/* ======== STEP 3: New Password ======== */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="fp-new-password">
                नया पासवर्ड
              </label>
              <input
                id="fp-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="कम से कम 6 अक्षर"
                required
                style={styles.input}
                autoComplete="new-password"
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="fp-confirm-password">
                पासवर्ड पुष्टि करें
              </label>
              <input
                id="fp-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="पासवर्ड दोबारा दर्ज करें"
                required
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
              {loading ? 'बदला जा रहा है...' : 'पासवर्ड बदलें'}
            </button>
          </form>
        )}

        {/* ======== STEP 4: Success ======== */}
        {step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={styles.successBox}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2D5A3D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: 2 }}
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>पासवर्ड सफलतापूर्वक बदल दिया गया!</span>
            </div>
            <p style={{ color: '#806B59', fontSize: 14, marginBottom: 20 }}>
              अब आप अपने नए पासवर्ड से लॉगिन कर सकते हैं।
            </p>
            <Link href="/admin/login" style={styles.submitBtn as React.CSSProperties}>
              लॉगिन पर जाएं
            </Link>
          </div>
        )}

        {/* Back to login */}
        {step !== 'success' && (
          <div style={styles.backLink}>
            <Link href="/admin/login" style={styles.link}>
              ← लॉगिन पर वापस जाएं
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
