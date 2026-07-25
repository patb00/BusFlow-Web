import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import RouteMap from '../components/RouteMap'
import RoutePlanner from '../components/RoutePlanner'
import { TripSummary, QuoteCard } from '../components/Itinerary'
import AdminMock from '../components/AdminMock'
import Seo from '../components/Seo'
import { useItinerary } from '../lib/useItinerary'
import { formatEur } from '../lib/quote'

function Flow({ step }) {
  const { t } = useTranslation()
  return (
    <div className="flow">
      {[1, 2, 3].map((n) => (
        <span key={n} className={step === n ? 'is-now' : step > n ? 'is-done' : ''}>
          <span className="num">{String(n).padStart(2, '0')}</span> {t(`demo.steps.s${n}`)}
        </span>
      ))}
    </div>
  )
}

function Booking() {
  const { t, i18n } = useTranslation()
  const lng = i18n.language?.slice(0, 2) || 'de'
  const trip = useItinerary()
  const [step, setStep] = useState(1)
  const quote = trip.quote
  const best = quote?.best
  const excursionPoints = useMemo(() => trip.preview.excursions.map((e) => e.to), [trip.preview])

  // Editing the trip after a price was calculated sends the flow back to step one.
  const currentStep = quote ? step : 1

  return (
    <div className="demo__grid">
      <div className="demo__map">
        <RouteMap points={trip.preview.places} excursions={excursionPoints} height="26rem" />
        <div style={{ marginTop: '1rem' }}>
          <TripSummary trip={trip} dense withSchedule />
        </div>
      </div>

      <div>
        <Flow step={currentStep} />

        {currentStep === 1 && (
          <>
            <RoutePlanner trip={trip} onCalculated={() => setStep(2)} compact />
            {quote && (
              <div style={{ marginTop: '1rem' }}>
                <QuoteCard quote={quote} lng={lng} onBook={() => setStep(2)} />
              </div>
            )}
          </>
        )}

        {currentStep === 2 && quote && (
          <div className="panel">
            <div className="panel__head">
              <h2 className="panel__title">{t('demo.checkout.title')}</h2>
              <span className="panel__hint num">{formatEur(best.total, lng)}</span>
            </div>
            <div className="panel__split" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 0 }}>
              <div className="field">
                <label htmlFor="d-name">{t('demo.checkout.name')}</label>
                <input id="d-name" defaultValue="Ana Horvat" />
              </div>
              <div className="field">
                <label htmlFor="d-mail">{t('demo.checkout.email')}</label>
                <input id="d-mail" defaultValue="ana@primjer.hr" />
              </div>
              <div className="field">
                <label htmlFor="d-phone">{t('demo.checkout.phone')}</label>
                <input id="d-phone" defaultValue="+385 91 234 5678" />
              </div>
              <div className="field">
                <label htmlFor="d-org">{t('demo.checkout.company')}</label>
                <input id="d-org" defaultValue="OŠ Ivana Gundulića" />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="d-card">{t('demo.checkout.card')}</label>
                <input id="d-card" defaultValue="4242 4242 4242 4242" />
              </div>
            </div>
            <p className="panel__legal">{t('demo.checkout.note')}</p>
            <div className="panel__foot">
              <button className="btn is-secondary" onClick={() => setStep(1)}>
                {t('demo.checkout.back')}
              </button>
              <button className="btn" onClick={() => setStep(3)}>
                {t('demo.checkout.pay')}
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && quote && (
          <div className="panel">
            <div className="panel__head">
              <h2 className="panel__title">{t('demo.done.title')}</h2>
              <span className="panel__hint">BF-2419</span>
            </div>
            <p className="p--sm">{t('demo.done.sub')}</p>
            <dl className="quotecard__lines">
              <div>
                <dt>{t('quote.route')}</dt>
                <dd>
                  {quote.places.map((p) => p.label).join(' → ')}
                  {quote.roundTrip ? ` → ${quote.from}` : ''}
                </dd>
              </div>
              {quote.excursions.length > 0 && (
                <div>
                  <dt>{t('planner.excursions')}</dt>
                  <dd>{quote.excursions.map((e) => e.to.label).join(', ')}</dd>
                </div>
              )}
              <div>
                <dt>{t('quote.bus')}</dt>
                <dd>{t(`buses.${best.key}.name`)}</dd>
              </div>
              <div>
                <dt>{t('quote.pax')}</dt>
                <dd className="num">{quote.passengers}</dd>
              </div>
              <div>
                <dt>{t('demo.done.paid')}</dt>
                <dd className="num">{formatEur(best.total, lng)}</dd>
              </div>
            </dl>
            <p className="quotecard__rule">{t('demo.done.note')}</p>
            <div className="panel__foot">
              <span className="tiny">{t('demo.done.again')}</span>
              <button
                className="btn is-secondary"
                onClick={() => {
                  trip.reset()
                  setStep(1)
                }}
              >
                {t('demo.done.restart')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Demo() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('booking')

  return (
    <main>
      <Seo title={t('seo.demo.title')} description={t('seo.demo.description')} />

      <section className="section is-tight">
        <div className="wrap">
          <p className="eyebrow">{t('demo.eyebrow')}</p>
          <h1 className="h1" style={{ maxWidth: '28rem' }}>{t('demo.title')}</h1>
          <p className="lead" style={{ maxWidth: '40rem' }}>{t('demo.sub')}</p>

          <div className="tabs" style={{ marginTop: '2.5rem' }}>
            <button
              className={`tabs__btn${tab === 'booking' ? ' is-active' : ''}`}
              onClick={() => setTab('booking')}
            >
              {t('demo.tabs.booking')}
            </button>
            <button
              className={`tabs__btn${tab === 'admin' ? ' is-active' : ''}`}
              onClick={() => setTab('admin')}
            >
              {t('demo.tabs.admin')}
            </button>
          </div>
        </div>
      </section>

      <section className="section is-tight" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {tab === 'booking' ? (
            <Booking />
          ) : (
            <>
              <div className="head" style={{ marginBottom: '1.5rem' }}>
                <h2 className="h3">{t('demo.adminTitle')}</h2>
                <p className="p" style={{ marginTop: '0.5rem' }}>{t('demo.adminSub')}</p>
              </div>
              <AdminMock />
            </>
          )}
        </div>
      </section>
    </main>
  )
}
