import { db, isDbAvailable } from '@/lib/db';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Payment gateway configuration
// ---------------------------------------------------------------------------

const UPI_ID = process.env.PAYMENT_UPI_ID || 'sahubhagwat392@indianbk';
const MERCHANT_NAME = 'कृष्णकुंज माँ कर्मा धाम';
const CURRENCY = 'INR';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreatePaymentOrderResult {
  orderId: string;
  upiLink: string;
  qrData: string;
}

export interface VerifyPaymentResult {
  paymentStatus: string;
  transactionId: string | null;
}

export interface GetPaymentStatusResult {
  paymentStatus: string;
  transactionId: string | null;
  amount: number;
  receiptNumber: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a receipt number in format KMD-{YEAR}-{6-digit sequential number}.
 *
 * Concurrency safety: Uses MAX(receiptNumber) for the current year to compute
 * the next sequential number. The DB @unique constraint on receiptNumber catches
 * any remaining race condition; on P2002 (unique violation) the function
 * retries with the next number.
 */
async function generateReceiptNumber(retries = 5): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `KMD-${year}-`;

  if (isDbAvailable()) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Find the highest sequential number for this year
        const maxResult = await db.donation.findFirst({
          where: { receiptNumber: { startsWith: prefix } },
          orderBy: { receiptNumber: 'desc' },
          select: { receiptNumber: true },
        });

        let nextNum = 1;
        if (maxResult) {
          const suffix = maxResult.receiptNumber.slice(prefix.length);
          nextNum = parseInt(suffix, 10) + 1;
        }

        const receiptNumber = `${prefix}${String(nextNum).padStart(6, '0')}`;
        return receiptNumber;
      } catch {
        // DB query failed — retry
      }
    }
  }
  // Fallback: random 6-digit receipt number (no DB)
  const rand = String(Math.floor(100000 + Math.random() * 900000));
  return `${prefix}${rand}`;
}

/**
 * Build a UPI deep-link string.
 *
 * UPI deep link spec: upi://pay?pa=<VPA>&pn=<Name>&am=<Amount>&cu=<Currency>&tn=<Note>
 *
 * NOTE: In production, replace this with a real payment gateway (Razorpay, PhonePe, etc.)
 * that provides a proper order creation API and returns an order_id for verification.
 */
export function buildUpiLink(amount: number, receiptNumber: string): string {
  const note = `मंदिर निर्माण हेतु दान - ${receiptNumber}`;
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: MERCHANT_NAME,
    am: String(amount),
    cu: CURRENCY,
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a payment order.
 *
 * Flow:
 * 1. Generate a unique receipt number (KMD-2026-XXXXXX).
 * 2. Persist a PENDING donation record in the database.
 * 3. Build a UPI deep-link for the donor to pay.
 * 4. Return order details + UPI link (never any API keys/secrets).
 *
 * PRODUCTION NOTE:
 * Replace the UPI deep-link logic with a real gateway call, e.g.:
 *   const razorpayOrder = await razorpay.orders.create({
 *     amount: amount * 100, // paise
 *     currency: 'INR',
 *     receipt: receiptNumber,
 *   });
 *   // store razorpayOrder.id as paymentOrderId
 *   // return { orderId, razorpayKey, orderDetails }
 */
export async function createPaymentOrder(
  amount: number,
  donorName: string,
  mobile: string,
  extras?: {
    email?: string;
    address?: string;
    pincode?: string;
    idempotencyKey?: string;
  },
  maxRetries = 15,
): Promise<{ receiptNumber: string } & CreatePaymentOrderResult> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const receiptNumber = await generateReceiptNumber();
    const orderId = randomUUID();
    const upiLink = buildUpiLink(amount, receiptNumber);

    // Persist the donation as PENDING (only if DB is available)
    if (isDbAvailable()) {
      try {
        await db.donation.create({
          data: {
            receiptNumber,
            donorName,
            mobile,
            email: extras?.email ?? null,
            address: extras?.address ?? null,
            pincode: extras?.pincode ?? null,
            idempotencyKey: extras?.idempotencyKey ?? null,
            amount,
            currency: CURRENCY,
            paymentMethod: 'UPI',
            paymentOrderId: orderId,
            paymentStatus: 'PENDING',
          },
        });
        return { orderId, receiptNumber, upiLink, qrData: upiLink };
      } catch (err: unknown) {
        // P2002 = unique constraint violation → wait briefly then retry
        if (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code: string }).code === 'P2002'
        ) {
          // Jittered backoff: 5-20ms random delay to spread colliding requests
          await new Promise((r) => setTimeout(r, 5 + Math.random() * 15));
          continue;
        }
        // Any other DB error — fall through to return without DB
      }
    }

    // No DB or non-unique DB error — return order without persistence
    return { orderId, receiptNumber, upiLink, qrData: upiLink };
  }

  // All retries exhausted (should not happen in practice)
  throw new Error('दान आदेश बनाने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
}

/**
 * Verify a payment by order ID.
 *
 * PRODUCTION NOTE:
 * In production, call the real gateway API to verify payment status:
 *   const payment = await razorpay.payments.fetch(paymentId);
 *   // compare payment.order_id with our stored paymentOrderId
 *   // update DB accordingly
 *
 * For now, we simply return the current DB status.
 */
export async function verifyPayment(
  orderId: string,
): Promise<VerifyPaymentResult> {
  if (isDbAvailable()) {
    try {
      const donation = await db.donation.findUnique({
        where: { paymentOrderId: orderId },
      });
      if (donation) {
        return {
          paymentStatus: donation.paymentStatus,
          transactionId: donation.transactionId,
        };
      }
    } catch {
      // DB query failed
    }
  }
  // No DB — return unknown status
  return { paymentStatus: 'UNKNOWN', transactionId: null };
}

/**
 * Get detailed payment status for an order.
 */
export async function getPaymentStatus(
  orderId: string,
): Promise<GetPaymentStatusResult> {
  if (isDbAvailable()) {
    try {
      const donation = await db.donation.findUnique({
        where: { paymentOrderId: orderId },
      });
      if (donation) {
        return {
          paymentStatus: donation.paymentStatus,
          transactionId: donation.transactionId,
          amount: donation.amount,
          receiptNumber: donation.receiptNumber,
        };
      }
    } catch {
      // DB query failed
    }
  }
  throw new Error('दान आदेश नहीं मिला।');
}
