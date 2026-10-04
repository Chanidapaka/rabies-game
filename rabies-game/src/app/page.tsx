import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getLevelsWithProgress } from '@/lib/levels';
import Stars from '@/components/Stars';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();
  const levels = await getLevelsWithProgress(session?.uid);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>ถูกสัตว์กัด ต้องล้างแผลทันที นานประมาณ 15 นาที</h1>
            <p>
              เกมจำลองสถานการณ์ 5 ด่าน ฝึกตัดสินใจเหมือนเหตุการณ์จริง ตั้งแต่ปฐมพยาบาล ประเมินความเสี่ยง
              ไปจนถึงฉีดวัคซีนให้ครบตามนัด ใช้เวลาเล่นไม่นานและเล่นได้ทั้งบนมือถือและคอมพิวเตอร์
            </p>
            <div className="hero-actions">
              <Link href={session ? '/play' : '/register'} className="btn btn-primary">
                {session ? 'เล่นต่อ' : 'สมัครและเริ่มเล่น'}
              </Link>
              <Link href="/leaderboard" className="btn">ดูตารางอันดับ</Link>
            </div>
          </div>
          <div className="ring" aria-hidden="true">
            <svg viewBox="0 0 220 220">
              <circle className="ring-track" cx="110" cy="110" r="90" />
              <circle className="ring-progress" cx="110" cy="110" r="90" />
              <text className="ring-num" x="110" y="122" textAnchor="middle">15</text>
              <text className="ring-unit" x="110" y="152" textAnchor="middle">นาที</text>
            </svg>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>5 ด่านที่ต้องผ่าน</h2>
          <ol className="path">
            {levels.map((lv) => (
              <li key={lv.id} className={lv.completed ? 'done' : lv.unlocked ? '' : 'locked'}>
                <span className="no" aria-hidden="true">{lv.id}</span>
                <div>
                  <h3>{lv.title}</h3>
                  <span className="muted">{lv.description}</span>
                </div>
                {session ? <Stars value={lv.stars} /> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
