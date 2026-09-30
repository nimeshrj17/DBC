import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAnonCookie, setSessionCookie } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const anonId = await getAnonCookie();
    if (!anonId) return NextResponse.json({ error: 'Missing anonymous binding' }, { status: 400 });

    const body = await request.json();
    const { tableId, tableNumber, items, orderKey } = body;
    if (!tableId || !items || !orderKey) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // 1. Fetch full menu to re-validate prices server-side
    const menuSnap = await adminDb.collection('menuItems').get();
    const menuMap = new Map();
    menuSnap.forEach(doc => menuMap.set(doc.id, { id: doc.id, ...doc.data() }));

    let serverSubtotal = 0;
    const validatedItems: any[] = [];
    
    for (const clientItem of items) {
      const serverItem = menuMap.get(clientItem.menuItemId || clientItem.id);
      if (!serverItem) continue;
      
      const qty = Math.min(Math.max(1, clientItem.qty), 10); // cap qty at 10 per line
      const price = serverItem.price;
      serverSubtotal += (price * qty);
      
      validatedItems.push({
        menuItemId: serverItem.id,
        name: serverItem.name,
        category: serverItem.category || 'Uncategorized',
        isRetail: serverItem.isRetail || false,
        price,
        qty,
        notes: clientItem.notes || ''
      });
    }

    if (validatedItems.length === 0) return NextResponse.json({ error: 'No valid items' }, { status: 400 });

    // 2. Fetch settings to apply taxes (simplified for now)
    const settingsSnap = await adminDb.collection('settings').doc('global').get();
    const settings = settingsSnap.data() || { taxEnabled: false, taxPercentage: 0 };
    const serverTax = settings.taxEnabled ? serverSubtotal * (settings.taxPercentage / 100) : 0;
    const serverTotal = serverSubtotal + serverTax;

    const tableRef = adminDb.collection('tables').doc(tableId);

    // 3. Run Transaction
    const sessionId = crypto.randomUUID();
    const orderDocId = `${sessionId}_${orderKey}`;
    const orderRef = adminDb.collection('orders').doc(orderDocId);

    const result = await adminDb.runTransaction(async (t) => {
      const tableDoc = await t.get(tableRef);
      const orderDoc = await t.get(orderRef);

      // Idempotency: If the exact orderKey already exists for this anonId, just return success
      if (orderDoc.exists) {
        const existingData = orderDoc.data();
        if (existingData?.anonId === anonId) {
          return { status: 200, sessionId: existingData.sessionId, tableStatus: tableDoc.data()?.status };
        }
        throw new Error('OrderKey conflict');
      }

      if (!tableDoc.exists) throw new Error('Table not found');
      
      const tData = tableDoc.data();
      const currentStatus = tData?.status || 'empty';
      
      // If table is Active or Billed, we reject anonymous submit-first!
      if (['active', 'billed', 'paid'].includes(currentStatus)) {
        throw new Error('Table is locked');
      }

      // Transition Table Status if Empty
      if (currentStatus === 'empty') {
        t.update(tableRef, { status: 'claimed' });
      }
      
      // It's allowed if status is 'claimed' (Competing Claims) or 'empty'.

      const newOrderData = {
        tableId,
        tableNumber: parseInt(tableNumber) || 0,
        sessionId,
        anonId, // Bind it to anonId for idempotency
        items: validatedItems,
        subtotal: serverSubtotal,
        tax: serverTax,
        total: serverTotal,
        status: 'needs_approval',
        paymentStatus: 'unpaid',
        paymentMethod: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      t.set(orderRef, newOrderData);

      return { status: 201, sessionId, tableStatus: currentStatus === 'empty' ? 'claimed' : currentStatus };
    });

    if (result.status === 409) return NextResponse.json({ error: 'Conflict' }, { status: 409 });
    
    // 4. Issue the Session Cookie!
    await setSessionCookie(tableId, { tableId, sessionId: result.sessionId, role: 'owner' });

    return NextResponse.json({ success: true, sessionId: result.sessionId, message: 'Order submitted for approval' }, { status: 201 });

  } catch (error: any) {
    if (error.message === 'Table is locked') return NextResponse.json({ error: 'Table already active' }, { status: 409 });
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
