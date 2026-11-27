/* BusFlow landing — postavke koje vlasnik stranice popunjava prije objave.
   Prazna vrijednost ostavlja oznaku u uglatim zagradama vidljivom na stranici (npr. [telefon]),
   pa se ništa ne prikazuje kao stvarno dok se ne unese. */
window.BUSFLOW = {
  /* Kontakt: podnožje, panel „Radije odmah termin?“, potvrda upita i adresa na koju upit stiže (Formspree ili e-mail). */
  email: "info@flow-solutions.hr",
  phone: "",            /* u obliku za tel: poveznicu, npr. "+385911234567" */
  phoneDisplay: "",     /* kako se prikazuje, npr. "+385 91 123 4567" */

  /* Obećanje u tekstu („odgovor unutar 1 radnog dana“, isto piše i u dijalogu na mikanovic.de).
     Tekstovi koji ovise o jeziku stranice pišu se kao { de: "…", hr: "…", en: "…" }. */
  replyWithin: { de: "innerhalb eines Werktages", hr: "unutar 1 radnog dana", en: "within one working day" },

  /* Prvi sastanak: booking stranica „BusFlow“ u Zoho Calendaru (isti link kao na mikanovic.de), 30 min na Zoho Meeting
     videu; termini su svaki dan od 9 do 18 h (zadnji počinje u 17:15). Dani i sati mijenjaju se u Zohu (Appointment
     Booking → BusFlow → Available hours), a ovdje samo tekst uz gumbe. Prazno = gumbi za kalendar se skrivaju. */
  bookingUrl: "https://calendar.zoho.eu/zc/view/slot-booking/0801123eb2e67d0614e435f10b7cfc7b0000908716c149fb8693f4a7881c898cbfcd0c31ecb462b0af14579353eac5f1a484bdfff151f8cbc0b7539f527d29d66cc5",
  meetingMinutes: 30,
  bookingHours: { de: "9–18 Uhr", hr: "9–18 h", en: "9:00–18:00 (CET/CEST)" },

  /* Kratki upit (e-mail, broj vozila, poruka) šalje se automatski preko Formspreea: isti obrazac kao na flow-solutions.hr,
     poruka stiže na info@flow-solutions.hr. Šalje se JSON (POST, Content-Type: application/json; polja _subject, _replyto,
     email, flota, poruka, lang, page, sent_at), očekuje se HTTP 2xx.
     Ako slanje ne uspije ili traje dulje od 15 s, potvrda nudi gumb koji otvara posjetiteljev e-mail program s istim
     sažetkom, uz „kopiraj“ (rezerva).
     Prazno = upit se uvijek šalje e-mailom iz preglednika. Testovi ovu adresu moraju presresti i nikad je stvarno pozvati. */
  formEndpoint: "https://formspree.io/f/mnjwrbpa"
};
