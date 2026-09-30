import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.SESSION_SECRET || 'fallback-secret-change-in-production-1234567890';

export interface SessionPayload {
  tableId: string;
  sessionId: string;
  role: 'owner' | 'joined';
  isAnon?: boolean;
}

export async function signSession(payload: SessionPayload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '4h' });
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getSessionCookie(tableId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(`__Host-tbl_${tableId}`)?.value;
  if (!token) return null;
  return await verifySession(token);
}

export async function setSessionCookie(tableId: string, payload: SessionPayload) {
  const token = await signSession(payload);
  const cookieStore = await cookies();
  
  cookieStore.set(`__Host-tbl_${tableId}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 4, // 4 hours
  });
}

export async function getAnonCookie() {
  const cookieStore = await cookies();
  return cookieStore.get('__Host-anon')?.value;
}

export async function setAnonCookie(anonId: string) {
  const cookieStore = await cookies();
  cookieStore.set('__Host-anon', anonId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function clearSessionCookie(tableId: string) {
  const cookieStore = await cookies();
  cookieStore.delete(`__Host-tbl_${tableId}`);
}
