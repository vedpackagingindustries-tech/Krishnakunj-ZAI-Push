import { NextRequest, NextResponse } from 'next/server';
import { db, isDbAvailable } from '@/lib/db';

// ---------------------------------------------------------------------------
// GET /api/donate/receipt/[orderId]
//
// Returns receipt-safe fields only if paymentStatus === 'SUCCESS'.
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;

    if (!isDbAvailable()) {
      return NextResponse.json(
        { success: false, error: 'रसीद डेटाबेस उपलब्ध नहीं है।' },
        { status: 503 },
      );
    }

    const donation = await db.donation.findUnique({
      where: { paymentOrderId: orderId },
    });

    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'दान रसीद नहीं मिली।' },
        { status: 404 },
      );
    }

    // Only return receipt data if payment is successful
    if (donation.paymentStatus !== 'SUCCESS') {
      return NextResponse.json(
        {
          success: false,
          error: 'रसीद अभी तैयार नहीं है। भुगतान पुष्टि होने पर यह दिखाई देगी।',
        },
        { status: 404 },
      );
    }

    // Return only receipt-necessary fields (no full PII)
    return NextResponse.json({
      success: true,
      donation: {
        id: donation.id,
        receiptNumber: donation.receiptNumber,
        donorName: donation.donorName,
        amount: donation.amount,
        currency: donation.currency,
        paymentMethod: donation.paymentMethod,
        paymentStatus: donation.paymentStatus,
        paidAt: donation.paidAt,
        receiptGeneratedAt: donation.receiptGeneratedAt,
        createdAt: donation.createdAt,
      },
    });
  } catch (error) {
    console.error('[receipt] Error:', error);
    return NextResponse.json(
      { success: false, error: 'रसीद प्राप्त करने में त्रुटि हुई। कृपया पुनः प्रयास करें।' },
      { status: 500 },
    );
  }
}
