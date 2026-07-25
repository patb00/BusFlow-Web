import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LangToggle from './LangToggle'
import Brand from './Brand'

const PAGES = [
  { key: 'home', to: '/' },
  { key: 'clients', to: '/klijenti' },
  { key: 'demo', to: '/demo' },
  { key: 'contact', to: '/kontakt' },
]

export default function Navbar() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="wrap nav__inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <Brand />
          BusFlow
        </Link>

        <nav className="nav__links">
          {PAGES.map(({ key, to }) => (
            <NavLink
              key={key}
              to={to}
              end={to === '/'}
              className={({ isActive }) => (isActive ? 'is-active' : '')}
              onClick={() => setOpen(false)}
            >
              {t(`nav.${key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="nav__actions">
          <LangToggle />
          <button className="nav__burger" onClick={() => setOpen((o) => !o)}>
            {open ? t('nav.close') : t('nav.menu')}
          </button>
        </div>
      </div>

      {/* Mobile panel lives outside the nav grid so its width is the full bar. */}
      {open && (
        <nav className="nav__panel">
          {PAGES.map(({ key, to }) => (
            <NavLink key={key} to={to} end={to === '/'} onClick={() => setOpen(false)}>
              {t(`nav.${key}`)}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
