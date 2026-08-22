const ADMIN_TOKEN_KEY = 'admin_token' as const

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearAdminToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export async function fetchAdmin<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const token = getAdminToken()
  if (!token) {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login'
    }
    throw new Error('अधिकृत नहीं। कृपया लॉगिन करें।')
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type':
        options?.headers &&
        (options.headers as Record<string, string>)['Content-Type']
          ? (options.headers as Record<string, string>)['Content-Type']
          : 'application/json',
    },
  })

  if (response.status === 401) {
    clearAdminToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login'
    }
    throw new Error('सत्र समाप्त हो गया है। कृपया फिर से लॉगिन करें।')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      (errorData as { error?: string }).error ||
        `अनुरोध विफल: ${response.status}`
    )
  }

  return response.json() as Promise<T>
}
