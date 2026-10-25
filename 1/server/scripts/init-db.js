// Создаёт таблицы и заполняет демо-данными: npm run db:init
// Флаг --no-seed — только схема, без демо-данных.
import { readFile } from 'node:fs/promises'
import { pool } from '../src/db.js'

const withSeed = !process.argv.includes('--no-seed')
const files = ['schema.sql', ...(withSeed ? ['seed.sql'] : [])]

try {
  for (const file of files) {
    const sql = await readFile(new URL(`../db/${file}`, import.meta.url), 'utf8')
    await pool.query(sql)
    console.log(`✓ ${file}`)
  }
  console.log(withSeed ? 'База готова. Демо-вход: anna@eventtech.ru / demo123' : 'Схема создана.')
} catch (error) {
  console.error('Ошибка инициализации базы:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
