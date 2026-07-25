// Figures for the "BusFlow in numbers" band.
//
// Only claims we can actually stand behind belong here — the band sits on the same site as the
// Clients page, so an inflated operator count contradicts it on the next click. Set a value to
// null to hide that figure; the section renders whatever is left.
//
// Numbers are formatted per locale; strings (like '24/7') are printed as they are.
export const FACTS = {
  operators: 1, // coach companies live on BusFlow — Omnibus Mikanović
  languages: 3, // HR / EN / DE across the platform, emails included
  modules: 5, // admin areas: overview, bookings, departures, tariff, users
  availability: '24/7', // the booking flow needs no office hours
  vehicles: null, // TODO: coaches managed in the system
  bookings: null, // TODO: bookings processed
}

/** The figures that have a value, in display order. */
export const VISIBLE_FACTS = Object.entries(FACTS).filter(([, value]) => value != null)
