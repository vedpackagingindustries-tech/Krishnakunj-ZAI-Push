import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPaymentOrder, buildUpiLink } from '@/lib/payment';
import { db, isDbAvailable } from '@/lib/db';

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// In-memory rate limiter: IP → timestamp[]
// ---------------------------------------------------------------------------

const orderRateMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds
const RATE_LIMIT_MAX = 5; // max orders per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = orderRateMap.get(ip) || [];
  // Filter out timestamps outside the window
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  orderRateMap.set(ip, recent);
  return recent.length >= RATE_LIMIT_MAX;
}

function recordOrder(ip: string): void {
  const now = Date.now();
  const timestamps = orderRateMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  orderRateMap.set(ip, recent);
}

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
// Zod validation schema (Hindi error messages)
// ---------------------------------------------------------------------------

const createOrderSchema = z.object({
  amount: z
    .number({ message: 'कृपया दान राशि दर्ज करें।' })
    .int({ message: 'दान राशि पूर्ण संख्या होनी चाहिए।' })
    .min(100, 'क्षमा करें, कृपया ₹100 या उससे अधिक की दान राशि दर्ज करें।')
    .max(10000000, 'दान राशि ₹10,00,000 से अधिक नहीं हो सकती।'),
  donorName: z
    .string({ message: 'कृपया अपना नाम दर्ज करें।' })
    .min(2, 'नाम कम से कम 2 अक्षर का होना चाहिए।'),
  mobile: z
    .string({ message: 'कृपया मोबाइल नंबर दर्ज करें।' })
    .regex(/^[6-9]\d{9}$/, 'कृपया एक मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।'),
  email: z
    .string()
    .email('कृपया एक मान्य ईमेल पता दर्ज करें।')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  pincode: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/donate/create-order
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Rate limit check
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'बहुत अधिक अनुरोध। कृपया कुछ समय बाद पुनः प्रयास करें।',
        },
        { status: 429 },
      );
    }

    const body = await request.json();

    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const { mobile, idempotencyKey } = data;

    // --- Idempotency check ---
    if (idempotencyKey && isDbAvailable()) {
      try {
        const existing = await db.donation.findFirst({
          where: {
            idempotencyKey,
            paymentStatus: 'PENDING',
          },
        });
        if (existing && existing.paymentOrderId) {
          return NextResponse.json({
            success: true,
            orderId: existing.paymentOrderId,
            receiptNumber: existing.receiptNumber,
            amount: existing.amount,
            upiLink: buildUpiLink(existing.amount, existing.receiptNumber),
          });
        }
      } catch {
        // DB query failed — continue with order creation
      }
    }

    // --- Anti-fraud: check for too many PENDING orders from same mobile ---
    if (isDbAvailable()) {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const pendingCount = await db.donation.count({
          where: {
            mobile,
            paymentStatus: 'PENDING',
            createdAt: {
              gte: twentyFourHoursAgo,
            },
          },
        });
        if (pendingCount >= 3) {
          return NextResponse.json(
            {
              success: false,
              error: 'आपके मोबाइल नंबर से बहुत अधिक लंबित ऑर्डर हैं। कृपया पहले पूर्व भुगतान करें या बाद में पुनः प्रयास करें।',
            },
            { status: 429 },
          );
        }
      } catch {
        // DB query failed — continue
      }
    }

    // Record this order for rate limiting
    recordOrder(ip);

    const result = await createPaymentOrder(
      data.amount,
      data.donorName,
      data.mobile,
      {
        email: data.email && data.email.length > 0 ? data.email : undefined,
        address: data.address,
        pincode: data.pincode,
        idempotencyKey: idempotencyKey || undefined,
      },
    );

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      receiptNumber: result.receiptNumber,
      amount: data.amount,
      upiLink: result.upiLink,
    });
  } catch (error) {
    console.error('[create-order] Error:', error);
    return NextResponse.json(
      { success: false, error: 'दान आदेश बनाने में त्रुटि हुई। कृपया पुनः प्रयास करें।' },
      { status: 500 },
    );
  }
}
