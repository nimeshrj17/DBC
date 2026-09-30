import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { orderId, tableId } = await request.json();
    if (!orderId || !tableId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // In a real app, verify Firebase Admin Auth Token here to ensure caller is staff.
    // const authHeader = request.headers.get('Authorization');
    // const decodedToken = await adminAuth.verifyIdToken(authHeader?.split('Bearer ')[1]);
    
    const tableRef = adminDb.collection('tables').doc(tableId);
    const orderRef = adminDb.collection('orders').doc(orderId);
    const secretsRef = tableRef.collection('secrets').doc('session');

    const result = await adminDb.runTransaction(async (t) => {
      const tableDoc = await t.get(tableRef);
      const orderDoc = await t.get(orderRef);
      
      if (!tableDoc.exists || !orderDoc.exists) throw new Error('Not found');
      
      const orderData = orderDoc.data();
      if (orderData?.status !== 'needs_approval') throw new Error('Invalid order state');

      // 1. Generate PIN
      const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();

      // 2. Set Table to Active
      t.update(tableRef, { status: 'active' });
      
      // 3. Save PIN securely
      t.set(secretsRef, {
        pin: generatedPin,
        sessionId: orderData.sessionId,
        updatedAt: new Date()
      });

      // 4. Update Order to Pending (triggers KOT)
      t.update(orderRef, { status: 'pending' });

      // 5. Sibling Candidates logic: Any other orders on this table that are 'needs_approval'
      // but have a DIFFERENT sessionId should ideally remain 'needs_approval' so they can be merged.
      // (Done implicitly by not updating them).

      return { success: true, pin: generatedPin };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
