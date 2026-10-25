import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthGrid, MONTHS, todayISO, WEEKDAYS } from '../lib/format.js'

export function MonthNav({ year, month, onChange }) {
  const shift = (delta) => {
    const date = new Date(year, month + delta, 1)
    onChange(date.getFullYear(), date.getMonth())
  }
  return (
    <div className="month-nav">
      <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Предыдущий месяц">
        <ChevronLeft size={18} />
      </button>
      <span className="month-nav__title">
        {MONTHS[month]} {year}
      </span>
      <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Следующий месяц">
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

/**
 * Компактный календарь для главной.
 * marks: { 'YYYY-MM-DD': 'task' | 'overdue' }, range: [start, end] — дни мероприятия.
 */
export function MiniCalendar({ year, month, onChange, marks = {}, range }) {
  const today = todayISO()
  return (
    <div className="mini-cal">
      <MonthNav year={year} month={month} onChange={onChange} />
      <div className="mini-cal__grid">
        {WEEKDAYS.map((d) => (
          <span key={d} className="mini-cal__weekday">
            {d}
          </span>
        ))}
        {monthGrid(year, month).map(({ iso, day, inMonth }) => {
          const inEvent = range && iso >= range[0] && iso <= range[1]
          const classes = ['mini-cal__day']
          if (!inMonth) classes.push('is-muted')
          if (iso === today) classes.push('is-today')
          if (inEvent) classes.push('is-event')
          return (
            <span key={iso} className={classes.join(' ')} title={inEvent ? 'Дни мероприятия' : undefined}>
              {day}
              {marks[iso] && <i className={`mini-cal__dot mini-cal__dot--${marks[iso]}`} />}
            </span>
          )
        })}
      </div>
      <div className="mini-cal__legend">
        <span><i className="mini-cal__dot mini-cal__dot--task" /> Задачи</span>
        <span><i className="mini-cal__dot mini-cal__dot--overdue" /> Просрочено</span>
        <span><i className="legend-event" /> Мероприятие</span>
      </div>
    </div>
  )
}
