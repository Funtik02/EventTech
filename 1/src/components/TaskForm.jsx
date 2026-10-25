import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '../lib/api.js'
import { PRIORITIES, TASK_STATUSES } from '../lib/format.js'
import { Field, FormError, Modal } from './ui.jsx'

/** Модалка создания/редактирования задачи. task = null — новая задача. */
export function TaskForm({ eventId, task, team, defaultDate, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    assignee_id: task?.assignee_id ?? '',
    due_date: task?.due_date ?? defaultDate ?? '',
    priority: task?.priority ?? 'medium',
    status: task?.status ?? 'todo',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body = { ...form, assignee_id: form.assignee_id ? Number(form.assignee_id) : null }
      const saved = task
        ? await api(`/tasks/${task.id}`, { method: 'PATCH', body })
        : await api(`/events/${eventId}/tasks`, { method: 'POST', body })
      onSaved(saved)
    } catch (err) {
      setError(err)
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`Удалить задачу «${task.title}»?`)) return
    try {
      await api(`/tasks/${task.id}`, { method: 'DELETE' })
      onDeleted(task)
    } catch (err) {
      setError(err)
    }
  }

  return (
    <Modal
      title={task ? 'Редактирование задачи' : 'Новая задача'}
      onClose={onClose}
      footer={
        <>
          {task && (
            <button type="button" className="btn btn--danger-ghost" onClick={remove}>
              <Trash2 size={16} />
              Удалить
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" form="task-form" className="btn btn--primary" disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form id="task-form" className="form" onSubmit={submit}>
        <Field label="Название задачи">
          {(id) => (
            <input id={id} className="input" value={form.title} onChange={set('title')} required autoFocus maxLength={300} />
          )}
        </Field>
        <Field label="Описание">
          {(id) => <textarea id={id} className="input" rows={3} value={form.description} onChange={set('description')} />}
        </Field>
        <div className="form__row">
          <Field label="Исполнитель">
            {(id) => (
              <select id={id} className="input" value={form.assignee_id} onChange={set('assignee_id')}>
                <option value="">Не назначен</option>
                {team.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Срок">
            {(id) => <input id={id} type="date" className="input" value={form.due_date} onChange={set('due_date')} />}
          </Field>
        </div>
        <div className="form__row">
          <Field label="Приоритет">
            {(id) => (
              <select id={id} className="input" value={form.priority} onChange={set('priority')}>
                {Object.entries(PRIORITIES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Статус">
            {(id) => (
              <select id={id} className="input" value={form.status} onChange={set('status')}>
                {Object.entries(TASK_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}
