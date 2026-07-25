import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Reveal from '../components/Reveal'
import Faq from '../components/Faq'
import Seo from '../components/Seo'
import StructuredData from '../components/StructuredData'

// The same Formspree form flow-solutions.hr already posts to — this site has no backend of
// its own, and a mailto: link loses most enquiries.
const FORM_ENDPOINT = 'https://formspree.io/f/mnjwrbpa'
const COMPANY_SITE = 'https://flow-solutions.hr'
const FLEET_SIZES = ['f1', 'f2', 'f3']
const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6']

export default function Contact() {
  const { t } = useTranslation()
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    fleet: 'f1',
    message: '',
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: t('contact.form.subject'),
          source: 'BusFlow',
          name: form.name,
          company: form.company,
          email: form.email,
          phone: form.phone,
          fleet: t(`contact.fleet.${form.fleet}`),
          message: form.message,
        }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  // FAQ rich results: the questions already live on this page, so the markup only mirrors them.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_KEYS.map((key) => ({
      '@type': 'Question',
      name: t(`faq.${key}.q`),
      acceptedAnswer: { '@type': 'Answer', text: t(`faq.${key}.a`) },
    })),
  }

  return (
    <main>
      <Seo title={t('seo.contact.title')} description={t('seo.contact.description')} />
      <StructuredData data={faqSchema} />

      <section className="section is-tight">
        <div className="wrap contact">
          <Reveal>
            <p className="eyebrow">{t('contact.eyebrow')}</p>
            <h1 className="h1">{t('contact.title')}</h1>
            <p className="lead">{t('contact.sub')}</p>

            <dl className="contact__direct">
              <div>
                <dt>{t('contact.direct.company')}</dt>
                <dd>
                  <a className="textlink" href={COMPANY_SITE} target="_blank" rel="noreferrer">
                    flow-solutions.hr
                  </a>
                </dd>
              </div>
              <div>
                <dt>{t('contact.direct.answer')}</dt>
                <dd>{t('contact.direct.answerValue')}</dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={80}>
            <form className="panel" onSubmit={submit}>
              <div className="panel__head">
                <h2 className="panel__title">{t('contact.form.title')}</h2>
              </div>

              <div className="panel__split" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 0 }}>
                <div className="field">
                  <label htmlFor="c-name">{t('contact.form.name')}</label>
                  <input id="c-name" required value={form.name} onChange={set('name')} />
                </div>
                <div className="field">
                  <label htmlFor="c-company">{t('contact.form.company')}</label>
                  <input id="c-company" value={form.company} onChange={set('company')} />
                </div>
                <div className="field">
                  <label htmlFor="c-email">{t('contact.form.email')}</label>
                  <input id="c-email" type="email" required value={form.email} onChange={set('email')} />
                </div>
                <div className="field">
                  <label htmlFor="c-phone">{t('contact.form.phone')}</label>
                  <input id="c-phone" value={form.phone} onChange={set('phone')} />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="c-fleet">{t('contact.form.fleet')}</label>
                  <select id="c-fleet" value={form.fleet} onChange={set('fleet')}>
                    {FLEET_SIZES.map((key) => (
                      <option key={key} value={key}>
                        {t(`contact.fleet.${key}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="c-message">{t('contact.form.message')}</label>
                  <textarea
                    id="c-message"
                    rows="4"
                    placeholder={t('contact.form.messagePlaceholder')}
                    value={form.message}
                    onChange={set('message')}
                  />
                </div>
              </div>

              <div className="panel__foot">
                <p className="tiny" style={{ maxWidth: '15rem' }}>
                  {status === 'sent'
                    ? t('contact.form.sent')
                    : status === 'error'
                      ? t('contact.form.error')
                      : t('contact.form.note')}
                </p>
                <button className="btn" type="submit" disabled={status === 'sending' || status === 'sent'}>
                  {status === 'sending' ? t('contact.form.sending') : t('contact.form.send')}
                </button>
              </div>
            </form>
          </Reveal>
        </div>
      </section>

      <section className="section is-paper" id="faq">
        <div className="wrap is-narrow">
          <Reveal className="head is-center">
            <p className="eyebrow">{t('faq.eyebrow')}</p>
            <h2 className="h2">{t('faq.title')}</h2>
          </Reveal>
          <Reveal delay={60}>
            <Faq />
          </Reveal>
        </div>
      </section>
    </main>
  )
}
