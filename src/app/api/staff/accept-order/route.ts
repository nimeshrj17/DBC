import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { orderId, tableId } = await request.json();
    if (!orderId || !tableId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const tableRef = adminDb.collection('tables').doc(tableId);
    const orderRef = adminDb.collection('orders').doc(orderId);
    const secretsRef = tableRef.collection('secrets').doc('session');

    const result = await adminDb.runTransaction(async (t: any) => {
      const tableDoc = await t.get(tableRef);
      const orderDoc = await t.get(orderRef);
      
      if (!tableDoc.exists || !orderDoc.exists) throw new Error('Not found');
      
      const orderData = orderDoc.data();
      const tableData = tableDoc.data();
      if (orderData?.status !== 'needs_approval') throw new Error('Invalid order state');

      const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();

      const currentActiveIds = tableData?.activeOrderIds || [];

      t.update(tableRef, { 
        status: 'occupied',
        activeOrderIds: Array.from(new Set([...currentActiveIds, orderId]))
      });
      
      t.set(secretsRef, {
        pin: generatedPin,
        sessionId: orderData.sessionId,
        updatedAt: new Date()
      });

      t.update(orderRef, { status: 'pending' });

      return { success: true, pin: generatedPin };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
