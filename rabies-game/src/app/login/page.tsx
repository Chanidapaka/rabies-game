import Link from 'next/link';
import AuthForm from '@/components/AuthForm';

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const n = searchParams.next;
  const next = n && n.startsWith('/') && !n.startsWith('//') ? n : '/play';
  return (
    <div className="container section">
      <h1>เข้าสู่ระบบ</h1>
      <AuthForm mode="login" next={next} />
      <p>ยังไม่มีบัญชี? <Link href="/register">สมัครสมาชิก</Link></p>
    </div>
  );
}
