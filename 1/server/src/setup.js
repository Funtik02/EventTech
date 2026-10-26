import { readFile } from 'node:fs/promises'
import { pool } from './db.js'

export async function runSqlFiles({ seed = true } = {}) {
  const files = ['schema.sql', ...(seed ? ['seed.sql'] : [])]
  for (const file of files) {
    const sql = await readFile(new URL(`../db/${file}`, import.meta.url), 'utf8')
    await pool.query(sql)
    console.log(`✓ ${file}`)
  }
}

export async function ensureDatabase() {
  const { rows } = await pool.query("SELECT to_regclass('public.users') AS users_table")
  if (rows[0].users_table) return
  console.log('[db] Таблиц нет — создаю схему и демо-данные')
  await runSqlFiles({ seed: true })
}
