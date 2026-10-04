import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'rg_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 วัน

export type Session = { uid: number; role: 'player' | 'admin'; name: string };

export function jwtKey(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('JWT_SECRET ต้องมีอย่างน้อย 32 ตัวอักษร');
  return new TextEncoder().encode(s);
}

export async function createSession(session: Session) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(jwtKey());

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwtKey());
    return { uid: Number(payload.uid), role: payload.role as Session['role'], name: String(payload.name) };
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}
