import { ArrowLeft, Calendar, Check, Clock, MapPin, Plus, Trash2, Users, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Avatar, Field, FormError } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useEvents } from '../context/EventContext.jsx'
import { api } from '../lib/api.js'
import { EVENT_TYPES, formatDateRange, formatMoney, formatNumber } from '../lib/format.js'

const STEPS = ['Основное', 'Команда', 'Подтверждение']

let memberSeq = 0
const emptyMember = () => ({ key: ++memberSeq, name: '', email: '', role: '' })

function Stepper({ step }) {
  return (
    <ol className="stepper">
      {STEPS.map((label, index) => (
        <li key={label} className={`stepper__item${index === step ? ' is-active' : ''}${index < step ? ' is-done' : ''}`}>
          <span className="stepper__num">{index < step ? <Check size={14} strokeWidth={3} /> : index + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  )
}

export function EventCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { reload, setCurrentId } = useEvents()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    title: '',
    type: 'conference',
    start_date: '',
    start_time: '10:00',
    end_date: '',
    location: '',
    description: '',
    expected_attendees: '',
    budget_limit: '',
  })
  const [team, setTeam] = useState([emptyMember()])
  const [planTemplate, setPlanTemplate] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))
  const setMember = (key, field) => (e) =>
    setTeam((prev) => prev.map((m) => (m.key === key ? { ...m, [field]: e.target.value } : m)))
  const filledTeam = team.filter((m) => m.name.trim())

  const next = (e) => {
    e.preventDefault()
    setError(null)
    if (step === 0 && form.end_date && form.end_date < form.start_date) {
      setError(new Error('Дата окончания не может быть раньше даты начала'))
      return
    }
    setStep((s) => s + 1)
  }

  const create = async () => {
    setSaving(true)
    setError(null)
    try {
      const event = await api('/events', {
        method: 'POST',
        body: {
          ...form,
          expected_attendees: form.expected_attendees || 0,
          budget_limit: form.budget_limit || 0,
          team: filledTeam.map(({ name, email, role }) => ({ name, email, role })),
          plan_template: planTemplate,
        },
      })
      await reload()
      setCurrentId(event.id)
      navigate('/')
    } catch (err) {
      setError(err)
      setSaving(false)
    }
  }

  return (
    <div className="wizard">
      <header className="wizard__header">
        <button type="button" className="icon-btn" onClick={() => (step ? setStep(step - 1) : navigate(-1))} aria-label="Назад">
          <ArrowLeft size={20} />
        </button>
        <h1>Создание мероприятия</h1>
      </header>
      <Stepper step={step} />

      {step === 0 && (
        <form className="card form wizard__body" onSubmit={next}>
          <Field label="Название мероприятия">
            {(id) => (
              <input
                id={id}
                className="input"
                value={form.title}
                onChange={set('title')}
                placeholder="Бизнес-форум «Технологии будущего»"
                required
                autoFocus
              />
            )}
          </Field>
          <Field label="Тип мероприятия">
            {(id) => (
              <select id={id} className="input" value={form.type} onChange={set('type')}>
                {Object.entries(EVENT_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <div className="form__row form__row--3">
            <Field label="Дата начала">
              {(id) => <input id={id} type="date" className="input" value={form.start_date} onChange={set('start_date')} required />}
            </Field>
            <Field label="Время">
              {(id) => <input id={id} type="time" className="input" value={form.start_time} onChange={set('start_time')} />}
            </Field>
            <Field label="Дата окончания">
              {(id) => (
                <input id={id} type="date" className="input" value={form.end_date} min={form.start_date} onChange={set('end_date')} />
              )}
            </Field>
          </div>
          <Field label="Место проведения">
            {(id) => <input id={id} className="input" value={form.location} onChange={set('location')} placeholder="Москва, Крокус Экспо" />}
          </Field>
          <Field label="Описание и цели">
            {(id) => (
              <textarea
                id={id}
                className="input"
                rows={3}
                value={form.description}
                onChange={set('description')}
                placeholder="Обсудить тренды и перспективы развития технологий в бизнесе"
              />
            )}
          </Field>
          <div className="form__row">
            <Field label="Планируемое количество участников">
              {(id) => (
                <input id={id} type="number" min="0" className="input" value={form.expected_attendees} onChange={set('expected_attendees')} placeholder="500" />
              )}
            </Field>
            <Field label="Бюджет, ₽">
              {(id) => (
                <input id={id} type="number" min="0" className="input" value={form.budget_limit} onChange={set('budget_limit')} placeholder="1 500 000" />
              )}
            </Field>
          </div>
          <FormError error={error} />
          <button type="submit" className="btn btn--primary btn--block">
            Далее
          </button>
        </form>
      )}

      {step === 1 && (
        <form className="card form wizard__body" onSubmit={next}>
          <p className="muted">Добавьте людей, которые будут готовить мероприятие. Им можно будет назначать задачи.</p>
          <div className="team-row team-row--owner">
            <Avatar name={user.name} size={36} />
            <div>
              <strong>{user.name}</strong>
              <div className="muted">Руководитель проекта · вы</div>
            </div>
          </div>
          {team.map((member) => (
            <div key={member.key} className="team-row">
              <input className="input" placeholder="Имя и фамилия" value={member.name} onChange={setMember(member.key, 'name')} aria-label="Имя" />
              <input className="input" placeholder="Роль" value={member.role} onChange={setMember(member.key, 'role')} aria-label="Роль" />
              <input
                className="input"
                type="email"
                placeholder="Email"
                value={member.email}
                onChange={setMember(member.key, 'email')}
                aria-label="Email"
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setTeam((prev) => (prev.length > 1 ? prev.filter((m) => m.key !== member.key) : [emptyMember()]))}
                aria-label="Удалить строку"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn--ghost" onClick={() => setTeam((prev) => [...prev, emptyMember()])}>
            <Plus size={16} />
            Добавить участника команды
          </button>
          <button type="submit" className="btn btn--primary btn--block">
            Далее
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="card wizard__body">
          <h2 className="wizard__title">{form.title}</h2>
          <span className="tag">{EVENT_TYPES[form.type]}</span>
          <ul className="summary-list">
            <li>
              <Calendar size={16} />
              {formatDateRange(form.start_date, form.end_date || form.start_date)}
            </li>
            {form.start_time && (
              <li>
                <Clock size={16} />
                Начало в {form.start_time}
              </li>
            )}
            {form.location && (
              <li>
                <MapPin size={16} />
                {form.location}
              </li>
            )}
            <li>
              <Users size={16} />
              {formatNumber(Number(form.expected_attendees) || 0)} участников · команда {filledTeam.length + 1} чел.
            </li>
            <li>
              <Wallet size={16} />
              Бюджет {formatMoney(Number(form.budget_limit) || 0)}
            </li>
          </ul>
          {form.description && <p className="muted">{form.description}</p>}
          <label className="check-option">
            <input type="checkbox" checked={planTemplate} onChange={(e) => setPlanTemplate(e.target.checked)} />
            <span>
              <strong>Создать типовой план подготовки</strong>
              <span className="muted">
                12 задач от концепции до сбора обратной связи со сроками, рассчитанными от даты мероприятия.
              </span>
            </span>
          </label>
          <FormError error={error} />
          <button type="button" className="btn btn--primary btn--block" onClick={create} disabled={saving}>
            {saving ? 'Создание…' : 'Создать мероприятие'}
          </button>
        </div>
      )}
    </div>
  )
}
