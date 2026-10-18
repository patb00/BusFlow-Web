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
| `assets/css/fonts.css` + `assets/fonts/` | samostalno posluživani fontovi Barlow 400–700, Barlow Condensed 800 i JetBrains Mono (varijabilni, jedna datoteka za 400–700), latin + latin-ext; svaki novi rez je nova datoteka za preuzimanje, pa prije dodavanja provjeriti može li postojeći |
| `assets/js/config.js` | postavke (kontakt, kalendar termina, trajanje sastanka, adresa za slanje upita); u `<head>` je namjerno bez `defer`: mjereno na sporom mobitelu, s `defer` se hero iscrta ~0,5 s kasnije (preglednik prvo obradi cijeli HTML) |
| `assets/js/landing.js` | izbornik, skaliranje filma, tračnica i paljenje stanica, ulazne animacije, tabovi mini Einsatzplana (sekcija 03), putna karta (korak 1 upita) |
| `assets/js/analytics.js` | statistika posjeta (Vercel Web Analytics), učitava se samo na busflow.email |
| `assets/js/upit.js` | logika upita: koraci, provjera, sažetak, slanje preko Formspreea (rezerva: e-mail iz preglednika); njemački, hrvatski i engleski tekstovi u rječniku `I18N` |
| `assets/js/demo.js` | demo-kalkulator u sekciji 04: pretraga mjesta (Photon), ruta (OSRM), karta (Leaflet + OpenStreetMap), države na ruti, posada, dani i ilustrativna cijena iz posjetiteljevih parametara; tekstovi de/hr/en u rječniku `I18N` |
| `assets/vendor/leaflet/` | Leaflet 1.9.4 (BSD-2-Clause, `LICENSE` u mapi), poslužuje se s naše stranice i učitava tek pri prvom izračunu |
| `assets/data/europe-countries.json` | pojednostavljeni poligoni europskih država (Natural Earth 110m, public domain) za pripisivanje kilometara državama |
| `assets/img/` | ikone `favicon.svg`, `favicon-96.png` i `apple-touch-icon.png`; slike za dijeljenje `og-de.png`, `og-hr.png`, `og-en.png` (1200×630); logo reference |
| `scripts/build.mjs`, `package.json` | provjera (`npm run lint`, uključujući SEO provjere) i build u `dist/` (`npm run build`), bez ovisnosti |
| `scripts/make-europe.mjs` | generira `assets/data/europe-countries.json` iz preuzetog Natural Earth GeoJSON-a (izvor se ne commita) |
| `vercel.json` | postavke za Vercel: build, preusmjeravanja starih adresa i kratkih adresa pravnih stranica, keširanje i sigurnosna zaglavlja |
| `favicon.ico`, `llms.txt` | ikona na adresi koju neki alati traže izravno (16/32/48 px iz `favicon.svg`) i kratak opis stranice za AI alate (lint provjerava njegove poveznice i sidra) |

## Sekcije stranice (DE / HR; engleska stranica ima iste sekcije)

1. **Abfahrt / Polazak (hero)**: „Während Sie fahren, verkauft BusFlow.“ / „Dok vi vozite, BusFlow prodaje.“, kutija
   „Im Alltag bewährt“ / „Dokazano u prometu“, CTA i hero-film desno.
2. **Referenzband / Traka reference**: Omnibus Mikanović, Offenbach am Main, u produkciji od kolovoza 2026.
3. **01 Systemkarte / Karta sustava**: karta linija P, O, F, B spojenih u kalkulacijskom motoru; na mobitelu popis stanica linije P.
4. **02 Funktionen / Mogućnosti**: četiri ploče s 32 stanice i oznakama „Läuft automatisch“ / „Sie entscheiden“; linija O
   ima 10 stanica, od kojih O9 „Fahrerakte und Fristen“ i O10 „Einsatzplan und Stunden“ opisuju modul Fahrer.
5. **03 Was besser wird / Što se poboljšava**: osam poslova, prije → s BusFlowom (osmi je „Fahrer einteilen“), a ispod
   tablice mini Einsatzplan s tabovima **Übersicht / Einsatzplan / Stunden** (ARIA tablist, JS samo mijenja panele; sadržaj
   je statičan): kartice po vozaču s dokumentima i sljedećom vožnjom, tjedna mreža četiriju izmišljenih vozača (vožnje,
   dvodnevna vožnja preko dvije ćelije, žuto upozorenje na dokument, crveno na dvostruku podjelu, legenda) i tablica sati s
   oznakom CSV-izvoza.
