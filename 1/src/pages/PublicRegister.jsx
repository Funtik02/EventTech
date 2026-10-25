import { Calendar, CircleCheck, MapPin, Users } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { EventCover } from '../components/EventCover.jsx'
import { Logo } from '../components/Logo.jsx'
import { ErrorState, Field, FormError, Spinner } from '../components/ui.jsx'
import { api, useApi } from '../lib/api.js'
import { EVENT_TYPES, formatDateRange, formatTime } from '../lib/format.js'

/** Публичная страница регистрации гостя: /r/:eventId */
export function PublicRegister() {
  const { eventId } = useParams()
  const event = useApi(`/public/events/${encodeURIComponent(eventId)}`)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api(`/public/events/${encodeURIComponent(eventId)}/register`, { method: 'POST', body: form })
      setDone(true)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="public">
      <header className="public__header">
        <Logo size={30} />
      </header>
      <main className="public__main">
        {event.loading && <Spinner />}
        {event.error && <ErrorState error={event.error} />}
        {event.data && (
          <div className="card public__card">
            <div className="public__cover">
              <EventCover title={event.data.title} />
            </div>
            <div className="public__body">
              <span className="tag">{EVENT_TYPES[event.data.type]}</span>
              <h1>{event.data.title}</h1>
              <ul className="summary-list">
                <li>
                  <Calendar size={16} />
                  {formatDateRange(event.data.start_date, event.data.end_date)}
                  {event.data.start_time && `, ${formatTime(event.data.start_time)}`}
                </li>
                {event.data.location && (
                  <li>
                    <MapPin size={16} />
                    {event.data.location}
                  </li>
                )}
                <li>
                  <Users size={16} />
                  Уже зарегистрировались: {event.data.registered_count}
                </li>
              </ul>
              {event.data.description && <p className="public__description">{event.data.description}</p>}

              {done ? (
                <div className="public__success">
                  <CircleCheck size={40} />
                  <h2>Вы зарегистрированы!</h2>
                  <p className="muted">Ждём вас на мероприятии. Организаторы свяжутся с вами по адресу {form.email}.</p>
                </div>
              ) : event.data.registration_open ? (
                <form className="form" onSubmit={submit}>
                  <h2>Регистрация</h2>
                  <Field label="Имя и фамилия">
                    {(id) => <input id={id} className="input" value={form.name} onChange={set('name')} required autoComplete="name" />}
                  </Field>
                  <div className="form__row">
                    <Field label="Email">
                      {(id) => <input id={id} type="email" className="input" value={form.email} onChange={set('email')} required autoComplete="email" />}
                    </Field>
                    <Field label="Телефон">
                      {(id) => <input id={id} type="tel" className="input" value={form.phone} onChange={set('phone')} autoComplete="tel" />}
                    </Field>
                  </div>
                  <Field label="Компания">
                    {(id) => <input id={id} className="input" value={form.company} onChange={set('company')} autoComplete="organization" />}
                  </Field>
                  <FormError error={error} />
                  <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
                    {busy ? 'Отправка…' : 'Зарегистрироваться'}
                  </button>
                </form>
              ) : (
                <div className="public__closed">Регистрация на мероприятие закрыта.</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
