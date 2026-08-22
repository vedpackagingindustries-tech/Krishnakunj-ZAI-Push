import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { db } from '@/lib/db'

const PAYMENT_KEYS = [
  'upiId',
  'accountHolder',
  'bankName',
  'ifsc',
  'accountNumber',
  'showUpi',
  'showBank',
] as const

type PaymentKey = typeof PAYMENT_KEYS[number]

function isPaymentKey(key: string): key is PaymentKey {
  return PAYMENT_KEYS.includes(key as PaymentKey)
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'अधिकृत नहीं। कृपया लॉगिन करें।' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7).trim()
    const admin = await validateSession(token)
    if (!admin) {
      return NextResponse.json(
        { error: 'सत्र समाप्त हो गया है। कृपया फिर से लॉगिन करें।' },
        { status: 401 }
      )
    }

    const settings = await db.websiteSetting.findMany({
      where: { key: { in: [...PAYMENT_KEYS] } },
    })

    const result: Record<string, string> = {}
    for (const s of settings) {
      result[s.key] = s.value
    }

    return NextResponse.json({ settings: result })
  } catch (error) {
    console.error('Payment settings get error:', error)
    return NextResponse.json(
      { error: 'भुगतान सेटिंग प्राप्त करने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'अधिकृत नहीं। कृपया लॉगिन करें।' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7).trim()
    const admin = await validateSession(token)
    if (!admin) {
      return NextResponse.json(
        { error: 'सत्र समाप्त हो गया है। कृपया फिर से लॉगिन करें।' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const operations = Object.entries(body).filter(
      ([key]) => isPaymentKey(key)
    )

    if (operations.length === 0) {
      return NextResponse.json(
        { error: 'कोई मान्य सेटिंग नहीं मिली।' },
        { status: 400 }
      )
    }

    await Promise.all(
      operations.map(([key, value]) =>
        db.websiteSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value), label: key },
        })
      )
    )

    await db.auditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: 'UPDATE',
        entityType: 'setting',
        metadata: JSON.stringify({ group: 'payment', keys: operations.map(([k]) => k) }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment settings put error:', error)
    return NextResponse.json(
      { error: 'भुगतान सेटिंग सहेजने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}