6. **04 Was schneller wird / Što se ubrzava** (tamno): cjevovod od upita do cijene u šest koraka, **demo-kalkulator**
   (`#demo`, vidi dolje) i što sustav radi sam.
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
- **Posebni ulazi**: karta sustava se sama iscrta, cjevovod u sekciji 04 pali korake (a nakon izračuna u demu svaki korak
  dobije čip s vrijednošću), redovi prije → poslije i redovi mini Einsatzplana ulaze s odmakom.
- Uz `prefers-reduced-motion` sve je odmah vidljivo, a film stoji na mirnom kadru.

## Pokretanje lokalno

Nema instalacije. Stranicu poslužite bilo kojim statičnim poslužiteljem, npr. `python3 -m http.server 8080`, i otvorite
`http://localhost:8080/` (njemački), `http://localhost:8080/hr/` (hrvatski) ili `http://localhost:8080/en/` (engleski).
Sve radi bez interneta osim demo-kalkulatora u sekciji 04, koji pri izračunu zove Photon, OSRM i OpenStreetMap pločice.

```
npm run lint    # sintaksa JS-a, sve lokalne poveznice i sidra, inline skripte, odredišta preusmjeravanja iz vercel.json, SEO (vidi dolje)
npm run build   # isto, pa kopija u dist/ (CSS i JS s hashom u imenu) te robots.txt i sitemap.xml s lastmod (VITE_SITE_URL, zadano https://busflow.email)
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
`sessionStorage` za odgovore, statistiku posjeta (Vercel Web Analytics), demo-kalkulator (Photon, OSRM demo
poslužitelj, OpenStreetMap pločice, `sessionStorage` za primjerne cijene; odjeljak 5 `#h-demo`, na njega vodi napomena
ispod gumba u demu), e-mail na Microsoft 365, termin preko Microsoft Bookings i Teamsa; stranica nema kolačića. Ako se
doda nova usluga (npr. drugi servis za rutiranje ili drugi alat za statistiku), treba je dodati i u Datenschutz.

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

## Demo-kalkulator (sekcija 04)

Posjetitelj unese mjesto polaska i odredište, vrstu vožnje (Transfer – samo jedan smjer / Hin- und Rückfahrt /
Tagesfahrt), datume, po želji vrijeme polaska, broj putnika i **vlastite primjerne cijene** (€/km, dnevni minimum,
dodatni vozač po danu, noćenje vozača, postotak za vrstu vožnje) te neobvezno **Betriebshof** (garažu) za prazne
kilometre. Gumb „Fahrpreis berechnen“ nacrta rutu na karti (prazne dionice isprekidano, garaža s vlastitim markerom) i
ispiše udaljenost, praznu vožnju, ukupne km, vožnju po smjeru, vozilo, dane, numerirani put izračuna (ruta → prazna vožnja
→ ×1,2 → pauze → vozači → dani → dolazak → vozilo), države na ruti s kilometrima i cijenu sa **svim stavkama** (cijena po
km i dnevni minimum oboje, s oznakom koja vrijedi; dodatni vozač, noćenja i postotak i kad su 0; zbroj; po osobi), uz
napomenu da je sve samo ilustracija načina rada. Nakon izračuna koraci cjevovoda 01–06 dobiju čipove s vrijednostima.
Zadane cijene (2,20 €/km, 650 €/dan, 250 €, 90 €, 0 %) su okrugli primjeri, **ne** cjenik Omnibusa Mikanović; primjerne
cijene i garaža pamte se u `sessionStorage` (ključ `busflow-demo`).

Pravila izračuna (`demo.js`, komentirano u kodu): s garažom se rutiraju dionice garaža → polazak i, kod transfera,
odredište → garaža (jedan OSRM poziv po dionici); vožnja po smjeru = (OSRM trajanje dionice s putnicima + dolazak iz
garaže) × 1,2 (OSRM računa za automobil); pauza 45 min na svakih 4,5 h; 1 vozač do 9 h vožnje, inače 2 (do 18 h dnevno);
transfer bez garaže uključuje praznu vožnju natrag na mjesto polaska, s garažom prazne dionice iz garaže i u garažu;
povratna vožnja traje od datuma polaska do povratka, najmanje 2 × dani vožnje; jednodnevna vožnja > 18 h nije izvediva
(računa se s noćenjima); vozilo po broju putnika (≤ 8 Kleinbus, ≤ 19 Minibus, ≤ 35 Midibus, ≤ 54 Reisebus, ≤ 74
Doppeldecker); cijena neto = max(km × cijena, dani × minimum) + dodatni vozači + noćenja + postotak. Države: točke rute
svakih ~5 km protiv poligona iz `assets/data/europe-countries.json`; novi JSON radi `node scripts/make-europe.mjs
<ne_110m_admin_0_countries.geojson>` (Natural Earth, public domain).

