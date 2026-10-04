import { RowDataPacket } from 'mysql2/promise';
import { query } from './db';

export async function getAdminStats() {
  const [totals] = await query<RowDataPacket>(
    `SELECT (SELECT COUNT(*) FROM users WHERE role='player') AS players,
            (SELECT COUNT(*) FROM game_sessions)              AS sessions,
            (SELECT COUNT(DISTINCT user_id) FROM level_progress WHERE completed = 1 AND level_id = (SELECT MAX(id) FROM levels)) AS finished_all`,
  );

  const byAge = await query<RowDataPacket>(
    `SELECT age_group, COUNT(*) AS n FROM users WHERE role='player' GROUP BY age_group ORDER BY age_group`,
  );

  const perLevel = await query<RowDataPacket>(
    `SELECT l.id, l.title,
            COUNT(s.id)                       AS attempts,
            COUNT(DISTINCT s.user_id)         AS players,
            COALESCE(ROUND(AVG(s.passed) * 100, 1), 0) AS pass_rate,
            COALESCE(ROUND(AVG(s.score), 1), 0)        AS avg_score,
            COALESCE(ROUND(AVG(s.time_spent_sec)), 0)  AS avg_time
       FROM levels l
       LEFT JOIN game_sessions s ON s.level_id = l.id
      GROUP BY l.id, l.title
      ORDER BY l.id`,
  );

  const prePost = await query<RowDataPacket>(
    `SELECT type, COUNT(*) AS n, ROUND(AVG(score / total) * 100, 1) AS avg_pct
       FROM quiz_results
      WHERE type IN ('pre','post')
      GROUP BY type`,
  );

  const mostMissed = await query<RowDataPacket>(
    `SELECT level_id, choice_key, COUNT(*) AS n, ROUND(AVG(is_correct) * 100, 1) AS correct_rate
       FROM decisions_log
      GROUP BY level_id, choice_key
     HAVING COUNT(*) >= 5
      ORDER BY correct_rate ASC, n DESC
      LIMIT 10`,
  );

  return { totals, byAge, perLevel, prePost, mostMissed };
}
