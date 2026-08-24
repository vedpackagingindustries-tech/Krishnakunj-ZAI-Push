import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, isDbAvailable } from '@/lib/db';
import { validateSession } from '@/lib/auth';
import { logFinancialEvent } from '@/lib/audit';

// ---------------------------------------------------------------------------
// POST /api/donate/mark-success
//
// SECURITY: Requires admin authentication.
// Only an authorized admin can mark a donation as SUCCESS.
// Transaction ID must be provided by the admin (real reference from bank).
// No fake transaction IDs are generated.
// ---------------------------------------------------------------------------

const markSuccessSchema = z.object({
  orderId: z.string().min(1),
  transactionId: z.string().optional(),
});

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // ── Require admin authentication ──
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'अधिकृत नहीं।' },
        { status: 401 },
      );
    }

    const admin = await validateSession(authHeader.slice(7).trim());
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'सत्र समाप्त हो गया है। कृपया लॉगिन करें।' },
        { status: 401 },
      );
    }

    // ── Validate request body ──
    const body = await request.json();
    const parsed = markSuccessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { orderId, transactionId } = parsed.data;
    const ip = getClientIp(request);

    if (!isDbAvailable()) {
      return NextResponse.json(
        { success: false, error: 'डेटाबेस उपलब्ध नहीं है।' },
        { status: 503 },
      );
    }

    // ── Find the donation ──
    const donation = await db.donation.findUnique({
      where: { paymentOrderId: orderId },
    });

    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'दान रिकॉर्ड नहीं मिला।' },
        { status: 404 },
      );
    }

    // ── Only allow transition from PENDING or PROCESSING ──
    if (donation.paymentStatus === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        message: 'यह दान पहले ही सफल हो चुका है।',
        donation: {
          id: donation.id,
          receiptNumber: donation.receiptNumber,
          amount: donation.amount,
          paymentStatus: donation.paymentStatus,
          paidAt: donation.paidAt,
          transactionId: donation.transactionId,
        },
      });
    }

    if (donation.paymentStatus !== 'PENDING' && donation.paymentStatus !== 'PROCESSING') {
      return NextResponse.json(
        { success: false, error: `इस दान की स्थिति '${donation.paymentStatus}' है, सत्यापित नहीं किया जा सकता।` },
        { status: 400 },
      );
    }

    // ── Mark as SUCCESS ──
    const now = new Date();
    const updated = await db.donation.update({
      where: { paymentOrderId: orderId },
      data: {
        paymentStatus: 'SUCCESS',
        paidAt: now,
        transactionId: transactionId || null,
        receiptGeneratedAt: now,
      },
    });

    // ── Audit log ──
    await logFinancialEvent({
      action: 'PAYMENT_VERIFIED_BY_ADMIN',
      entityType: 'donation',
      entityId: donation.id,
      metadata: {
        amount: donation.amount,
        currency: donation.currency,
        receiptNumber: donation.receiptNumber,
        transactionId: transactionId || null,
        donorName: donation.donorName,
        mobile: donation.mobile,
        adminName: admin.name,
        adminEmail: admin.email,
      },
      ipAddress: ip,
      adminId: admin.id,
      adminName: admin.name,
    });

    return NextResponse.json({
      success: true,
      donation: {
        id: updated.id,
        receiptNumber: updated.receiptNumber,
        amount: updated.amount,
        paymentStatus: updated.paymentStatus,
        paidAt: updated.paidAt,
        transactionId: updated.transactionId,
      },
    });
  } catch (error) {
    console.error('[mark-success] Error:', error);
    return NextResponse.json(
      { success: false, error: 'भुगतान अद्यतन करने में त्रुटि हुई।' },
      { status: 500 },
    );
  }
}
