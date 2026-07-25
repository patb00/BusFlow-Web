// Single source of truth for the site's public origin. Canonical links, Open Graph URLs and the
// sitemap must all agree on one absolute origin.
//
// Set VITE_SITE_URL at build time (see .env.example). The fallback keeps local builds working,
// but shipping without it would publish canonicals pointing at localhost.
const configured = import.meta.env.VITE_SITE_URL

// A trailing slash would produce "//path" once joined; strip it once, here.
export const SITE_URL = (configured?.trim() || 'http://localhost:5173').replace(/\/+$/, '')

export const SITE_NAME = 'BusFlow'
export const SITE_TAGLINE = 'Flow Solutions d.o.o.'

/** Absolute URL for a route path, for canonical/og:url. */
export function absoluteUrl(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Absolute URL of a page in a given language. Language lives in `?lang=`, and the default
 * (German) is the bare URL — so the canonical of the default language has no query at all.
 */
export function localizedUrl(path, lang, defaultLang = 'de') {
  const base = absoluteUrl(path)
  return lang === defaultLang ? base : `${base}?lang=${lang}`
}
