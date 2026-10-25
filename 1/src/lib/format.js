export const EVENT_TYPES = {
  conference: 'Конференция',
  forum: 'Форум',
  exhibition: 'Выставка',
  festival: 'Фестиваль',
  corporate: 'Корпоративное событие',
  training: 'Обучение',
  hackathon: 'Хакатон',
  meetup: 'Митап',
  other: 'Другое',
}

export const EVENT_STATUSES = {
  draft: 'Черновик',
  preparing: 'В подготовке',
  live: 'Идёт сейчас',
  finished: 'Завершено',
  cancelled: 'Отменено',
}

export const PRIORITIES = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
}

export const TASK_STATUSES = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  done: 'Выполнено',
}

export const GUEST_STATUSES = {
  registered: 'Зарегистрирован',
  confirmed: 'Подтвердил участие',
  checked_in: 'Пришёл',
  cancelled: 'Отменил',
}

const MONTHS_GENITIVE = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
export const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function parseDate(value) {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO() {
  return toISODate(new Date())
}

export function formatDate(value) {
  if (!value) return '—'
  const date = parseDate(value)
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`
}

export function formatDateShort(value) {
  if (!value) return 'Без срока'
  const date = parseDate(value)
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`
}

export function formatDateRange(start, end) {
  if (!start) return '—'
  if (!end || end === start) return formatDate(start)
  const a = parseDate(start)
  const b = parseDate(end)
  if (a.getFullYear() !== b.getFullYear()) return `${formatDate(start)} – ${formatDate(end)}`
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()}–${b.getDate()} ${MONTHS_GENITIVE[b.getMonth()]} ${b.getFullYear()}`
  }
  return `${a.getDate()} ${MONTHS_GENITIVE[a.getMonth()]} – ${b.getDate()} ${MONTHS_GENITIVE[b.getMonth()]} ${b.getFullYear()}`
}

export function formatTime(value) {
  return value ? value.slice(0, 5) : ''
}

export function formatDateTime(value) {
  const date = new Date(value)
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}, ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const moneyFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })
export function formatMoney(value) {
  return `${moneyFormat.format(value ?? 0)} ₽`
}

export function formatNumber(value) {
  return moneyFormat.format(value ?? 0)
}

export function percent(part, total) {
  if (!total) return 0
  return Math.min(100, Math.round((part / total) * 100))
}

export function plural(n, forms) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

export function daysUntil(value) {
  const ms = parseDate(value) - parseDate(todayISO())
  return Math.round(ms / 86_400_000)
}

export function isOverdue(task) {
  return task.status !== 'done' && Boolean(task.due_date) && task.due_date < todayISO()
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function registrationUrl(eventId) {
  return `${window.location.origin}/r/${eventId}`
}

export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - offset)
  const weeks = Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7)
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return { iso: toISODate(date), day: date.getDate(), inMonth: date.getMonth() === month }
  })
}
