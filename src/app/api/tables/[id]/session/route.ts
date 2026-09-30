import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSessionCookie } from '@/lib/session';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tableId = (await params).id;
  const session = await getSessionCookie(tableId);

  try {
    const tableDoc = await adminDb.collection('tables').doc(tableId).get();
    if (!tableDoc.exists) return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    
    const tableData = tableDoc.data();
    const status = tableData?.status || 'empty';

    let pin = null;
    let orders: any[] = [];
    
    // If the user has a valid session and it matches the table's active session, fetch their orders
    // Actually, we don't store activeSessionId on the table anymore in this model?
    // We do! We just don't expose it to clients directly. Wait, the tables doc is public?
    // No, we denied client reads. So we can just read the orders for this table.
    
    // In a real implementation, we would query orders where tableId == tableId AND sessionId == session.sessionId
    if (session) {
      const ordersSnap = await adminDb.collection('orders')
        .where('tableId', '==', tableId)
        .where('sessionId', '==', session.sessionId)
        .get();
        
      orders = ordersSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

      if (session.role === 'owner') {
        const secretDoc = await adminDb.collection('tables').doc(tableId).collection('secrets').doc('session').get();
        pin = secretDoc.data()?.pin || null;
      }
    }

    return NextResponse.json({ 
      status, 
      authenticated: !!session,
      role: session?.role || null,
      pin,
      orders
    });
    
  } catch (err) { console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
