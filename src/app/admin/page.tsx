'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/* ============================================================
   Admin Entry Page — CLIENT COMPONENT

   Uses the /api/admin/auth/check API (which is proven to work)
   to decide whether to show Setup or Login.
   ============================================================ */

export default function AdminEntryPage() {
  const router = useRouter()
  const [showLogin, setShowLogin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // If already logged in, go to dashboard
    const token = localStorage.getItem('admin_token')
    if (token) {
      fetch('/api/admin/auth/session', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) {
            router.replace('/admin/dashboard')
            return
          }
          // Token invalid, clear and continue with check
          localStorage.removeItem('admin_token')
          checkAdminExists()
        })
        .catch(() => checkAdminExists())
    } else {
      checkAdminExists()
    }

    function checkAdminExists() {
      fetch('/api/admin/auth/check')
        .then((res) => res.json())
        .then((data) => {
          if (data.hasAdmin === false) {
            router.replace('/admin/setup')
          } else {
            setShowLogin(true)
            setChecking(false)
          }
        })
        .catch(() => {
          // API failed — show login as fallback
          setShowLogin(true)
          setChecking(false)
        })
    }
  }, [router])

  // Import login form dynamically to avoid circular dependency
  const [LoginComponent, setLoginComponent] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    if (showLogin) {
      import('./login-client').then((mod) => {
        setLoginComponent(() => mod.default)
      })
    }
  }, [showLogin])

  if (checking || !showLogin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #FFF9ED 0%, #EDE2D0 100%)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid #EDE2D0',
            borderTop: '3px solid #E88A24',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#5A3A24', fontSize: 16 }}>जाँच हो रही है...</p>
        </div>
      </div>
    )
  }

  if (LoginComponent) {
    return <LoginComponent />
  }

  // Fallback loading while LoginComponent loads
  return null
}
