import { LoaderCircle, TriangleAlert, X } from 'lucide-react'
import { useEffect, useId } from 'react'
import { EVENT_STATUSES, GUEST_STATUSES, initials, PRIORITIES } from '../lib/format.js'

export function PriorityBadge({ priority }) {
  return <span className={`badge badge--${priority}`}>{PRIORITIES[priority]}</span>
}

export function EventStatusBadge({ status }) {
  return <span className={`badge badge--event-${status}`}>{EVENT_STATUSES[status]}</span>
}

export function GuestStatusBadge({ status }) {
  return <span className={`badge badge--guest-${status}`}>{GUEST_STATUSES[status]}</span>
}

export function ProgressBar({ value, tone = 'primary' }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progress__bar progress__bar--${tone}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

const AVATAR_COLORS = ['#6366F1', '#A78BFA', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#14B8A6', '#8B5CF6']

export function Avatar({ name, size = 32 }) {
  const color = AVATAR_COLORS[[...(name ?? '')].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_COLORS.length]
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, background: color }}
      title={name}
      aria-hidden="true"
    >
      {initials(name) || '?'}
    </span>
  )
}

export function Spinner({ label = 'Загрузка…' }) {
  return (
    <div className="state">
      <LoaderCircle className="spin" size={28} />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state state--error">
      <TriangleAlert size={28} />
      <span>{error?.message ?? 'Что-то пошло не так'}</span>
      {onRetry && (
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="state">
      {Icon && (
        <span className="state__icon">
          <Icon size={26} />
        </span>
      )}
      <strong>{title}</strong>
      {text && <span>{text}</span>}
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}

export function Tabs({ value, onChange, options }) {
  return (
    <div className="tabs" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={`tabs__item${value === option.value ? ' is-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && <span className="tabs__count">{option.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, hint, children, className = '' }) {
  const id = useId()
  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {typeof children === 'function' ? children(id) : children}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  )
}

export function Modal({ title, onClose, children, footer, width = 520 }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [onClose])

  return (
    <div className="modal" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal__dialog" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
        <header className="modal__header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  )
}

export function FormError({ error }) {
  if (!error) return null
  return (
    <div className="form-error" role="alert">
      <TriangleAlert size={16} />
      {error.message ?? String(error)}
    </div>
  )
}
