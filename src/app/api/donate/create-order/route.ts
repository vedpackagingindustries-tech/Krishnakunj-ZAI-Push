import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPaymentOrder } from '@/lib/payment';

// ---------------------------------------------------------------------------
// Zod validation schema (Hindi error messages)
// ---------------------------------------------------------------------------

const createOrderSchema = z.object({
  amount: z
    .number({ message: 'कृपया दान राशि दर्ज करें।' })
    .int({ message: 'दान राशि पूर्ण संख्या होनी चाहिए।' })
    .min(100, 'क्षमा करें, कृपया ₹100 या उससे अधिक की दान राशि दर्ज करें।'),
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
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/donate/create-order
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
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

    const result = await createPaymentOrder(data.amount, data.donorName, data.mobile, {
      email: data.email && data.email.length > 0 ? data.email : undefined,
      address: data.address,
      city: data.city,
      district: data.district,
      state: data.state,
      pincode: data.pincode,
    });

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
