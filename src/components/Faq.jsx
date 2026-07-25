import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6']

export default function Faq() {
  const { t } = useTranslation()
  const [open, setOpen] = useState('q1')

  return (
    <div className="faq">
      {KEYS.map((key) => (
        <div className={`faq__item${open === key ? ' is-open' : ''}`} key={key}>
          <button className="faq__q" onClick={() => setOpen(open === key ? null : key)} aria-expanded={open === key}>
            {t(`faq.${key}.q`)}
            <span className="faq__sign">{open === key ? '−' : '+'}</span>
          </button>
          <div className="faq__a">
            <div>
              <p>{t(`faq.${key}.a`)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
