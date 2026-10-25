import { Mail, Pencil, Trash2, UserPlus, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { RequireEvent } from '../components/RequireEvent.jsx'
import { Avatar, EmptyState, ErrorState, Field, FormError, Modal, PageHeader, ProgressBar, Spinner } from '../components/ui.jsx'
import { api, useApi } from '../lib/api.js'
import { percent, plural } from '../lib/format.js'

function MemberForm({ eventId, member, onClose, onSaved }) {
  const [form, setForm] = useState({ name: member?.name ?? '', email: member?.email ?? '', role: member?.role ?? '' })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const saved = member
        ? await api(`/team/${member.id}`, { method: 'PATCH', body: form })
        : await api(`/events/${eventId}/team`, { method: 'POST', body: form })
      onSaved(saved)
    } catch (err) {
      setError(err)
      setSaving(false)
    }
  }

  return (
    <Modal
      title={member ? 'Участник команды' : 'Добавить в команду'}
      onClose={onClose}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" form="member-form" className="btn btn--primary" disabled={saving}>
            Сохранить
          </button>
        </>
      }
    >
      <form id="member-form" className="form" onSubmit={submit}>
        <Field label="Имя и фамилия">
          {(id) => <input id={id} className="input" value={form.name} onChange={set('name')} required autoFocus />}
        </Field>
        <Field label="Роль в команде">
          {(id) => <input id={id} className="input" value={form.role} onChange={set('role')} placeholder="Например, менеджер площадки" />}
        </Field>
        <Field label="Email" hint="Если человек зарегистрируется в EventTech с этим email, он получит доступ к мероприятию.">
          {(id) => <input id={id} type="email" className="input" value={form.email} onChange={set('email')} />}
        </Field>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

function TeamContent({ event }) {
  const team = useApi(`/events/${event.id}/team`)
  const [editing, setEditing] = useState(null)

  if (team.loading && !team.data) return <Spinner />
  if (team.error) return <ErrorState error={team.error} onRetry={team.reload} />

  const remove = async (member) => {
    if (!window.confirm(`Убрать ${member.name} из команды? Задачи останутся без исполнителя.`)) return
    try {
      await api(`/team/${member.id}`, { method: 'DELETE' })
      team.setData((prev) => prev.filter((m) => m.id !== member.id))
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Команда"
        subtitle={`${team.data.length} ${plural(team.data.length, ['человек', 'человека', 'человек'])} · ${event.title}`}
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
            <UserPlus size={18} />
            Добавить
          </button>
        }
      />

      {team.data.length === 0 ? (
        <div className="card">
          <EmptyState icon={UsersRound} title="В команде пока никого" />
        </div>
      ) : (
        <div className="team-grid">
          {team.data.map((member) => {
            const isOwner = member.user_id === event.owner_id
            const open = member.tasks_total - member.tasks_done
            return (
              <article key={member.id} className="card member-card">
                <div className="member-card__head">
                  <Avatar name={member.name} size={48} />
                  <div className="member-card__name">
                    <strong>{member.name}</strong>
                    <span className="muted">{member.role || 'Роль не указана'}</span>
                  </div>
                  <div className="member-card__actions">
                    <button type="button" className="icon-btn" onClick={() => setEditing(member)} aria-label="Изменить">
                      <Pencil size={16} />
                    </button>
                    {!isOwner && (
                      <button type="button" className="icon-btn" onClick={() => remove(member)} aria-label="Удалить">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                {member.email && (
                  <a className="member-card__email" href={`mailto:${member.email}`}>
                    <Mail size={14} />
                    {member.email}
                  </a>
                )}
                <div className="member-card__tags">
                  {isOwner && <span className="tag tag--accent">Владелец</span>}
                  {member.user_id ? <span className="tag">В сервисе</span> : <span className="tag tag--muted">Не зарегистрирован</span>}
                </div>
                <div className="member-card__tasks">
                  <span>
                    {open > 0 ? `${open} ${plural(open, ['задача', 'задачи', 'задач'])} в работе` : 'Нет открытых задач'}
                  </span>
                  <span className="muted">
                    {member.tasks_done}/{member.tasks_total}
                  </span>
                </div>
                <ProgressBar value={percent(member.tasks_done, member.tasks_total)} />
              </article>
            )
          })}
        </div>
      )}

      {editing && (
        <MemberForm
          eventId={event.id}
          member={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            team.reload()
          }}
        />
      )}
    </>
  )
}

export function Team() {
  return <RequireEvent>{(event) => <TeamContent event={event} />}</RequireEvent>
}
