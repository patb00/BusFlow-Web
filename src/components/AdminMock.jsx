import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BUS_CLASSES, formatEur } from '../lib/quote'

const BOOKINGS = [
  { id: 'BF-2418', client: 'OŠ Ivana Gundulića', route: 'Zagreb → Plitvice', date: '12.08.', pax: 48, bus: 'standard', total: 1240, status: 'paid' },
  { id: 'BF-2417', client: 'Rimac Automobili', route: 'Sveta Nedelja → München', date: '14.08.', pax: 32, bus: 'midi', total: 3180, status: 'confirmed' },
  { id: 'BF-2416', client: 'KUD Sljeme', route: 'Zagreb → Maribor → Wien', date: '17.08.', pax: 55, bus: 'standard', total: 2450, status: 'quote' },
  { id: 'BF-2415', client: 'Hotel Adriatic', route: 'Rijeka → Venezia', date: '19.08.', pax: 41, bus: 'midi', total: 1980, status: 'paid' },
  { id: 'BF-2414', client: 'NK Zagorec', route: 'Varaždin → Graz', date: '23.08.', pax: 28, bus: 'midi', total: 1420, status: 'cancelled' },
  { id: 'BF-2413', client: 'Reisegruppe Offenbach', route: 'Offenbach → Split', date: '26.08.', pax: 62, bus: 'double', total: 6890, status: 'confirmed' },
]

const TRIPS = [
  { id: 'L-118', route: 'Zagreb → Offenbach', date: '09.08. 20:00', bus: 'Setra S431 DT', seats: 83, sold: 71, price: 89 },
  { id: 'L-119', route: 'Offenbach → Zagreb', date: '11.08. 18:30', bus: 'Setra S431 DT', seats: 83, sold: 44, price: 89 },
  { id: 'L-120', route: 'Zagreb → Split', date: '15.08. 06:00', bus: 'VDL Futura', seats: 57, sold: 57, price: 34 },
  { id: 'L-121', route: 'Split → Zagreb', date: '18.08. 16:00', bus: 'VDL Futura', seats: 57, sold: 12, price: 34 },
]

const USERS = [
  { name: 'Ilija Mikanović', email: 'ilija@primjer.hr', role: 'superadmin', active: true },
  { name: 'Irena Kovač', email: 'irena@primjer.hr', role: 'admin', active: true },
  { name: 'Marko Babić', email: 'marko@primjer.hr', role: 'admin', active: true },
  { name: 'Ana Horvat', email: 'ana@primjer.hr', role: 'member', active: true },
  { name: 'Tomislav Perić', email: 'tomislav@primjer.hr', role: 'member', active: false },
]

const STATE = { paid: 'is-ok', confirmed: 'is-info', quote: 'is-wait', cancelled: 'is-off' }
const NAV = ['dashboard', 'bookings', 'trips', 'pricing', 'users']

function Seats({ sold, seats }) {
  return (
    <div className="row" style={{ gap: '0.625rem', flexWrap: 'nowrap' }}>
      <div className="bar" style={{ flex: 1 }}>
        <div className="bar__fill" style={{ width: `${Math.round((sold / seats) * 100)}%` }} />
      </div>
      <span className="num" style={{ minWidth: '3.25rem', textAlign: 'right' }}>
        {sold}/{seats}
      </span>
    </div>
  )
}

