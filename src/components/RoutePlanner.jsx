import { useTranslation } from 'react-i18next'
import PlaceField from './PlaceField'

function Leg({ mark, dashed = false, children, onRemove, removeLabel }) {
  return (
    <div className="leg">
      <span className={`leg__markcol${dashed ? ' is-dashed' : ''}`}>
        <span className="leg__mark">{mark}</span>
      </span>
      <div className="leg__field">{children}</div>
      {onRemove ? (
        <button type="button" className="leg__remove" onClick={onRemove} aria-label={removeLabel}>
          ×
        </button>
      ) : (
        <span />
      )}
    </div>
  )
}

export default function RoutePlanner({ trip, onCalculated, compact = false }) {
  const { t } = useTranslation()
  const last = trip.stops.length - 1

  function submit(e) {
    e.preventDefault()
    trip.calculate(onCalculated)
  }

  return (
    <form className="panel" onSubmit={submit}>
      <div className="panel__head">
        <h2 className="panel__title">{t('planner.title')}</h2>
        <span className="panel__hint">{t('planner.badge')}</span>
      </div>

      <div className="legs">
        {trip.stops.map((stop, i) => {
          const isFirst = i === 0
          const isLast = i === last
          return (
            <Leg
              key={i}
              mark={isFirst ? 'A' : isLast ? 'B' : i}
              onRemove={!isFirst && !isLast ? () => trip.removeStop(i) : null}
              removeLabel={t('planner.removeStop')}
            >
              <PlaceField
                id={`bf-stop-${i}`}
                label={isFirst ? t('planner.from') : isLast ? t('planner.to') : t('planner.via')}
                placeholder={isFirst ? t('planner.fromPlaceholder') : t('planner.toPlaceholder')}
                value={stop.label}
                onChange={(label, coord) => trip.setStop(i, label, coord)}
              />
            </Leg>
          )
        })}
        <button type="button" className="leg__add" onClick={trip.addStop}>
          + {t('planner.addStop')}
        </button>
      </div>

      <div className="panel__split is-four">
        <div className="field">
          <label htmlFor="bf-date">{t('planner.date')}</label>
          <input id="bf-date" type="date" value={trip.date} onChange={(e) => trip.setDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="bf-time">{t('planner.time')}</label>
          <input id="bf-time" type="time" value={trip.time} onChange={(e) => trip.setTime(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="bf-nights">{t('planner.nights')}</label>
          <input
            id="bf-nights"
            type="number"
            min="0"
            max="21"
            value={trip.nights}
            onChange={(e) => trip.setNights(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor="bf-pax">{t('planner.pax')}</label>
          <input
            id="bf-pax"
            type="number"
            min="1"
            max="160"
            value={trip.pax}
            onChange={(e) => trip.setPax(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="excursions">
        <div className="excursions__head">
          <span className="excursions__title">{t('planner.excursions')}</span>
          <span className="excursions__note">{t('planner.excursionsNote')}</span>
        </div>
        <div className="legs is-excursions">
          {trip.excursions.map((exc, i) => (
            <Leg
              key={i}
              mark="•"
              dashed
              onRemove={() => trip.removeExcursion(i)}
              removeLabel={t('planner.removeExcursion')}
            >
              <PlaceField
                id={`bf-exc-${i}`}
                label={t('planner.excursion')}
                placeholder={t('planner.excursionPlaceholder')}
                value={exc.label}
                onChange={(label, coord) => trip.setExcursion(i, label, coord)}
              />
            </Leg>
          ))}
          <button type="button" className="leg__add" onClick={trip.addExcursion}>
            + {t('planner.addExcursion')}
          </button>
        </div>
      </div>

      <div className="panel__foot">
        <label className="switch">
          <input type="checkbox" checked={trip.roundTrip} onChange={(e) => trip.setRoundTrip(e.target.checked)} />
          <span className="switch__track" />
          {t('planner.roundTrip')}
        </label>
        <button className="btn" type="submit" disabled={trip.calculating}>
          {trip.calculating ? t('planner.calculating') : t('planner.submit')}
        </button>
      </div>

      {!compact && <p className="panel__legal">{t('planner.note')}</p>}
    </form>
  )
}
