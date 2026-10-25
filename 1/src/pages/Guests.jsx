import { Download, ExternalLink, Search, Trash2, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CopyLinkButton } from '../components/CopyLinkButton.jsx'
import { RequireEvent } from '../components/RequireEvent.jsx'
import { EmptyState, ErrorState, Field, FormError, Modal, PageHeader, ProgressBar, Spinner, Tabs } from '../components/ui.jsx'
import { useEvents } from '../context/EventContext.jsx'
import { api, useApi } from '../lib/api.js'
import { formatDateTime, formatNumber, GUEST_STATUSES, percent, registrationUrl } from '../lib/format.js'

const PAGE_SIZE = 50
const EMPTY = []

function GuestForm({ eventId, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', status: 'registered' })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      onSaved(await api(`/events/${eventId}/guests`, { method: 'POST', body: form }))
    } catch (err) {
      setError(err)
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Добавить участника"
      onClose={onClose}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" form="guest-form" className="btn btn--primary" disabled={saving}>
            Добавить
          </button>
        </>
      }
    >
      <form id="guest-form" className="form" onSubmit={submit}>
        <Field label="Имя и фамилия">
          {(id) => <input id={id} className="input" value={form.name} onChange={set('name')} required autoFocus />}
        </Field>
        <div className="form__row">
          <Field label="Email">
            {(id) => <input id={id} type="email" className="input" value={form.email} onChange={set('email')} required />}
          </Field>
          <Field label="Телефон">
            {(id) => <input id={id} type="tel" className="input" value={form.phone} onChange={set('phone')} />}
          </Field>
        </div>
        <div className="form__row">
          <Field label="Компания">
            {(id) => <input id={id} className="input" value={form.company} onChange={set('company')} />}
          </Field>
          <Field label="Статус">
            {(id) => (
              <select id={id} className="input" value={form.status} onChange={set('status')}>
                {Object.entries(GUEST_STATUSES).map(([value, label]) => (
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

function exportCsv(event, guests) {
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const rows = [
    ['Имя', 'Email', 'Телефон', 'Компания', 'Статус', 'Источник', 'Дата регистрации'],
    ...guests.map((g) => [g.name, g.email, g.phone, g.company, GUEST_STATUSES[g.status], g.source === 'form' ? 'Форма' : 'Вручную', g.created_at]),
  ]
  // BOM — чтобы Excel корректно открыл кириллицу
  const csv = '﻿' + rows.map((row) => row.map(escape).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `участники-${event.id}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function GuestsContent({ event }) {
  const { reload: reloadEvents } = useEvents()
  const guests = useApi(`/events/${event.id}/guests`)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [adding, setAdding] = useState(false)

  const list = guests.data ?? EMPTY
  const counts = useMemo(() => {
    const result = { all: list.length }
    for (const key of Object.keys(GUEST_STATUSES)) result[key] = list.filter((g) => g.status === key).length
    return result
  }, [list])

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return list.filter(
      (g) =>
        (status === 'all' || g.status === status) &&
        (!query || [g.name, g.email, g.company, g.phone].some((v) => v.toLowerCase().includes(query))),
    )
  }, [list, status, search])

  if (guests.loading && !guests.data) return <Spinner />
  if (guests.error) return <ErrorState error={guests.error} onRetry={guests.reload} />

  const active = list.length - counts.cancelled

  const changeStatus = async (guest, next) => {
    try {
      const saved = await api(`/guests/${guest.id}`, { method: 'PATCH', body: { status: next } })
      guests.setData((prev) => prev.map((g) => (g.id === saved.id ? saved : g)))
      reloadEvents()
    } catch (err) {
      window.alert(err.message)
    }
  }

  const remove = async (guest) => {
    if (!window.confirm(`Удалить участника «${guest.name}»?`)) return
    try {
      await api(`/guests/${guest.id}`, { method: 'DELETE' })
      guests.setData((prev) => prev.filter((g) => g.id !== guest.id))
      reloadEvents()
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Участники"
        subtitle={event.title}
        actions={
          <>
            <button type="button" className="btn btn--secondary" onClick={() => exportCsv(event, visible)} disabled={!visible.length}>
              <Download size={18} />
              Экспорт CSV
            </button>
            <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
              <UserPlus size={18} />
              Добавить
            </button>
          </>
        }
      />

      <div className="guests-top">
        <div className="card registration-card">
          <div>
            <h2>Регистрация гостей</h2>
            <p className="muted">
              {event.registration_open ? 'Отправьте ссылку гостям — заявки появятся в списке автоматически.' : 'Регистрация закрыта. Откройте её в настройках.'}
            </p>
            <code className="registration-card__url">{registrationUrl(event.id)}</code>
          </div>
          <div className="registration-card__actions">
            <CopyLinkButton eventId={event.id} />
            <a className="btn btn--ghost btn--sm" href={`/r/${event.id}`} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              Открыть форму
            </a>
          </div>
        </div>
        <div className="card stat-card">
          <span className="stat-card__title">Зарегистрировано</span>
          <strong className="stat-card__value">{formatNumber(active)}</strong>
          <span className="stat-card__caption">из {formatNumber(event.expected_attendees)} ожидаемых</span>
          <div className="stat-card__progress">
            <ProgressBar value={percent(active, event.expected_attendees)} />
            <span>{percent(active, event.expected_attendees)}%</span>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <Tabs
          value={status}
          onChange={(value) => {
            setStatus(value)
            setLimit(PAGE_SIZE)
          }}
          options={[
            { value: 'all', label: 'Все', count: counts.all },
            ...Object.entries(GUEST_STATUSES).map(([value, label]) => ({ value, label, count: counts[value] })),
          ]}
        />
        <label className="search">
          <Search size={16} />
          <input
            className="input"
            placeholder="Имя, email, компания"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setLimit(PAGE_SIZE)
            }}
            aria-label="Поиск участника"
          />
        </label>
      </div>

      <div className="card">
        {visible.length === 0 ? (
          <EmptyState icon={Users} title="Участников не найдено" text={list.length === 0 ? 'Поделитесь ссылкой на регистрацию.' : undefined} />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Участник</th>
                    <th>Компания</th>
                    <th>Телефон</th>
                    <th>Статус</th>
                    <th>Регистрация</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visible.slice(0, limit).map((guest) => (
                    <tr key={guest.id}>
                      <td>
                        <strong>{guest.name}</strong>
                        <div className="muted">{guest.email}</div>
                      </td>
                      <td>{guest.company || '—'}</td>
                      <td className="nowrap">{guest.phone || '—'}</td>
                      <td>
                        <select
                          className={`status-select status-select--${guest.status}`}
                          value={guest.status}
                          onChange={(e) => changeStatus(guest, e.target.value)}
                          aria-label={`Статус: ${guest.name}`}
                        >
                          {Object.entries(GUEST_STATUSES).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="nowrap muted">
                        {formatDateTime(guest.created_at)}
                        <div>{guest.source === 'form' ? 'через форму' : 'вручную'}</div>
                      </td>
                      <td className="row-actions">
                        <button type="button" className="icon-btn" onClick={() => remove(guest)} aria-label="Удалить">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visible.length > limit && (
              <div className="table-more">
                <button type="button" className="btn btn--secondary" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                  Показать ещё ({visible.length - limit})
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {adding && (
        <GuestForm
          eventId={event.id}
          onClose={() => setAdding(false)}
          onSaved={(saved) => {
            setAdding(false)
            guests.setData((prev) => [saved, ...prev])
            reloadEvents()
          }}
        />
      )}
    </>
  )
}

export function Guests() {
  return <RequireEvent>{(event) => <GuestsContent event={event} />}</RequireEvent>
}
