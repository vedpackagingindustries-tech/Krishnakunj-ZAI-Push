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
 * Generate a receipt number in format KMD-2026-XXXXXX.
 * Uses DB count when available, otherwise generates a random 6-digit number.
 */
async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  if (isDbAvailable()) {
    try {
      const count = await db.donation.count();
      const sequential = String(count + 1).padStart(6, '0');
      return `KMD-${year}-${sequential}`;
    } catch {
      // DB query failed — fall through to random
    }
  }
  // Fallback: random 6-digit receipt number (no DB)
  const rand = String(Math.floor(100000 + Math.random() * 900000));
  return `KMD-${year}-${rand}`;
}

/**
 * Build a UPI deep-link string.
 *
 * UPI deep link spec: upi://pay?pa=<VPA>&pn=<Name>&am=<Amount>&cu=<Currency>&tn=<Note>
 *
 * NOTE: In production, replace this with a real payment gateway (Razorpay, PhonePe, etc.)
 * that provides a proper order creation API and returns an order_id for verification.
 */
function buildUpiLink(amount: number, receiptNumber: string): string {
  const note = `मंदिर निर्माण दान - ${receiptNumber}`;
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
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  },
): Promise<{ receiptNumber: string } & CreatePaymentOrderResult> {
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
          city: extras?.city ?? null,
          district: extras?.district ?? null,
          state: extras?.state ?? null,
          pincode: extras?.pincode ?? null,
          amount,
          currency: CURRENCY,
          paymentMethod: 'UPI',
          paymentOrderId: orderId,
          paymentStatus: 'PENDING',
        },
      });
    } catch {
      // DB write failed — donation proceeds without DB tracking
    }
  }

  return {
    orderId,
    receiptNumber,
    upiLink,
    qrData: upiLink, // QR data is the same UPI deep-link encoded as a QR code
  };
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
