# BusFlow – landing stranica za prijevoznike

Statična landing stranica (HTML, CSS i JavaScript bez okvira i bez ovisnosti) kojom FlowSolutions d.o.o.
nudi uvođenje BusFlowa drugim autobusnim prijevoznicima. Struktura i sadržaj slijede odobreni dizajn
„Autobusna linija“: stranica je linija, svaka sekcija je stanica (01–08), a završna stanica je upit za prvi
sastanak. Paleta je bijela podloga s tri navy tona; krem se koristi samo na navy površinama.

**Jezici:** njemački je na glavnoj adresi (`/`, `/upit.html`), hrvatski na `/hr/` (`/hr/`, `/hr/upit.html`), engleski na
`/en/` (`/en/`, `/en/upit.html`). Prekidač jezika vodi na istu stranicu na drugom jeziku.

## Struktura

| Put | Što je |
| --- | --- |
| `index.html`, `upit.html` | **njemačka** landing stranica i upit za prvi sastanak (glavna adresa) |
| `hr/index.html`, `hr/upit.html` | ista stranica i upit na **hrvatskom** |
| `en/index.html`, `en/upit.html` | ista stranica i upit na **engleskom** |
| `kontakt/index.html` | `/kontakt` (na nju vodi „Mehr über BusFlow“ iz dijaloga na mikanovic.de): njemački upit; uz `?lang=hr` / `?lang=en` ili hrvatski / engleski preglednik upit na tom jeziku (`?lang` ima prednost); parametri iz adrese ostaju |
| `impressum.html`, `datenschutz.html` | njemački Impressum i Datenschutzerklärung (FlowSolutions d.o.o.) |
| `hr/impresum.html`, `hr/privatnost.html` | isto na hrvatskom: Impresum i Pravila privatnosti |
| `en/legal-notice.html`, `en/privacy.html` | isto na engleskom: Legal notice i Privacy policy |
| `404.html` | stranica „nije pronađeno“ (njemački, s hrvatskim i engleskim retkom); poveznice su root-apsolutne jer se poslužuje na bilo kojoj adresi |
| `assets/css/style.css` | tokeni boja i fontova, osnova, zajedničke komponente (gumbi, kartice, čipovi, logo, polja obrasca) |
| `assets/css/landing.css` | zaglavlje, prekidač jezika, tračnica sa stanicama i autobusom, hero-film (CSS 3D autobus), sve sekcije, animacije, prilagodbe širini |
| `assets/css/upit.css` | stilovi stranice upita |
| `assets/css/legal.css` | stilovi pravnih stranica |
| `assets/css/fonts.css` + `assets/fonts/` | samostalno posluživani fontovi Barlow, Barlow Condensed i JetBrains Mono (latin + latin-ext) |
| `assets/js/config.js` | postavke (kontakt, kalendar termina, trajanje sastanka, adresa za slanje upita) |
| `assets/js/landing.js` | izbornik, skaliranje filma, tračnica i paljenje stanica, ulazne animacije, putna karta (korak 1 upita) |
| `assets/js/analytics.js` | statistika posjeta (Vercel Web Analytics), učitava se samo na busflow.email |
| `assets/js/upit.js` | logika upita: koraci, provjera, sažetak, slanje preko Formspreea (rezerva: e-mail iz preglednika); njemački, hrvatski i engleski tekstovi u rječniku `I18N` |
| `assets/img/favicon.svg` | ikona |
| `scripts/build.mjs`, `package.json` | provjera (`npm run lint`) i build u `dist/` (`npm run build`), bez ovisnosti |
| `vercel.json` | postavke za Vercel: build, preusmjeravanja starih adresa i kratkih adresa pravnih stranica, keširanje fontova |

## Sekcije stranice (DE / HR; engleska stranica ima iste sekcije)

1. **Abfahrt / Polazak (hero)**: „Während Sie fahren, verkauft BusFlow.“ / „Dok vi vozite, BusFlow prodaje.“, kutija
   „Im Alltag bewährt“ / „Dokazano u prometu“, CTA i hero-film desno.
