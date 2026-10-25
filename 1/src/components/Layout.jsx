import {
  Bell,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Ellipsis,
  House,
  LogOut,
  Menu,
  Settings,
  SquareCheckBig,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import { useEvents } from '../context/EventContext.jsx'
import { Footer } from './Footer.jsx'
import { Logo } from './Logo.jsx'
import { Avatar } from './ui.jsx'

const NAV = [
  { to: '/', label: 'Главная', icon: House, end: true },
  { to: '/events', label: 'Мероприятия', icon: CalendarRange },
  { to: '/tasks', label: 'Задачи', icon: SquareCheckBig },
  { to: '/budget', label: 'Бюджет', icon: Wallet },
  { to: '/guests', label: 'Участники', icon: Users },
  { to: '/team', label: 'Команда', icon: UsersRound },
  { to: '/calendar', label: 'Календарь', icon: CalendarDays },
  { to: '/settings', label: 'Настройки', icon: Settings },
]

const BOTTOM_NAV = [NAV[0], NAV[2], NAV[6]]

function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()

  return (
    <>
      <div className={`sidebar-backdrop${open ? ' is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar${open ? ' is-open' : ''}`}>
        <Link to="/" className="sidebar__logo" onClick={onClose}>
          <Logo size={30} light />
        </Link>
        <nav className="sidebar__nav" aria-label="Основное меню">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="sidebar__link" onClick={onClose}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__user">
          <Link to="/settings" className="sidebar__profile" onClick={onClose}>
            <Avatar name={user?.name} size={36} />
            <span className="sidebar__profile-text">
              <strong>{user?.name}</strong>
              <span>{user?.position}</span>
            </span>
            <ChevronRight size={16} />
          </Link>
          <button type="button" className="sidebar__logout" onClick={logout}>
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </aside>
    </>
  )
}

function EventSwitcher() {
  const { events, current, setCurrentId } = useEvents()
  if (events.length < 2) return null
  return (
    <select
      className="event-switcher"
      value={current?.id ?? ''}
      onChange={(e) => setCurrentId(Number(e.target.value))}
      aria-label="Текущее мероприятие"
    >
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.title}
        </option>
      ))}
    </select>
  )
}

export function Layout() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="app">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="app__main">
        <header className="topbar">
          <button type="button" className="icon-btn topbar__menu" onClick={() => setMenuOpen(true)} aria-label="Открыть меню">
            <Menu size={20} />
          </button>
          <Link to="/" className="topbar__logo">
            <Logo size={26} />
          </Link>
          <EventSwitcher />
          <div className="topbar__right">
            <Link to="/tasks?filter=overdue" className="icon-btn" aria-label="Просроченные задачи">
              <Bell size={20} />
            </Link>
            <Link to="/settings" aria-label="Профиль">
              <Avatar name={user?.name} size={34} />
            </Link>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
        <Footer className="footer--app" />
      </div>

      <nav className="bottom-nav" aria-label="Навигация">
        {BOTTOM_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="bottom-nav__link">
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
        <button type="button" className="bottom-nav__link" onClick={() => setMenuOpen(true)}>
          <Ellipsis size={20} />
          Ещё
        </button>
      </nav>
    </div>
  )
}
