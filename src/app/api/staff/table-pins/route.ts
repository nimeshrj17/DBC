import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Only query active tables to avoid reading empty tables
    const tablesSnap = await adminDb.collection('tables')
      .where('status', 'in', ['occupied', 'served', 'billed'])
      .get();
      
    const pins: Record<string, string> = {};
    
    await Promise.all(tablesSnap.docs.map(async (tableDoc) => {
      const secretDoc = await adminDb.collection('tables').doc(tableDoc.id).collection('secrets').doc('session').get();
      if (secretDoc.exists) {
        pins[tableDoc.id] = secretDoc.data()?.pin;
      }
    }));

    return NextResponse.json({ pins });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
