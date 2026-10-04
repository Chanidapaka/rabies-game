import Link from 'next/link';
import { getSession } from '@/lib/auth';
import LogoutButton from './LogoutButton';

export default async function Nav() {
  const s = await getSession();
  return (
    <header className="nav">
      <nav className="container nav-inner" aria-label="เมนูหลัก">
        <Link href="/" className="brand">ล้างแผลทัน</Link>
        <Link href="/play">เล่นเกม</Link>
        <Link href="/leaderboard">อันดับ</Link>
        {s?.role === 'admin' && <Link href="/dashboard">แดชบอร์ด</Link>}
        {s ? (
          <>
            <span className="who">{s.name}</span>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login">เข้าสู่ระบบ</Link>
            <Link href="/register">สมัครสมาชิก</Link>
          </>
        )}
      </nav>
    </header>
  );
}
