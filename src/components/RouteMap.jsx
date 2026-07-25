import { useEffect, useRef } from 'react'
import { Map as MapLibreMap, Marker, LngLatBounds, AttributionControl, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// Same keyless vector tiles the BusFlow app itself uses.
const STYLE = 'https://tiles.openfreemap.org/styles/positron'
const INK = '#2c2a25'
const EXCURSION = '#8a7f6a'

// A straight segment between two cities reads as a drawing error, so each leg is bent
// slightly to the side — the same visual shorthand printed route maps use.
function curve(a, b, bend = 0.12, steps = 48) {
  const mx = (a[0] + b[0]) / 2
  const my = (a[1] + b[1]) / 2
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const cx = mx - dy * bend
  const cy = my + dx * bend
  const out = []
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const u = 1 - t
    out.push([u * u * a[0] + 2 * u * t * cx + t * t * b[0], u * u * a[1] + 2 * u * t * cy + t * t * b[1]])
  }
  return out
}

function lineFor(points, bend) {
  const coords = []
  for (let i = 1; i < points.length; i += 1) {
    const seg = curve(points[i - 1], points[i], bend)
    coords.push(...(i === 1 ? seg : seg.slice(1)))
  }
  return coords
}

function markerEl(label, kind) {
  const el = document.createElement('div')
  el.className = `mapmark${kind === 'excursion' ? ' is-excursion' : ''}`
  el.innerHTML = `<span class="mapmark__dot">${label}</span>`
  return el
}

export default function RouteMap({ points = [], excursions = [], height = '100%', interactive = true, padding = 90 }) {
  const holder = useRef(null)
  const map = useRef(null)
  const markers = useRef([])

  // Create once.
  useEffect(() => {
    if (!holder.current || map.current) return
    let cancelled = false
    try {
      const m = new MapLibreMap({
        container: holder.current,
        style: STYLE,
        center: [14.5, 47.2],
        zoom: 4.4,
        interactive,
        attributionControl: false,
      })
      // OpenStreetMap's ODbL and OpenFreeMap's terms both require the credit, so it stays —
      // collapsed behind the (i) button, which is what compact mode is for.
      m.addControl(new AttributionControl({ compact: true }), 'bottom-right')
      const collapseAttribution = () =>
        holder.current
          ?.querySelector('.maplibregl-ctrl-attrib')
          ?.classList.remove('maplibregl-compact-show')
      m.on('load', collapseAttribution)
      m.on('idle', collapseAttribution)
      if (interactive) m.addControl(new NavigationControl({ showCompass: false }), 'top-right')
      m.on('error', () => {})
      map.current = m
    } catch {
      // Tiles unreachable — the styled container stays as a neutral backdrop.
    }
    return () => {
      if (cancelled) return
      cancelled = true
      markers.current.forEach((mk) => mk.remove())
      markers.current = []
      map.current?.remove()
      map.current = null
    }
  }, [interactive])

  // Redraw route + markers whenever the itinerary changes.
  useEffect(() => {
    const m = map.current
    if (!m) return
    const main = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
    const trips = excursions.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
    const mainCoords = main.map((p) => [p.lon, p.lat])
    const hub = mainCoords[mainCoords.length - 1]

    function draw() {
      const routeData = {
        type: 'FeatureCollection',
        features:
          mainCoords.length > 1
            ? [{ type: 'Feature', geometry: { type: 'LineString', coordinates: lineFor(mainCoords, 0.1) } }]
            : [],
      }
      const excursionData = {
        type: 'FeatureCollection',
        features: hub
          ? trips.map((p, i) => ({
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: lineFor([hub, [p.lon, p.lat]], i % 2 ? -0.2 : 0.2) },
            }))
          : [],
      }

      if (m.getSource('bf-route')) {
        m.getSource('bf-route').setData(routeData)
        m.getSource('bf-excursions').setData(excursionData)
      } else {
        m.addSource('bf-route', { type: 'geojson', data: routeData })
        m.addSource('bf-excursions', { type: 'geojson', data: excursionData })
        m.addLayer({
          id: 'bf-route-halo',
          type: 'line',
          source: 'bf-route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.85 },
        })
        m.addLayer({
          id: 'bf-route-line',
          type: 'line',
          source: 'bf-route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': INK, 'line-width': 2.6 },
        })
        m.addLayer({
          id: 'bf-excursion-line',
          type: 'line',
          source: 'bf-excursions',
          layout: { 'line-cap': 'round' },
          paint: { 'line-color': EXCURSION, 'line-width': 2, 'line-dasharray': [1.6, 1.6] },
        })
      }

      markers.current.forEach((mk) => mk.remove())
      markers.current = [
        ...main.map((p, i) =>
          new Marker({ element: markerEl(i === 0 ? 'A' : i === main.length - 1 ? 'B' : String(i), 'main') })
            .setLngLat([p.lon, p.lat])
            .addTo(m),
        ),
        ...trips.map((p) =>
          new Marker({ element: markerEl('•', 'excursion') }).setLngLat([p.lon, p.lat]).addTo(m),
        ),
      ]

      const all = [...mainCoords, ...trips.map((p) => [p.lon, p.lat])]
      if (all.length > 1) {
        const b = all.reduce((acc, c) => acc.extend(c), new LngLatBounds(all[0], all[0]))
        m.fitBounds(b, { padding: typeof padding === 'number' ? padding : { top: 90, bottom: 90, left: 90, right: 90, ...padding }, maxZoom: 7.5, duration: 900 })
      } else if (all.length === 1) {
        m.easeTo({ center: all[0], zoom: 6, duration: 900 })
      }
    }

    if (m.isStyleLoaded()) {
      draw()
      return undefined
    }
    m.once('idle', draw)
    return () => m.off('idle', draw)
  }, [points, excursions, padding])

  return <div ref={holder} className="mapholder" style={{ height }} />
}
