import { Router } from 'express'
import { accessCondition, getAccessibleEvent } from '../access.js'
import { query, transaction } from '../db.js'
import { buildUpdate, HttpError, parseBody, parseId } from '../validate.js'

export const EVENT_TYPES = ['conference', 'forum', 'exhibition', 'festival', 'corporate', 'training', 'hackathon', 'meetup', 'other']
export const EVENT_STATUSES = ['draft', 'preparing', 'live', 'finished', 'cancelled']

const eventSchema = {
  title: { type: 'string', required: true, max: 200, label: 'Название' },
  type: { type: 'string', enum: EVENT_TYPES, default: 'conference', label: 'Тип' },
  status: { type: 'string', enum: EVENT_STATUSES, default: 'preparing', label: 'Статус' },
  start_date: { type: 'date', required: true, label: 'Дата начала' },
  end_date: { type: 'date', label: 'Дата окончания' },
  start_time: { type: 'time', label: 'Время начала' },
  location: { type: 'string', max: 300, label: 'Место проведения' },
  description: { type: 'string', max: 5000, label: 'Описание' },
  expected_attendees: { type: 'int', min: 0, default: 0, label: 'Количество участников' },
  budget_limit: { type: 'money', default: 0, label: 'Бюджет' },
  registration_open: { type: 'bool', default: true, label: 'Регистрация открыта' },
}

const teamMemberSchema = {
  name: { type: 'string', required: true, max: 120, label: 'Имя участника команды' },
  email: { type: 'string', email: true, max: 200, label: 'Email участника команды' },
  role: { type: 'string', max: 120, label: 'Роль' },
}

const PLAN_TEMPLATE = [
  { title: 'Утвердить концепцию и цели мероприятия', priority: 'high', offset: -60 },
  { title: 'Согласовать бюджет', priority: 'high', offset: -55 },
  { title: 'Выбрать и забронировать площадку', priority: 'high', offset: -50 },
  { title: 'Сформировать программу', priority: 'high', offset: -40 },
  { title: 'Пригласить спикеров', priority: 'medium', offset: -35 },
  { title: 'Открыть регистрацию участников', priority: 'high', offset: -30 },
  { title: 'Запустить продвижение', priority: 'medium', offset: -28 },
  { title: 'Заключить договоры с подрядчиками', priority: 'medium', offset: -21 },
  { title: 'Разослать приглашения гостям', priority: 'medium', offset: -14 },
  { title: 'Подготовить раздаточные материалы и бейджи', priority: 'low', offset: -7 },
  { title: 'Провести техническую репетицию', priority: 'high', offset: -1 },
  { title: 'Собрать обратную связь от участников', priority: 'medium', offset: 2, from_end: true },
]

const EVENT_LIST_SQL = `
  SELECT e.*,
    e.owner_id = $1 AS is_owner,
    (SELECT count(*) FROM tasks t WHERE t.event_id = e.id) AS tasks_total,
    (SELECT count(*) FROM tasks t WHERE t.event_id = e.id AND t.status = 'done') AS tasks_done,
    (SELECT count(*) FROM guests g WHERE g.event_id = e.id AND g.status <> 'cancelled') AS guests_count
  FROM events e
  WHERE ${accessCondition('$1')}
  ORDER BY e.start_date, e.id`

export const eventsRouter = Router()

eventsRouter.get('/', async (req, res) => {
  const { rows } = await query(EVENT_LIST_SQL, [req.userId])
  res.json(rows)
})

