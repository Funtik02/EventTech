import { LogOut, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Field, FormError, PageHeader } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useEvents } from '../context/EventContext.jsx'
import { api } from '../lib/api.js'
import { EVENT_STATUSES, EVENT_TYPES, formatTime } from '../lib/format.js'

function SaveButton({ saving, saved }) {
  return (
    <div className="form__actions">
      {saved && <span className="text-success">Сохранено</span>}
      <button type="submit" className="btn btn--primary" disabled={saving}>
        {saving ? 'Сохранение…' : 'Сохранить'}
      </button>
    </div>
  )
}

function useSaveState() {
  const [state, setState] = useState({ saving: false, saved: false, error: null })
  const run = async (fn) => {
    setState({ saving: true, saved: false, error: null })
    try {
      await fn()
      setState({ saving: false, saved: true, error: null })
      setTimeout(() => setState((s) => ({ ...s, saved: false })), 2500)
    } catch (error) {
      setState({ saving: false, saved: false, error })
    }
  }
  return [state, run]
}

function ProfileForm() {
  const { user, setUser, logout } = useAuth()
  const [form, setForm] = useState({ name: user.name, position: user.position })
  const [state, run] = useSaveState()

  const submit = (e) => {
    e.preventDefault()
    run(async () => setUser(await api('/auth/me', { method: 'PATCH', body: form })))
  }

  return (
    <form className="card form" onSubmit={submit}>
      <div className="card__header">
        <h2>Профиль</h2>
        <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
          <LogOut size={16} />
          Выйти
        </button>
      </div>
      <div className="form__row">
        <Field label="Имя и фамилия">
          {(id) => <input id={id} className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />}
        </Field>
        <Field label="Должность">
          {(id) => <input id={id} className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />}
        </Field>
      </div>
      <Field label="Email">{(id) => <input id={id} className="input" value={user.email} disabled />}</Field>
      <FormError error={state.error} />
      <SaveButton {...state} />
    </form>
  )
}

function EventSettings({ event }) {
  const { reload } = useEvents()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: event.title,
    type: event.type,
    status: event.status,
    start_date: event.start_date,
    end_date: event.end_date,
    start_time: formatTime(event.start_time),
    location: event.location,
    description: event.description,
    expected_attendees: event.expected_attendees,
    budget_limit: event.budget_limit,
    registration_open: event.registration_open,
  })
  const [state, run] = useSaveState()
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    run(async () => {
      await api(`/events/${event.id}`, { method: 'PATCH', body: form })
      await reload()
    })
  }

  const remove = async () => {
    if (!window.confirm(`Удалить мероприятие «${event.title}» со всеми задачами, бюджетом и участниками? Это действие необратимо.`)) return
    try {
      await api(`/events/${event.id}`, { method: 'DELETE' })
      await reload()
      navigate('/events')
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <div className="card__header">
        <h2>Мероприятие</h2>
      </div>
      <Field label="Название">
        {(id) => <input id={id} className="input" value={form.title} onChange={set('title')} required />}
      </Field>
      <div className="form__row">
        <Field label="Тип">
          {(id) => (
            <select id={id} className="input" value={form.type} onChange={set('type')}>
              {Object.entries(EVENT_TYPES).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Статус">
          {(id) => (
            <select id={id} className="input" value={form.status} onChange={set('status')}>
              {Object.entries(EVENT_STATUSES).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <div className="form__row form__row--3">
        <Field label="Дата начала">
          {(id) => <input id={id} type="date" className="input" value={form.start_date} onChange={set('start_date')} required />}
        </Field>
        <Field label="Время">
          {(id) => <input id={id} type="time" className="input" value={form.start_time} onChange={set('start_time')} />}
        </Field>
        <Field label="Дата окончания">
          {(id) => <input id={id} type="date" className="input" value={form.end_date} onChange={set('end_date')} required />}
        </Field>
      </div>
      <Field label="Место проведения">
        {(id) => <input id={id} className="input" value={form.location} onChange={set('location')} />}
      </Field>
      <Field label="Описание и цели">
        {(id) => <textarea id={id} className="input" rows={3} value={form.description} onChange={set('description')} />}
      </Field>
      <div className="form__row">
        <Field label="Ожидаемое количество участников">
          {(id) => <input id={id} type="number" min="0" className="input" value={form.expected_attendees} onChange={set('expected_attendees')} />}
        </Field>
        <Field label="Лимит бюджета, ₽">
          {(id) => <input id={id} type="number" min="0" step="0.01" className="input" value={form.budget_limit} onChange={set('budget_limit')} />}
        </Field>
      </div>
      <label className="check-option">
        <input
          type="checkbox"
          checked={form.registration_open}
          onChange={(e) => setForm((prev) => ({ ...prev, registration_open: e.target.checked }))}
        />
        <span>
          <strong>Регистрация гостей открыта</strong>
          <span className="muted">Публичная форма доступна по ссылке, пока мероприятие в подготовке или идёт.</span>
        </span>
      </label>
      <FormError error={state.error} />
      <div className="form__footer">
        {event.is_owner && (
          <button type="button" className="btn btn--danger-ghost" onClick={remove}>
            <Trash2 size={16} />
            Удалить мероприятие
          </button>
        )}
        <span className="spacer" />
        <SaveButton {...state} />
      </div>
    </form>
  )
}

export function Settings() {
  const { current } = useEvents()
  return (
    <>
      <PageHeader title="Настройки" />
      <div className="settings">
        <ProfileForm />
        {current && <EventSettings key={current.id} event={current} />}
      </div>
    </>
  )
}
