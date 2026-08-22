import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, isDbAvailable } from '@/lib/db';

// ---------------------------------------------------------------------------
// Zod validation schema
// ---------------------------------------------------------------------------

const confirmPaymentSchema = z.object({
  orderId: z.string().min(1, 'कृपया ऑर्डर आईडी दर्ज करें।'),
  transactionId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/donate/confirm-payment
//
// This is called when the donor confirms they have completed the UPI payment.
// Since we do not have a real payment gateway to auto-verify, we mark the
// donation as PROCESSING and return a message asking the donor to wait.
//
// PRODUCTION NOTE:
// In production, this endpoint would be replaced by a payment gateway webhook
// that automatically verifies and updates the payment status. The client
// would poll /api/donate/verify-payment or listen via WebSocket for the update.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = confirmPaymentSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 },
      );
    }

    const { orderId, transactionId } = parsed.data;

    // Try to update in DB if available
    if (isDbAvailable()) {
      try {
        const donation = await db.donation.findUnique({
          where: { paymentOrderId: orderId },
        });

        if (donation && donation.paymentStatus === 'PENDING') {
          await db.donation.update({
            where: { paymentOrderId: orderId },
            data: {
              paymentStatus: 'PROCESSING',
              ...(transactionId ? { transactionId } : {}),
            },
          });
        }
      } catch {
        // DB unavailable — proceed without tracking
      }
    }

    return NextResponse.json({
      success: true,
      message: 'भुगतान सत्यापित किया जा रहा है...',
    });
  } catch (error) {
    console.error('[confirm-payment] Error:', error);
    return NextResponse.json(
      { success: false, error: 'भुगतान पुष्टि करने में त्रुटि हुई। कृपया पुनः प्रयास करें।' },
      { status: 500 },
    );
  }
}
