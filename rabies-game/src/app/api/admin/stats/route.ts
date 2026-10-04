import { getAdminStats } from '@/lib/stats';
import { ok, requireSession, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  return route(async () => {
    await requireSession('admin');
    return ok(await getAdminStats());
  });
}
