import { z } from 'zod';

export const AGE_GROUPS = ['20-29', '30-39', '40-49', '50-60'] as const;

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(190),
  password: z.string().min(8, 'ต้องยาวอย่างน้อย 8 ตัวอักษร').max(72),
  displayName: z.string().trim().min(2).max(30),
  ageGroup: z.enum(AGE_GROUPS),
  consent: z.literal(true, { errorMap: () => ({ message: 'ต้องยินยอมการเก็บข้อมูลก่อนสมัคร' }) }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
});

export const progressSchema = z.object({
  levelId: z.number().int().min(1),
  score: z.number().int().min(0).max(100000),
  timeSpentSec: z.number().int().min(1).max(7200),
  decisions: z
    .array(z.object({ choiceKey: z.string().min(1).max(64), isCorrect: z.boolean() }))
    .max(200)
    .default([]),
});

export const quizSubmitSchema = z.object({
  type: z.enum(['pre', 'post', 'level']),
  levelId: z.number().int().min(1).optional(),
  answers: z.array(z.object({ questionId: z.number().int(), choiceIndex: z.number().int().min(0).max(9) })).min(1).max(50),
});
