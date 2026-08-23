import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, isDbAvailable } from '@/lib/db';
import { randomBytes } from 'crypto';
import { logFinancialEvent } from '@/lib/audit';

// ---------------------------------------------------------------------------
// Zod validation schema
// ---------------------------------------------------------------------------

const markSuccessSchema = z.object({
  orderId: z.string().min(1, 'कृपया ऑर्डर आईडी दर्ज करें।'),
});

// ---------------------------------------------------------------------------
// Client IP helper
// ---------------------------------------------------------------------------

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

// ---------------------------------------------------------------------------
// POST /api/donate/mark-success
//
// PRODUCTION NOTE:
// In production, this endpoint would be called by a payment gateway webhook
// (e.g. Razorpay webhook at /api/donate/webhook) — NOT by the client directly.
// The gateway would verify the payment server-side using its own API keys,
// then call this logic (or similar) to mark the order as SUCCESS.
//
// For demo / testing purposes, the success page calls this after the user
// confirms payment. This simulates what the gateway webhook would do.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = markSuccessSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 },
      );
    }

    const { orderId } = parsed.data;
    const ip = getClientIp(request);

    if (!isDbAvailable()) {
      return NextResponse.json({
        success: true,
        message: 'दान सफलतापूर्वक दर्ज किया गया। (डेटाबेस ट्रैकिंग उपलब्ध नहीं है)',
      });
    }

    // Find the donation
    const donation = await db.donation.findUnique({
      where: { paymentOrderId: orderId },
    });

    if (!donation) {
      return NextResponse.json({
        success: true,
        message: 'दान सफलतापूर्वक दर्ज किया गया।',
      });
    }

    // Idempotency: if already SUCCESS, return existing record
    if (donation.paymentStatus === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        donation,
      });
    }

    // Generate a simulated UPI transaction ID
    const transactionId = `UPI-${randomBytes(8).toString('hex').toUpperCase()}`;
    const now = new Date();

    // Update donation to SUCCESS
    const updated = await db.donation.update({
      where: { paymentOrderId: orderId },
      data: {
        paymentStatus: 'SUCCESS',
        paidAt: now,
        transactionId,
        receiptGeneratedAt: now,
      },
    });

    // Log financial audit event
    await logFinancialEvent({
      action: 'PAYMENT_SUCCESS',
      entityType: 'donation',
      entityId: donation.id,
      metadata: {
        amount: donation.amount,
        currency: donation.currency,
        receiptNumber: donation.receiptNumber,
        transactionId,
        donorName: donation.donorName,
        mobile: donation.mobile,
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      donation: updated,
    });
  } catch (error) {
    console.error('[mark-success] Error:', error);
    return NextResponse.json(
      { success: false, error: 'भुगतान अद्यतन करने में त्रुटि हुई। कृपया पुनः प्रयास करें।' },
      { status: 500 },
    );
  }
}
