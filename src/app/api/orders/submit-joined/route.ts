import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSessionCookie } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableId, items, orderKey } = body;
    if (!tableId || !items || !orderKey) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const session = await getSessionCookie(tableId);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Validate prices
    const menuSnap = await adminDb.collection('menuItems').get();
    const menuMap = new Map();
    menuSnap.forEach((doc: any) => menuMap.set(doc.id, { id: doc.id, ...doc.data() }));

    let serverSubtotal = 0;
    const validatedItems: any[] = [];
    
    for (const clientItem of items) {
      const serverItem = menuMap.get(clientItem.menuItemId);
      if (!serverItem) continue;
      
      const qty = Math.min(Math.max(1, clientItem.qty), 10);
      serverSubtotal += (serverItem.price * qty);
      
      validatedItems.push({
        menuItemId: serverItem.id,
        name: serverItem.name,
        category: serverItem.category || 'Uncategorized',
        price: serverItem.price,
        qty,
        notes: clientItem.notes || ''
      });
    }

    if (validatedItems.length === 0) return NextResponse.json({ error: 'No valid items' }, { status: 400 });

    // Settings
    const settingsSnap = await adminDb.collection('settings').doc('global').get();
    const settings = settingsSnap.data() || { taxEnabled: false, taxPercentage: 0 };
    const serverTax = settings.taxEnabled ? serverSubtotal * (settings.taxPercentage / 100) : 0;
    const serverTotal = serverSubtotal + serverTax;

    const orderDocId = `${session.sessionId}_${orderKey}`;
    const orderRef = adminDb.collection('orders').doc(orderDocId);
    const tableRef = adminDb.collection('tables').doc(tableId);

    const result = await adminDb.runTransaction(async (t: any) => {
      const tableDoc = await t.get(tableRef);
      if (!tableDoc.exists) throw new Error('Table not found');
      
      const status = tableDoc.data()?.status;
      if (['billed', 'paid', 'empty'].includes(status)) {
        throw new Error('Invalid table status');
      }

      const orderDoc = await t.get(orderRef);
      if (orderDoc.exists) return { status: 200 }; // Idempotent success

      const orderStatus = (serverTotal > 2000) ? 'needs_approval' : 'pending';

      const newOrderData = {
        tableId,
        tableNumber: tableDoc.data()?.number || 0,
        sessionId: session.sessionId,
        items: validatedItems,
        subtotal: serverSubtotal,
        tax: serverTax,
        total: serverTotal,
        status: orderStatus,
        paymentStatus: 'unpaid',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      t.set(orderRef, newOrderData);
      return { status: 201 };
    });

    return NextResponse.json({ success: true, message: 'Order submitted' }, { status: result.status });
  } catch (error: any) {
    console.error(error);
    if (error.message === 'Invalid table status') return NextResponse.json({ error: 'Cannot order on a billed table' }, { status: 403 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
