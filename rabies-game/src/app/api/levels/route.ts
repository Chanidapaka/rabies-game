import { getSession } from '@/lib/auth';
import { getLevelsWithProgress } from '@/lib/levels';
import { ok, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  return route(async () => {
    const s = await getSession();
    return ok({ levels: await getLevelsWithProgress(s?.uid) });
  });
}