2. **Referenzband / Traka reference**: Omnibus Mikanović, Offenbach am Main, u produkciji od kolovoza 2026.
3. **01 Systemkarte / Karta sustava**: karta linija P, O, F, B spojenih u kalkulacijskom motoru; na mobitelu popis stanica linije P.
4. **02 Funktionen / Mogućnosti**: četiri ploče s 30 stanica i oznakama „Läuft automatisch“ / „Sie entscheiden“.
5. **03 Was besser wird / Što se poboljšava**: sedam poslova, prije → s BusFlowom.
6. **04 Was schneller wird / Što se ubrzava** (tamno): cjevovod od upita do cijene u šest koraka i što sustav radi sam.
7. **05 Vorteile / Prednosti**: šest razloga, vaš brend na autobusu, sigurnost i vlasništvo.
8. **06 Einführung / Uvođenje**: faze 0–7 + hypercare, „Sie liefern / Wir erledigen“, kritični put, model suradnje.
9. **07 Referenz / Referenca** (tamno): činjenice, izjava vlasnika Ilije Mikanovića s logom tvrtke (izvadak, cijeli tekst
   na klik; na hrvatskoj stranici prijevod i njemački izvornik) i popis onoga što smo za Omnibus Mikanović napravili.
10. **08 Fragen / Pitanja**: osam pitanja.
11. **Ziel / Odredište**: putna karta (korak 1 upita na stranici), „Im Erstgespräch“, „Lieber gleich einen Termin?“ (gumb na Microsoft Bookings).

Sidra sekcija na njemačkoj stranici: `#start, #systemkarte, #funktionen, #verbesserungen, #tempo, #vorteile, #einfuehrung,
#referenz, #fragen, #termin`; na hrvatskoj: `#vrh, #karta, #mogucnosti, #poboljsanja, #ubrzanja, #prednosti, #uvodenje,
#referenca, #pitanja, #sastanak`; na engleskoj: `#top, #system-map, #features, #improvements, #speed, #benefits,
#onboarding, #reference, #faq, #meeting`.

## Njemački tekst

Prijevod se oslanja na njemačke tekstove aplikacije BusFlow_Mikanovic: ponajprije na formulacije vlasnika Omnibusa
Mikanović (hero, kontakt, BUS-SOS, najam vozača, partnerska pisma) i na `de.json` datoteke aplikacije, a gumbi za
sastanak su doslovno kao u dijalogu „Eine Website wie diese für Ihr Busunternehmen?“ na mikanovic.de
(„Online-Termin vereinbaren“, „Mehr über BusFlow“), a upit se šalje gumbom „Anfrage senden“. Osnovni pojmovi: Busunternehmen,
Flotte, Anfrage, Angebot, verbindlicher Festpreis, Buchung, Rechnung (nikad „E-Rechnung“), Umsatzsteuer, Lenk- und
Ruhezeiten, Betriebshof, Partnerunternehmen, Fahrauftrag, Erstgespräch; oslovljavanje uvijek sa „Sie“.

## Animacije

- **Hero-film**: čista CSS animacija (14 s petlja) s CSS 3D autobusom, rutom München–Zagreb po državama i
  koracima izračuna. Pozornica je 720×540 px i skalira se u okvir (`tan(atan2())` u CSS-u, uz JS rezervu).
- **Tračnica**: lijeva linija s oznakama stanica; ikona autobusa kreće ispod natpisa „Abfahrt“ / „Polazak“ i spušta se
  1:1 sa skrolom do oznake „Ziel“ / „Odredište“, prijeđeni dio se ispuni, a oznaka stanice iskoči kad je autobus prođe
  (`setupRail`). Na mobitelu tračnicu zamjenjuje tanka linija ispod zaglavlja.
- **Dolazak na stanicu**: natpis i naslov sekcije uklize s lijeva, kartice se dižu jedna za drugom (IntersectionObserver).
- **Posebni ulazi**: karta sustava se sama iscrta, cjevovod u sekciji 04 pali korake, redovi prije → poslije ulaze s odmakom.
- Uz `prefers-reduced-motion` sve je odmah vidljivo, a film stoji na mirnom kadru.

## Pokretanje lokalno

Nema instalacije. Stranicu poslužite bilo kojim statičnim poslužiteljem, npr. `python3 -m http.server 8080`, i otvorite
`http://localhost:8080/` (njemački), `http://localhost:8080/hr/` (hrvatski) ili `http://localhost:8080/en/` (engleski).

```
npm run lint    # sintaksa JS-a, sve lokalne poveznice i sidra, inline skripte, odredišta preusmjeravanja iz vercel.json
npm run build   # isto, pa kopija u dist/ te robots.txt i sitemap.xml (VITE_SITE_URL, zadano https://busflow.email)
```

## Prije objave: `assets/js/config.js`

