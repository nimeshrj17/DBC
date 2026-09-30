import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAnonCookie, setAnonCookie } from '@/lib/session';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tableId = (await params).id;
  
  // 1. Ensure anonymous cookie exists
  let anonId = await getAnonCookie();
  if (!anonId) {
    anonId = crypto.randomUUID();
    await setAnonCookie(anonId);
  }

  try {
    const tableRef = adminDb.collection('tables').doc(tableId);
    
    // Lazy Sweep & Status read inside a transaction
    const result = await adminDb.runTransaction(async (t) => {
      const doc = await t.get(tableRef);
      if (!doc.exists) return null;
      
      const data = doc.data();
      let status = data?.status || 'empty';
      const activeSessionId = data?.activeSessionId;

      // LAZY SWEEP: If table is 'claimed' but unapproved for > 5 mins, and no pending orders exist?
      // Actually, competing claims mean we just sweep individual candidates.
      // For now, if status is 'empty', return empty.
      
      return { status, activeSessionId };
    });

    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const response = NextResponse.json({ status: result.status });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
    
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
