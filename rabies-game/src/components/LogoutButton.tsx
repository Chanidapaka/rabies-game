'use client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="linklike"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
      }}
    >
      ออกจากระบบ
    </button>
  );
}
