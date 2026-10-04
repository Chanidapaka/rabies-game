import { getSession } from '@/lib/auth';
import { getLeaderboard } from '@/lib/leaderboard';
import { ok, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return route(async () => {
    const limit = Math.min(Number(new URL(req.url).searchParams.get('limit') ?? 50) || 50, 100);
    const s = await getSession();
    return ok(await getLeaderboard(limit, s?.uid));
  });
}
