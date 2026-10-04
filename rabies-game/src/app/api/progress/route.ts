import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '@/lib/db';
import { getLevelsWithProgress, starsFor } from '@/lib/levels';
import { progressSchema } from '@/lib/schemas';
import { HttpError, ok, rateLimit, requireSession, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  return route(async () => {
    const s = await requireSession();
    return ok({ levels: await getLevelsWithProgress(s.uid) });
  });
}

/**
 * Unity ส่งผลมาที่นี่ผ่านหน้าเว็บ (ดู GameShell.tsx)
 * เซิร์ฟเวอร์คำนวณดาวเอง และตรวจความสมเหตุสมผลของคะแนน/เวลา ไม่เชื่อค่าจาก client ทั้งหมด
 */
export async function POST(req: Request) {
  return route(async () => {
    const s = await requireSession();
    rateLimit(req, `progress:${s.uid}`, 60, 60 * 1000);
    const body = progressSchema.parse(await req.json());

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [lv] = await conn.query<RowDataPacket[]>(
        'SELECT max_score, min_time_sec FROM levels WHERE id = ? AND is_active = 1',
        [body.levelId],
      );
      if (!lv[0]) throw new HttpError(404, 'ไม่พบด่านนี้');
      const { max_score: maxScore, min_time_sec: minTime } = lv[0];

      if (body.score > maxScore) throw new HttpError(422, 'คะแนนเกินค่าสูงสุดของด่าน');
      if (body.timeSpentSec < minTime) throw new HttpError(422, 'เวลาเล่นสั้นเกินกว่าจะเป็นไปได้');

      // ต้องผ่านด่านก่อนหน้าก่อนจึงจะบันทึกด่านถัดไปได้
      if (body.levelId > 1) {
        const [prev] = await conn.query<RowDataPacket[]>(
          `SELECT p.completed FROM level_progress p
            WHERE p.user_id = ?
              AND p.level_id = (SELECT MAX(id) FROM levels WHERE id < ? AND is_active = 1)`,
          [s.uid, body.levelId],
        );
        if (!prev[0]?.completed) throw new HttpError(403, 'ยังไม่ได้ปลดล็อกด่านนี้');
      }

      const [before] = await conn.query<RowDataPacket[]>(
        'SELECT best_score FROM level_progress WHERE user_id = ? AND level_id = ?',
        [s.uid, body.levelId],
      );
      const prevBest: number = before[0]?.best_score ?? 0;

      const stars = starsFor(body.score, maxScore);
      const passed = stars >= 1 ? 1 : 0;

      const [sess] = await conn.query<ResultSetHeader>(
        `INSERT INTO game_sessions (user_id, level_id, score, stars, time_spent_sec, passed)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [s.uid, body.levelId, body.score, stars, body.timeSpentSec, passed],
      );

      await conn.query(
        `INSERT INTO level_progress
           (user_id, level_id, best_score, best_stars, best_time_sec, attempts, completed, first_completed_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, IF(?, UTC_TIMESTAMP(), NULL))
         ON DUPLICATE KEY UPDATE
           best_time_sec = IF(VALUES(completed) = 1 AND (best_time_sec IS NULL OR VALUES(best_time_sec) < best_time_sec),
                              VALUES(best_time_sec), best_time_sec),
           best_score = GREATEST(best_score, VALUES(best_score)),
           best_stars = GREATEST(best_stars, VALUES(best_stars)),
           attempts   = attempts + 1,
           completed  = GREATEST(completed, VALUES(completed)),
           first_completed_at = COALESCE(first_completed_at, VALUES(first_completed_at))`,
        [s.uid, body.levelId, body.score, stars, passed ? body.timeSpentSec : null, passed, passed],
      );

      if (body.decisions.length > 0) {
        await conn.query(
          'INSERT INTO decisions_log (session_id, user_id, level_id, choice_key, is_correct) VALUES ?',
          [body.decisions.map((d) => [sess.insertId, s.uid, body.levelId, d.choiceKey, d.isCorrect ? 1 : 0])],
        );
      }

      await conn.commit();

      return ok({
        summary: { levelId: body.levelId, score: body.score, stars, passed: Boolean(passed), newBest: body.score > prevBest },
        levels: await getLevelsWithProgress(s.uid),
      });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  });
}
