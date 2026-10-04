import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2/promise';
import { pool, query } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { loginSchema } from '@/lib/schemas';
import { HttpError, ok, rateLimit, route } from '@/lib/http';

export async function POST(req: Request) {
  return route(async () => {
    rateLimit(req, 'login', 10, 15 * 60 * 1000);
    const { email, password } = loginSchema.parse(await req.json());

    const [user] = await query<RowDataPacket>(
      'SELECT id, display_name, password_hash, role FROM users WHERE email = ? LIMIT 1',
      [email],
    );
    // ข้อความเดียวกันทั้งกรณีไม่พบอีเมลและรหัสผ่านผิด เพื่อไม่เปิดเผยว่าอีเมลมีในระบบหรือไม่
    const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!user || !valid) throw new HttpError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');

    await pool.query('UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?', [user.id]);
    await createSession({ uid: user.id, role: user.role, name: user.display_name });
    return ok({ id: user.id, displayName: user.display_name, role: user.role });
  });
}
