import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Reveal from '../components/Reveal'
import RouteMap from '../components/RouteMap'
import RoutePlanner from '../components/RoutePlanner'
import { TripSummary, QuoteCard } from '../components/Itinerary'
import AdminMock from '../components/AdminMock'
import Seo from '../components/Seo'
import StructuredData from '../components/StructuredData'
import { SITE_NAME, SITE_TAGLINE, absoluteUrl } from '../lib/site'
import { useItinerary } from '../lib/useItinerary'
import { VISIBLE_FACTS } from '../lib/facts'

const RULES = ['stops', 'excursions', 'rest']
const STEPS = ['s1', 's2', 's3', 's4']
const COVERAGE = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']

// On wide screens the planner floats over the left of the map, so the route has to be
// fitted into the free space beside it.
function useWideLayout() {
  const query = '(min-width: 900px)'
  const [wide, setWide] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e) => setWide(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return wide
}

export default function Home() {
  const { t, i18n } = useTranslation()
  const lng = i18n.language?.slice(0, 2) || 'de'
  const trip = useItinerary()
  const wide = useWideLayout()
  const mapPadding = useMemo(
    () => (wide ? { top: 110, bottom: 110, left: 540, right: 120 } : 50),
    [wide],
  )

  const excursionPoints = useMemo(() => trip.preview.excursions.map((e) => e.to), [trip.preview])

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: absoluteUrl('/'),
    description: t('seo.home.description'),
    inLanguage: ['hr', 'en', 'de'],
    author: { '@type': 'Organization', name: SITE_TAGLINE, url: 'https://flow-solutions.hr' },
  }

  return (
    <main>
      <Seo title={t('seo.home.title')} description={t('seo.home.description')} />
      <StructuredData data={productSchema} />

      <section className="stage">
        <div className="stage__map">
          <RouteMap
            points={trip.preview.places}
            excursions={excursionPoints}
            padding={mapPadding}
          />
          <div className="stage__veil" />
        </div>

        <div className="wrap stage__inner">
          <div>
            <div className="stage__copy">
              <p className="eyebrow">{t('hero.eyebrow')}</p>
              <h1 className="h1">{t('hero.title')}</h1>
              <p className="lead">{t('hero.sub')}</p>
            </div>
            <RoutePlanner trip={trip} />
            <div style={{ marginTop: '1rem' }}>
              <TripSummary trip={trip} dense withSchedule />
            </div>
            {trip.quote && (
              <div style={{ marginTop: '1rem' }}>
                <QuoteCard quote={trip.quote} lng={lng} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Usage figures */}
      <section className="section" id="numbers">
        <div className="wrap">
          <Reveal className="head is-center" style={{ marginBottom: '3rem' }}>
            <p className="eyebrow">{t('facts.eyebrow')}</p>
            <h2 className="h2">{t('facts.title')}</h2>
            <p className="lead">{t('facts.sub')}</p>
          </Reveal>
          <div className="figures is-large">
            {VISIBLE_FACTS.map(([key, value], i) => (
              <Reveal key={key} delay={i * 80}>
                <div className="figure__num num">
                  {typeof value === 'number' ? value.toLocaleString(lng === 'en' ? 'en-GB' : lng) : value}
                </div>
                {/* count drives the plural form — "1 prijevoznik" vs "3 prijevoznika". */}
                <p className="figure__label">
                  {t(`facts.${key}`, typeof value === 'number' ? { count: value } : undefined)}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* What the route model covers */}
      <section className="section is-paper" id="route">
        <div className="wrap">
          <Reveal className="head">
            <p className="eyebrow">{t('route.eyebrow')}</p>
            <h2 className="h2">{t('route.title')}</h2>
            <p className="lead">{t('route.sub')}</p>
          </Reveal>
          <div className="rules">
            {RULES.map((key, i) => (
              <Reveal className="rule" key={key} delay={i * 80}>
                <span className="rule__index num">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h3">{t(`route.${key}.title`)}</h3>
                <p className="p">{t(`route.${key}.desc`)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" id="how">
        <div className="wrap">
          <Reveal className="head">
            <p className="eyebrow">{t('how.eyebrow')}</p>
            <h2 className="h2">{t('how.title')}</h2>
          </Reveal>
          <div className="deflist">
            {STEPS.map((key, i) => (
              <Reveal className="deflist__row" key={key} delay={i * 60}>
                <div className="deflist__term">
                  <span className="num" style={{ color: 'var(--ink-30)', marginRight: '0.75rem' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {t(`how.${key}.title`)}
                </div>
                <p className="p">{t(`how.${key}.desc`)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Admin */}
      <section className="section is-sand" id="system">
        <div className="wrap">
          <Reveal className="head">
            <p className="eyebrow">{t('system.eyebrow')}</p>
            <h2 className="h2">{t('system.title')}</h2>
            <p className="lead">{t('system.sub')}</p>
          </Reveal>
          <Reveal delay={60}>
            <AdminMock />
          </Reveal>

          <Reveal delay={100}>
            <div className="deflist" style={{ marginTop: '3.5rem' }}>
              {COVERAGE.map((key) => (
                <div className="deflist__row" key={key}>
                  <div className="deflist__term">{t(`system.${key}.title`)}</div>
                  <p className="p">{t(`system.${key}.desc`)}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="section is-paper" id="contact">
        <div className="wrap is-narrow" style={{ textAlign: 'center' }}>
          <Reveal>
            <h2 className="h2">{t('closing.title')}</h2>
            <p className="lead">{t('closing.sub')}</p>
            <div className="row" style={{ justifyContent: 'center', marginTop: '2rem' }}>
              <Link className="btn is-lg" to="/kontakt">
                {t('closing.primary')}
              </Link>
              <Link className="btn is-secondary is-lg" to="/demo">
                {t('closing.secondary')}
              </Link>
            </div>
            <p className="tiny" style={{ marginTop: '1.5rem' }}>{t('closing.note')}</p>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
