import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import hr from './locales/hr/translation.json'
import en from './locales/en/translation.json'
import de from './locales/de/translation.json'

export const LANGS = [
  { value: 'de', label: 'Deutsch', short: 'DE', flag: 'https://flagcdn.com/de.svg' },
  { value: 'en', label: 'English', short: 'EN', flag: 'https://flagcdn.com/gb.svg' },
  { value: 'hr', label: 'Hrvatski', short: 'HR', flag: 'https://flagcdn.com/hr.svg' },
]

// German is the default: the operators BusFlow is sold to are German-speaking, so the bare
// URL is the German one and hr/en hang off ?lang=.
export const DEFAULT_LANG = 'de'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      hr: { translation: hr },
      en: { translation: en },
      de: { translation: de },
    },
    fallbackLng: DEFAULT_LANG,
    supportedLngs: LANGS.map((l) => l.value),
    // Only an explicit choice moves the site off German: ?lang= (shareable and crawlable, see
    // Seo's hreflang set) or a previous pick kept in localStorage. The browser's own language
    // is deliberately NOT consulted — otherwise the bare URL would serve English to an English
    // browser while the canonical and sitemap declare it German.
    detection: {
      order: ['querystring', 'localStorage'],
      lookupQuerystring: 'lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

export default i18n
