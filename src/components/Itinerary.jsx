import { useTranslation } from 'react-i18next'
import { addMinutes, buildSchedule, formatEur, formatHours } from '../lib/quote'

/**
 * Estimated arrival and departure per point of the route. Times are derived from the leg
 * distances plus boarding time and the mandatory break, so they move with every edit.
 */
export function RouteSchedule({ trip }) {
  const { t } = useTranslation()
  const p = trip.preview
  if (p.legs.length === 0) return null

  const points = buildSchedule(p.legs)

  return (
    <div className="timetable">
      <div className="timetable__title">{t('schedule.title')}</div>
      {points.map((point, i) => {
        const arrival = point.arrival == null ? null : addMinutes(trip.time, point.arrival)
        const departure = point.departure == null ? null : addMinutes(trip.time, point.departure)
        return (
          <div className="timetable__row" key={i}>
            <span className="timetable__mark">
              {i === 0 ? 'A' : i === points.length - 1 ? 'B' : i}
            </span>
            <span className="timetable__place">{point.place.label || '—'}</span>
            <span className="timetable__times num">
              {arrival && (
                <>
                  {t('schedule.arrival')} <b>{arrival.time}</b>
                  {arrival.dayOffset > 0 && <span className="timetable__day"> +{arrival.dayOffset} d</span>}
                </>
              )}
              {arrival && departure && ' · '}
              {departure && (
                <>
                  {t('schedule.departure')} <b>{departure.time}</b>
                  {departure.dayOffset > 0 && (
                    <span className="timetable__day"> +{departure.dayOffset} d</span>
                  )}
                </>
              )}
            </span>
          </div>
        )
      })}
      <p className="timetable__note">{t('schedule.note')}</p>
    </div>
  )
}

// Live route read-out: what the map is showing, in numbers.
export function TripSummary({ trip, dense = false, withSchedule = false }) {
  const { t } = useTranslation()
  const p = trip.preview

  return (
    <div className={`readout${dense ? ' is-dense' : ''}`}>
      <div className="readout__route">
        {p.places.map((place, i) => (
          <span key={i} className="readout__place">
            {i > 0 && <span className="readout__sep">→</span>}
            {place.label || '—'}
          </span>
        ))}
        {p.roundTrip && p.places.length > 1 && (
          <span className="readout__place">
            <span className="readout__sep">→</span>
            {p.places[0].label}
          </span>
        )}
      </div>

      <div className="readout__stats">
        <div>
          <b className="num">{p.totalKm}</b> km
        </div>
        <div>
          <b className="num">{formatHours(p.drivingHours)}</b> {t('quote.driving')}
        </div>
        <div>
          <b className="num">{p.drivers}</b> {p.drivers === 1 ? t('quote.driverOne') : t('quote.driverMany')}
        </div>
        <div>
          <b className="num">{p.days}</b> {p.days === 1 ? t('quote.dayOne') : t('quote.dayMany')}
        </div>
      </div>

      {p.excursions.length > 0 && (
        <p className="readout__note">
          {t('quote.withExcursions', { n: p.excursions.length, km: p.excursionKm })}
        </p>
      )}

      {withSchedule && <RouteSchedule trip={trip} />}
    </div>
  )
}

export function QuoteCard({ quote, lng, onBook, showOptions = true }) {
  const { t } = useTranslation()
  const best = quote.best

  return (
    <div className="quotecard">
      <div className="quotecard__top">
        <div>
          <span className="quotecard__label">{t('quote.fixedPrice')}</span>
          <div className="quotecard__price num">{formatEur(best.total, lng)}</div>
          <div className="quotecard__per num">
            {formatEur(best.perPerson, lng)} {t('quote.perPerson')} · {quote.passengers} {t('quote.pax')}
          </div>
        </div>
        {onBook && (
          <button className="btn" onClick={onBook}>
            {t('quote.book')}
          </button>
        )}
      </div>

      <dl className="quotecard__lines">
        <div>
          <dt>{t('quote.km')}</dt>
          <dd className="num">{formatEur(best.kmCost, lng)}</dd>
        </div>
        <div>
          <dt>{t('quote.driversCost', { n: quote.drivers, d: quote.days })}</dt>
          <dd className="num">{formatEur(best.driverCost, lng)}</dd>
        </div>
        <div>
          <dt>{t('quote.tolls')}</dt>
          <dd className="num">{formatEur(best.tolls, lng)}</dd>
        </div>
        <div>
          <dt>{t('quote.base')}</dt>
          <dd className="num">{formatEur(best.base, lng)}</dd>
        </div>
      </dl>

      {showOptions && quote.options.length > 1 && (
        <div className="quotecard__options">
          <span className="quotecard__label">{t('quote.otherBuses')}</span>
          {quote.options.slice(1).map((opt) => (
            <div className="quotecard__option" key={opt.key}>
              <span>
                {t(`buses.${opt.key}.name`)} · {opt.seats} {t('quote.seats')}
              </span>
              <b className="num">{formatEur(opt.total, lng)}</b>
            </div>
          ))}
        </div>
      )}

      <p className="quotecard__rule">
        {quote.drivers > 1 ? t('quote.twoDrivers') : t('quote.oneDriver')}
      </p>
    </div>
  )
}
