// Demo itinerary + pricing engine. Everything runs in the browser: no backend, no API keys.
// The rates are plausible market numbers, not a real tariff.
//
// Places normally arrive from Photon autocomplete (see PlaceField) with real coordinates.
// This short table is only a safety net: it seeds the default trip without a network call
// and still resolves a city the visitor typed without picking a suggestion.
const CITIES = [
  { label: 'Offenbach am Main', lat: 50.1, lon: 8.77, alt: ['offenbach'] },
  { label: 'Frankfurt am Main', lat: 50.11, lon: 8.68, alt: ['frankfurt'] },
  { label: 'München', lat: 48.14, lon: 11.58, alt: ['munchen', 'munich', 'minhen'] },
  { label: 'Berlin', lat: 52.52, lon: 13.4 },
  { label: 'Hamburg', lat: 53.55, lon: 9.99 },
  { label: 'Köln', lat: 50.94, lon: 6.96, alt: ['koln', 'cologne'] },
  { label: 'Stuttgart', lat: 48.78, lon: 9.18 },
  { label: 'Düsseldorf', lat: 51.23, lon: 6.78, alt: ['dusseldorf'] },
  { label: 'Nürnberg', lat: 49.45, lon: 11.08, alt: ['nurnberg', 'nuremberg'] },
  { label: 'Wien', lat: 48.21, lon: 16.37, alt: ['vienna', 'bec'] },
  { label: 'Schönbrunn', lat: 48.18, lon: 16.31, alt: ['schonbrunn'] },
  { label: 'Graz', lat: 47.07, lon: 15.44 },
  { label: 'Salzburg', lat: 47.81, lon: 13.04 },
  { label: 'Zagreb', lat: 45.81, lon: 15.98 },
  { label: 'Split', lat: 43.51, lon: 16.44 },
  { label: 'Rijeka', lat: 45.33, lon: 14.44 },
  { label: 'Zadar', lat: 44.12, lon: 15.23 },
  { label: 'Osijek', lat: 45.55, lon: 18.69 },
  { label: 'Dubrovnik', lat: 42.65, lon: 18.09 },
  { label: 'Pula', lat: 44.87, lon: 13.85 },
  { label: 'Plitvice', lat: 44.88, lon: 15.61, alt: ['plitvicka', 'plitvicejezera'] },
  { label: 'Varaždin', lat: 46.31, lon: 16.34, alt: ['varazdin'] },
  { label: 'Maribor', lat: 46.55, lon: 15.65 },
  { label: 'Ljubljana', lat: 46.06, lon: 14.51 },
  { label: 'Bled', lat: 46.37, lon: 14.11 },
  { label: 'Budapest', lat: 47.5, lon: 19.04, alt: ['budimpesta'] },
  { label: 'Praha', lat: 50.08, lon: 14.44, alt: ['prague', 'prag'] },
  { label: 'Bratislava', lat: 48.15, lon: 17.11 },
  { label: 'Milano', lat: 45.46, lon: 9.19, alt: ['milan', 'mailand'] },
  { label: 'Venezia', lat: 45.44, lon: 12.32, alt: ['venecija', 'venice', 'venedig'] },
  { label: 'Verona', lat: 45.44, lon: 10.99 },
  { label: 'Roma', lat: 41.9, lon: 12.5, alt: ['rim', 'rome', 'rom'] },
  { label: 'Zürich', lat: 47.38, lon: 8.54, alt: ['zurich'] },
  { label: 'Paris', lat: 48.86, lon: 2.35, alt: ['pariz'] },
  { label: 'Amsterdam', lat: 52.37, lon: 4.9 },
  { label: 'Bruxelles', lat: 50.85, lon: 4.35, alt: ['brussels', 'brussel', 'bruessel'] },
  { label: 'Barcelona', lat: 41.39, lon: 2.17 },
  { label: 'Beograd', lat: 44.79, lon: 20.45, alt: ['belgrade', 'belgrad'] },
  { label: 'Sarajevo', lat: 43.86, lon: 18.41 },
]

// Coach classes the demo can quote. `rate` is €/km, `daily` the driver day rate.
export const BUS_CLASSES = [
  { key: 'minibus', seats: 19, rate: 1.35, daily: 210 },
  { key: 'midi', seats: 35, rate: 1.65, daily: 235 },
  { key: 'standard', seats: 57, rate: 1.95, daily: 255 },
  { key: 'double', seats: 83, rate: 2.45, daily: 285 },
]

const BASE_FEE = 90
const ROAD_FACTOR = 1.25 // straight line -> road distance
const AVG_SPEED = 70 // km/h including breaks
const TOLL_PER_KM = 0.12
const MAX_DRIVING_PER_DRIVER = 9 // EU regulation 561/2006 daily driving limit

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')
}

export function findCity(input) {
  const q = normalize(input)
  if (!q) return null
  return (
    CITIES.find((c) => normalize(c.label) === q || (c.alt || []).includes(q)) ||
    CITIES.find((c) => normalize(c.label).startsWith(q) || (c.alt || []).some((a) => a.startsWith(q))) ||
    CITIES.find((c) => normalize(c.label).includes(q)) ||
    null
  )
}

/** Accepts a plain string or a `{ label, lat, lon }` place picked from autocomplete. */
export function resolvePlace(input) {
  const place = typeof input === 'string' ? { label: input } : input || {}
  const label = String(place.label || '').trim()
  if (Number.isFinite(place.lat) && Number.isFinite(place.lon)) {
    return { label, lat: place.lat, lon: place.lon, resolved: true }
  }
  const city = findCity(label)
  if (city) return { label: label || city.label, lat: city.lat, lon: city.lon, resolved: true }
  return label ? { label, resolved: false } : null
}

