import { ArrowRight, Check, Mail, MapPin, Mountain, Phone } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'

const TEAM = {
  name: 'На пике',
  phone: '+7 (962) 735-47-77',
  phoneHref: 'tel:+79627354777',
  email: 'ndanilov40@gmail.com',
  address: 'Якутск, 3 км, Сергеляхское ш., дом 3',
  year: 2026,
}

const NAV = [
  { label: 'Главная', to: '/' },
  { label: 'О нас', href: '#footer-about' },
  { label: 'Услуги', href: '#' },
  { label: 'Контакты', href: '#footer-contacts' },
]

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.4 4.6 2.9 11.7c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.5c.2.6.4.8.8.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.5c.3-1.3-.5-1.9-1.3-1.5Zm-11.8 10 .3 3.8-1.4-4.4 9.5-6c.5-.3.9-.1.5.2l-8.9 6.4Z" />
    </svg>
  )
}

function VkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.8 17.5C6.9 17.5 3.5 13.5 3.4 6.8h2.9c.1 4.9 2.3 7 4 7.4V6.8H13v4.2c1.7-.2 3.5-2.1 4.1-4.2h2.7c-.5 2.6-2.4 4.5-3.8 5.3 1.4.7 3.6 2.4 4.4 5.4h-3c-.6-2-2.3-3.6-4.4-3.8v3.8h-.2Z" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

const SOCIALS = [
  { label: 'Telegram', href: 'https://t.me/ndanilov08', icon: TelegramIcon },
  { label: 'ВКонтакте', href: 'https://vk.ru/ndanilov40', icon: VkIcon },
  { label: 'GitHub', href: 'https://github.com/Funtik02/EventTech/tree/last', icon: GithubIcon },
]

function SubscribeForm() {
  const id = useId()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    setDone(true)
  }

  if (done) {
    return (
      <p className="footer__subscribed" role="status">
        <Check size={18} />
        Спасибо! Вы подписаны на новости.
      </p>
    )
  }

  return (
    <form className="footer__subscribe" onSubmit={submit}>
      <label htmlFor={id} className="visually-hidden">
        Ваш email
      </label>
      <input
        id={id}
        type="email"
        className="footer__input"
        placeholder="Ваш email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <button type="submit" className="footer__button">
        Подписаться
      </button>
    </form>
  )
}

export function Footer({ className = '' }) {
  return (
    <footer className={`footer ${className}`}>
      <div className="footer__inner">
        <div className="footer__grid">
          <section className="footer__col footer__about" id="footer-about">
            <div className="footer__brand">
              <span className="footer__brand-mark">
                <Mountain size={22} strokeWidth={2.2} />
              </span>
              <span className="footer__brand-name">{TEAM.name}</span>
            </div>
            <p className="footer__text">
              Команда «{TEAM.name}» — создаём цифровые сервисы, которые помогают проводить мероприятия без хаоса и лишней
              рутины.
            </p>
            <ul className="footer__socials">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a href={href} className="footer__social" aria-label={label} title={label}>
                    <Icon />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <nav className="footer__col" aria-label="Навигация в подвале">
            <h2 className="footer__title">Навигация</h2>
            <ul className="footer__links">
              {NAV.map((item) => (
                <li key={item.label}>
                  {item.to ? (
                    <Link to={item.to} className="footer__link">
                      <ArrowRight size={14} />
                      {item.label}
                    </Link>
                  ) : (
                    <a href={item.href} className="footer__link">
                      <ArrowRight size={14} />
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <section className="footer__col" id="footer-contacts">
            <h2 className="footer__title">Контакты</h2>
            <ul className="footer__contacts">
              <li>
                <a href={TEAM.phoneHref} className="footer__contact">
                  <span className="footer__contact-icon">
                    <Phone size={16} />
                  </span>
                  {TEAM.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${TEAM.email}`} className="footer__contact">
                  <span className="footer__contact-icon">
                    <Mail size={16} />
                  </span>
                  {TEAM.email}
                </a>
              </li>
              <li>
                <span className="footer__contact">
                  <span className="footer__contact-icon">
                    <MapPin size={16} />
                  </span>
                  {TEAM.address}
                </span>
              </li>
            </ul>
          </section>

          <section className="footer__col">
            <h2 className="footer__title">Подписка</h2>
            <p className="footer__text">Раз в месяц — новости и обновления сервиса. Без спама.</p>
            <SubscribeForm />
          </section>
        </div>

        <div className="footer__bottom">
          <p>
            © {TEAM.year} {TEAM.name}. Все права защищены.
          </p>
          <ul className="footer__legal">
            <li>
              <a href="#">Политика конфиденциальности</a>
            </li>
            <li>
              <a href="#">Пользовательское соглашение</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
