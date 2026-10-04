import Link from 'next/link';
import AuthForm from '@/components/AuthForm';

export default function RegisterPage() {
  return (
    <div className="container section">
      <h1>สมัครสมาชิก</h1>
      <AuthForm mode="register" />
      <p>มีบัญชีอยู่แล้ว? <Link href="/login">เข้าสู่ระบบ</Link></p>
    </div>
  );
}
