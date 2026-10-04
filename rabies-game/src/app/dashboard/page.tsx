import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAdminStats } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const s = await getSession();
  if (!s) redirect('/login?next=/dashboard');
  if (s.role !== 'admin') redirect('/');

  const { totals, byAge, perLevel, prePost, mostMissed } = await getAdminStats();
  const pre = prePost.find((r) => r.type === 'pre');
  const post = prePost.find((r) => r.type === 'post');
  const maxAge = Math.max(1, ...byAge.map((r) => Number(r.n)));

  return (
    <div className="container section">
      <h1>แดชบอร์ดผู้ดูแล</h1>

      <dl className="kpis">
        <div><dt>ผู้เล่นทั้งหมด</dt><dd>{totals.players}</dd></div>
        <div><dt>จำนวนครั้งที่เล่น</dt><dd>{totals.sessions}</dd></div>
        <div><dt>ผ่านครบทุกด่าน</dt><dd>{totals.finished_all}</dd></div>
        <div>
          <dt>คะแนนทดสอบ ก่อน → หลังเล่น</dt>
          <dd>{pre ? `${pre.avg_pct}%` : '–'} → {post ? `${post.avg_pct}%` : '–'}</dd>
        </div>
      </dl>

      <h2>สถิติรายด่าน</h2>
      <div className="table-wrap" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>ด่าน</th><th className="num">ผู้เล่น</th><th className="num">เล่นกี่ครั้ง</th>
              <th className="num">อัตราผ่าน</th><th className="num">คะแนนเฉลี่ย</th><th className="num">เวลาเฉลี่ย (วินาที)</th>
            </tr>
          </thead>
          <tbody>
            {perLevel.map((r) => (
              <tr key={r.id}>
                <td>{r.id}. {r.title}</td>
                <td className="num">{r.players}</td><td className="num">{r.attempts}</td>
                <td className="num">{r.pass_rate}%</td><td className="num">{r.avg_score}</td><td className="num">{r.avg_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>จุดที่ผู้เล่นตัดสินใจพลาดบ่อย</h2>
      {mostMissed.length === 0 ? (
        <p className="muted">ยังมีข้อมูลไม่พอ (ต้องมีอย่างน้อย 5 ครั้งต่อตัวเลือก)</p>
      ) : (
        <div className="table-wrap" style={{ marginBottom: '2rem' }}>
          <table>
            <thead><tr><th>ด่าน</th><th>ตัวเลือก</th><th className="num">จำนวนครั้ง</th><th className="num">ตอบถูก</th></tr></thead>
            <tbody>
              {mostMissed.map((r, i) => (
                <tr key={i}><td>{r.level_id}</td><td>{r.choice_key}</td><td className="num">{r.n}</td><td className="num">{r.correct_rate}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>ผู้เล่นแยกตามช่วงอายุ</h2>
      <div className="table-wrap">
        <table>
          <tbody>
            {byAge.map((r) => (
              <tr key={r.age_group}>
                <td>{r.age_group} ปี</td>
                <td className="num">{r.n}</td>
                <td style={{ width: '50%' }}><span className="meter" style={{ width: `${(Number(r.n) / maxAge) * 100}%` }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
