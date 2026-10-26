import { pool } from '../src/db.js'
import { runSqlFiles } from '../src/setup.js'

const withSeed = !process.argv.includes('--no-seed')

try {
  await runSqlFiles({ seed: withSeed })
  console.log(withSeed ? 'База готова. Демо-вход: ndanilov40@gmail.com / demo123' : 'Схема создана.')
} catch (error) {
  console.error('Ошибка инициализации базы:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
