import pg from 'pg'

// DATE отдаём строкой 'YYYY-MM-DD', чтобы часовой пояс сервера не сдвигал дату
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value)
// NUMERIC (деньги) — числом, а не строкой
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => Number.parseFloat(value))
// COUNT(*) возвращает BIGINT — для наших объёмов безопасно превращать в число
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => Number.parseInt(value, 10))

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

export function query(text, params) {
  return pool.query(text, params)
}

export async function transaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
