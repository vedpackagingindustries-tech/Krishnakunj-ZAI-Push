import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { logFinancialEvent } from '@/lib/audit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Admin auth validation ──
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

    // ── Get donation by ID ──
    const { id } = await params

    const donation = await db.donation.findUnique({
      where: { id },
    })

    if (!donation) {
      return NextResponse.json(
        { error: 'दान रिकॉर्ड नहीं मिला।' },
        { status: 404 }
      )
    }

    return NextResponse.json(donation)
  } catch (error) {
    console.error('Donation detail error:', error)
    return NextResponse.json(
      { error: 'दान विवरण प्राप्त करने में त्रुटि हुई।' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/donations/[id]
//
// Admin verifies a donation and marks it SUCCESS or FAILED.
// ---------------------------------------------------------------------------

const verifySchema = z.object({
  action: z.enum(['verify', 'reject']),
  transactionId: z.string().max(100).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Admin auth ──
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'अधिकृत नहीं।' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7).trim()
    const admin = await validateSession(token)
    if (!admin) {
      return NextResponse.json(
        { error: 'सत्र समाप्त हो गया है।' },
        { status: 401 }
      )
    }

    const { id } = await params

    // ── Validate body ──
    const body = await request.json()
    const parsed = verifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { action, transactionId } = parsed.data

    // ── Find donation ──
    const donation = await db.donation.findUnique({ where: { id } })
    if (!donation) {
      return NextResponse.json(
        { error: 'दान रिकॉर्ड नहीं मिला।' },
        { status: 404 }
      )
    }

    // ── Already SUCCESS → idempotent ──
    if (action === 'verify' && donation.paymentStatus === 'SUCCESS') {
      return NextResponse.json({ success: true, message: 'पहले ही सत्यापित।' })
    }

    // ── Only allow verify from PENDING/PROCESSING, reject from same ──
    if (action === 'verify') {
      if (donation.paymentStatus !== 'PENDING' && donation.paymentStatus !== 'PROCESSING') {
        return NextResponse.json(
          { error: `स्थिति '${donation.paymentStatus}' से सत्यापित नहीं किया जा सकता।` },
          { status: 400 }
        )
      }

      const now = new Date()
      await db.donation.update({
        where: { id },
        data: {
          paymentStatus: 'SUCCESS',
          paidAt: now,
          transactionId: transactionId || null,
          receiptGeneratedAt: now,
        },
      })

      await logFinancialEvent({
        action: 'PAYMENT_VERIFIED_BY_ADMIN',
        entityType: 'donation',
        entityId: donation.id,
        metadata: {
          amount: donation.amount,
          receiptNumber: donation.receiptNumber,
          transactionId: transactionId || null,
          donorName: donation.donorName,
          adminName: admin.name,
        },
        adminId: admin.id,
        adminName: admin.name,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
      })

      return NextResponse.json({ success: true, message: 'दान सफलतापूर्वक सत्यापित।' })
    }

    // ── Reject ──
    if (action === 'reject') {
      if (donation.paymentStatus === 'SUCCESS') {
        return NextResponse.json(
          { error: 'सफल दान अस्वीकार नहीं किया जा सकता।' },
          { status: 400 }
        )
      }

      await db.donation.update({
        where: { id },
        data: { paymentStatus: 'FAILED' },
      })

      return NextResponse.json({ success: true, message: 'दान अस्वीकार किया गया।' })
    }

    return NextResponse.json({ error: 'अमान्य क्रिया।' }, { status: 400 })
  } catch (error) {
    console.error('[admin/donations/id] PATCH error:', error)
    return NextResponse.json(
      { error: 'त्रुटि हुई।' },
      { status: 500 }
    )
  }
}
