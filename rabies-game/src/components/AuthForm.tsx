'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const AGE_GROUPS = ['20-29', '30-39', '40-49', '50-60'];

export default function AuthForm({ mode, next = '/play' }: { mode: 'login' | 'register'; next?: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const payload =
      mode === 'register'
        ? {
            email: f.get('email'),
            password: f.get('password'),
            displayName: f.get('displayName'),
            ageGroup: f.get('ageGroup'),
            consent: f.get('consent') === 'on',
          }
        : { email: f.get('email'), password: f.get('password') };

    const res = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
    router.push(next);
    router.refresh();
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate={false}>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {mode === 'register' && (
        <div className="field">
          <label htmlFor="displayName">ชื่อที่แสดงในตารางอันดับ</label>
          <input id="displayName" name="displayName" required minLength={2} maxLength={30} autoComplete="nickname" />
        </div>
      )}
      <div className="field">
        <label htmlFor="email">อีเมล</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="password">รหัสผ่าน{mode === 'register' && ' (อย่างน้อย 8 ตัวอักษร)'}</label>
        <input
          id="password" name="password" type="password" required minLength={mode === 'register' ? 8 : 1}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        />
      </div>

      {mode === 'register' && (
        <>
          <div className="field">
            <label htmlFor="ageGroup">ช่วงอายุ</label>
            <select id="ageGroup" name="ageGroup" required defaultValue="">
              <option value="" disabled>เลือกช่วงอายุ</option>
              {AGE_GROUPS.map((g) => <option key={g} value={g}>{g} ปี</option>)}
            </select>
          </div>
          <label className="check">
            <input type="checkbox" name="consent" required />
            <span>
              ข้าพเจ้ายินยอมให้เก็บชื่อที่แสดง อีเมล ช่วงอายุ และผลการเล่น เพื่อใช้ในตารางอันดับและการวิเคราะห์ผลการเรียนรู้
              (ชื่อที่แสดงและคะแนนจะปรากฏในตารางอันดับสาธารณะ)
            </span>
          </label>
        </>
      )}

      <button className="btn btn-primary" disabled={busy} type="submit">
        {busy ? 'กำลังดำเนินการ…' : mode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
      </button>
    </form>
  );
}
