import mysql, { Pool, RowDataPacket } from 'mysql2/promise';

const g = globalThis as unknown as { __pool?: Pool };

function createPool(): Pool {
  return mysql.createPool({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
    timezone: 'Z',
    decimalNumbers: true, // ให้ AVG/SUM คืนเป็น number แทน string
  });
}

export const pool: Pool = g.__pool ?? createPool();
if (process.env.NODE_ENV !== 'production') g.__pool = pool;

export async function query<T = RowDataPacket>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}