function haversine(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Unknown place names still get a stable, believable distance so a typo never dead-ends
// the demo.
function fallbackDistance(a, b) {
  const seed = normalize((a?.label || '') + (b?.label || ''))
  let h = 0
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 100000
  return 120 + (h % 480)
}

function legDistance(a, b) {
  if (a?.resolved && b?.resolved) return Math.round(haversine(a, b) * ROAD_FACTOR)
  return fallbackDistance(a, b)
}

export function pickClasses(pax) {
  const fitting = BUS_CLASSES.filter((c) => c.seats >= pax)
  return fitting.length ? fitting.slice(0, 3) : [BUS_CLASSES[BUS_CLASSES.length - 1]]
}

/**
 * @param stops       ordered place names: [departure, ...intermediate, destination]
 * @param excursions  day trips from the destination while the group is there
 */
export function calculateItinerary({ stops = [], excursions = [], pax = 30, roundTrip = true, nights = 0 }) {
  const passengers = Math.max(1, Math.min(160, Number(pax) || 1))
  const places = stops.map(resolvePlace).filter(Boolean)
  const trips = excursions.map(resolvePlace).filter(Boolean)

  const legs = []
  for (let i = 1; i < places.length; i += 1) {
    legs.push({ from: places[i - 1], to: places[i], km: legDistance(places[i - 1], places[i]) })
  }
  const mainKm = legs.reduce((sum, l) => sum + l.km, 0)
  const hub = places[places.length - 1]
  const excursionLegs = trips.map((p) => ({ to: p, km: legDistance(hub, p) * 2 }))
  const excursionKm = excursionLegs.reduce((sum, l) => sum + l.km, 0)

  const totalKm = Math.max(40, (roundTrip ? mainKm * 2 : mainKm) + excursionKm)
  const drivingHours = totalKm / AVG_SPEED
  const drivers = drivingHours > MAX_DRIVING_PER_DRIVER ? 2 : 1
  const travelDays = Math.max(1, Math.ceil(drivingHours / (drivers * MAX_DRIVING_PER_DRIVER)))
  const days = travelDays + Math.max(0, Number(nights) || 0)

  const options = pickClasses(passengers).map((cls) => {
    const kmCost = totalKm * cls.rate
    const driverCost = drivers * days * cls.daily
    const tolls = totalKm * TOLL_PER_KM
    const total = Math.round((BASE_FEE + kmCost + driverCost + tolls) / 5) * 5
    return {
      ...cls,
      kmCost: Math.round(kmCost),
      driverCost: Math.round(driverCost),
      tolls: Math.round(tolls),
      base: BASE_FEE,
      total,
      perPerson: Math.round(total / passengers),
    }
  })

  return {
    places,
    legs,
    excursions: excursionLegs,
    from: places[0]?.label || '',
    to: hub?.label || '',
    unresolved: places.some((p) => !p.resolved) || trips.some((p) => !p.resolved),
    passengers,
    roundTrip,
    mainKm,
    excursionKm,
    totalKm,
    drivingHours: Math.round(drivingHours * 10) / 10,
    drivers,
    days,
    nights: Math.max(0, Number(nights) || 0),
    options,
    best: options[0],
  }
}

const DWELL_MINUTES = 15 // boarding time at an intermediate stop
const DRIVE_BEFORE_BREAK = 270 // EU 561/2006: 4.5 h of driving
const BREAK_MINUTES = 45

/**
 * Arrival and departure estimate for every point of the route, in minutes from the departure
 * time. Driving time comes from the leg distance; the mandatory 45-minute break after 4.5 h of
 * driving is added where it falls, and every intermediate stop holds the bus for boarding.
 */
export function buildSchedule(legs) {
  const points = []
  let clock = 0
  let sinceBreak = 0

  legs.forEach((leg, i) => {
    if (i === 0) points.push({ place: leg.from, arrival: null, departure: 0 })

    let remaining = (leg.km / AVG_SPEED) * 60
    while (sinceBreak + remaining > DRIVE_BEFORE_BREAK) {
      const untilBreak = DRIVE_BEFORE_BREAK - sinceBreak
      clock += untilBreak + BREAK_MINUTES
      remaining -= untilBreak
      sinceBreak = 0
    }
    clock += remaining
    sinceBreak += remaining

    const isLast = i === legs.length - 1
    points.push({
      place: leg.to,
      arrival: Math.round(clock),
      departure: isLast ? null : Math.round(clock + DWELL_MINUTES),
    })
    if (!isLast) clock += DWELL_MINUTES
  })

  return points
}

/** "07:30" + 195 min -> { time: '10:45', dayOffset: 0 } */
export function addMinutes(startTime, minutes) {
  const [h, m] = String(startTime || '07:00')
    .split(':')
    .map((v) => Number(v) || 0)
  const total = h * 60 + m + minutes
  const dayOffset = Math.floor(total / 1440)
  const rest = ((total % 1440) + 1440) % 1440
  const hh = String(Math.floor(rest / 60)).padStart(2, '0')
  const mm = String(Math.round(rest % 60)).padStart(2, '0')
  return { time: `${hh}:${mm}`, dayOffset }
}

export function formatEur(value, lng = 'de') {
  const locale = lng === 'de' ? 'de-DE' : lng === 'en' ? 'en-IE' : 'hr-HR'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatHours(value) {
  const h = Math.floor(value)
  const m = Math.round((value - h) * 60)
  return m ? `${h} h ${m} min` : `${h} h`
}
