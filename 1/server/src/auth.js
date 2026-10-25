import bcrypt from 'bcryptjs'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { query, transaction } from './db.js'
import { HttpError, parseBody } from './validate.js'

const JWT_SECRET = process.env.JWT_SECRET || 'eventtech-dev-secret'
if (!process.env.JWT_SECRET) {
  console.warn('[auth] JWT_SECRET не задан — используется dev-секрет. Задайте его в server/.env')
}

const USER_FIELDS = 'id, name, email, position, created_at'

function issueToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' })
}

export function requireAuth(req, _res, next) {
  const header = req.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new HttpError(401, 'Требуется вход')
  try {
    req.userId = jwt.verify(token, JWT_SECRET).sub
  } catch {
    throw new HttpError(401, 'Сессия истекла, войдите снова')
  }
  next()
}

const registerSchema = {
  name: { type: 'string', required: true, max: 120, label: 'Имя' },
  email: { type: 'string', required: true, email: true, max: 200, label: 'Email' },
  password: { type: 'string', required: true, max: 200, label: 'Пароль' },
  position: { type: 'string', max: 120, default: 'Организатор', label: 'Должность' },
}

const loginSchema = {
  email: { type: 'string', required: true, label: 'Email' },
  password: { type: 'string', required: true, label: 'Пароль' },
}

const profileSchema = {
  name: { type: 'string', required: true, max: 120, label: 'Имя' },
  position: { type: 'string', max: 120, label: 'Должность' },
}

export const authRouter = Router()

authRouter.post('/register', async (req, res) => {
  const data = parseBody(req.body, registerSchema)
  if (data.password.length < 6) throw new HttpError(400, 'Пароль должен быть не короче 6 символов')
  const email = data.email.toLowerCase()
  const hash = await bcrypt.hash(data.password, 10)

  const user = await transaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO users (name, email, password_hash, position) VALUES ($1, $2, $3, $4) RETURNING ${USER_FIELDS}`,
      [data.name, email, hash, data.position],
    )
    await client.query(
      'UPDATE team_members SET user_id = $1 WHERE user_id IS NULL AND lower(email) = $2',
      [rows[0].id, email],
    )
    return rows[0]
  })

  res.status(201).json({ token: issueToken(user), user })
})

authRouter.post('/login', async (req, res) => {
  const data = parseBody(req.body, loginSchema)
  const { rows } = await query(
    `SELECT ${USER_FIELDS}, password_hash FROM users WHERE email = $1`,
    [data.email.toLowerCase()],
  )
  const found = rows[0]
  if (!found || !(await bcrypt.compare(data.password, found.password_hash))) {
    throw new HttpError(401, 'Неверный email или пароль')
  }
  const { password_hash: _hash, ...user } = found
  res.json({ token: issueToken(user), user })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const { rows } = await query(`SELECT ${USER_FIELDS} FROM users WHERE id = $1`, [req.userId])
  if (!rows[0]) throw new HttpError(401, 'Пользователь не найден')
  res.json(rows[0])
})

authRouter.patch('/me', requireAuth, async (req, res) => {
  const data = parseBody(req.body, profileSchema)
  const { rows } = await query(
    `UPDATE users SET name = $1, position = $2 WHERE id = $3 RETURNING ${USER_FIELDS}`,
    [data.name, data.position || 'Организатор', req.userId],
  )
  res.json(rows[0])
})
