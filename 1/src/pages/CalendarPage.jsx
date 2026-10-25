import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MonthNav } from '../components/MonthCalendar.jsx'
import { RequireEvent } from '../components/RequireEvent.jsx'
import { TaskForm } from '../components/TaskForm.jsx'
import { ErrorState, PageHeader, Spinner } from '../components/ui.jsx'
import { useEvents } from '../context/EventContext.jsx'
import { useApi } from '../lib/api.js'
import { isOverdue, monthGrid, parseDate, todayISO, WEEKDAYS } from '../lib/format.js'

const MAX_IN_CELL = 3

function CalendarContent({ event }) {
  const { reload: reloadEvents } = useEvents()
  const tasks = useApi(`/events/${event.id}/tasks`)
  const team = useApi(`/events/${event.id}/team`)
  const [view, setView] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [editing, setEditing] = useState(null)

  const byDate = useMemo(() => {
    const map = {}
    for (const task of tasks.data ?? []) {
      if (task.due_date) (map[task.due_date] ??= []).push(task)
    }
    return map
  }, [tasks.data])

  if (tasks.loading && !tasks.data) return <Spinner />
  if (tasks.error) return <ErrorState error={tasks.error} onRetry={tasks.reload} />

  const today = todayISO()
  const goToEvent = () => {
    const start = parseDate(event.start_date)
    setView({ year: start.getFullYear(), month: start.getMonth() })
  }
  const afterChange = () => {
    setEditing(null)
    tasks.reload()
    reloadEvents()
  }

  return (
    <>
      <PageHeader
        title="Календарь"
        subtitle={event.title}
        actions={
          <>
            <button type="button" className="btn btn--secondary" onClick={goToEvent}>
              К дате мероприятия
            </button>
            <button type="button" className="btn btn--primary" onClick={() => setEditing({ task: null, date: today })}>
              <Plus size={18} />
              Задача
            </button>
          </>
        }
      />
      <div className="card calendar">
        <MonthNav year={view.year} month={view.month} onChange={(year, month) => setView({ year, month })} />
        <div className="calendar__grid">
          {WEEKDAYS.map((d) => (
            <div key={d} className="calendar__weekday">
              {d}
            </div>
          ))}
          {monthGrid(view.year, view.month).map(({ iso, day, inMonth }) => {
            const dayTasks = byDate[iso] ?? []
            const inEvent = iso >= event.start_date && iso <= event.end_date
            const classes = ['calendar__cell']
            if (!inMonth) classes.push('is-muted')
            if (iso === today) classes.push('is-today')
            if (inEvent) classes.push('is-event')
            return (
              <div
                key={iso}
                className={classes.join(' ')}
                onDoubleClick={() => setEditing({ task: null, date: iso })}
                title="Двойной клик — новая задача на этот день"
              >
                <span className="calendar__day">{day}</span>
                {inEvent && <span className="calendar__event">{event.title}</span>}
                {dayTasks.slice(0, MAX_IN_CELL).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className={`calendar__task calendar__task--${task.priority}${task.status === 'done' ? ' is-done' : ''}${isOverdue(task) ? ' is-overdue' : ''}`}
                    onClick={() => setEditing({ task })}
                  >
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > MAX_IN_CELL && <span className="calendar__more">ещё {dayTasks.length - MAX_IN_CELL}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {editing && (
        <TaskForm
          eventId={event.id}
          task={editing.task}
          defaultDate={editing.date}
          team={team.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={afterChange}
          onDeleted={afterChange}
        />
      )}
    </>
  )
}

export function CalendarPage() {
  return <RequireEvent>{(event) => <CalendarContent event={event} />}</RequireEvent>
}
