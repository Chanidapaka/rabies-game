import { RowDataPacket } from 'mysql2/promise';
import { query } from './db';

const RANKED = `
  SELECT ROW_NUMBER() OVER (ORDER BY total_score DESC, total_time_sec ASC, user_id ASC) AS rank_no,
         user_id, display_name, total_score, total_stars, levels_completed, total_time_sec
    FROM v_leaderboard`;

export async function getLeaderboard(limit = 50, userId?: number) {
  const top = await query<RowDataPacket>(`SELECT * FROM (${RANKED}) t ORDER BY rank_no LIMIT ?`, [limit]);
  let me: RowDataPacket | null = null;
  if (userId) {
    const rows = await query<RowDataPacket>(`SELECT * FROM (${RANKED}) t WHERE user_id = ?`, [userId]);
    me = rows[0] ?? null;
  }
  return { top, me };
}
