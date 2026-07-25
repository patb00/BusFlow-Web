import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

// Languages Photon can localise labels to.
const PHOTON_LANGS = ['de', 'en', 'fr']

function toSuggestion(feature) {
  const p = feature.properties ?? {}
  const street = [p.street, p.housenumber].filter(Boolean).join(' ')
  const cityLine = [p.postcode, p.city].filter(Boolean).join(' ')
  const label = [p.name, street, cityLine, p.country]
    .filter((v, i, arr) => v && arr.indexOf(v) === i)
    .join(', ')
  const [lon, lat] = feature.geometry?.coordinates ?? []
  return {
    id: `${label}@${lat},${lon}`,
    label,
    lat: typeof lat === 'number' ? lat : null,
    lon: typeof lon === 'number' ? lon : null,
  }
}

/**
 * Place autocomplete backed by Photon (photon.komoot.io) — the same OSM-based, keyless
 * search-as-you-type service the BusFlow app uses. Free-typed text stays usable; only a
 * picked suggestion carries coordinates.
 *
 * onChange(label, coord) — coord is { lat, lon } for a picked place, null otherwise.
 */
export default function PlaceField({ id, label, placeholder, value, onChange }) {
  const { i18n } = useTranslation()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const skipNextFetch = useRef(false)
  const focused = useRef(false)

  // Debounced lookup while typing (min 3 chars). Picking a suggestion also changes the
  // value, so skipNextFetch keeps that from re-opening the list.
  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false
      return undefined
    }
    const q = (value || '').trim()
    const ctl = new AbortController()
    const timer = window.setTimeout(async () => {
      if (q.length < 3) {
        setItems([])
        setOpen(false)
        return
      }
      try {
        const lang = i18n.resolvedLanguage || ''
        const langParam = PHOTON_LANGS.includes(lang) ? `&lang=${lang}` : ''
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lat=47.5&lon=14.5${langParam}`,
          { signal: ctl.signal },
        )
        if (!res.ok) return
        const json = await res.json()
        const seen = new Set()
        const next = []
        for (const f of json.features ?? []) {
          const s = toSuggestion(f)
          if (s.label && !seen.has(s.label)) {
            seen.add(s.label)
            next.push(s)
          }
        }
        setItems(next)
        setOpen(next.length > 0 && focused.current)
        setActive(-1)
      } catch {
        // Aborted or offline — the field keeps working as a plain text input.
      }
    }, 250)
    return () => {
      window.clearTimeout(timer)
      ctl.abort()
    }
  }, [value, i18n.resolvedLanguage])

  function select(s) {
    skipNextFetch.current = true
    onChange(s.label, s.lat != null && s.lon != null ? { lat: s.lat, lon: s.lon } : null)
    setOpen(false)
    setItems([])
  }

  return (
    <div className="place">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        type="text"
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value, null)}
        onFocus={() => {
          focused.current = true
          if (items.length > 0) setOpen(true)
        }}
        onBlur={() => {
          focused.current = false
          setOpen(false)
        }}
        onKeyDown={(e) => {
          if (!open || items.length === 0) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((i) => (i + 1) % items.length)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => (i <= 0 ? items.length - 1 : i - 1))
          } else if (e.key === 'Enter' && active >= 0) {
            e.preventDefault()
            select(items[active])
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
      />
      {open && (
        <ul className="place__menu">
          {items.map((s, i) => (
            <li key={s.id}>
              {/* onMouseDown, not onClick: selection has to win over the input's blur. */}
              <button
                type="button"
                className={`place__item${i === active ? ' is-active' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  select(s)
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
