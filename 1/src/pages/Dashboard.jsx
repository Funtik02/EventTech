import { Calendar, Check, MapPin, Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CopyLinkButton } from '../components/CopyLinkButton.jsx'
import { EventCover } from '../components/EventCover.jsx'
import { MiniCalendar } from '../components/MonthCalendar.jsx'
import { RequireEvent } from '../components/RequireEvent.jsx'
import { TaskForm } from '../components/TaskForm.jsx'
import { TaskItem } from '../components/TaskItem.jsx'
import { EmptyState, ErrorState, EventStatusBadge, ProgressBar, Spinner } from '../components/ui.jsx'
import { useEvents } from '../context/EventContext.jsx'
import { api, useApi } from '../lib/api.js'
import {
  daysUntil,
  EVENT_TYPES,
  formatDateRange,
  formatMoney,
  formatNumber,
  formatTime,
  isOverdue,
  parseDate,
  percent,
  plural,
} from '../lib/format.js'

function Countdown({ event }) {
  const days = daysUntil(event.start_date)
  if (event.status === 'finished' || daysUntil(event.end_date) < 0) return <span className="countdown">Мероприятие завершено</span>
  if (days <= 0) return <span className="countdown countdown--live">Мероприятие идёт сейчас</span>
  return (
    <span className="countdown">
      До начала <strong>{days}</strong> {plural(days, ['день', 'дня', 'дней'])}
    </span>
  )
}

function StatCard({ title, value, caption, progress, extra, to }) {
  return (
    <Link to={to} className="card stat-card">
      <span className="stat-card__title">{title}</span>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__caption">{caption}</span>
      <div className="stat-card__progress">
        <ProgressBar value={progress} tone={progress > 100 ? 'danger' : 'primary'} />
        <span>{progress}%</span>
      </div>
      {extra}
    </Link>
  )
}

function DashboardContent({ event }) {
  const { reload: reloadEvents } = useEvents()
  const summary = useApi(`/events/${event.id}/summary`)
  const tasks = useApi(`/events/${event.id}/tasks`)
  const team = useApi(`/events/${event.id}/team`)
  const start = parseDate(event.start_date)
  const [month, setMonth] = useState({ year: start.getFullYear(), month: start.getMonth() })
  const [editing, setEditing] = useState(null)

  const marks = useMemo(() => {
    const result = {}
    for (const task of tasks.data ?? []) {
      if (!task.due_date || task.status === 'done') continue
      result[task.due_date] = isOverdue(task) || result[task.due_date] === 'overdue' ? 'overdue' : 'task'
    }
    return result
  }, [tasks.data])

  if (summary.loading && !summary.data) return <Spinner />
  if (summary.error) return <ErrorState error={summary.error} onRetry={summary.reload} />

  const { tasks: t, budget, guests, upcoming_tasks: upcoming } = summary.data
  const refresh = () => {
    summary.reload()
    tasks.reload()
    reloadEvents()
  }

  const toggle = async (task) => {
    try {
      await api(`/tasks/${task.id}`, { method: 'PATCH', body: { status: task.status === 'done' ? 'todo' : 'done' } })
      refresh()
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <div className="dashboard">
      <section className="card event-hero">
        <div className="event-hero__info">
          <span className="event-hero__label">Мероприятие · {EVENT_TYPES[event.type]}</span>
          <div className="event-hero__title">
            <h1>{event.title}</h1>
            <EventStatusBadge status={event.status} />
          </div>
          <ul className="event-hero__facts">
            <li>
              <Calendar size={16} />
              {formatDateRange(event.start_date, event.end_date)}
              {event.start_time && `, начало в ${formatTime(event.start_time)}`}
            </li>
            {event.location && (
              <li>
                <MapPin size={16} />
                {event.location}
              </li>
            )}
            <li>
              <Users size={16} />
              Ожидаемое кол-во участников: {formatNumber(event.expected_attendees)}
            </li>
          </ul>
          <div className="event-hero__actions">
            <Countdown event={event} />
            <CopyLinkButton eventId={event.id} />
          </div>
        </div>
        <div className="event-hero__cover">
          <EventCover title={event.title} />
        </div>
      </section>

      <section className="stats">
        <StatCard
          to="/tasks"
          title="Задачи"
          value={t.total}
          caption={`из них ${t.done} ${plural(t.done, ['выполнена', 'выполнено', 'выполнено'])}`}
          progress={percent(t.done, t.total)}
          extra={t.overdue > 0 && <span className="stat-card__alert">{t.overdue} {plural(t.overdue, ['просрочена', 'просрочено', 'просрочено'])}</span>}
        />
        <StatCard
          to="/budget"
          title="Бюджет"
          value={formatMoney(budget.actual)}
          caption={budget.limit ? `из ${formatMoney(budget.limit)}` : 'лимит не задан'}
          progress={budget.limit ? Math.round((budget.actual / budget.limit) * 100) : 0}
        />
        <StatCard
          to="/guests"
          title="Участники"
          value={formatNumber(guests.active)}
          caption={guests.expected ? `из ${formatNumber(guests.expected)}` : 'ожидаемое число не задано'}
          progress={percent(guests.active, guests.expected)}
        />
      </section>

      <section className="dashboard__bottom">
        <div className="card">
          <div className="card__header">
            <h2>Ближайшие задачи</h2>
            <div className="card__header-actions">
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing('new')}>
                <Plus size={16} />
                Добавить
              </button>
              <Link to="/tasks" className="link">
                Все задачи
              </Link>
            </div>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState icon={Check} title="Все задачи выполнены" text="Отличная работа!" />
          ) : (
            <ul className="task-list">
              {upcoming.map((task) => (
                <TaskItem key={task.id} task={task} compact onToggle={() => toggle(task)} onOpen={() => setEditing(task)} />
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <div className="card__header">
            <h2>Календарь</h2>
            <Link to="/calendar" className="link">
              Открыть
            </Link>
          </div>
          <MiniCalendar
            year={month.year}
            month={month.month}
            onChange={(year, m) => setMonth({ year, month: m })}
            marks={marks}
            range={[event.start_date, event.end_date]}
          />
        </div>
      </section>

      {editing && (
        <TaskForm
          eventId={event.id}
          task={editing === 'new' ? null : editing}
          team={team.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            refresh()
          }}
          onDeleted={() => {
            setEditing(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}

export function Dashboard() {
  return <RequireEvent>{(event) => <DashboardContent event={event} />}</RequireEvent>
}
