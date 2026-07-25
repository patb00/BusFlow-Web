import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Reveal from '../components/Reveal'
import Seo from '../components/Seo'

const BASE = import.meta.env.BASE_URL
const asset = (file) => `${BASE}clients/${file}`

const FACT_ROWS = ['sector', 'place', 'since', 'scope', 'languages', 'role']
const CHALLENGE = ['c1', 'c2', 'c3']
const SOLUTION = ['s1', 's2', 's3', 's7', 's4', 's5', 's6']
const STACK = ['frontend', 'backend', 'auth', 'map', 'payments', 'hosting']


export default function CaseMikanovic() {
  const { t } = useTranslation()
  const videoRef = useRef(null)

  // Safari and Chrome both accept a muted autoplay, but a tab restored from bfcache can come
  // back paused — asking once on mount covers that.
  useEffect(() => {
    videoRef.current?.play().catch(() => {})
  }, [])

  return (
    <main>
      <Seo title={t('seo.caseMikanovic.title')} description={t('seo.caseMikanovic.description')} />

      {/* Header */}
      <section className="section is-tight">
        <div className="wrap">
          <Reveal>
            <Link className="backlink" to="/klijenti">
              ← {t('case.back')}
            </Link>
            <div className="case__head">
              <div>
                <p className="eyebrow">{t('case.eyebrow')}</p>
                <h1 className="h1">{t('case.mikanovic.title')}</h1>
                <p className="lead">{t('case.mikanovic.lead')}</p>
              </div>
              <img
                className="case__logo"
                src={asset('mikanovic-logo.png')}
                alt={t('clients.mikanovic.name')}
              />
            </div>
          </Reveal>

          <Reveal delay={80}>
            <dl className="case__facts">
              {FACT_ROWS.map((key) => (
                <div key={key}>
                  <dt>{t(`case.facts.${key}.label`)}</dt>
                  <dd>{t(`case.facts.${key}.value`)}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Opening shot */}
      <section className="section is-tight" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <figure className="case__hero">
              {/* muted + playsInline are what let a browser start it without a click. */}
              <video
                ref={videoRef}
                src={asset('mikanovic-tour.webm')}
                poster={asset('mikanovic-home.jpg')}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              />
              <figcaption>{t('case.gallery.home')}</figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* Challenge */}
      <section className="section is-paper">
        <div className="wrap">
          <Reveal className="head">
            <p className="eyebrow">{t('case.challenge.eyebrow')}</p>
            <h2 className="h2">{t('case.challenge.title')}</h2>
            <p className="lead">{t('case.challenge.sub')}</p>
          </Reveal>
          <div className="rules">
            {CHALLENGE.map((key, i) => (
              <Reveal className="rule" key={key} delay={i * 80}>
                <span className="rule__index num">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h3">{t(`case.challenge.${key}.title`)}</h3>
                <p className="p">{t(`case.challenge.${key}.desc`)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="section">
        <div className="wrap">
          <Reveal className="head">
            <p className="eyebrow">{t('case.solution.eyebrow')}</p>
            <h2 className="h2">{t('case.solution.title')}</h2>
            <p className="lead">{t('case.solution.sub')}</p>
          </Reveal>
          <div className="deflist">
            {SOLUTION.map((key, i) => (
              <Reveal className="deflist__row" key={key} delay={i * 50}>
                <div className="deflist__term">{t(`case.solution.${key}.title`)}</div>
                <p className="p">{t(`case.solution.${key}.desc`)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="section is-ink">
        <div className="wrap">
          <Reveal className="head">
            <p className="eyebrow">{t('case.stack.eyebrow')}</p>
            <h2 className="h2">{t('case.stack.title')}</h2>
            <p className="lead">{t('case.stack.sub')}</p>
          </Reveal>
          <Reveal delay={60}>
            <dl className="stacklist">
              {STACK.map((key) => (
                <div key={key}>
                  <dt>{t(`case.stack.${key}.label`)}</dt>
                  <dd>{t(`case.stack.${key}.value`)}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Closing */}
      <section className="section is-paper">
        <div className="wrap is-narrow" style={{ textAlign: 'center' }}>
          <Reveal>
            <h2 className="h2">{t('case.closing.title')}</h2>
            <p className="lead">{t('case.closing.sub')}</p>
            <div className="row" style={{ justifyContent: 'center', marginTop: '2rem' }}>
              <Link className="btn is-lg" to="/kontakt">
                {t('case.closing.primary')}
              </Link>
              <Link className="btn is-secondary is-lg" to="/demo">
                {t('case.closing.secondary')}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
