import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// GET /api/donate/receipt/[orderId]
//
// Returns the full donation record for the given orderId.
// Used by the receipt/success page to display donation details.
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;

    const donation = await db.donation.findUnique({
      where: { paymentOrderId: orderId },
    });

    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'दान रसीद नहीं मिली।' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      donation,
    });
  } catch (error) {
    console.error('[receipt] Error:', error);
    return NextResponse.json(
      { success: false, error: 'रसीद प्राप्त करने में त्रुटि हुई। कृपया पुनः प्रयास करें।' },
      { status: 500 },
    );
  }
}
