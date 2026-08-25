import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const url = request.nextUrl

  // ── Prevent clickjacking ──
  response.headers.set('X-Frame-Options', 'DENY')

  // ── Prevent MIME type sniffing ──
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // ── HSTS: enforce HTTPS for 1 year, include subdomains ──
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // ── Control referrer information ──
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // ── Restrict browser features ──
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )

  // ── Control DNS prefetching ──
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  // ── Remove X-Powered-By header (hides Next.js) ──
  response.headers.delete('x-powered-by')

  // ── Content Security Policy ──
  // Restricts where scripts, styles, images, etc. can be loaded from
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-inline/eval needed for Next.js runtime
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ]
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))

  // ── Additional security headers ──
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless')

  // ── Block common attack paths in URL ──
  const pathname = url.pathname
  // Block path traversal attempts
  if (pathname.includes('..') || pathname.includes('%2e%2e') || pathname.includes('%252e')) {
    return new NextResponse(null, { status: 400 })
  }

  // ── CSRF protection for mutating requests to API routes ──
  if (pathname.startsWith('/api/') && request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')

    // Allow if origin matches host or is from the same site
    const isSameOrigin =
      (origin && (origin.includes(host || ''))) ||
      (referer && (referer.includes(host || '')))

    // Also allow if it's a server-side request (no origin/referer, e.g., from Vercel cron)
    const isServerRequest = !origin && !referer

    if (!isSameOrigin && !isServerRequest && host) {
      return new NextResponse(
        JSON.stringify({ error: 'CSRF validation failed.' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon\.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
