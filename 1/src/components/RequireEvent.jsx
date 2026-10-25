import { CalendarPlus } from 'lucide-react'
import { Link } from 'react-router'
import { useEvents } from '../context/EventContext.jsx'
import { EmptyState, ErrorState, Spinner } from './ui.jsx'

export function RequireEvent({ children }) {
  const { current, loading, error, reload } = useEvents()

  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!current) {
    return (
      <EmptyState
        icon={CalendarPlus}
        title="У вас пока нет мероприятий"
        text="Создайте первое мероприятие — мы поможем составить план подготовки."
        action={
          <Link to="/events/new" className="btn btn--primary">
            Создать мероприятие
          </Link>
        }
      />
    )
  }
  return <div key={current.id}>{children(current)}</div>
}
