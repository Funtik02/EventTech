export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isEmpty(value) {
  return value === null || (typeof value === 'string' && value.trim() === '')
}

function coerce(value, rule, label) {
  const fail = (hint) => {
    throw new HttpError(400, `Поле «${label}»: ${hint}`)
  }

  switch (rule.type) {
    case 'string': {
      if (typeof value !== 'string') fail('ожидается строка')
      const text = value.trim()
      if (text.length > (rule.max ?? 2000)) fail(`не длиннее ${rule.max ?? 2000} символов`)
      if (rule.email && !EMAIL_RE.test(text)) fail('некорректный email')
      if (rule.enum && !rule.enum.includes(text)) fail('недопустимое значение')
      return text
    }
    case 'int': {
      const number = Number(value)
      if (!Number.isInteger(number)) fail('ожидается целое число')
      if (rule.min !== undefined && number < rule.min) fail(`не меньше ${rule.min}`)
      return number
    }
    case 'money': {
      const number = Number(value)
      if (!Number.isFinite(number) || number < 0) fail('ожидается неотрицательное число')
      return Math.round(number * 100) / 100
    }
    case 'date':
      if (typeof value !== 'string' || !DATE_RE.test(value)) fail('ожидается дата ГГГГ-ММ-ДД')
      return value
    case 'time':
      if (typeof value !== 'string' || !TIME_RE.test(value)) fail('ожидается время ЧЧ:ММ')
      return value
    case 'bool':
      if (typeof value !== 'boolean') fail('ожидается true/false')
      return value
    default:
      throw new Error(`Unknown rule type ${rule.type}`)
  }
}

export function parseBody(body, schema, { partial = false } = {}) {
  const source = body ?? {}
  const result = {}

  for (const [key, rule] of Object.entries(schema)) {
    const label = rule.label ?? key
    const value = source[key]

    if (value === undefined && partial) continue

    if (value === undefined || isEmpty(value)) {
      if (rule.required) throw new HttpError(400, `Поле «${label}» обязательно`)
      result[key] = rule.default !== undefined ? rule.default : rule.type === 'string' ? '' : null
      continue
    }

    result[key] = coerce(value, rule, label)
  }

  return result
}

export function parseId(value) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Не найдено')
  return id
}

export function buildUpdate(table, id, fields) {
  const keys = Object.keys(fields)
  if (keys.length === 0) throw new HttpError(400, 'Нет полей для обновления')
  const assignments = keys.map((key, index) => `${key} = $${index + 1}`).join(', ')
  return {
    text: `UPDATE ${table} SET ${assignments} WHERE id = $${keys.length + 1} RETURNING id`,
    values: [...keys.map((key) => fields[key]), id],
  }
}