eventsRouter.post('/', async (req, res) => {
  const data = parseBody(req.body, eventSchema)
  data.end_date ??= data.start_date
  const team = Array.isArray(req.body?.team) ? req.body.team.map((m) => parseBody(m, teamMemberSchema)) : []

  const event = await transaction(async (client) => {
    const keys = Object.keys(data)
    const { rows } = await client.query(
      `INSERT INTO events (owner_id, ${keys.join(', ')})
       VALUES ($1, ${keys.map((_, i) => `$${i + 2}`).join(', ')}) RETURNING *`,
      [req.userId, ...keys.map((k) => data[k])],
    )
    const created = rows[0]

    const { rows: owner } = await client.query('SELECT name, email FROM users WHERE id = $1', [req.userId])
    const { rows: ownerMember } = await client.query(
      `INSERT INTO team_members (event_id, user_id, name, email, role)
       VALUES ($1, $2, $3, $4, 'Руководитель проекта') RETURNING id`,
      [created.id, req.userId, owner[0].name, owner[0].email],
    )
    if (req.body?.plan_template === true) {
      await client.query(
        `INSERT INTO tasks (event_id, assignee_id, title, priority, due_date)
         SELECT $1, $2, t.title, t.priority,
                GREATEST(CURRENT_DATE, CASE WHEN t.from_end THEN $4::date ELSE $3::date END + t."offset")
         FROM jsonb_to_recordset($5::jsonb) AS t(title text, priority text, "offset" int, from_end boolean)`,
        [created.id, ownerMember[0].id, created.start_date, created.end_date, JSON.stringify(PLAN_TEMPLATE)],
      )
    }
    for (const member of team) {
      await client.query(
        `INSERT INTO team_members (event_id, user_id, name, email, role)
         VALUES ($1, (SELECT id FROM users WHERE lower(email) = lower($3) AND $3 <> ''), $2, $3, $4)`,
        [created.id, member.name, member.email, member.role],
      )
    }
    return created
  })

  res.status(201).json({ ...event, is_owner: true })
})

eventsRouter.get('/:id', async (req, res) => {
  res.json(await getAccessibleEvent(req.userId, parseId(req.params.id)))
})

eventsRouter.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  await getAccessibleEvent(req.userId, id)
  const data = parseBody(req.body, eventSchema, { partial: true })
  const { text, values } = buildUpdate('events', id, data)
  await query(text, values)
  res.json(await getAccessibleEvent(req.userId, id))
})

eventsRouter.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  const event = await getAccessibleEvent(req.userId, id)
  if (!event.is_owner) throw new HttpError(403, 'Удалить мероприятие может только его владелец')
  await query('DELETE FROM events WHERE id = $1', [id])
  res.status(204).end()
})

eventsRouter.get('/:id/summary', async (req, res) => {
  const id = parseId(req.params.id)
  const event = await getAccessibleEvent(req.userId, id)

  const [tasks, budget, guests, team, upcoming] = await Promise.all([
    query(
      `SELECT count(*) AS total,
              count(*) FILTER (WHERE status = 'done') AS done,
              count(*) FILTER (WHERE status <> 'done' AND due_date < CURRENT_DATE) AS overdue
       FROM tasks WHERE event_id = $1`,
      [id],
    ),
    query(
      `SELECT coalesce(sum(planned), 0) AS planned, coalesce(sum(actual), 0) AS actual
       FROM budget_items WHERE event_id = $1`,
      [id],
    ),
    query(
      `SELECT count(*) FILTER (WHERE status <> 'cancelled') AS active,
              count(*) FILTER (WHERE status = 'confirmed') AS confirmed,
              count(*) FILTER (WHERE status = 'checked_in') AS checked_in,
              count(*) FILTER (WHERE status = 'cancelled') AS cancelled
       FROM guests WHERE event_id = $1`,
      [id],
    ),
    query('SELECT count(*) AS total FROM team_members WHERE event_id = $1', [id]),
    query(
      `SELECT t.*, m.name AS assignee_name
       FROM tasks t LEFT JOIN team_members m ON m.id = t.assignee_id
       WHERE t.event_id = $1 AND t.status <> 'done'
       ORDER BY t.due_date NULLS LAST, t.id
       LIMIT 5`,
      [id],
    ),
  ])

  res.json({
    event,
    tasks: tasks.rows[0],
    budget: { ...budget.rows[0], limit: event.budget_limit },
    guests: { ...guests.rows[0], expected: event.expected_attendees },
    team: team.rows[0],
    upcoming_tasks: upcoming.rows,
  })
})
