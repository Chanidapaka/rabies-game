import { clearSession } from '@/lib/auth';
import { ok } from '@/lib/http';

export async function POST() {
  clearSession();
  return ok({ ok: true });
}
