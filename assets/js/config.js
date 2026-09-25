/* BusFlow landing — postavke koje vlasnik stranice popunjava prije objave.
   Prazna vrijednost ostavlja oznaku u uglatim zagradama vidljivom na stranici (npr. [telefon]),
   pa se ništa ne prikazuje kao stvarno dok se ne unese. */
window.BUSFLOW = {
  /* Kontakt: podnožje, panel „Radije odmah termin?“, potvrda upita i adresa na koju upit stiže e-mailom. */
  email: "info@flow-solutions.hr",
  phone: "",            /* u obliku za tel: poveznicu, npr. "+385911234567" */
  phoneDisplay: "",     /* kako se prikazuje, npr. "+385 91 123 4567" */

  /* Obećanje u tekstu („odgovor unutar 1 radnog dana“, isto piše i u dijalogu na mikanovic.de).
     Tekstovi koji ovise o jeziku stranice pišu se kao { de: "…", hr: "…" }. */
  replyWithin: { de: "innerhalb eines Werktages", hr: "unutar 1 radnog dana" },

  /* Prvi sastanak: Microsoft Bookings (isti kalendar kao na mikanovic.de), trajanje i radno vrijeme tog tipa termina. */
  bookingUrl: "https://bookings.cloud.microsoft/bookwithme/user/3537dbd8af364e94963da5c3748b24f2@flow-solutions.hr/meetingtype/Z7I12j5WzEuFcvfPyJhC0A2?anonymous",
  meetingMinutes: 30,
  bookingHours: { de: "Mo–Fr, 9–16 Uhr", hr: "pon–pet 9–16 h" },

  /* Upit se šalje automatski preko Formspreea: isti obrazac kao na flow-solutions.hr, poruka stiže na info@flow-solutions.hr.
     Šalje se JSON (POST, Content-Type: application/json; polja _subject, _replyto, poruka i svi odgovori), očekuje se HTTP 2xx.
     Ako slanje ne uspije ili traje dulje od 15 s, otvara se posjetiteljev e-mail program s istim sažetkom (rezerva).
     Prazno = upit se uvijek šalje e-mailom iz preglednika. Testovi ovu adresu moraju presresti i nikad je stvarno pozvati. */
  formEndpoint: "https://formspree.io/f/mnjwrbpa"
};
