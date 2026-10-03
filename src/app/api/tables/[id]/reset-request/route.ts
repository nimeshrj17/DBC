import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tableId = (await params).id;
    await adminDb.collection('tables').doc(tableId).update({
      resetRequested: true,
      updatedAt: new Date()
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset request error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
