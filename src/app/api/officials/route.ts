import { NextResponse } from 'next/server';
import { db, isDbAvailable } from '@/lib/db';

export async function GET() {
  try {
    if (!isDbAvailable()) return NextResponse.json({ officials: [] });
    const officials = await db.officialMember.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json({ officials });
  } catch {
    return NextResponse.json({ officials: [] });
  }
}
