import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import i18n, { LANGS, DEFAULT_LANG } from './i18n.js'
import App from './App.jsx'
import './styles.css'

// Keep <html lang> in sync with the active locale.
function syncLang(lng) {
  document.documentElement.lang = LANGS.find((l) => lng?.startsWith(l.value))?.value || DEFAULT_LANG
}
syncLang(i18n.language)
i18n.on('languageChanged', syncLang)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
