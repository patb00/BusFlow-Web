import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Reveal from '../components/Reveal'
import Seo from '../components/Seo'

// One entry per operator running on BusFlow. `to` points at that client's case study.
const CLIENTS = [
  {
    key: 'mikanovic',
    to: '/klijenti/mikanovic',
    logo: 'clients/mikanovic-logo.png',
  },
]

export default function Clients() {
  const { t } = useTranslation()

  return (
    <main>
      <Seo title={t('seo.clients.title')} description={t('seo.clients.description')} />

      <section className="section is-tight">
        <div className="wrap">
          <Reveal className="head">
            <p className="eyebrow">{t('clients.eyebrow')}</p>
            <h1 className="h1">{t('clients.title')}</h1>
            <p className="lead">{t('clients.sub')}</p>
          </Reveal>

          <div className="clientlist">
            {CLIENTS.map((client, i) => (
              <Reveal key={client.key} delay={i * 80}>
                <Link className="clientcard" to={client.to}>
                  <span className="clientcard__logo">
                    <img
                      src={`${import.meta.env.BASE_URL}${client.logo}`}
                      alt={t(`clients.${client.key}.name`)}
                      loading="lazy"
                    />
                  </span>
                  <span className="clientcard__body">
                    <span className="clientcard__name">{t(`clients.${client.key}.name`)}</span>
                    <span className="clientcard__place">{t(`clients.${client.key}.place`)}</span>
                    <span className="clientcard__desc">{t(`clients.${client.key}.short`)}</span>
                  </span>
                  <span className="btn is-secondary clientcard__go">{t('clients.caseStudy')}</span>
                </Link>
              </Reveal>
            ))}

            <Reveal delay={CLIENTS.length * 80}>
              <div className="clientcard is-empty">
                <span className="clientcard__logo" aria-hidden="true">
                  <span className="clientcard__ghost" />
                </span>
                <span className="clientcard__body">
                  <span className="clientcard__name">{t('clients.next.name')}</span>
                  <span className="clientcard__place">{t('clients.next.place')}</span>
                  <span className="clientcard__desc">{t('clients.next.desc')}</span>
                </span>
                <Link className="btn" to="/kontakt">
                  {t('clients.next.cta')}
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  )
}
