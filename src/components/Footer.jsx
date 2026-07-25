import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LANGS, DEFAULT_LANG } from '../i18n'
import Brand from './Brand'

const PAGES = [
  { key: 'home', to: '/' },
  { key: 'clients', to: '/klijenti' },
  { key: 'demo', to: '/demo' },
  { key: 'contact', to: '/kontakt' },
]

const HOME_SECTIONS = ['route', 'how', 'system']

export default function Footer() {
  const { t, i18n } = useTranslation()
  const current = LANGS.find((l) => i18n.language?.startsWith(l.value))?.value || DEFAULT_LANG
  const location = useLocation()
  const navigate = useNavigate()

  function goToSection(id) {
    if (location.pathname !== '/') {
      navigate('/')
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120)
      return
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__grid">
          <div className="footer__col">
            <span className="brand">
              <Brand size={24} />
              BusFlow
            </span>
            <p className="p--sm" style={{ maxWidth: '24rem' }}>
              {t('footer.blurb')}
            </p>
            <span className="tiny">{t('footer.byline')}</span>
          </div>

          <div className="footer__col">
            <div className="footer__title">{t('footer.pages')}</div>
            {PAGES.map(({ key, to }) => (
              <Link key={key} className="footer__link" to={to}>
                {t(`nav.${key}`)}
              </Link>
            ))}
          </div>

          <div className="footer__col">
            <div className="footer__title">{t('footer.product')}</div>
            {HOME_SECTIONS.map((id) => (
              <button key={id} className="footer__link" onClick={() => goToSection(id)}>
                {t(`footer.section.${id}`)}
              </button>
            ))}
          </div>

          <div className="footer__col">
            <div className="footer__title">{t('footer.languages')}</div>
            {LANGS.map((l) => (
              <button
                key={l.value}
                className="footer__link"
                style={{ color: l.value === current ? 'var(--ink)' : undefined }}
                onClick={() => i18n.changeLanguage(l.value)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="footer__bottom">
          <span>{t('footer.copyright')}</span>
          <span>{t('footer.demoNote')}</span>
        </div>
      </div>
    </footer>
  )
}
