import { RowDataPacket } from 'mysql2/promise';
import { query } from './db';

export type LevelView = {
  id: number;
  title: string;
  description: string;
  maxScore: number;
  bestScore: number;
  stars: number;
  completed: boolean;
  unlocked: boolean;
};

export function starsFor(score: number, maxScore: number): number {
  const r = maxScore > 0 ? score / maxScore : 0;
  if (r >= 0.9) return 3;
  if (r >= 0.7) return 2;
  if (r >= 0.5) return 1;
  return 0;
}

/** ด่านทั้งหมดพร้อมความคืบหน้าของผู้เล่น (ถ้าไม่ส่ง userId จะเป็นมุมมองผู้เยี่ยมชม) */
export async function getLevelsWithProgress(userId?: number): Promise<LevelView[]> {
  const rows = await query<RowDataPacket>(
    `SELECT l.id, l.title, l.description, l.max_score,
            COALESCE(p.best_score, 0) AS best_score,
            COALESCE(p.best_stars, 0) AS best_stars,
            COALESCE(p.completed, 0)  AS completed
       FROM levels l
       LEFT JOIN level_progress p ON p.level_id = l.id AND p.user_id = ?
      WHERE l.is_active = 1
      ORDER BY l.id`,
    [userId ?? 0],
  );

  let prevCompleted = true; // ด่านแรกเปิดเสมอ
  return rows.map((r) => {
    const completed = Boolean(r.completed);
    const view: LevelView = {
      id: r.id,
      title: r.title,
      description: r.description,
      maxScore: r.max_score,
      bestScore: r.best_score,
      stars: r.best_stars,
      completed,
      unlocked: Boolean(userId) && prevCompleted,
    };
    prevCompleted = completed;
    return view;
  });
}
