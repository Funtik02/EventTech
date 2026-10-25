import { ClipboardList, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { RequireEvent } from '../components/RequireEvent.jsx'
import { TaskForm } from '../components/TaskForm.jsx'
import { TaskItem } from '../components/TaskItem.jsx'
import { EmptyState, ErrorState, PageHeader, ProgressBar, Spinner, Tabs } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useEvents } from '../context/EventContext.jsx'
import { api, useApi } from '../lib/api.js'
import { isOverdue, percent, PRIORITIES } from '../lib/format.js'

const EMPTY = []

const FILTERS = {
  all: (task) => task.status !== 'done',
  mine: (task, userId) => task.status !== 'done' && task.assignee_user_id === userId,
  overdue: (task) => isOverdue(task),
  done: (task) => task.status === 'done',
}

function TasksContent({ event }) {
  const { user } = useAuth()
  const { reload: reloadEvents } = useEvents()
  const tasks = useApi(`/events/${event.id}/tasks`)
  const team = useApi(`/events/${event.id}/team`)
  const [params, setParams] = useSearchParams()
  const filter = FILTERS[params.get('filter')] ? params.get('filter') : 'all'
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)

  const list = tasks.data ?? EMPTY
  const counts = useMemo(
    () => Object.fromEntries(Object.entries(FILTERS).map(([key, fn]) => [key, list.filter((t) => fn(t, user.id)).length])),
    [list, user.id],
  )

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return list.filter(
      (task) =>
        FILTERS[filter](task, user.id) &&
        (!assignee || String(task.assignee_id) === assignee) &&
        (!priority || task.priority === priority) &&
        (!query || task.title.toLowerCase().includes(query)),
    )
  }, [list, filter, assignee, priority, search, user.id])

  if (tasks.loading && !tasks.data) return <Spinner />
  if (tasks.error) return <ErrorState error={tasks.error} onRetry={tasks.reload} />

  const done = counts.done
  const total = list.length

  const upsert = (saved) => {
    tasks.setData((prev) => {
      const exists = prev.some((t) => t.id === saved.id)
      return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [...prev, saved]
    })
    reloadEvents()
  }

  const toggle = async (task) => {
    try {
      const saved = await api(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: { status: task.status === 'done' ? 'todo' : 'done' },
      })
      upsert(saved)
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Задачи"
        subtitle={event.title}
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
            <Plus size={18} />
            Новая задача
          </button>
        }
      />

      <div className="card progress-card">
        <div>
          <strong>
            {done} из {total}
          </strong>{' '}
          задач выполнено
        </div>
        <ProgressBar value={percent(done, total)} />
        <span className="progress-card__value">{percent(done, total)}%</span>
      </div>

      <div className="toolbar">
        <Tabs
          value={filter}
          onChange={(value) => setParams(value === 'all' ? {} : { filter: value }, { replace: true })}
          options={[
            { value: 'all', label: 'Все', count: counts.all },
            { value: 'mine', label: 'Мои', count: counts.mine },
            { value: 'overdue', label: 'Просроченные', count: counts.overdue },
            { value: 'done', label: 'Выполненные', count: counts.done },
          ]}
        />
        <div className="toolbar__filters">
          <label className="search">
            <Search size={16} />
            <input
              className="input"
              placeholder="Поиск задачи"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Поиск задачи"
            />
          </label>
          <select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Исполнитель">
            <option value="">Все исполнители</option>
            {(team.data ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Приоритет">
            <option value="">Любой приоритет</option>
            {Object.entries(PRIORITIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {visible.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={filter === 'overdue' ? 'Просроченных задач нет' : 'Задач не найдено'}
            text={filter === 'all' && total === 0 ? 'Добавьте первую задачу в план подготовки.' : undefined}
          />
        ) : (
          <ul className="task-list">
            {visible.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={() => toggle(task)} onOpen={() => setEditing(task)} />
            ))}
          </ul>
        )}
      </div>

      <button type="button" className="fab" onClick={() => setEditing('new')} aria-label="Новая задача">
        <Plus size={26} />
      </button>

      {editing && (
        <TaskForm
          eventId={event.id}
          task={editing === 'new' ? null : editing}
          team={team.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null)
            upsert(saved)
          }}
          onDeleted={(task) => {
            setEditing(null)
            tasks.setData((prev) => prev.filter((t) => t.id !== task.id))
            reloadEvents()
          }}
        />
      )}
    </>
  )
}

export function Tasks() {
  return <RequireEvent>{(event) => <TasksContent event={event} />}</RequireEvent>
}
