export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSessionCookie, getAnonCookie, setAnonCookie } from '@/lib/session';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tableId = (await params).id;
  const session = await getSessionCookie(tableId);

  try {
    let anonId = await getAnonCookie();
    if (!anonId) {
      anonId = crypto.randomUUID();
      await setAnonCookie(anonId);
    }

    const tableDoc = await adminDb.collection('tables').doc(tableId).get();
    if (!tableDoc.exists) return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    
    const tableData = tableDoc.data();
    const status = tableData?.status || 'empty';
    const number = tableData?.number ?? tableId;

    let pin = null;
    let orders: any[] = [];
    
    if (session) {
      if (status === 'empty') {
        const response = NextResponse.json({ 
          status, 
          number,
          authenticated: false,
          role: null,
          pin: null,
          orders: []
        });
        response.cookies.delete(`__Host-tbl_${tableId}`);
        return response;
      }
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
      number,
      authenticated: !!session,
      role: session?.role || null,
      pin,
      orders
    });
    
  } catch (err) { console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
