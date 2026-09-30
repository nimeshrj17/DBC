import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { sessionId, tableId } = await request.json();
    if (!sessionId || !tableId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const tableRef = adminDb.collection('tables').doc(tableId);

    await adminDb.runTransaction(async (t) => {
      // Reject ALL orders associated with this sessionId (Batch Reject)
      const ordersSnap = await t.get(
        adminDb.collection('orders')
          .where('tableId', '==', tableId)
          .where('sessionId', '==', sessionId)
      );
      
      let wasOnlyOrder = true;
      ordersSnap.forEach((doc) => {
        t.update(doc.ref, { status: 'rejected', rejectedAt: new Date() });
      });

      // Check if table needs to revert to 'empty'
      // If there are NO other active/claimed sessions on this table, revert it.
      const otherOrdersSnap = await t.get(
        adminDb.collection('orders')
          .where('tableId', '==', tableId)
          .where('status', 'in', ['needs_approval', 'pending', 'served'])
      );
      
      const otherSessions = otherOrdersSnap.docs.filter(d => d.data().sessionId !== sessionId);
      
      if (otherSessions.length === 0) {
        t.update(tableRef, { status: 'empty' });
        // Clear secrets
        t.delete(tableRef.collection('secrets').doc('session'));
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
