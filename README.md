# BusFlow — promo & demo site

Marketing site and clickable demo for **BusFlow**, the coach-hire booking platform built by
Flow Solutions. It exists to show prospective operators what the product does, so **everything
runs in the browser — there is no backend, no database and no sign-up.**

The product itself lives in `../BusFlow_Mikanovic`; this repo only mirrors its behaviour.

## Stack

React 19 + Vite, React Router, react-i18next (HR / EN / DE), MapLibre GL with keyless
[OpenFreeMap](https://openfreemap.org) vector tiles and [Photon](https://photon.komoot.io)
place autocomplete — the same map and geocoding services the real app uses. Typography
(Graphik + FH Oscar Pro) matches flow-solutions.hr.

> **Before publishing:** set `VITE_SITE_URL` (see `.env.example`) — canonicals, Open Graph URLs,
> robots.txt and sitemap.xml all derive from it. And fill in the hidden figures in
> [src/lib/facts.js](src/lib/facts.js): only the ones with a value render, so the band never
> claims more than the Clients page can back up.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/
npm run preview
npm run lint
```

## What's where

```
src/
├── lib/
│   ├── quote.js         # distance, coach classes, the whole price model
│   ├── useItinerary.js  # trip state: stops, day trips, passengers, nights, price
│   └── facts.js         # usage figures for the "in numbers" band (placeholders)
├── components/
│   ├── RouteMap.jsx     # MapLibre map: route line, numbered markers, dashed day trips
│   ├── PlaceField.jsx   # Photon autocomplete; picked places carry real coordinates
│   ├── RoutePlanner.jsx # A → stops → B, plus day trips from the destination
│   ├── Itinerary.jsx    # live route read-out + the price card
│   ├── AdminMock.jsx    # operator admin mock-up (bookings, departures, tariff, users)
│   └── Faq.jsx, Navbar.jsx, Footer.jsx, LangToggle.jsx, Reveal.jsx
├── pages/               # Home (map-first landing), Clients, Demo (booking + admin),
│                        # Contact (mailto form + FAQ), NotFound
├── locales/{hr,en,de}/  # all copy; the three files must stay key-identical
└── styles.css           # single stylesheet, design tokens at the top
```

## The price model (demo only)

`calculateItinerary()` in [src/lib/quote.js](src/lib/quote.js):

- coordinates come from the place picked in autocomplete; a short built-in city table only
  seeds the default trip and resolves names typed without picking a suggestion, and anything
  still unknown falls back to a stable pseudo-distance so a typo never dead-ends the demo
- distance = great-circle between places × 1.25 road factor, summed leg by leg
- day trips are priced as return runs from the destination
- driving time = distance ÷ 70 km/h; **over 9 h of driving adds a second driver**
  (EU regulation 561/2006), which also shortens the number of days
- price = base fee + km × class rate + drivers × days × day rate + tolls/fuel

Rates are plausible market numbers, **not** a real tariff. In the product the operator sets them.

## SEO

- **Per-page metadata** — [src/components/Seo.jsx](src/components/Seo.jsx) renders the title,
  description, canonical, Open Graph/Twitter tags and the hreflang set. React 19 hoists head
  tags, so no helmet library is needed; exactly one `Seo` per page. `index.html` keeps a static
  fallback marked `data-default`, which the first page render removes so the two never compete.
- **Language in the URL** — `?lang=en` / `?lang=de`; Croatian is the bare URL and `x-default`.
  The canonical follows the URL, not the language the visitor happens to be served.
- **robots.txt + sitemap.xml** are generated into `dist/` by
  [scripts/gen-seo-files.mjs](scripts/gen-seo-files.mjs) on `postbuild`, from `VITE_SITE_URL`.
- **Structured data** — Organization in `index.html`, SoftwareApplication on the home page,
  FAQPage on `/kontakt` (mirrors the questions already rendered there).
- **Not solved:** the tags are written by JavaScript. Google renders JS and sees them;
  WhatsApp/Facebook/LinkedIn crawlers do not, so link previews use the `index.html` fallback
  until the routes are prerendered to static HTML.

The contact form posts to the Formspree endpoint flow-solutions.hr already uses
([src/pages/Contact.jsx](src/pages/Contact.jsx)) — the only network call the site makes with
visitor data.

## Deploying

Static build — any host will do. `public/404.html` + `public/.htaccess` cover SPA fallback on
Apache/Hostinger-style hosts. The only runtime network calls are the map tiles and the two
webfonts.