Na autobusu u sekciji 05 `[IHR LOGO]` / `[ihre-domain.de]` (i hrvatske i engleske inačice) namjerno su oznake: pokazuju
gdje dolazi logo i domena prijevoznika. Tekstovi koji ovise o jeziku upisuju se kao `{ de: "…", hr: "…", en: "…" }`.

- `email` – `info@flow-solutions.hr`: podnožje, potvrda upita i adresa na koju upit stiže e-mailom.
- `phone`, `phoneDisplay` – telefon u podnožju; dok je prazno, stavka se ne prikazuje.
- `replyWithin` – rok odgovora (`de` „innerhalb eines Werktages“, `hr` „unutar 1 radnog dana“, `en` „within one working
  day“, kao u dijalogu na mikanovic.de).
- `bookingUrl` – Microsoft Bookings za prvi sastanak (isti kalendar kao na mikanovic.de); `meetingMinutes` (30) i
  `bookingHours` (`de` „Mo–Fr, 9–16 Uhr“, `hr` „pon–pet 9–16 h“, `en` „Mon–Fri, 9:00–16:00 CET“) opisuju taj tip termina.
- `formEndpoint` – `https://formspree.io/f/mnjwrbpa`, isti Formspree obrazac kao na flow-solutions.hr (stiže na
  info@flow-solutions.hr). Upit ide kao JSON (`POST`, `Content-Type: application/json`, očekuje se odgovor 2xx). Ako
  slanje ne uspije ili traje dulje od 15 s, otvara se e-mail program posjetitelja s porukom za `email` (rezerva).
  Prazno: upit se uvijek šalje e-mailom iz preglednika.

## Pravne stranice

`impressum.html` i `datenschutz.html` (njemački), `hr/impresum.html` i `hr/privatnost.html` (hrvatski) te
`en/legal-notice.html` i `en/privacy.html` (engleski) su statične
stranice bez JavaScripta, s oznakom `noindex`. Podaci o tvrtki (puni naziv, sjedište u Križevcima, direktor, OIB,
PDV ID, MBS i Trgovački sud u Bjelovaru, banka i IBAN) upisani su izravno u tih šest datoteka; temeljni kapital se
namjerno ne navodi. E-mail adresa je u njima upisana ručno, pa je pri promjeni treba promijeniti i ondje. Datenschutz opisuje stvarne obrade: hosting na Vercelu, slanje upita preko Formspreea,
`sessionStorage` za odgovore, statistiku posjeta (Vercel Web Analytics), e-mail na Microsoft 365, termin preko
Microsoft Bookings i Teamsa; stranica nema kolačića. Ako se doda nova usluga (npr. karta ili drugi alat za
statistiku), treba je dodati i u Datenschutz.

## Statistika posjeta

Broj posjeta mjeri **Vercel Web Analytics** (bez kolačića, samo zbirni podaci). Sve stranice učitavaju
`assets/js/analytics.js`, koji na adresi busflow.email dodaje Vercelovu skriptu `/_vercel/insights/script.js`; lokalno,
na GitHub Pages i u pregledu ne radi ništa. Da bi statistika radila, vlasnik Vercel projekta (Patrik) mora uključiti
**Analytics → Enable** u projektu busflow.email i zatim ponovno objaviti stranicu (novi push na `main` ili
**Redeploy**); prije toga skripta vraća 404. Podaci su u Vercel nadzornoj ploči pod **Analytics**. Na besplatnom
(Hobby) planu uključeno je 50.000 događaja mjesečno za sve projekte na računu, a izvještaji pokrivaju zadnji mjesec.
Datenschutz, Pravila privatnosti i Privacy policy opisuju tu obradu u odjeljku 4; ako se alat promijeni, treba promijeniti i
njih. Kratke adrese `/impressum`, `/datenschutz`, `/hr/impresum`, `/hr/privatnost`, `/en/legal-notice` i `/en/privacy`
preusmjeravaju na te stranice (`vercel.json`).

Izjava vlasnika u sekciji 07 je doslovan tekst koji je Ilija Mikanović napisao na njemačkom; izvadak koristi „[…]“ za
izostavljene dijelove; hrvatska i engleska stranica prikazuju prijevod i njemački izvornik. Logo je
`assets/img/mikanovic-logo.webp` (iz aplikacije BusFlow_Mikanovic, smanjen na 560 px).

## Upit za prvi sastanak

