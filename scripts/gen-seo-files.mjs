// Emits robots.txt and sitemap.xml into dist/ after the Vite build.
//
// Generated rather than committed because both files must carry the site's ABSOLUTE origin (the
// sitemap protocol requires it, and robots.txt's Sitemap: line does too). Committing them would
// mean a localhost URL shipping to production the first time someone forgets to edit it.
// The origin comes from VITE_SITE_URL — the same variable the app reads in src/lib/site.js.

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = join(import.meta.dirname, '..', 'dist')
const siteUrl = (process.env.VITE_SITE_URL || '').trim().replace(/\/+$/, '')

if (!siteUrl) {
  // A hard failure would break local builds, which legitimately have no domain. Warn loudly
  // instead — production sets the variable, and this is the reminder if it does not.
  console.warn(
    '[gen-seo-files] VITE_SITE_URL is not set — robots.txt and sitemap.xml get a localhost\n' +
      '                origin and are NOT fit to deploy. Set it in the build environment.',
  )
}

const origin = siteUrl || 'http://localhost:5173'

// Public routes, kept in sync with src/App.jsx.
const PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/klijenti', priority: '0.8', changefreq: 'monthly' },
  { path: '/klijenti/mikanovic', priority: '0.7', changefreq: 'monthly' },
  { path: '/demo', priority: '0.8', changefreq: 'monthly' },
  { path: '/kontakt', priority: '0.7', changefreq: 'monthly' },
]

// Language lives in ?lang=; German is the bare URL. Keep in sync with src/i18n.js.
const LANGUAGES = ['de', 'en', 'hr']
const DEFAULT_LANGUAGE = 'de'

const url = (path, lang) =>
  `${origin}${path}${lang === DEFAULT_LANGUAGE ? '' : `?lang=${lang}`}`

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...PAGES.flatMap(({ path, priority, changefreq }) =>
    LANGUAGES.map((lang) =>
      [
        '  <url>',
        `    <loc>${url(path, lang)}</loc>`,
        // Every language version lists every other one — that reciprocity is what makes an
        // hreflang set valid.
        ...LANGUAGES.map(
          (alt) =>
            `    <xhtml:link rel="alternate" hreflang="${alt}" href="${url(path, alt)}"/>`,
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${url(path, DEFAULT_LANGUAGE)}"/>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n'),
    ),
  ),
  '</urlset>',
  '',
].join('\n')

const robots = ['User-agent: *', 'Allow: /', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n')

writeFileSync(join(DIST, 'sitemap.xml'), sitemap, 'utf8')
writeFileSync(join(DIST, 'robots.txt'), robots, 'utf8')
console.log(`[gen-seo-files] wrote robots.txt and sitemap.xml for ${origin}`)
