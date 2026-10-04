import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSession, Session } from './auth';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (status: number, message: string) => NextResponse.json({ error: message }, { status });

/** ครอบ route handler เพื่อจัดการ error ให้เหมือนกันทุกจุด */
export async function route(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) return fail(e.status, e.message);
    if (e instanceof ZodError) {
      return fail(400, 'ข้อมูลไม่ถูกต้อง: ' + e.issues.map((i) => `${i.path.join('.')} ${i.message}`).join(', '));
    }
    console.error(e);
    return fail(500, 'เกิดข้อผิดพลาดภายในระบบ');
  }
}

export async function requireSession(role?: 'admin'): Promise<Session> {
  const s = await getSession();
  if (!s) throw new HttpError(401, 'กรุณาเข้าสู่ระบบ');
  if (role && s.role !== role) throw new HttpError(403, 'ไม่มีสิทธิ์เข้าถึง');
  return s;
}

// ตัวจำกัดจำนวนครั้งแบบง่าย (อยู่ใน memory ของเครื่องเดียว)
// ถ้ารันหลายเครื่อง/หลาย instance ให้เปลี่ยนไปใช้ Redis
const hits = new Map<string, { n: number; reset: number }>();
export function rateLimit(req: Request, bucket: string, max: number, windowMs: number) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return;
  }
  h.n += 1;
  if (h.n > max) throw new HttpError(429, 'ลองใหม่อีกครั้งในภายหลัง');
}
