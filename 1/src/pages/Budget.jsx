import { Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { RequireEvent } from '../components/RequireEvent.jsx'
import { EmptyState, ErrorState, Field, FormError, Modal, PageHeader, ProgressBar, Spinner } from '../components/ui.jsx'
import { useEvents } from '../context/EventContext.jsx'
import { api, useApi } from '../lib/api.js'
import { formatMoney } from '../lib/format.js'

const EMPTY = []
const CATEGORIES = ['Площадка', 'Кейтеринг', 'Техника', 'Маркетинг', 'Спикеры', 'Печать', 'Персонал', 'Транспорт', 'Сувениры', 'Прочее']

function BudgetForm({ eventId, item, onClose, onSaved }) {
  const [form, setForm] = useState({
    category: item?.category ?? CATEGORIES[0],
    title: item?.title ?? '',
    vendor: item?.vendor ?? '',
    planned: item?.planned ?? '',
    actual: item?.actual ?? '',
  })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const saved = item
        ? await api(`/budget/${item.id}`, { method: 'PATCH', body: form })
        : await api(`/events/${eventId}/budget`, { method: 'POST', body: form })
      onSaved(saved)
    } catch (err) {
      setError(err)
      setSaving(false)
    }
  }

  return (
    <Modal
      title={item ? 'Статья расходов' : 'Новая статья расходов'}
      onClose={onClose}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" form="budget-form" className="btn btn--primary" disabled={saving}>
            Сохранить
          </button>
        </>
      }
    >
      <form id="budget-form" className="form" onSubmit={submit}>
        <div className="form__row">
          <Field label="Категория">
            {(id) => (
              <>
                <input id={id} className="input" list="budget-categories" value={form.category} onChange={set('category')} required />
                <datalist id="budget-categories">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
          <Field label="Подрядчик">
            {(id) => <input id={id} className="input" value={form.vendor} onChange={set('vendor')} />}
          </Field>
        </div>
        <Field label="Статья расходов">
          {(id) => <input id={id} className="input" value={form.title} onChange={set('title')} required autoFocus />}
        </Field>
        <div className="form__row">
          <Field label="План, ₽">
            {(id) => <input id={id} type="number" min="0" step="0.01" className="input" value={form.planned} onChange={set('planned')} />}
          </Field>
          <Field label="Факт, ₽">
            {(id) => <input id={id} type="number" min="0" step="0.01" className="input" value={form.actual} onChange={set('actual')} />}
          </Field>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

function BudgetContent({ event }) {
  const { reload: reloadEvents } = useEvents()
  const items = useApi(`/events/${event.id}/budget`)
  const [editing, setEditing] = useState(null)

  const list = items.data ?? EMPTY
  const totals = useMemo(
    () => list.reduce((acc, i) => ({ planned: acc.planned + i.planned, actual: acc.actual + i.actual }), { planned: 0, actual: 0 }),
    [list],
  )
  const byCategory = useMemo(() => {
    const map = new Map()
    for (const item of list) {
      const entry = map.get(item.category) ?? { category: item.category, planned: 0, actual: 0 }
      entry.planned += item.planned
      entry.actual += item.actual
      map.set(item.category, entry)
    }
    return [...map.values()].sort((a, b) => b.planned - a.planned)
  }, [list])

  if (items.loading && !items.data) return <Spinner />
  if (items.error) return <ErrorState error={items.error} onRetry={items.reload} />

  const limit = event.budget_limit
  const remaining = limit - totals.actual
  const maxCategory = Math.max(1, ...byCategory.map((c) => Math.max(c.planned, c.actual)))

  const remove = async (item) => {
    if (!window.confirm(`Удалить статью «${item.title}»?`)) return
    try {
      await api(`/budget/${item.id}`, { method: 'DELETE' })
      items.setData((prev) => prev.filter((i) => i.id !== item.id))
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Бюджет"
        subtitle={event.title}
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
            <Plus size={18} />
            Добавить расход
          </button>
        }
      />

      <section className="stats stats--4">
        <div className="card stat-card">
          <span className="stat-card__title">Лимит бюджета</span>
          <strong className="stat-card__value">{formatMoney(limit)}</strong>
          <span className="stat-card__caption">меняется в настройках</span>
        </div>
        <div className="card stat-card">
          <span className="stat-card__title">Запланировано</span>
          <strong className="stat-card__value">{formatMoney(totals.planned)}</strong>
          <span className={`stat-card__caption${limit && totals.planned > limit ? ' text-danger' : ''}`}>
            {limit ? `${Math.round((totals.planned / limit) * 100)}% лимита` : '—'}
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-card__title">Потрачено</span>
          <strong className="stat-card__value">{formatMoney(totals.actual)}</strong>
          <div className="stat-card__progress">
            <ProgressBar value={limit ? (totals.actual / limit) * 100 : 0} tone={totals.actual > limit ? 'danger' : 'primary'} />
            <span>{limit ? Math.round((totals.actual / limit) * 100) : 0}%</span>
          </div>
        </div>
        <div className="card stat-card">
          <span className="stat-card__title">Остаток</span>
          <strong className={`stat-card__value${remaining < 0 ? ' text-danger' : ''}`}>{formatMoney(remaining)}</strong>
          <span className="stat-card__caption">{remaining < 0 ? 'перерасход' : 'доступно к тратам'}</span>
        </div>
      </section>

      {list.length === 0 ? (
        <div className="card">
          <EmptyState icon={Wallet} title="Расходов пока нет" text="Добавьте статьи расходов, чтобы контролировать бюджет." />
        </div>
      ) : (
        <div className="budget-layout">
          <div className="card">
            <div className="card__header">
              <h2>Статьи расходов</h2>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Статья</th>
                    <th>Категория</th>
                    <th className="num">План</th>
                    <th className="num">Факт</th>
                    <th className="num">Отклонение</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => {
                    const diff = item.planned - item.actual
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.title}</strong>
                          {item.vendor && <div className="muted">{item.vendor}</div>}
                        </td>
                        <td>
                          <span className="tag">{item.category}</span>
                        </td>
                        <td className="num">{formatMoney(item.planned)}</td>
                        <td className="num">{formatMoney(item.actual)}</td>
                        <td className={`num ${diff < 0 ? 'text-danger' : 'text-success'}`}>
                          {diff < 0 ? '−' : ''}
                          {formatMoney(Math.abs(diff))}
                        </td>
                        <td className="row-actions">
                          <button type="button" className="icon-btn" onClick={() => setEditing(item)} aria-label="Изменить">
                            <Pencil size={16} />
                          </button>
                          <button type="button" className="icon-btn" onClick={() => remove(item)} aria-label="Удалить">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Итого</td>
                    <td className="num">{formatMoney(totals.planned)}</td>
                    <td className="num">{formatMoney(totals.actual)}</td>
                    <td className="num">{formatMoney(totals.planned - totals.actual)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <h2>По категориям</h2>
            </div>
            <ul className="category-bars">
              {byCategory.map((c) => (
                <li key={c.category}>
                  <div className="category-bars__head">
                    <span>{c.category}</span>
                    <span className="muted">
                      {formatMoney(c.actual)} / {formatMoney(c.planned)}
                    </span>
                  </div>
                  <div className="category-bars__track">
                    <div className="category-bars__planned" style={{ width: `${(c.planned / maxCategory) * 100}%` }} />
                    <div
                      className={`category-bars__actual${c.actual > c.planned ? ' is-over' : ''}`}
                      style={{ width: `${(c.actual / maxCategory) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mini-cal__legend">
              <span><i className="legend-bar legend-bar--planned" /> План</span>
              <span><i className="legend-bar legend-bar--actual" /> Факт</span>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <BudgetForm
          eventId={event.id}
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null)
            items.setData((prev) =>
              prev.some((i) => i.id === saved.id) ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved],
            )
            reloadEvents()
          }}
        />
      )}
    </>
  )
}

export function Budget() {
  return <RequireEvent>{(event) => <BudgetContent event={event} />}</RequireEvent>
}
