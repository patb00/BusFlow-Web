import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { LANGS, DEFAULT_LANG } from '../i18n'
import { SITE_NAME, absoluteUrl, localizedUrl } from '../lib/site'

/**
 * Per-page metadata. React 19 hoists <title>, <meta> and <link> rendered anywhere in the tree
 * into <head>, so no helmet library is needed — but the last render wins, so exactly one <Seo>
 * belongs per page.
 *
 * What this does not solve: the tags are written by JavaScript. Google renders JS and sees them;
 * WhatsApp/Facebook/LinkedIn crawlers do not, so link previews fall back to the tags in
 * index.html until the routes are prerendered.
 */
export default function Seo({ title, description, image = '/og-share.jpg', noindex = false }) {
  const { i18n } = useTranslation()
  const { pathname, search } = useLocation()
  const lang = LANGS.find((l) => i18n.resolvedLanguage?.startsWith(l.value))?.value || DEFAULT_LANG

  // React 19 appends these tags rather than replacing the static fallbacks in index.html, which
  // would leave two competing description/og tags in the head — crawlers are then free to pick
  // either. Drop the static set as soon as a real page has rendered its own.
  useEffect(() => {
    document.head.querySelectorAll('[data-default]').forEach((el) => el.remove())
  }, [])

  // The canonical follows the URL, not the language the visitor happens to get: a crawler
  // fetching "/" with an English Accept-Language must still canonicalise to "/", or the bare
  // URL would point at ?lang=en and collide with x-default.
  const explicitLang = new URLSearchParams(search).get('lang')
  const url = explicitLang ? localizedUrl(pathname, explicitLang, DEFAULT_LANG) : absoluteUrl(pathname)
  const fullTitle = `${title} | ${SITE_NAME}`

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* hreflang ties the three language versions of this page together, so a search engine
          serves the right one instead of treating them as duplicates. Every version lists every
          version, itself included — that reciprocity is what makes the set valid. */}
      {!noindex && (
        <>
          {LANGS.map((alt) => (
            <link
              key={alt.value}
              rel="alternate"
              hrefLang={alt.value}
              href={localizedUrl(pathname, alt.value, DEFAULT_LANG)}
            />
          ))}
          <link rel="alternate" hrefLang="x-default" href={absoluteUrl(pathname)} />
        </>
      )}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={absoluteUrl(image)} />
      <meta property="og:locale" content={lang === 'hr' ? 'hr_HR' : lang === 'de' ? 'de_DE' : 'en_GB'} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteUrl(image)} />
    </>
  )
}
