import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // In a real app we should check if the requester is staff using tokens.
    // For now, return the pins.
    const tablesSnap = await adminDb.collection('tables').get();
    const pins: Record<string, string> = {};
    
    await Promise.all(tablesSnap.docs.map(async (tableDoc) => {
      const status = tableDoc.data().status;
      if (status === 'occupied' || status === 'served' || status === 'billed') {
        const secretDoc = await adminDb.collection('tables').doc(tableDoc.id).collection('secrets').doc('session').get();
        if (secretDoc.exists) {
          pins[tableDoc.id] = secretDoc.data()?.pin;
        }
      }
    }));

    return NextResponse.json({ pins });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
