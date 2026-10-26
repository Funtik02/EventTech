import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { authRouter, requireAuth } from './auth.js'
import { pool } from './db.js'
import { eventsRouter } from './routes/events.js'
import { publicRouter } from './routes/public.js'
import { resourcesRouter } from './routes/resources.js'
import { ensureDatabase } from './setup.js'
import { HttpError } from './validate.js'

const app = express()
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/public', publicRouter)
app.use('/api/events', requireAuth, eventsRouter)
app.use('/api', requireAuth, resourcesRouter)

app.use('/api', (_req, _res) => {
  throw new HttpError(404, 'Метод API не найден')
})

const distDir = fileURLToPath(new URL('../../dist', import.meta.url))
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('/{*splat}', (_req, res) => res.sendFile('index.html', { root: distDir }))
}

const PG_ERRORS = {
  23505: [409, 'Такая запись уже существует'],
  23503: [400, 'Связанная запись не найдена'],
  23514: [400, 'Некорректные данные'],
}

app.use((error, _req, res, _next) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message })
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON' })
  }
  if (error.constraint === 'events_check') {
    return res.status(400).json({ error: 'Дата окончания не может быть раньше даты начала' })
  }
  if (PG_ERRORS[error.code]) {
    const [status, message] = PG_ERRORS[error.code]
    return res.status(status).json({ error: message })
  }
  if (error.code === 'ECONNREFUSED' || error.code === '28P01' || error.code === '3D000') {
    console.error('[db]', error.message)
    return res.status(503).json({ error: 'Нет подключения к базе данных. Проверьте DATABASE_URL в server/.env' })
  }
  console.error(error)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})

try {
  await ensureDatabase()
} catch (error) {
  console.error('[db] Не удалось подготовить базу:', error.message)
}

const port = Number(process.env.PORT) || 3001
app.listen(port, () => {
  console.log(`EventTech API: http://localhost:${port}`)
})
