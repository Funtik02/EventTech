import { Check } from 'lucide-react'
import { formatDateShort, isOverdue } from '../lib/format.js'
import { Avatar, PriorityBadge } from './ui.jsx'

export function TaskCheckbox({ done, onToggle, title }) {
  return (
    <button
      type="button"
      className={`checkbox${done ? ' is-checked' : ''}`}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      aria-pressed={done}
      aria-label={done ? `Вернуть в работу: ${title}` : `Отметить выполненной: ${title}`}
    >
      {done && <Check size={14} strokeWidth={3} />}
    </button>
  )
}

export function TaskItem({ task, onToggle, onOpen, compact = false }) {
  const done = task.status === 'done'
  const overdue = isOverdue(task)

  return (
    <li
      className={`task-item task-item--${task.priority}${done ? ' is-done' : ''}${compact ? ' task-item--compact' : ''}`}
      onClick={onOpen}
    >
      <TaskCheckbox done={done} onToggle={onToggle} title={task.title} />
      <div className="task-item__main">
        <span className="task-item__title">{task.title}</span>
        {!compact && (
          <span className="task-item__meta">
            {task.status === 'in_progress' && <span className="task-item__progress">В работе</span>}
            {task.assignee_name ?? 'Без исполнителя'}
          </span>
        )}
      </div>
      <span className={`task-item__date${overdue ? ' is-overdue' : ''}`}>
        {overdue ? 'Просрочено · ' : ''}
        {formatDateShort(task.due_date)}
      </span>
      <PriorityBadge priority={task.priority} />
      {!compact && (task.assignee_name ? <Avatar name={task.assignee_name} size={28} /> : <span className="avatar-placeholder" />)}
    </li>
  )
}
