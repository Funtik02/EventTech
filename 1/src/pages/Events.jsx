import { Calendar, CalendarPlus, MapPin, Plus, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { EmptyState, ErrorState, EventStatusBadge, PageHeader, ProgressBar, Spinner } from '../components/ui.jsx'
import { useEvents } from '../context/EventContext.jsx'
import { EVENT_TYPES, formatDateRange, formatNumber, percent } from '../lib/format.js'

export function Events() {
  const { events, current, loading, error, reload, setCurrentId } = useEvents()
  const navigate = useNavigate()

  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const open = (event) => {
    setCurrentId(event.id)
    navigate('/')
  }

  return (
    <>
      <PageHeader
        title="Мероприятия"
        subtitle="Все мероприятия, к которым у вас есть доступ"
        actions={
          <Link to="/events/new" className="btn btn--primary">
            <Plus size={18} />
            Создать мероприятие
          </Link>
        }
      />
      {events.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CalendarPlus}
            title="Мероприятий пока нет"
            action={
              <Link to="/events/new" className="btn btn--primary">
                Создать первое
              </Link>
            }
          />
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              className={`card event-card${current?.id === event.id ? ' is-current' : ''}`}
              onClick={() => open(event)}
            >
              <div className="event-card__top">
                <span className="tag">{EVENT_TYPES[event.type]}</span>
                <EventStatusBadge status={event.status} />
              </div>
              <h2>{event.title}</h2>
              <ul className="event-card__facts">
                <li>
                  <Calendar size={15} />
                  {formatDateRange(event.start_date, event.end_date)}
                </li>
                {event.location && (
                  <li>
                    <MapPin size={15} />
                    {event.location}
                  </li>
                )}
                <li>
                  <Users size={15} />
                  {formatNumber(event.guests_count)} из {formatNumber(event.expected_attendees)} участников
                </li>
              </ul>
              <div className="event-card__progress">
                <span>
                  Подготовка: {event.tasks_done}/{event.tasks_total} задач
                </span>
                <ProgressBar value={percent(event.tasks_done, event.tasks_total)} />
              </div>
              {current?.id === event.id && <span className="event-card__current">Текущее</span>}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
