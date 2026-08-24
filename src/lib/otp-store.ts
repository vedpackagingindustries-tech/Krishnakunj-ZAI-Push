import { randomInt } from 'crypto';

// ---------------------------------------------------------------------------
// In-memory OTP store for password reset flow
// ---------------------------------------------------------------------------

interface OtpRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number; // 5
}

const otpStore = new Map<string, OtpRecord>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

export function storeOtp(email: string, otp: string): void {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
  });
}

export function verifyOtp(email: string, otp: string): { valid: boolean; expired?: boolean; locked?: boolean } {
  const record = otpStore.get(email);
  if (!record) {
    return { valid: false };
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return { valid: false, expired: true };
  }
  if (record.otp !== otp) {
    record.attempts += 1;
    if (record.attempts >= record.maxAttempts) {
      otpStore.delete(email);
      return { valid: false, locked: true };
    }
    return { valid: false };
  }
  // Success — clear the record
  otpStore.delete(email);
  return { valid: true };
}

export function clearOtp(email: string): void {
  otpStore.delete(email);
}
