import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { setSessionCookie } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { tableId, pin } = await request.json();
    if (!tableId || !pin) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Very simple rate limit tracking in Firestore (Production should use Redis)
    const rateLimitRef = adminDb.collection('security_logs').doc(`${tableId}_${ip}`);
    
    const isLocked = await adminDb.runTransaction(async (t) => {
      const rlDoc = await t.get(rateLimitRef);
      let attempts = 0;
      if (rlDoc.exists) {
        const data = rlDoc.data();
        if (data && data.lockedUntil && data.lockedUntil.toDate() > new Date()) {
          return true; // Soft Locked
        }
        if (data && data.expiresAt && data.expiresAt.toDate() > new Date()) {
          attempts = data.attempts || 0;
        }
      }

      attempts += 1;
      const updates: any = { attempts, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }; // 10 min expiry
      
      if (attempts > 5) {
        updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        t.set(rateLimitRef, updates, { merge: true });
        return true;
      }
      
      t.set(rateLimitRef, updates, { merge: true });
      return false;
    });

    if (isLocked) {
      return NextResponse.json({ error: 'Too many attempts. Ask staff to add you.' }, { status: 429 });
    }

    // Check PIN in tableSecrets
    const secretDoc = await adminDb.collection('tables').doc(tableId).collection('secrets').doc('session').get();
    if (!secretDoc.exists) return NextResponse.json({ error: 'Table has no active PIN' }, { status: 404 });

    const actualPin = secretDoc.data()?.pin;
    const activeSessionId = secretDoc.data()?.sessionId;

    if (!actualPin || !activeSessionId) return NextResponse.json({ error: 'Table is not active' }, { status: 400 });

    // Constant time comparison (simple string match for now)
    if (actualPin !== pin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    // Success! Issue 'joined' role cookie
    await setSessionCookie(tableId, { tableId, sessionId: activeSessionId, role: 'joined' });
    
    // Clear failures on success
    await rateLimitRef.delete();

    return NextResponse.json({ success: true, message: 'Joined table successfully' });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
