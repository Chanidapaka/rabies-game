import { RowDataPacket } from 'mysql2/promise';
import { pool, query } from '@/lib/db';
import { quizSubmitSchema } from '@/lib/schemas';
import { HttpError, ok, requireSession, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** GET /api/quiz  (ข้อสอบรวม pre/post)  หรือ  /api/quiz?levelId=2  — ไม่ส่งเฉลยไปให้ client */
export async function GET(req: Request) {
  return route(async () => {
    await requireSession();
    const raw = new URL(req.url).searchParams.get('levelId');
    const levelId = raw ? Number(raw) : null;

    const rows = await query<RowDataPacket>(
      levelId
        ? 'SELECT id, question, choices FROM quiz_questions WHERE is_active = 1 AND level_id = ? ORDER BY RAND()'
        : 'SELECT id, question, choices FROM quiz_questions WHERE is_active = 1 AND level_id IS NULL ORDER BY id',
      levelId ? [levelId] : [],
    );
    return ok({ questions: rows.map((r) => ({ id: r.id, question: r.question, choices: r.choices })) });
  });
}

/** ตรวจคำตอบที่ฝั่งเซิร์ฟเวอร์ แล้วบันทึกผล pre / post / level test */
export async function POST(req: Request) {
  return route(async () => {
    const s = await requireSession();
    const body = quizSubmitSchema.parse(await req.json());

    const ids = [...new Set(body.answers.map((a) => a.questionId))];
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, correct_index, explanation FROM quiz_questions WHERE id IN (?)',
      [ids],
    );
    if (rows.length !== ids.length) throw new HttpError(400, 'พบคำถามที่ไม่มีในระบบ');

    const byId = new Map(rows.map((r) => [r.id as number, r]));
    const review = body.answers.map((a) => {
      const q = byId.get(a.questionId)!;
      return {
        questionId: a.questionId,
        correct: a.choiceIndex === q.correct_index,
        correctIndex: q.correct_index as number,
        explanation: q.explanation as string,
      };
    });
    const score = review.filter((r) => r.correct).length;

    await pool.query('INSERT INTO quiz_results (user_id, level_id, type, score, total) VALUES (?, ?, ?, ?, ?)', [
      s.uid,
      body.levelId ?? null,
      body.type,
      score,
      review.length,
    ]);
    return ok({ score, total: review.length, review });
  });
}
