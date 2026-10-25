import { Router } from 'express'
import { getAccessibleEvent, getAccessibleRowEvent } from '../access.js'
import { query } from '../db.js'
import { buildUpdate, HttpError, parseBody, parseId } from '../validate.js'

const resources = [
  {
    path: 'tasks',
    table: 'tasks',
    select: `SELECT t.*, m.name AS assignee_name, m.user_id AS assignee_user_id
             FROM tasks t LEFT JOIN team_members m ON m.id = t.assignee_id`,
    alias: 't',
    order: `t.status = 'done', t.due_date NULLS LAST, t.id`,
    schema: {
      title: { type: 'string', required: true, max: 300, label: 'Название задачи' },
      description: { type: 'string', max: 5000, label: 'Описание' },
      assignee_id: { type: 'int', min: 1, label: 'Исполнитель' },
      due_date: { type: 'date', label: 'Срок' },
      priority: { type: 'string', enum: ['high', 'medium', 'low'], default: 'medium', label: 'Приоритет' },
      status: { type: 'string', enum: ['todo', 'in_progress', 'done'], default: 'todo', label: 'Статус' },
    },
    async prepare(data, eventId) {
      if (data.assignee_id) {
        const { rows } = await query('SELECT 1 FROM team_members WHERE id = $1 AND event_id = $2', [data.assignee_id, eventId])
        if (!rows[0]) throw new HttpError(400, 'Исполнитель не состоит в команде мероприятия')
      }
    },
  },
  {
    path: 'team',
    table: 'team_members',
    select: `SELECT m.*,
               (SELECT count(*) FROM tasks t WHERE t.assignee_id = m.id) AS tasks_total,
               (SELECT count(*) FROM tasks t WHERE t.assignee_id = m.id AND t.status = 'done') AS tasks_done
             FROM team_members m`,
    alias: 'm',
    order: 'm.id',
    schema: {
      name: { type: 'string', required: true, max: 120, label: 'Имя' },
      email: { type: 'string', email: true, max: 200, label: 'Email' },
      role: { type: 'string', max: 120, label: 'Роль' },
    },
    async prepare(data) {
      if (data.email) {
        const { rows } = await query('SELECT id FROM users WHERE lower(email) = lower($1)', [data.email])
        data.user_id = rows[0]?.id ?? null
      }
    },
  },
  {
    path: 'budget',
    table: 'budget_items',
    select: 'SELECT b.* FROM budget_items b',
    alias: 'b',
    order: 'b.category, b.id',
    schema: {
      category: { type: 'string', required: true, max: 120, label: 'Категория' },
      title: { type: 'string', required: true, max: 300, label: 'Статья расходов' },
      vendor: { type: 'string', max: 200, label: 'Подрядчик' },
      planned: { type: 'money', default: 0, label: 'План' },
      actual: { type: 'money', default: 0, label: 'Факт' },
    },
  },
  {
    path: 'guests',
    table: 'guests',
    select: 'SELECT g.* FROM guests g',
    alias: 'g',
    order: 'g.created_at DESC, g.id DESC',
    schema: {
      name: { type: 'string', required: true, max: 200, label: 'Имя' },
      email: { type: 'string', required: true, email: true, max: 200, label: 'Email' },
      phone: { type: 'string', max: 50, label: 'Телефон' },
      company: { type: 'string', max: 200, label: 'Компания' },
      status: { type: 'string', enum: ['registered', 'confirmed', 'checked_in', 'cancelled'], default: 'registered', label: 'Статус' },
    },
    async prepare(data) {
      if (data.email) data.email = data.email.toLowerCase()
    },
  },
]

export const resourcesRouter = Router()

for (const resource of resources) {
  const { path, table, select, alias, order, schema, prepare } = resource

  const fetchOne = async (id) => {
    const { rows } = await query(`${select} WHERE ${alias}.id = $1`, [id])
    return rows[0]
  }

  resourcesRouter.get(`/events/:eventId/${path}`, async (req, res) => {
    const eventId = parseId(req.params.eventId)
    await getAccessibleEvent(req.userId, eventId)
    const { rows } = await query(`${select} WHERE ${alias}.event_id = $1 ORDER BY ${order}`, [eventId])
    res.json(rows)
  })

  resourcesRouter.post(`/events/:eventId/${path}`, async (req, res) => {
    const eventId = parseId(req.params.eventId)
    await getAccessibleEvent(req.userId, eventId)
    const data = parseBody(req.body, schema)
    await prepare?.(data, eventId)
    const keys = Object.keys(data)
    const { rows } = await query(
      `INSERT INTO ${table} (event_id, ${keys.join(', ')})
       VALUES ($1, ${keys.map((_, i) => `$${i + 2}`).join(', ')}) RETURNING id`,
      [eventId, ...keys.map((k) => data[k])],
    )
    res.status(201).json(await fetchOne(rows[0].id))
  })

  resourcesRouter.patch(`/${path}/:id`, async (req, res) => {
    const id = parseId(req.params.id)
    const eventId = await getAccessibleRowEvent(table, id, req.userId)
    const data = parseBody(req.body, schema, { partial: true })
    await prepare?.(data, eventId)
    const { text, values } = buildUpdate(table, id, data)
    await query(text, values)
    res.json(await fetchOne(id))
  })

  resourcesRouter.delete(`/${path}/:id`, async (req, res) => {
    const id = parseId(req.params.id)
    await getAccessibleRowEvent(table, id, req.userId)
    if (table === 'team_members') {
      const { rows } = await query(
        'SELECT 1 FROM team_members m JOIN events e ON e.id = m.event_id WHERE m.id = $1 AND m.user_id = e.owner_id',
        [id],
      )
      if (rows[0]) throw new HttpError(400, 'Нельзя удалить владельца мероприятия из команды')
    }
    await query(`DELETE FROM ${table} WHERE id = $1`, [id])
    res.status(204).end()
  })
}
