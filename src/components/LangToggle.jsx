import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGS, DEFAULT_LANG } from '../i18n'

export default function LangToggle() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = LANGS.find((l) => i18n.language?.startsWith(l.value)) || LANGS[0]

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="lang" ref={ref}>
      <button className="lang__btn" onClick={() => setOpen((o) => !o)} aria-label="Language" aria-expanded={open}>
        <img className="flag" src={current.flag} alt="" aria-hidden="true" width="18" height="13" />
        <span>{current.short}</span>
      </button>
      {open && (
        <div className="lang__menu">
          {LANGS.map((l) => (
            <button
              key={l.value}
              className={`lang__item${l.value === current.value ? ' is-active' : ''}`}
              onClick={() => {
                i18n.changeLanguage(l.value)
                setOpen(false)
                // Keep the URL in step with the language so the page can be shared (and
                // crawled) in the language it is being read in. German is the bare URL.
                const url = new URL(window.location.href)
                if (l.value === DEFAULT_LANG) url.searchParams.delete('lang')
                else url.searchParams.set('lang', l.value)
                window.history.replaceState(null, '', url)
              }}
            >
              <img className="flag" src={l.flag} alt="" aria-hidden="true" width="18" height="13" />
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
