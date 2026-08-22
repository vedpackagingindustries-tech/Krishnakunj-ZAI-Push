import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPayment } from '@/lib/payment';

// ---------------------------------------------------------------------------
// Zod validation schema
// ---------------------------------------------------------------------------

const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'कृपया ऑर्डर आईडी दर्ज करें।'),
});

// ---------------------------------------------------------------------------
// POST /api/donate/verify-payment
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = verifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 },
      );
    }

    const { orderId } = parsed.data;

    const result = await verifyPayment(orderId);

    return NextResponse.json({
      success: true,
      paymentStatus: result.paymentStatus,
      transactionId: result.transactionId ?? undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'भुगतान सत्यापन में त्रुटि हुई।';
    return NextResponse.json(
      { success: false, error: message },
      { status: 404 },
    );
  }
}
