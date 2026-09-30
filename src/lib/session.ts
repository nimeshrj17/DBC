import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.SESSION_SECRET || 'fallback-secret-change-in-production-1234567890';
const key = new TextEncoder().encode(SECRET_KEY);

export interface SessionPayload {
  tableId: string;
  sessionId: string;
  role: 'owner' | 'joined';
  isAnon?: boolean;
}

export async function signSession(payload: SessionPayload, expiresIn = '4h') {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
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
