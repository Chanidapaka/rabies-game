import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getLevelsWithProgress } from '@/lib/levels';
import GameShell from '@/components/GameShell';

export const dynamic = 'force-dynamic';

export default async function PlayPage() {
  const s = await getSession();
  if (!s) redirect('/login?next=/play');
  const levels = await getLevelsWithProgress(s.uid);

  return (
    <GameShell
      initialLevels={levels}
      userName={s.name}
      unityBuild={process.env.UNITY_BUILD_NAME || undefined}
    />
  );
}
