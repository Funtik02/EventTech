import { Router } from 'express'
import { query } from '../db.js'
import { HttpError, parseBody, parseId } from '../validate.js'

// Открытые эндпоинты без авторизации — страница регистрации гостя

const PUBLIC_EVENT_SQL = `
  SELECT e.id, e.title, e.type, e.status, e.start_date, e.end_date, e.start_time,
         e.location, e.description, e.expected_attendees,
         e.registration_open AND e.status IN ('preparing', 'live') AS registration_open,
         (SELECT count(*) FROM guests g WHERE g.event_id = e.id AND g.status <> 'cancelled') AS registered_count
  FROM events e
  WHERE e.id = $1 AND e.status <> 'draft'`

const registrationSchema = {
  name: { type: 'string', required: true, max: 200, label: 'Имя и фамилия' },
  email: { type: 'string', required: true, email: true, max: 200, label: 'Email' },
  phone: { type: 'string', max: 50, label: 'Телефон' },
  company: { type: 'string', max: 200, label: 'Компания' },
}

async function getPublicEvent(id) {
  const { rows } = await query(PUBLIC_EVENT_SQL, [id])
  if (!rows[0]) throw new HttpError(404, 'Мероприятие не найдено')
  return rows[0]
}

export const publicRouter = Router()

publicRouter.get('/events/:id', async (req, res) => {
  res.json(await getPublicEvent(parseId(req.params.id)))
})

publicRouter.post('/events/:id/register', async (req, res) => {
  const event = await getPublicEvent(parseId(req.params.id))
  if (!event.registration_open) throw new HttpError(400, 'Регистрация на это мероприятие закрыта')

  const data = parseBody(req.body, registrationSchema)
  const { rows } = await query(
    `INSERT INTO guests (event_id, name, email, phone, company, source)
     VALUES ($1, $2, $3, $4, $5, 'form')
     ON CONFLICT (event_id, email) DO NOTHING
     RETURNING id, name, email`,
    [event.id, data.name, data.email.toLowerCase(), data.phone, data.company],
  )
  if (!rows[0]) throw new HttpError(409, 'Этот email уже зарегистрирован на мероприятие')
  res.status(201).json(rows[0])
})
