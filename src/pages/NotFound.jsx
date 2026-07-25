import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Seo from '../components/Seo'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <main className="section">
      <Seo title={t('notfound.title')} description={t('notfound.sub')} noindex />
      <div className="wrap is-narrow" style={{ textAlign: 'center' }}>
        <p className="eyebrow num">404</p>
        <h1 className="h2">{t('notfound.title')}</h1>
        <p className="lead">{t('notfound.sub')}</p>
        <Link className="btn is-lg" to="/" style={{ marginTop: '2rem' }}>
          {t('notfound.cta')}
        </Link>
      </div>
    </main>
  )
}