export default function AdminMock({ initial = 'dashboard' }) {
  const { t, i18n } = useTranslation()
  const lng = i18n.language?.slice(0, 2) || 'de'
  const [view, setView] = useState(initial)
  const [selected, setSelected] = useState(BOOKINGS[1])

  return (
    <div className="app">
      <div className="app__bar">
        <span className="app__dot" />
        <span className="app__dot" />
        <span className="app__dot" />
        <span className="app__url">app.busflow.eu/{view}</span>
      </div>

      <div className="app__body">
        <aside className="app__side">
          {NAV.map((key) => (
            <button
              key={key}
              className={`app__nav${view === key ? ' is-active' : ''}`}
              onClick={() => setView(key)}
            >
              {t(`admin.nav.${key}`)}
            </button>
          ))}
        </aside>

        <div className="app__main">
          {view === 'dashboard' && (
            <>
              <div className="app__head">
                <div>
                  <h3 className="h4">{t('admin.dashboard.title')}</h3>
                  <p className="p--sm">{t('admin.dashboard.sub')}</p>
                </div>
                <span className="tiny">{t('admin.dashboard.period')}</span>
              </div>
              <div className="kpis">
                <div>
                  <div className="kpi__num num">38</div>
                  <div className="tiny">{t('admin.kpi.bookings')}</div>
                </div>
                <div>
                  <div className="kpi__num num">{formatEur(74250, lng)}</div>
                  <div className="tiny">{t('admin.kpi.revenue')}</div>
                </div>
                <div>
                  <div className="kpi__num num">92%</div>
                  <div className="tiny">{t('admin.kpi.occupancy')}</div>
                </div>
                <div>
                  <div className="kpi__num num">4 min</div>
                  <div className="tiny">{t('admin.kpi.response')}</div>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>{t('admin.col.id')}</th>
                      <th>{t('admin.col.client')}</th>
                      <th>{t('admin.col.route')}</th>
                      <th>{t('admin.col.date')}</th>
                      <th>{t('admin.col.total')}</th>
                      <th>{t('admin.col.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BOOKINGS.slice(0, 4).map((b) => (
                      <tr key={b.id} onClick={() => { setSelected(b); setView('bookings') }}>
                        <td><b>{b.id}</b></td>
                        <td>{b.client}</td>
                        <td>{b.route}</td>
                        <td className="num">{b.date}</td>
                        <td className="num"><b>{formatEur(b.total, lng)}</b></td>
                        <td><span className={`state ${STATE[b.status]}`}>{t(`admin.status.${b.status}`)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {view === 'bookings' && (
            <>
              <div className="app__head">
                <div>
                  <h3 className="h4">{t('admin.bookings.title')}</h3>
                  <p className="p--sm">{t('admin.bookings.sub')}</p>
                </div>
                <span className="tiny num">{BOOKINGS.length} {t('admin.bookings.count')}</span>
              </div>
              <div className="table-wrap" style={{ marginBottom: '1.5rem' }}>
                <table className="data">
                  <thead>
                    <tr>
                      <th>{t('admin.col.id')}</th>
                      <th>{t('admin.col.client')}</th>
                      <th>{t('admin.col.route')}</th>
                      <th>{t('admin.col.date')}</th>
                      <th>{t('admin.col.pax')}</th>
                      <th>{t('admin.col.total')}</th>
                      <th>{t('admin.col.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BOOKINGS.map((b) => (
                      <tr key={b.id} className={selected?.id === b.id ? 'is-active' : ''} onClick={() => setSelected(b)}>
                        <td><b>{b.id}</b></td>
                        <td>{b.client}</td>
                        <td>{b.route}</td>
                        <td className="num">{b.date}</td>
                        <td className="num">{b.pax}</td>
                        <td className="num"><b>{formatEur(b.total, lng)}</b></td>
                        <td><span className={`state ${STATE[b.status]}`}>{t(`admin.status.${b.status}`)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selected && (
                <div className="readout is-dense">
                  <div className="app__head" style={{ marginBottom: '0.75rem' }}>
                    <div>
                      <span className="tiny">{t('admin.detail.title')} · {selected.id}</span>
                      <h4 className="h4" style={{ marginTop: '0.25rem' }}>{selected.client}</h4>
                    </div>
                    <span className={`state ${STATE[selected.status]}`}>{t(`admin.status.${selected.status}`)}</span>
                  </div>
                  <div className="kpis" style={{ margin: 0, border: 0, padding: 0, gap: '1.25rem' }}>
                    <div>
                      <div className="tiny">{t('admin.col.route')}</div>
                      <div className="p--sm strong">{selected.route}</div>
                    </div>
                    <div>
                      <div className="tiny">{t('admin.col.pax')}</div>
                      <div className="p--sm strong num">{selected.pax}</div>
                    </div>
                    <div>
                      <div className="tiny">{t('admin.col.bus')}</div>
                      <div className="p--sm strong">{t(`buses.${selected.bus}.name`)}</div>
                    </div>
                    <div>
                      <div className="tiny">{t('admin.col.total')}</div>
                      <div className="p--sm strong num">{formatEur(selected.total, lng)}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {view === 'trips' && (
            <>
              <div className="app__head">
                <div>
                  <h3 className="h4">{t('admin.trips.title')}</h3>
                  <p className="p--sm">{t('admin.trips.sub')}</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>{t('admin.col.line')}</th>
                      <th>{t('admin.col.route')}</th>
                      <th>{t('admin.col.departure')}</th>
                      <th>{t('admin.col.bus')}</th>
                      <th style={{ minWidth: '10rem' }}>{t('admin.col.seats')}</th>
                      <th>{t('admin.col.ticket')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TRIPS.map((tr) => (
                      <tr key={tr.id}>
                        <td><b>{tr.id}</b></td>
                        <td>{tr.route}</td>
                        <td className="num">{tr.date}</td>
                        <td>{tr.bus}</td>
                        <td><Seats sold={tr.sold} seats={tr.seats} /></td>
                        <td className="num"><b>{formatEur(tr.price, lng)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {view === 'pricing' && (
            <>
              <div className="app__head">
                <div>
                  <h3 className="h4">{t('admin.pricing.title')}</h3>
                  <p className="p--sm">{t('admin.pricing.sub')}</p>
                </div>
                <span className="tiny">{t('admin.pricing.saved')}</span>
              </div>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>{t('admin.col.bus')}</th>
                      <th>{t('admin.col.seats')}</th>
                      <th>{t('admin.pricing.perKm')}</th>
                      <th>{t('admin.pricing.perDay')}</th>
                      <th>{t('admin.col.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BUS_CLASSES.map((c) => (
                      <tr key={c.key}>
                        <td><b>{t(`buses.${c.key}.name`)}</b></td>
                        <td className="num">{c.seats}</td>
                        <td className="num">{c.rate.toFixed(2)} €</td>
                        <td className="num">{c.daily} €</td>
                        <td><span className="state is-ok">{t('admin.pricing.active')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="tiny" style={{ marginTop: '1rem' }}>{t('admin.pricing.note')}</p>
            </>
          )}

          {view === 'users' && (
            <>
              <div className="app__head">
                <div>
                  <h3 className="h4">{t('admin.users.title')}</h3>
                  <p className="p--sm">{t('admin.users.sub')}</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>{t('admin.col.name')}</th>
                      <th>{t('admin.col.email')}</th>
                      <th>{t('admin.col.role')}</th>
                      <th>{t('admin.col.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {USERS.map((u) => (
                      <tr key={u.email}>
                        <td><b>{u.name}</b></td>
                        <td>{u.email}</td>
                        <td>{t(`admin.roles.${u.role}`)}</td>
                        <td>
                          <span className={`state ${u.active ? 'is-ok' : 'is-off'}`}>
                            {t(u.active ? 'admin.status.active' : 'admin.status.inactive')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
