import { CalendarCheck, ChartColumn, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router'
import { Logo } from '../components/Logo.jsx'
import { Field, FormError, Tabs } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// Демо-аккаунт из server/db/seed.sql
const DEMO = { email: 'ndanilov40@gmail.com', password: 'demo123' }

export function Login() {
  const { user, login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    run(() => (mode === 'login' ? login(form.email, form.password) : register(form)))
  }

  return (
    <div className="auth">
      <section className="auth__brand">
        <Logo size={40} light tagline />
        <div>
          <h1>Организуйте мероприятия легко</h1>
          <p>Всё в одном сервисе: планирование, команда, бюджет и регистрация участников.</p>
        </div>
        <ul className="auth__features">
          <li>
            <CalendarCheck size={20} />
            План подготовки и задачи со сроками
          </li>
          <li>
            <UsersRound size={20} />
            Команда, подрядчики и регистрация гостей
          </li>
          <li>
            <ChartColumn size={20} />
            Контроль бюджета и прогресса в реальном времени
          </li>
        </ul>
      </section>

      <section className="auth__panel">
        <form className="auth__form form" onSubmit={submit}>
          <div className="auth__mobile-logo">
            <Logo size={34} />
          </div>
          <h2>{mode === 'login' ? 'Вход в EventTech' : 'Регистрация'}</h2>
          <Tabs
            value={mode}
            onChange={(value) => {
              setMode(value)
              setError(null)
            }}
            options={[
              { value: 'login', label: 'Вход' },
              { value: 'register', label: 'Регистрация' },
            ]}
          />
          {mode === 'register' && (
            <Field label="Имя и фамилия">
              {(id) => <input id={id} className="input" value={form.name} onChange={set('name')} required autoComplete="name" />}
            </Field>
          )}
          <Field label="Email">
            {(id) => <input id={id} type="email" className="input" value={form.email} onChange={set('email')} required autoComplete="email" />}
          </Field>
          <Field label="Пароль" hint={mode === 'register' ? 'Не короче 6 символов' : undefined}>
            {(id) => (
              <input
                id={id}
                type="password"
                className="input"
                value={form.password}
                onChange={set('password')}
                required
                minLength={mode === 'register' ? 6 : undefined}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            )}
          </Field>
          <FormError error={error} />
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
          {mode === 'login' && (
            <button type="button" className="btn btn--ghost btn--block" disabled={busy} onClick={() => run(() => login(DEMO.email, DEMO.password))}>
              Войти в демо-аккаунт
            </button>
          )}
        </form>
      </section>
    </div>
  )
}