Vanjski servisi – poziv tek na radnju posjetitelja, prije toga nema nijednog zahtjeva:

| Servis | Za što | Operater | Uvjeti |
| --- | --- | --- | --- |
| `photon.komoot.io` | pretraga mjesta (≥ 3 znaka, 300 ms odgoda) | komoot GmbH | fair use, bez jamstva dostupnosti, prekomjerno se usporava |
| `router.project-osrm.org` | ruta, udaljenost, trajanje | FOSSGIS e.V. (uvjeti kao za routing.openstreetmap.de) | **„razumna, nekomercijalna“ uporaba, bez SLA**; pristup se može ukinuti bez obrazloženja |
| `tile.openstreetmap.org` | kartografske pločice | OpenStreetMap Foundation | Tile Usage Policy: umjerena uporaba, atribucija „© OpenStreetMap-Mitwirkende“ (prikazana na karti) |

Ako OSRM ili Photon ne odgovore u 12 s, demo javlja da servis nije dostupan; kad koordinate postoje, udaljenost se
procijeni kao zračna × 1,3 pri 75 km/h i označi „geschätzt“. **Prije šire promocije stranice** zamijeniti OSRM demo
poslužitelj vlastitim OSRM-om ili BusFlow API-jem (`POST api/v1/routes/legs` uz CORS za busflow.email): javni demo
poslužitelj nije namijenjen komercijalnoj produkciji. Adresa za zamjenu je konstanta `OSRM` na vrhu `demo.js`
(`PHOTON` i `TILES` isto). Kratka adresa `/demo` (i `/demo?lang=hr`, `/demo?lang=en`) vodi na `#demo`.

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
Factur-X, myPOS i PayPal, referenca Omnibus Mikanović od kolovoza 2026., modul Fahrer: dokumenti s rokovima,
kontrola vozačke svakih 28 dana, Einsatzplan, sati, „Meine Fahrten“, Fahrauftrag e-mailom). Nema izmišljenih brojki
(ušteda, cijena, broja kupaca); demo-kalkulator računa isključivo iz brojki koje posjetitelj sam upiše, a zadane
vrijednosti su označene kao primjeri. Imena vozača u mini Einsatzplanu su izmišljena. Novi jezik: kopirati `en/` u novu mapu, prevesti tekst, dodati jezik u `I18N` (`upit.js`), u vrijednosti
`config.js`, u `LANGS`, `COPY` i `HTML` (`scripts/build.mjs`), u prekidače jezika i `hreflang` oznake svih stranica te u
`kontakt/index.html` i `vercel.json`; uz to sliku za dijeljenje `assets/img/og-<jezik>.png` i JSON-LD na tom jeziku (vidi SEO).

Engleski tekst koristi pojmove iz engleskih tekstova aplikacije BusFlow_Mikanovic (`en.json`): coach operator, coach,
inquiry, binding price, booking, invoice (nikad „e-invoice“), VAT, depot, partner operators, driver hire, „Book an online
meeting“, „within one working day“.

## Objava

