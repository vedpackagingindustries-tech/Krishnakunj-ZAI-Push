// ---------------------------------------------------------------------------
// In-memory OTP store for password reset flow
// ---------------------------------------------------------------------------

const otpStore = new Map<string, { otp: string; expiresAt: number }>()

const OTP_TTL_MS = 5 * 60 * 1000 // 5 minutes

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function storeOtp(email: string, otp: string): void {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
  })
}

export function verifyOtp(email: string, otp: string): { valid: boolean; expired?: boolean } {
  const record = otpStore.get(email)
  if (!record) {
    return { valid: false }
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email)
    return { valid: false, expired: true }
  }
  if (record.otp !== otp) {
    return { valid: false }
  }
  return { valid: true }
}

export function clearOtp(email: string): void {
  otpStore.delete(email)
}
