import { query } from './db.js'
import { HttpError } from './validate.js'

export function accessCondition(userParam) {
  return `(e.owner_id = ${userParam} OR EXISTS (
    SELECT 1 FROM team_members tm WHERE tm.event_id = e.id AND tm.user_id = ${userParam}
  ))`
}

export async function getAccessibleEvent(userId, eventId) {
  const { rows } = await query(
    `SELECT e.*, e.owner_id = $2 AS is_owner FROM events e WHERE e.id = $1 AND ${accessCondition('$2')}`,
    [eventId, userId],
  )
  if (!rows[0]) throw new HttpError(404, 'Мероприятие не найдено')
  return rows[0]
}

export async function getAccessibleRowEvent(table, rowId, userId) {
  const { rows } = await query(`SELECT event_id FROM ${table} WHERE id = $1`, [rowId])
  if (!rows[0]) throw new HttpError(404, 'Запись не найдена')
  await getAccessibleEvent(userId, rows[0].event_id)
  return rows[0].event_id
}