Dva koraka, ukupno 13 stavki: **01 Abfahrt / Polazište** (tvrtka*, ime*, e-mail*, telefon, država) i **02 Ziel /
Odredište** (broj autobusa*, usluge*, kako danas nastaju ponude, kada želite krenuti*, što već imate, video ili
telefon, napomena, privola*). Prvi korak može se ispuniti i na landing stranici: gumb „Weiter: Ihr Busbetrieb“ /
„Dalje: vaš prijevoz“ / „Next: your business“ sprema odgovore u `sessionStorage` (ključ `busflow-upit`, samo kodovi
odgovora, pa vrijede u svim jezicima) i otvara upit na istom jeziku na koraku 2.

Gumb „Anfrage senden“ / „Pošaljite upit“ / „Send inquiry“ šalje upit preko Formspreea; sažetak na jeziku stranice ide u polje `poruka`,
a isti je tekst na potvrdi, uz gumb za kopiranje. Kad slanje ne uspije, isti sažetak se otvara kao poruka u e-mail
programu. Njemački primjer:

```
Anfrage zur Einführung von BusFlow

Firma: …
Name: …
E-Mail: …
Telefon: …
Firmensitz: …
Anzahl Busse: …
Leistungen: …
Angebotserstellung heute: …
Gewünschter Start: …
Bereits vorhanden: …
Gespräch: Videotermin
Anmerkung: …

Gesendet von: https://busflow.email/upit.html
```

Potvrda zatim vodi na kalendar termina („Online-Termin vereinbaren“, `bookingUrl`, nova kartica). JSON koji ide na
`formEndpoint`: `_subject` (predmet poruke), `_replyto` (e-mail posjetitelja, za odgovor), `poruka` (sažetak), zatim
`sent_at, page, lang, tvrtka, ime, email, telefon, drzava, flota, usluge[], ponude, kada, imate[], format, napomena,
privola`.

**Testiranje:** automatski testovi i ručne provjere moraju presresti `formspree.io` (npr. Playwright
`context.route`), inače svaki klik na „Anfrage senden“ šalje pravi upit na info@flow-solutions.hr. Pravi probni upit
šalje se samo ručno, nakon objave, s jasnom oznakom „TEST“.

## Sadržaj

Sav tekst temelji se na dokumentaciji aplikacije (uvođenje 8–10 tjedana, vlastita instanca, podaci u EU, dnevni backup,
Factur-X, myPOS i PayPal, referenca Omnibus Mikanović od kolovoza 2026.). Nema izmišljenih brojki (ušteda, cijena,
broja kupaca). Novi jezik: kopirati `en/` u novu mapu, prevesti tekst, dodati jezik u `I18N` (`upit.js`), u vrijednosti
`config.js`, u `LANGS`, `COPY` i `HTML` (`scripts/build.mjs`), u prekidače jezika i `hreflang` oznake svih stranica te u
`kontakt/index.html` i `vercel.json`.

Engleski tekst koristi pojmove iz engleskih tekstova aplikacije BusFlow_Mikanovic (`en.json`): coach operator, coach,
inquiry, binding price, booking, invoice (nikad „e-invoice“), VAT, depot, partner operators, driver hire, „Book an online
meeting“, „within one working day“.

## Objava

Stranica je predviđena za `https://busflow.email`, koju danas poslužuje Vercel iz repozitorija `patb00/BusFlow-Web`
(svaki push na `main` objavljuje stranicu). Vercel čita `vercel.json`: build bez okvira (`npm ci`, `npm run build`,
izlaz `dist/`), bez preusmjeravanja svih adresa na `index.html`, s preusmjeravanjima starih adresa dosadašnje stranice
(`/hr` → `/hr/`, `/en` → `/en/`, `/?lang=hr` → `/hr/`, `/?lang=en` → `/en/`, `/demo` → karta sustava, `/klijenti` i
`/klijenti/…` → referenca, uz `?lang=hr` / `?lang=en` na hrvatsku / englesku stranicu) i s kratkim adresama pravnih
stranica. CSS, JS i HTML nemaju hash u imenu, pa ih Vercel poslužuje uz provjeru svježine; dugo se keširaju
samo fontovi, pa **promijenjeni font mora dobiti novo ime datoteke**.

Repozitorij `patb00/BusFlow-Web` drži isto stablo kao ovaj (osim `.github/`, gdje je njegov workflow za GitHub Pages,
koji koristi iste `npm ci`, `npm run lint` i `npm run build` uz `VITE_BASE=/BusFlow-Web/`). Bilo koji drugi statični
hosting također radi: poslužite sadržaj `dist/` nakon `npm run build`.
