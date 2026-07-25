import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calculateItinerary } from './quote'

function isoInDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// A place is { label, lat, lon }. lat/lon are filled in when the visitor picks a suggestion
// from autocomplete; free-typed text keeps them null and falls back to the built-in table.
const place = (label, lat, lon) => ({ label, lat, lon })

const DEFAULTS = {
  stops: [place('Zagreb', 45.81, 15.98), place('Maribor', 46.55, 15.65), place('Wien', 48.21, 16.37)],
  excursions: [place('Schönbrunn', 48.18, 16.31)],
  pax: 45,
  nights: 2,
  roundTrip: true,
}

// Shared trip state: the map follows every edit, the price only appears when asked for.
export function useItinerary(initial = {}) {
  const start = { ...DEFAULTS, ...initial }
  const [stops, setStops] = useState(start.stops)
  const [excursions, setExcursions] = useState(start.excursions)
  const [pax, setPax] = useState(start.pax)
  const [nights, setNights] = useState(start.nights)
  const [roundTrip, setRoundTrip] = useState(start.roundTrip)
  const [date, setDate] = useState(isoInDays(21))
  const [time, setTime] = useState('07:00')
  const [result, setResult] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const signature = JSON.stringify({ stops, excursions, pax, roundTrip, nights })

  const preview = useMemo(
    () => calculateItinerary({ stops, excursions, pax, roundTrip, nights }),
    [stops, excursions, pax, roundTrip, nights],
  )

  // Editing the trip invalidates the price calculated for the old one.
  const quote = result && result.signature === signature ? result.data : null

  const calculate = useCallback(
    (onDone) => {
      setCalculating(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        setResult({ signature, data: preview })
        setCalculating(false)
        onDone?.(preview)
      }, 520)
    },
    [preview, signature],
  )

  const setStop = (i, label, coord) =>
    setStops((s) => s.map((v, idx) => (idx === i ? place(label, coord?.lat, coord?.lon) : v)))
  const addStop = () => setStops((s) => [...s.slice(0, -1), place(''), s[s.length - 1]])
  const removeStop = (i) => setStops((s) => s.filter((_, idx) => idx !== i))

  const setExcursion = (i, label, coord) =>
    setExcursions((e) => e.map((v, idx) => (idx === i ? place(label, coord?.lat, coord?.lon) : v)))
  const addExcursion = () => setExcursions((e) => [...e, place('')])
  const removeExcursion = (i) => setExcursions((e) => e.filter((_, idx) => idx !== i))

  return {
    stops, setStop, addStop, removeStop,
    excursions, setExcursion, addExcursion, removeExcursion,
    pax, setPax,
    nights, setNights,
    roundTrip, setRoundTrip,
    date, setDate,
    time, setTime,
    preview,
    quote,
    calculating,
    calculate,
    reset: () => {
      setStops(DEFAULTS.stops)
      setExcursions(DEFAULTS.excursions)
      setPax(DEFAULTS.pax)
      setNights(DEFAULTS.nights)
      setRoundTrip(DEFAULTS.roundTrip)
      setResult(null)
    },
  }
}