Stranica je predviđena za `https://busflow.email`, koju danas poslužuje Vercel iz repozitorija `patb00/BusFlow-Web`
(svaki push na `main` objavljuje stranicu). Vercel čita `vercel.json`: build bez okvira (`npm ci`, `npm run build`,
izlaz `dist/`), bez preusmjeravanja svih adresa na `index.html`, s preusmjeravanjima starih adresa dosadašnje stranice
(`/hr` → `/hr/`, `/en` → `/en/`, `/?lang=hr` → `/hr/`, `/?lang=en` → `/en/`, `/demo` → demo-kalkulator `#demo`, `/klijenti` i
`/klijenti/…` → referenca, uz `?lang=hr` / `?lang=en` na hrvatsku / englesku stranicu) i s kratkim adresama pravnih
stranica. Build u `dist/` daje CSS-u i JS-u hash sadržaja u imenu (`landing.<hash>.css`) i prepiše poveznice u svim
HTML stranicama, pa se `/assets/css/` i `/assets/js/` keširaju godinu dana (`immutable`); u izvoru imena ostaju bez hasha.
Fontovi se također keširaju godinu dana, ali bez hasha, pa **promijenjeni font mora dobiti novo ime datoteke**. Slike,
`assets/vendor/` i `assets/data/` keširaju se dan (uz `stale-while-revalidate` od tjedan dana), a HTML se uvijek
provjerava. Sve adrese dobivaju sigurnosna zaglavlja `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
(bez kamere, mikrofona i lokacije) i `X-Frame-Options: DENY` (stranica se ne može ugraditi u iframe).

Repozitorij `patb00/BusFlow-Web` drži isto stablo kao ovaj (osim `.github/`, gdje je njegov workflow za GitHub Pages,
koji koristi iste `npm ci`, `npm run lint` i `npm run build` uz `VITE_BASE=/BusFlow-Web/`). Bilo koji drugi statični
hosting također radi: poslužite sadržaj `dist/` nakon `npm run build`.

## SEO

Indeksiraju se samo tri stranice: `/`, `/hr/` i `/en/`. Sve ostale (upit, `/kontakt`, pravne stranice, 404) imaju
`noindex`, a `npm run lint` to provjerava. Kanonska adresa je `https://busflow.email` i upisana je u HTML neovisno o
hostingu (`PROD` u `build.mjs`); `VITE_SITE_URL` mijenja samo `robots.txt` i `sitemap.xml`.

Svaka od tri stranice ima, u `<head>`:

- `<title>` (20–65 znakova, ključna riječ „Software für Busunternehmen“ / „softver za autobusne prijevoznike“ / „software for
  coach operators“ naprijed) i `description` (70–160 znakova); lint mjeri duljine.
- `robots` `index, follow, max-image-preview:large`, `canonical`, `hreflang` za de/hr/en i `x-default` (= de).
- Open Graph i Twitter: `og:title`, `og:description`, `og:site_name`, `og:locale`, `og:url`, `og:image`
  (`assets/img/og-<jezik>.png`, 1200×630, apsolutna adresa) s dimenzijama i `alt`, `twitter:card` `summary_large_image`.
- Ikone: `favicon.svg`, `favicon-96.png` (Google traži PNG/ICO, višekratnik 48 px) i `apple-touch-icon.png` (180×180);
  uz to `/favicon.ico` u korijenu, bez oznake u HTML-u.
- JSON-LD (`application/ld+json`, `@graph`): `Organization` (FlowSolutions d.o.o., podaci kao u Impressumu), `WebSite`,
  `WebPage`, `SoftwareApplication` (BusFlow, `BusinessApplication`, bez cijene) i `FAQPage` s osam pitanja iz sekcije 08.
  Pitanja i odgovori u JSON-LD-u moraju biti doslovno jednaki tekstu u `.faq__q` / `.faq__a` na stranici; lint to
  uspoređuje, pa se pri promjeni FAQ-a mijenjaju oba mjesta.

Naslovi sekcija (`h2`) zadržavaju ton linije, ali nose i temu sekcije („Der Fahrplan: alle Funktionen der Software für
Busunternehmen.“, „Vor der Abfahrt: häufige Fragen zur Buchungssoftware für Busunternehmen.“), jer po njima tražilice i AI
alati razumiju strukturu stranice.

`sitemap.xml` sadrži tri adrese s `hreflang` alternativama i `lastmod` (datum zadnjeg commita, ili datum builda bez gita).

Slike za dijeljenje i PNG ikone nacrtane su Canvas API-jem u pregledniku (navy podloga, logo, hero-tvrdnja na jeziku
stranice, podnaslov, `busflow.email`); fontovi su Barlow Condensed 800 i Barlow iz `assets/fonts/`. Za novu sliku
(npr. promjena tvrdnje ili novi jezik) dovoljno je nacrtati 1200×630 PNG istog imena; sadržaj teksta treba odgovarati
`og:image:alt`.

Nakon objave (radi vlasnik domene, jednokratno): u Google Search Console dodati domain property `busflow.email` i predati
`https://busflow.email/sitemap.xml`; isto u Bing Webmaster Tools; provjeriti stranicu u Rich Results Testu
(JSON-LD bez grešaka) i u LinkedIn Post Inspectoru (slika i naslov). Prije šire promocije vrijedi napomena iz odjeljka
o demo-kalkulatoru: zamijeniti javni OSRM demo poslužitelj.
