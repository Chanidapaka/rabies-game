import { getSession } from '@/lib/auth';
import { getLeaderboard } from '@/lib/leaderboard';

export const dynamic = 'force-dynamic';

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export default async function LeaderboardPage() {
  const session = await getSession();
  const { top, me } = await getLeaderboard(50, session?.uid);
  const inTop = me ? top.some((r) => r.user_id === me.user_id) : false;

  return (
    <div className="container section">
      <h1>ตารางอันดับ</h1>
      <p className="muted">เรียงตามคะแนนรวมของด่านที่ทำได้ดีที่สุด หากคะแนนเท่ากันจะดูเวลารวมที่น้อยกว่า</p>

      {top.length === 0 ? (
        <p>ยังไม่มีผู้เล่นในตาราง เป็นคนแรกที่ผ่านด่านที่ 1 ได้เลย</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="num">อันดับ</th><th>ชื่อ</th>
                <th className="num">คะแนนรวม</th><th className="num">ดาว</th>
                <th className="num">ด่านที่ผ่าน</th><th className="num">เวลารวม</th>
              </tr>
            </thead>
            <tbody>
              {top.map((r) => (
                <tr key={r.user_id} className={me?.user_id === r.user_id ? 'me' : ''}>
                  <td className="num">{r.rank_no}</td>
                  <td>{r.display_name}</td>
                  <td className="num">{r.total_score}</td>
                  <td className="num">{r.total_stars}</td>
                  <td className="num">{r.levels_completed}/5</td>
                  <td className="num">{fmt(r.total_time_sec)}</td>
                </tr>
              ))}
              {me && !inTop && (
                <tr className="me">
                  <td className="num">{me.rank_no}</td><td>{me.display_name} (คุณ)</td>
                  <td className="num">{me.total_score}</td><td className="num">{me.total_stars}</td>
                  <td className="num">{me.levels_completed}/5</td><td className="num">{fmt(me.total_time_sec)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
