import bcrypt from 'bcryptjs';
import { ResultSetHeader } from 'mysql2/promise';
import { pool } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { registerSchema } from '@/lib/schemas';
import { HttpError, ok, rateLimit, route } from '@/lib/http';

export async function POST(req: Request) {
  return route(async () => {
    rateLimit(req, 'register', 10, 60 * 60 * 1000);
    const body = registerSchema.parse(await req.json());
    const hash = await bcrypt.hash(body.password, 10);

    try {
      const [res] = await pool.query<ResultSetHeader>(
        `INSERT INTO users (email, display_name, password_hash, age_group, consent_at)
         VALUES (?, ?, ?, ?, UTC_TIMESTAMP())`,
        [body.email, body.displayName, hash, body.ageGroup],
      );
      await createSession({ uid: res.insertId, role: 'player', name: body.displayName });
      return ok({ id: res.insertId, displayName: body.displayName }, 201);
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'ER_DUP_ENTRY') throw new HttpError(409, 'อีเมลนี้ถูกใช้สมัครแล้ว');
      throw e;
    }
  });
}
