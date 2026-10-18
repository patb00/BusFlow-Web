/* BusFlow landing — Demo-Rechner in Haltestelle 04 (DE auf /, HR auf /hr/, EN auf /en/): der Besucher gibt Abfahrtsort,
   Zielort, Fahrtart, Daten und Personenzahl ein und trägt die Hauptwerte SEINER Preisliste ein (Beispielwerte sind frei
   gewählte runde Zahlen, kein Tarif eines Kunden). Erst auf seine Aktion hin ruft der Browser externe Dienste:
   Photon (komoot) für die Ortssuche, den öffentlichen OSRM-Demoserver für die Route und OpenStreetMap-Kacheln für die
   Karte (Leaflet wird lokal aus assets/vendor/leaflet/ nachgeladen). Länder entlang der Route kommen aus
   assets/data/europe-countries.json (Natural Earth 110m, grob). Besatzung nach vereinfachten Regeln der EU 561/2006,
   Preis netto = max(km × €/km, Tage × Tagesminimum) + zusätzliche Fahrer + Übernachtungen ± Fahrtart-%.
   Texte, die das Skript schreibt, stehen im Wörterbuch I18N; die Preisliste bleibt in sessionStorage. Ohne Abhängigkeiten. */
(function () {
  "use strict";

  var form = document.getElementById("demo-form");
  var root = document.getElementById("demo");
  if (!form || !root || typeof fetch !== "function") return;

  var html = document.documentElement;
  var LANG = (html.lang || "de").slice(0, 2).toLowerCase();
  var LOCALE = { de: "de-DE", hr: "hr-HR", en: "en-GB" }[LANG] || "de-DE";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ASSETS = (function () {
    var s = document.currentScript;
    return s && s.src ? s.src.replace(/js\/demo(\.[0-9a-f]+)?\.js(\?.*)?$/, "") : "assets/"; // in dist/ heißt die Datei demo.<hash>.js
  })();

  var STORAGE_KEY = "busflow-demo";
  var PHOTON = "https://photon.komoot.io/api/";
  var OSRM = "https://router.project-osrm.org/route/v1/driving/";
  var TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var EUROPE_BBOX = "-12,34,45,72";
  var TIMEOUT = 12000;        /* ms je externem Aufruf */
  var COACH_FACTOR = 1.2;     /* OSRM rechnet mit Pkw-Profil; ein Reisebus braucht länger */
  var AIR_FACTOR = 1.3;       /* Reserve: Luftlinie → Straße, wenn OSRM nicht antwortet */
  var AIR_SPEED = 75;         /* km/h für die geschätzte Fahrzeit der Reserve */
  var BREAK_EVERY = 4.5, BREAK_H = 0.75;   /* 45 Min. Pause nach 4,5 h Lenkzeit */
  var DAY_DRIVE = 9, TEAM_DRIVE = 18;      /* Lenkzeit je Tag: ein Fahrer 9 h, Doppelbesatzung 18 h */
  var TIGHT_DUTY = 13;        /* ab 13 h Dienst für einen Fahrer gilt der Tag als knapp */
  var SAMPLE_KM = 5;          /* Länderzuordnung alle ~5 km entlang der Route */
  var BUSES = [[8, "kleinbus"], [19, "minibus"], [35, "midibus"], [54, "reisebus"], [74, "doppeldecker"]];

  var I18N = {
    de: {
      bus: { kleinbus: "Kleinbus", minibus: "Minibus", midibus: "Midibus", reisebus: "Reisebus", doppeldecker: "Doppeldecker" },
      seats: "{n} Plätze", km: "{n} km", kmEst: "{n} km (geschätzt)", dur: "{h} Std. {m} Min.", durShort: "{h} Std.",
      days: { 1: "1 Tag", n: "{n} Tage" }, nights: { 0: "keine Übernachtung", 1: "1 Übernachtung", n: "{n} Übernachtungen" },
      drivers: { 1: "1 Fahrer", n: "{n} Fahrer" },
      legDays: { 1: "1 Fahrtag", n: "{n} Fahrtage" },
      /* Rechenweg – ein Schritt je Zeile: [Label, Text] */
      stRoute: "Route", stRouteT: "{km} Straße, {t} Pkw-Fahrzeit laut OSRM auf OpenStreetMap.",
      stRouteEst: "Routing-Dienst nicht erreichbar: Luftlinie × 1,3 = {km}, Fahrzeit mit 75 km/h gerechnet.",
      stCoach: "Lenkzeit Bus", stCoachT: "{t} × 1,2 = {h} je Richtung – ein Reisebus ist langsamer als der Pkw im Routing.",
      stBreaks: "Pausen", stBreaksT: "{b} × 45 Min. nach je 4,5 Std. Lenkzeit → {duty} Dienst {scope}.",
      stBreaksNone: "Unter 4,5 Std. Lenkzeit {scope} – keine Pflichtpause.",
      scopeLeg: "je Richtung", scopeAll: "gesamt",
      stDrivers: "Fahrer", stDriversOne: "{h} Lenkzeit {scope} ≤ 9 Std. → 1 Fahrer.",
      stDriversTwo: "{h} Lenkzeit {scope} > 9 Std. → 2 Fahrer (Doppelbesatzung, bis 18 Std. am Tag).",
      stDays: "Tage",
      stDaysTransfer: "Hinfahrt {h} + Leerfahrt zurück {h} = {H} bei {per} Std. je Tag → {days}, {nights}.",
      stDaysRound: "Vom {d1} bis {d2} = {span}; Bus und Fahrer bleiben bei der Gruppe → {days}, {nights}.",
      stDaysRoundMin: "Vom {d1} bis {d2} wären es {span}, die Fahrt braucht aber 2 × {legDays} → {days}, {nights}.",
      stDaysDay: "Hin und zurück am selben Tag, {H} Lenkzeit gesamt ≤ 18 Std. → 1 Tag, keine Übernachtung.",
      stDaysDayNo: "{H} Lenkzeit gesamt > 18 Std. → an einem Tag nicht machbar, gerechnet mit {days}, {nights}.",
      stArrive: "Ankunft", stArriveT: "Abfahrt {dep} Uhr + {h} Lenkzeit{br}: {a}", brT: " + {n} × 45 Min. Pause",
      stBus: "Fahrzeug", stBusT: "Personenzahl {n} → {bus} mit {seats} Plätzen.",
      arrive: "Ankunft gegen {t} Uhr.", arriveNext: "Ankunft am Folgetag gegen {t} Uhr.",
      feasOk: "Machbar nach EU 561/2006.", feasTight: "Knapp: rund {h} Std. Dienst für einen Fahrer – BusFlow prüft hier die Variante mit zweitem Fahrer.",
      feasNoDay: "An einem Tag nicht machbar ({h} Lenkzeit) – BusFlow schlägt Übernachtungen vor; gerechnet mit {n}.",
      feasReturn: "Rückfahrt frühestens am {date} – gerechnet mit {n}.",
      countriesNone: "Keine Länderzuordnung möglich (grobe Grenzen).", other: "sonstige",
      /* Preis – jede Position, auch wenn sie 0 ist */
      lnDist: "Gesamtstrecke: {km1} hin + {km1} zurück", lnDistTransfer: "Gesamtstrecke: {km1} Hinfahrt + {km1} Leerfahrt zurück",
      lnKm: "Kilometerpreis: {km} × {rate}/km", lnMin: "Tagesminimum: {days} × {rate}",
      lnApplies: " – greift (höherer Wert)", lnOff: " – entfällt (niedriger)",
      lnExtra: "Zusätzlicher Fahrer: {n} × {days} × {rate}", lnExtraNone: "Zusätzlicher Fahrer: nicht nötig (1 Fahrer)",
      lnHotel: "Übernachtungen: {nights} × {d} × {rate}", lnHotelNone: "Übernachtungen: keine",
      lnKind: "Fahrtart {pct} % auf {base}", lnKindNone: "Fahrtart: kein Zuschlag oder Rabatt (0 %)",
      lnSum: "Summe netto", lnPP: "Pro Person: {total} ÷ {n}", perPerson: "{p} pro Person",
      chipKind: { transfer: "Transfer", round: "Hin & Rück", day: "Tagesfahrt" }, chipPax: "{n} Pers. · {kind}",
      chipCrew: "{d} · {n}", chipPrice: "{p} netto",
      busy: "Berechne …", calc: "Fahrpreis berechnen",
      errPlace: "„{q}“ wurde nicht gefunden. Bitte wählen Sie einen Ort aus der Liste.",
      errRoute: "Routing-Dienst gerade nicht erreichbar – Entfernung als Luftlinie × 1,3 geschätzt.",
      errHard: "Ortssuche gerade nicht erreichbar. Bitte versuchen Sie es in einer Minute noch einmal.",
      errFields: "Bitte prüfen Sie die markierten Felder.",
      mapAttr: "© OpenStreetMap-Mitwirkende", mapFrom: "Abfahrt", mapTo: "Ziel", mapDepot: "Betriebshof",
      /* Leerfahrt ab Betriebshof */
      stLeer: "Leerfahrt",
      stLeerDepot: "Betriebshof {d} → Abfahrtsort {km1}, am Ende zurück {km1}: {leer} ohne Fahrgäste.",
      stLeerDepotTransfer: "Betriebshof {d} → Abfahrtsort {km1}, Zielort → Betriebshof {km2}: {leer} ohne Fahrgäste.",
      stLeerNoneTransfer: "Kein Betriebshof angegeben: der Bus fährt leer zum Abfahrtsort zurück ({leer}).",
      stLeerNone: "Kein Betriebshof angegeben: keine Leerfahrt gerechnet.",
      stCoachDepot: "{t} × 1,2 = {hm}, plus Anfahrt vom Betriebshof {ha} = {h} je Richtung.",
      stDaysTransferDepot: "Anfahrt {ha} + Hinfahrt {hm} + Leerfahrt zum Betriebshof {hb} = {H} bei {per} Std. je Tag → {days}, {nights}.",
      lnDistDepot: "Gesamtstrecke: {km1} hin + {km1} zurück + {leer} Leerfahrt",
      lnDistTransferDepot: "Gesamtstrecke: {km1} Hinfahrt + {leer} Leerfahrt ab und zum Betriebshof"
    },
    hr: {
      bus: { kleinbus: "Kombi", minibus: "Minibus", midibus: "Midibus", reisebus: "Turistički autobus", doppeldecker: "Autobus na kat" },
      seats: "{n} mjesta", km: "{n} km", kmEst: "{n} km (procjena)", dur: "{h} h {m} min", durShort: "{h} h",
      days: { 1: "1 dan", n: "{n} dana" }, nights: { 0: "bez noćenja", 1: "1 noćenje", n: "{n} noćenja" },
      drivers: { 1: "1 vozač", n: "{n} vozača" },
      legDays: { 1: "1 dan vožnje", n: "{n} dana vožnje" },
      stRoute: "Ruta", stRouteT: "{km} cestom, {t} vožnje osobnim autom prema OSRM-u na OpenStreetMapu.",
      stRouteEst: "Servis za rutiranje nije dostupan: zračna linija × 1,3 = {km}, vrijeme računano sa 75 km/h.",
      stCoach: "Vožnja autobusom", stCoachT: "{t} × 1,2 = {h} po smjeru – autobus je sporiji od automobila iz rutiranja.",
      stBreaks: "Pauze", stBreaksT: "{b} × 45 min nakon svakih 4,5 h vožnje → {duty} dužnosti {scope}.",
      stBreaksNone: "Manje od 4,5 h vožnje {scope} – obvezna pauza nije potrebna.",
      scopeLeg: "po smjeru", scopeAll: "ukupno",
      stDrivers: "Vozači", stDriversOne: "{h} vožnje {scope} ≤ 9 h → 1 vozač.",
      stDriversTwo: "{h} vožnje {scope} > 9 h → 2 vozača (dvostruka posada, do 18 h dnevno).",
      stDays: "Dani",
      stDaysTransfer: "Odlazak {h} + prazna vožnja natrag {h} = {H} uz {per} h dnevno → {days}, {nights}.",
      stDaysRound: "Od {d1} do {d2} = {span}; autobus i vozači ostaju s grupom → {days}, {nights}.",
      stDaysRoundMin: "Od {d1} do {d2} bilo bi {span}, ali vožnja traži 2 × {legDays} → {days}, {nights}.",
      stDaysDay: "Odlazak i povratak isti dan, {H} vožnje ukupno ≤ 18 h → 1 dan, bez noćenja.",
      stDaysDayNo: "{H} vožnje ukupno > 18 h → nije izvedivo u jednom danu, računano s {days}, {nights}.",
      stArrive: "Dolazak", stArriveT: "Polazak u {dep} + {h} vožnje{br}: {a}", brT: " + {n} × 45 min pauze",
      stBus: "Vozilo", stBusT: "Broj putnika {n} → {bus} s {seats} mjesta.",
      arrive: "Dolazak oko {t}.", arriveNext: "Dolazak sutradan oko {t}.",
      feasOk: "Izvedivo prema EU 561/2006.", feasTight: "Tijesno: oko {h} h dužnosti za jednog vozača – BusFlow ovdje provjerava varijantu s drugim vozačem.",
      feasNoDay: "Nije izvedivo u jednom danu ({h} vožnje) – BusFlow predlaže noćenja; računano s {n}.",
      feasReturn: "Povratak najranije {date} – računano s {n}.",
      countriesNone: "Države nije moguće odrediti (grube granice).", other: "ostalo",
      lnDist: "Ukupna udaljenost: {km1} odlazak + {km1} povratak", lnDistTransfer: "Ukupna udaljenost: {km1} odlazak + {km1} prazna vožnja natrag",
      lnKm: "Cijena po km: {km} × {rate}/km", lnMin: "Dnevni minimum: {days} × {rate}",
      lnApplies: " – vrijedi (veći iznos)", lnOff: " – ne vrijedi (manji iznos)",
      lnExtra: "Dodatni vozač: {n} × {days} × {rate}", lnExtraNone: "Dodatni vozač: nije potreban (1 vozač)",
      lnHotel: "Noćenja: {nights} × {d} × {rate}", lnHotelNone: "Noćenja: nema",
      lnKind: "Vrsta vožnje {pct} % na {base}", lnKindNone: "Vrsta vožnje: bez dodatka ili popusta (0 %)",
      lnSum: "Ukupno neto", lnPP: "Po osobi: {total} ÷ {n}", perPerson: "{p} po osobi",
      chipKind: { transfer: "Transfer", round: "Povratna", day: "Jednodnevna" }, chipPax: "{n} os. · {kind}",
      chipCrew: "{d} · {n}", chipPrice: "{p} neto",
      busy: "Računam …", calc: "Izračunajte cijenu",
      errPlace: "„{q}“ nije pronađeno. Odaberite mjesto s popisa.",
      errRoute: "Servis za rutiranje trenutačno nije dostupan – udaljenost je procijenjena kao zračna × 1,3.",
      errHard: "Pretraga mjesta trenutačno nije dostupna. Pokušajte ponovno za minutu.",
      errFields: "Provjerite označena polja.",
      mapAttr: "© suradnici OpenStreetMapa", mapFrom: "Polazak", mapTo: "Odredište", mapDepot: "Garaža",
      stLeer: "Prazna vožnja",
      stLeerDepot: "Garaža {d} → mjesto polaska {km1}, na kraju natrag {km1}: {leer} bez putnika.",
      stLeerDepotTransfer: "Garaža {d} → mjesto polaska {km1}, odredište → garaža {km2}: {leer} bez putnika.",
      stLeerNoneTransfer: "Garaža nije upisana: autobus se prazan vraća na mjesto polaska ({leer}).",
      stLeerNone: "Garaža nije upisana: prazna vožnja nije računana.",
      stCoachDepot: "{t} × 1,2 = {hm}, plus dolazak iz garaže {ha} = {h} po smjeru.",
      stDaysTransferDepot: "Dolazak iz garaže {ha} + odlazak {hm} + prazna vožnja u garažu {hb} = {H} uz {per} h dnevno → {days}, {nights}.",
      lnDistDepot: "Ukupna udaljenost: {km1} odlazak + {km1} povratak + {leer} prazne vožnje",
      lnDistTransferDepot: "Ukupna udaljenost: {km1} odlazak + {leer} prazne vožnje iz garaže i u garažu"
    },
    en: {
      bus: { kleinbus: "Minivan", minibus: "Minibus", midibus: "Midibus", reisebus: "Coach", doppeldecker: "Double-decker" },
      seats: "{n} seats", km: "{n} km", kmEst: "{n} km (estimated)", dur: "{h} h {m} min", durShort: "{h} h",
      days: { 1: "1 day", n: "{n} days" }, nights: { 0: "no overnight stay", 1: "1 overnight stay", n: "{n} overnight stays" },
      drivers: { 1: "1 driver", n: "{n} drivers" },
      legDays: { 1: "1 driving day", n: "{n} driving days" },
      stRoute: "Route", stRouteT: "{km} by road, {t} car driving time per OSRM on OpenStreetMap.",
      stRouteEst: "Routing service unavailable: great-circle × 1.3 = {km}, time calculated at 75 km/h.",
      stCoach: "Coach driving time", stCoachT: "{t} × 1.2 = {h} per direction – a coach is slower than the car used for routing.",
      stBreaks: "Breaks", stBreaksT: "{b} × 45 min after every 4.5 h of driving → {duty} on duty {scope}.",
      stBreaksNone: "Under 4.5 h of driving {scope} – no mandatory break.",
      scopeLeg: "per direction", scopeAll: "in total",
      stDrivers: "Drivers", stDriversOne: "{h} driving {scope} ≤ 9 h → 1 driver.",
      stDriversTwo: "{h} driving {scope} > 9 h → 2 drivers (multi-manning, up to 18 h a day).",
      stDays: "Days",
      stDaysTransfer: "Outbound {h} + empty return {h} = {H} at {per} h per day → {days}, {nights}.",
      stDaysRound: "From {d1} to {d2} = {span}; coach and drivers stay with the group → {days}, {nights}.",
      stDaysRoundMin: "From {d1} to {d2} would be {span}, but the trip needs 2 × {legDays} → {days}, {nights}.",
      stDaysDay: "Out and back on the same day, {H} driving in total ≤ 18 h → 1 day, no overnight stay.",
      stDaysDayNo: "{H} driving in total > 18 h → not feasible in one day, calculated with {days}, {nights}.",
      stArrive: "Arrival", stArriveT: "Departure {dep} + {h} driving{br}: {a}", brT: " + {n} × 45 min break",
      stBus: "Vehicle", stBusT: "Passengers {n} → {bus} with {seats} seats.",
      arrive: "Arrival at about {t}.", arriveNext: "Arrival the next day at about {t}.",
      feasOk: "Feasible under EU 561/2006.", feasTight: "Tight: about {h} h on duty for one driver – BusFlow checks the second-driver option here.",
      feasNoDay: "Not feasible in one day ({h} driving) – BusFlow suggests overnight stays; calculated with {n}.",
      feasReturn: "Return at the earliest on {date} – calculated with {n}.",
      countriesNone: "Countries could not be assigned (coarse borders).", other: "other",
      lnDist: "Total distance: {km1} out + {km1} back", lnDistTransfer: "Total distance: {km1} outbound + {km1} empty return",
      lnKm: "Per-km price: {km} × {rate}/km", lnMin: "Daily minimum: {days} × {rate}",
      lnApplies: " – applies (higher amount)", lnOff: " – dropped (lower amount)",
      lnExtra: "Additional driver: {n} × {days} × {rate}", lnExtraNone: "Additional driver: not needed (1 driver)",
      lnHotel: "Overnight stays: {nights} × {d} × {rate}", lnHotelNone: "Overnight stays: none",
      lnKind: "Trip type {pct} % of {base}", lnKindNone: "Trip type: no surcharge or discount (0 %)",
      lnSum: "Total net", lnPP: "Per person: {total} ÷ {n}", perPerson: "{p} per person",
      chipKind: { transfer: "Transfer", round: "Round trip", day: "Day trip" }, chipPax: "{n} pax · {kind}",
      chipCrew: "{d} · {n}", chipPrice: "{p} net",
      busy: "Calculating …", calc: "Calculate the fare",
      errPlace: "“{q}” was not found. Please pick a place from the list.",
      errRoute: "Routing service unavailable right now – distance estimated as great-circle × 1.3.",
      errHard: "Place search unavailable right now. Please try again in a minute.",
      errFields: "Please check the highlighted fields.",
      mapAttr: "© OpenStreetMap contributors", mapFrom: "Departure", mapTo: "Destination", mapDepot: "Depot",
      stLeer: "Empty run",
      stLeerDepot: "Depot {d} → departure {km1}, back at the end {km1}: {leer} without passengers.",
      stLeerDepotTransfer: "Depot {d} → departure {km1}, destination → depot {km2}: {leer} without passengers.",
      stLeerNoneTransfer: "No depot given: the coach returns empty to the departure place ({leer}).",
      stLeerNone: "No depot given: no empty run calculated.",
      stCoachDepot: "{t} × 1.2 = {hm}, plus approach from the depot {ha} = {h} per direction.",
      stDaysTransferDepot: "Approach {ha} + outbound {hm} + empty run to the depot {hb} = {H} at {per} h per day → {days}, {nights}.",
      lnDistDepot: "Total distance: {km1} out + {km1} back + {leer} empty run",
      lnDistTransferDepot: "Total distance: {km1} outbound + {leer} empty run from and to the depot"
    }
  };
  var T = I18N[LANG] || I18N.de;

  function $(sel, el) { return (el || root).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); }
  function fmt(s, vars) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return k in vars ? vars[k] : m; }); }
  function plural(dict, n) { return fmt(dict[n] !== undefined ? dict[n] : dict.n, { n: n }); }
  var nf0 = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
  var eur = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var eur2 = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function fmtKm(km, est) { return fmt(est ? T.kmEst : T.km, { n: nf0.format(Math.round(km)) }); }
  function fmtDur(h) {
    var m = Math.round(h * 60), hh = Math.floor(m / 60), mm = m % 60;
    return mm ? fmt(T.dur, { h: hh, m: mm }) : fmt(T.durShort, { h: hh });
  }
  function fmtDate(d) { return d.toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric" }); }
  function fmtTime(d) { return d.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" }); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function isoDate(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function parseDate(s) { var p = (s || "").split("-"); return p.length === 3 && p[0] ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }

  /* ---------- Externe Aufrufe (nur auf Aktion des Besuchers) ---------- */
  function fetchJson(url) {
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT) : null;
    return fetch(url, ctrl ? { signal: ctrl.signal } : undefined).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).finally(function () { if (timer) clearTimeout(timer); });
  }

  var placeCache = {}; /* Beschriftung → { lat, lon, label } aus den Vorschlägen */
  function photonUrl(q, limit) {
    var u = PHOTON + "?q=" + encodeURIComponent(q) + "&limit=" + limit + "&bbox=" + EUROPE_BBOX;
    if (LANG === "de" || LANG === "en") u += "&lang=" + LANG;
    return u;
  }
  function placeLabel(p) {
    var parts = [p.name];
    var where = p.city || p.county || p.state;
    if (where && where !== p.name) parts.push(where);
    if (p.country) parts.push(p.country);
    return parts.filter(Boolean).join(", ");
  }
  function toPlaces(json) {
    var out = [], seen = {};
    (json.features || []).forEach(function (f) {
      var p = f.properties || {}, c = f.geometry && f.geometry.coordinates;
      if (!p.name || !c) return;
      var label = placeLabel(p);
      if (seen[label]) return;
      seen[label] = true;
      out.push({ label: label, lat: c[1], lon: c[0] });
    });
    return out;
  }
  function suggest(input, list) {
    var q = input.value.trim();
    if (q.length < 3) return;
    fetchJson(photonUrl(q, 5)).then(function (json) {
      var places = toPlaces(json);
      list.innerHTML = "";
      places.forEach(function (pl) {
        placeCache[pl.label] = pl;
        var o = document.createElement("option");
        o.value = pl.label;
        list.appendChild(o);
      });
    }).catch(function () { /* Vorschläge sind optional */ });
  }
  function geocode(q) {
    if (placeCache[q]) return Promise.resolve(placeCache[q]);
    return fetchJson(photonUrl(q, 1)).then(function (json) {
      var places = toPlaces(json);
      if (!places.length) throw { kind: "place", q: q };
      placeCache[q] = places[0];
      return places[0];
    }, function () { throw { kind: "hard" }; });
  }

  function haversine(a, b) {
    var R = 6371, toRad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toRad, dLon = (b.lon - a.lon) * toRad;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  function route(from, to) {
    var url = OSRM + from.lon + "," + from.lat + ";" + to.lon + "," + to.lat + "?overview=full&geometries=geojson";
    return fetchJson(url).then(function (json) {
      var r = json.routes && json.routes[0];
      if (json.code !== "Ok" || !r) throw new Error("OSRM " + json.code);
      /* auf ganze km runden, damit „hin + zurück“ im Rechenweg exakt aufgeht */
      return { km: Math.round(r.distance / 1000), hours: r.duration / 3600, coords: r.geometry.coordinates, estimated: false };
    }).catch(function () {
      var km = Math.round(haversine(from, to) * AIR_FACTOR);
      return { km: km, hours: km / AIR_SPEED, coords: [[from.lon, from.lat], [to.lon, to.lat]], estimated: true };
    });
  }

  /* ---------- Länder entlang der Route (Natural Earth 110m, grob) ---------- */
  var countriesPromise = null;
  function loadCountries() {
    if (!countriesPromise) {
      countriesPromise = fetchJson(ASSETS + "data/europe-countries.json").then(function (d) {
        d.countries.forEach(function (c) {
          c.b = c.r.map(function (r) {
            var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (var i = 0; i < r.length; i += 2) {
              if (r[i] < minX) minX = r[i];
              if (r[i] > maxX) maxX = r[i];
              if (r[i + 1] < minY) minY = r[i + 1];
              if (r[i + 1] > maxY) maxY = r[i + 1];
            }
            return [minX, minY, maxX, maxY];
          });
        });
        return d.countries;
      }).catch(function () { return null; });
    }
    return countriesPromise;
  }
  function inRing(r, x, y) {
    var inside = false;
    for (var i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
      var xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function countryAt(countries, lon, lat, hint) {
    var order = hint ? [hint].concat(countries) : countries;
    for (var k = 0; k < order.length; k++) {
      var c = order[k];
      for (var i = 0; i < c.r.length; i++) {
        var b = c.b[i];
        if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
        if (inRing(c.r[i], lon, lat)) return c;
      }
    }
    return null;
  }
  /* km je Land für eine Richtung; ein Punkt alle ~5 km, grobe Grenzen → „ungefähr“ */
  function splitByCountry(countries, coords) {
    var km = {}, order = [], acc = 0, last = null;
    function add(code, d) { if (!(code in km)) { km[code] = 0; order.push(code); } km[code] += d; }
    for (var i = 1; i < coords.length; i++) {
      var a = { lon: coords[i - 1][0], lat: coords[i - 1][1] }, b = { lon: coords[i][0], lat: coords[i][1] };
      acc += haversine(a, b);
      if (acc >= SAMPLE_KM || i === coords.length - 1) {
        var c = countryAt(countries, b.lon, b.lat, last);
        last = c || last;
        add(c ? c.c : "?", acc);
        acc = 0;
      }
    }
    return order.map(function (code) { return { code: code, km: km[code] }; }).filter(function (e) { return e.km >= 1; });
  }
  /* mehrere Teilstrecken (mit Faktor, z. B. 2 für hin und zurück) zu einer Länderliste zusammenfassen */
  function splitLegs(countries, legFactors) {
    var km = {}, order = [];
    legFactors.forEach(function (lf) {
      splitByCountry(countries, lf[0]).forEach(function (e) {
        if (!(e.code in km)) { km[e.code] = 0; order.push(e.code); }
        km[e.code] += e.km * lf[1];
      });
    });
    return order.map(function (code) { return { code: code, km: km[code] }; });
  }

  /* ---------- Karte (Leaflet lokal, Kacheln von OpenStreetMap) ---------- */
  var leafletPromise = null, map = null, layer = null;
  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (!leafletPromise) {
      leafletPromise = new Promise(function (resolve, reject) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = ASSETS + "vendor/leaflet/leaflet.css";
        document.head.appendChild(link);
        var s = document.createElement("script");
        s.src = ASSETS + "vendor/leaflet/leaflet.js";
        s.onload = function () { resolve(window.L); };
        s.onerror = function () { reject(new Error("leaflet")); };
        document.head.appendChild(s);
      });
    }
    return leafletPromise;
  }
  /* Ortsnamen kommen von Photon – als Text einsetzen, nicht als HTML */
  function textNode(text) { var s = document.createElement("span"); s.textContent = text; return s; }
  function drawMap(L, places, legs) {
    var el = $("#demo-map");
    if (!el) return;
    var empty = $(".demo__empty", el);
    if (empty) empty.remove();
    if (!map) {
      L.Icon.Default.imagePath = ASSETS + "vendor/leaflet/images/";
      map = L.map(el, { scrollWheelZoom: false, zoomControl: true });
      L.tileLayer(TILES, { maxZoom: 18, attribution: T.mapAttr }).addTo(map);
    }
    if (layer) layer.remove();
    var toLatLng = function (c) { return [c[1], c[0]]; };
    /* Fahrgaststrecke durchgezogen, Leerfahrten gestrichelt */
    var items = [L.polyline(legs.main.coords.map(toLatLng), { color: "#0D1C42", weight: 5, opacity: 0.95 })];
    [legs.toA, legs.back].forEach(function (lg) {
      if (lg) items.push(L.polyline(lg.coords.map(toLatLng), { color: "#0D1C42", weight: 3, opacity: 0.6, dashArray: "6 8" }));
    });
    items.push(L.marker([places.from.lat, places.from.lon], { title: T.mapFrom }).bindPopup(textNode(places.from.label)));
    items.push(L.marker([places.to.lat, places.to.lon], { title: T.mapTo }).bindPopup(textNode(places.to.label)));
    if (places.depot) items.push(L.marker([places.depot.lat, places.depot.lon], { title: T.mapDepot, opacity: 0.7 }).bindPopup(textNode(T.mapDepot + ": " + places.depot.label)));
    layer = L.featureGroup(items).addTo(map);
    map.invalidateSize();
    map.fitBounds(layer.getBounds(), { padding: [28, 28] });
  }

  /* ---------- Rechenkern: Besatzung, Tage, Preis ---------- */
  function busFor(pax) {
    for (var i = 0; i < BUSES.length; i++) if (pax <= BUSES[i][0]) return { seats: BUSES[i][0], key: BUSES[i][1] };
    return { seats: 74, key: "doppeldecker" };
  }
  /* legs.main = Abfahrtsort → Zielort; legs.toA = Betriebshof → Abfahrtsort; legs.back = Zielort → Betriebshof (nur Transfer) */
  function calc(legs, inp, p) {
    var r = legs.main, toA = legs.toA, back = legs.back;
    var hMain = r.hours * COACH_FACTOR;                   /* Lenkzeit mit Fahrgästen je Richtung */
    var hA = toA ? toA.hours * COACH_FACTOR : 0;          /* Anfahrt vom Betriebshof */
    var hB = back ? back.hours * COACH_FACTOR : hA;       /* Rückweg zum Betriebshof; bei Hin- und Rückfahrt wie die Anfahrt */
    var kmA = toA ? toA.km : 0, kmB = back ? back.km : kmA;
    var h = hMain + hA;                                   /* Lenkzeit je Richtung inkl. Anfahrt – danach bemessen sich Fahrer und Fahrtage */
    var breaks = Math.floor(h / BREAK_EVERY);
    var drivers = h <= DAY_DRIVE ? 1 : 2;
    var perDay = drivers === 1 ? DAY_DRIVE : TEAM_DRIVE;
    var legDays = Math.max(1, Math.ceil(h / perDay));
    var out = {
      h: h, hMain: hMain, hA: hA, hB: hB, kmA: kmA, kmB: kmB, depot: !!toA, breaks: breaks, drivers: drivers, perDay: perDay,
      legDays: legDays, kind: inp.kind, warn: null, tight: false,
      estimated: !!(r.estimated || (toA && toA.estimated) || (back && back.estimated))
    };

    if (inp.kind === "transfer") {
      /* ohne Betriebshof fährt der Bus leer zum Abfahrtsort zurück */
      out.leer = toA ? kmA + kmB : r.km;
      out.km = r.km + out.leer;
      out.hTotal = toA ? hA + hMain + hB : 2 * hMain;
      out.days = Math.max(legDays, Math.ceil(out.hTotal / perDay));
      out.nights = out.days - 1;
    } else if (inp.kind === "round") {
      out.leer = 2 * kmA;
      out.km = 2 * r.km + out.leer;
      var minDays = 2 * legDays;
      var span = Math.round((inp.returnDate - inp.date) / 864e5) + 1;
      out.span = span;
      out.days = Math.max(span, minDays);
      out.nights = out.days - 1;
      if (span < minDays) out.warn = fmt(T.feasReturn, { date: fmtDate(addDays(inp.date, minDays - 1)), n: plural(T.days, out.days) });
    } else { /* Tagesfahrt / Andere: hin und zurück am selben Tag */
      out.leer = 2 * kmA;
      out.km = 2 * r.km + out.leer;
      var Hd = 2 * h;
      out.hTotal = Hd;
      out.breaks = Math.floor(Hd / BREAK_EVERY);
      if (Hd <= DAY_DRIVE) { out.drivers = 1; out.days = 1; out.nights = 0; }
      else if (Hd <= TEAM_DRIVE) { out.drivers = 2; out.days = 1; out.nights = 0; }
      else { out.drivers = 2; out.days = Math.max(2, 2 * legDays); out.nights = out.days - 1; out.warn = fmt(T.feasNoDay, { h: fmtDur(Hd), n: plural(T.days, out.days) }); }
    }
    if (out.drivers === 1) {
      var duty = (inp.kind === "day" ? out.hTotal : h) + out.breaks * BREAK_H;
      if (duty > TIGHT_DUTY) { out.tight = true; out.duty = duty; }
    }
    if (inp.time) { /* Ankunft der Hinfahrt: Abfahrtszeit gilt am Abfahrtsort, also ohne Anfahrt */
      var dep = new Date(inp.date);
      dep.setHours(inp.time[0], inp.time[1], 0, 0);
      var mainBreaks = Math.floor(hMain / BREAK_EVERY);
      var arr = new Date(dep.getTime() + (hMain + (out.drivers === 1 ? mainBreaks * BREAK_H : 0)) * 36e5);
      out.arrive = { dep: fmtTime(dep), time: fmtTime(arr), next: arr.getDate() !== dep.getDate() };
    }
    out.bus = busFor(inp.pax);

    var kmPrice = out.km * p.rate;
    var minimum = out.days * p.dayMin;
    out.kmPrice = kmPrice;
    out.minimum = minimum;
    out.minApplies = minimum > kmPrice;
    out.base = Math.max(kmPrice, minimum);
    out.extra = (out.drivers - 1) * out.days * p.extraDriver;
    out.hotel = out.nights * out.drivers * p.night;
    out.kindAdj = out.base * p.pct / 100;
    out.total = out.base + out.extra + out.hotel + out.kindAdj;
    out.perPerson = out.total / inp.pax;
    return out;
  }

  /* ---------- Ausgabe ---------- */
  function setOut(key, text) { var el = $('[data-out="' + key + '"]'); if (el) el.textContent = text; }
  function render(res, legs, inp, p, countries, places) {
    var r = legs.main;
    var box = $("#demo-result");
    setOut("km", fmtKm(r.km, r.estimated));
    setOut("leer", fmtKm(res.leer, res.estimated));
    setOut("kmTotal", fmtKm(res.km, res.estimated));
    setOut("dur", fmtDur(res.h));
    setOut("bus", T.bus[res.bus.key] + " · " + fmt(T.seats, { n: res.bus.seats }));
    setOut("days", plural(T.days, res.days) + " · " + plural(T.nights, res.nights));

    /* Rechenweg: jeder Schritt mit der Regel, die angewendet wurde */
    var est = res.estimated;
    var scope = res.kind === "day" ? T.scopeAll : T.scopeLeg;
    var hRef = res.kind === "day" ? res.hTotal : res.h;   /* Lenkzeit, nach der Fahrer und Pausen bemessen werden */
    var dn = { days: plural(T.days, res.days), nights: plural(T.nights, res.nights) };
    var daysText = res.kind === "transfer"
      ? (res.depot
        ? fmt(T.stDaysTransferDepot, { ha: fmtDur(res.hA), hm: fmtDur(res.hMain), hb: fmtDur(res.hB), H: fmtDur(res.hTotal), per: res.perDay, days: dn.days, nights: dn.nights })
        : fmt(T.stDaysTransfer, { h: fmtDur(res.h), H: fmtDur(res.hTotal), per: res.perDay, days: dn.days, nights: dn.nights }))
      : res.kind === "round"
        ? fmt(res.span < res.days ? T.stDaysRoundMin : T.stDaysRound, { d1: fmtDate(inp.date), d2: fmtDate(inp.returnDate), span: plural(T.days, res.span), legDays: plural(T.legDays, res.legDays), days: dn.days, nights: dn.nights })
        : fmt(res.warn ? T.stDaysDayNo : T.stDaysDay, { H: fmtDur(res.hTotal), days: dn.days, nights: dn.nights });
    var depotName = places && places.depot ? places.depot.label.split(",")[0] : "";
    var leerText = res.depot
      ? fmt(res.kind === "transfer" ? T.stLeerDepotTransfer : T.stLeerDepot, { d: depotName, km1: fmtKm(res.kmA, est), km2: fmtKm(res.kmB, est), leer: fmtKm(res.leer, est) })
      : fmt(res.kind === "transfer" ? T.stLeerNoneTransfer : T.stLeerNone, { leer: fmtKm(res.leer, est) });
    var steps = [
      [T.stRoute, r.estimated ? fmt(T.stRouteEst, { km: fmtKm(r.km) }) : fmt(T.stRouteT, { km: fmtKm(r.km), t: fmtDur(r.hours) })],
      [T.stLeer, leerText],
      [T.stCoach, res.depot
        ? fmt(T.stCoachDepot, { t: fmtDur(r.hours), hm: fmtDur(res.hMain), ha: fmtDur(res.hA), h: fmtDur(res.h) })
        : fmt(T.stCoachT, { t: fmtDur(r.hours), h: fmtDur(res.h) })],
      [T.stBreaks, res.breaks
        ? fmt(T.stBreaksT, { b: res.breaks, duty: fmtDur(hRef + res.breaks * BREAK_H), scope: scope })
        : fmt(T.stBreaksNone, { scope: scope })],
      [T.stDrivers, fmt(res.drivers === 1 ? T.stDriversOne : T.stDriversTwo, { h: fmtDur(hRef), scope: scope })],
      [T.stDays, daysText]
    ];
    var mainBreaks = Math.floor(res.hMain / BREAK_EVERY);
    if (res.arrive) steps.push([T.stArrive, fmt(T.stArriveT, {
      dep: res.arrive.dep, h: fmtDur(res.hMain),
      br: res.drivers === 1 && mainBreaks ? fmt(T.brT, { n: mainBreaks }) : "",
      a: fmt(res.arrive.next ? T.arriveNext : T.arrive, { t: res.arrive.time })
    })]);
    steps.push([T.stBus, fmt(T.stBusT, { n: inp.pax, bus: T.bus[res.bus.key], seats: res.bus.seats })]);
    var stepsEl = $('[data-out="steps"]');
    if (stepsEl) {
      stepsEl.innerHTML = "";
      steps.forEach(function (st) {
        var li = document.createElement("li");
        li.innerHTML = "<b></b><span></span>";
        li.firstChild.textContent = st[0];
        li.lastChild.textContent = st[1];
        stepsEl.appendChild(li);
      });
    }
    var feas = res.warn ? res.warn : res.tight ? fmt(T.feasTight, { h: Math.round(res.duty) }) : T.feasOk;
    var feasEl = $('[data-out="feasible"]');
    if (feasEl) { feasEl.textContent = feas; feasEl.classList.toggle("is-warn", !!(res.warn || res.tight)); }

    /* Länder über alle Teilstrecken: Fahrgaststrecke (×2 bei Hin- und Rückfahrt) plus Leerfahrten */
    var legFactors = [[r.coords, res.kind === "transfer" ? 1 : 2]];
    if (res.kind === "transfer") {
      if (legs.toA) { legFactors.push([legs.toA.coords, 1]); legFactors.push([legs.back.coords, 1]); }
      else legFactors.push([r.coords, 1]); /* Leerfahrt zurück auf derselben Strecke */
    } else if (legs.toA) legFactors.push([legs.toA.coords, 2]);
    var split = countries ? splitLegs(countries, legFactors) : [];
    var cEl = $('[data-out="countries"]');
    if (cEl) {
      cEl.innerHTML = "";
      if (!split.length) cEl.textContent = T.countriesNone;
      split.forEach(function (e) {
        var s = document.createElement("span");
        s.className = "demo__country";
        s.innerHTML = "<b></b> <span></span>";
        s.firstChild.textContent = e.code === "?" ? T.other : e.code;
        s.lastChild.textContent = fmtKm(e.km, est);
        cEl.appendChild(s);
      });
    }

    setOut("total", eur.format(res.total));
    setOut("perPerson", fmt(T.perPerson, { p: eur.format(res.perPerson) }));
    var lines = $('[data-out="lines"]');
    if (lines) {
      lines.innerHTML = "";
      /* Jede Position wird gezeigt – auch mit 0 –, damit der Rechenweg nachvollziehbar bleibt. [Text, Wert, Klasse] */
      var items = [
        [fmt(res.kind === "transfer" ? (res.depot ? T.lnDistTransferDepot : T.lnDistTransfer) : (res.depot ? T.lnDistDepot : T.lnDist),
          { km1: fmtKm(r.km, est), leer: fmtKm(res.leer, est) }), fmtKm(res.km, est), ""],
        [fmt(T.lnKm, { km: fmtKm(res.km, est), rate: eur2.format(p.rate) }) + (res.minApplies ? T.lnOff : T.lnApplies),
          eur2.format(res.kmPrice), res.minApplies ? "is-off" : "is-base"],
        [fmt(T.lnMin, { days: dn.days, rate: eur.format(p.dayMin) }) + (res.minApplies ? T.lnApplies : T.lnOff),
          eur2.format(res.minimum), res.minApplies ? "is-base" : "is-off"],
        [res.drivers > 1 ? fmt(T.lnExtra, { n: res.drivers - 1, days: dn.days, rate: eur.format(p.extraDriver) }) : T.lnExtraNone,
          eur2.format(res.extra), res.drivers > 1 ? "" : "is-zero"],
        [res.nights > 0 ? fmt(T.lnHotel, { nights: res.nights, d: plural(T.drivers, res.drivers), rate: eur.format(p.night) }) : T.lnHotelNone,
          eur2.format(res.hotel), res.nights > 0 ? "" : "is-zero"],
        [p.pct ? fmt(T.lnKind, { pct: (p.pct > 0 ? "+" : "") + p.pct, base: eur2.format(res.base) }) : T.lnKindNone,
          eur2.format(res.kindAdj), p.pct ? "" : "is-zero"],
        [T.lnSum, eur2.format(res.total), "is-sum"],
        [fmt(T.lnPP, { total: eur2.format(res.total), n: inp.pax }), eur2.format(res.perPerson), ""]
      ];
      items.forEach(function (it) {
        var li = document.createElement("li");
        if (it[2]) li.className = it[2];
        li.innerHTML = "<span></span><b></b>";
        li.firstChild.textContent = it[0];
        li.lastChild.textContent = it[1];
        lines.appendChild(li);
      });
    }
    if (box) box.hidden = false;

    /* Chips an den Schritten des Rechenwegs (01–06) */
    var section = root.closest(".st") || document;
    var steps = Array.prototype.slice.call(section.querySelectorAll(".pipe .pipe__step"));
    var pipe = section.querySelector(".pipe");
    var chips = [
      fmt(T.chipPax, { n: inp.pax, kind: T.chipKind[res.kind] }),
      fmtKm(r.km, r.estimated),
      T.bus[res.bus.key] + " · " + fmt(T.seats, { n: res.bus.seats }),
      fmt(T.chipCrew, { d: plural(T.drivers, res.drivers), n: plural(T.nights, res.nights) }),
      split.length ? split.map(function (e) { return e.code === "?" ? "…" : e.code; }).join(" · ") : "—",
      fmt(T.chipPrice, { p: eur.format(res.total) })
    ];
    if (pipe) pipe.classList.add("is-live");
    steps.forEach(function (step, i) {
      var chip = step.querySelector(".pipe__chip");
      if (!chip) { chip = document.createElement("span"); chip.className = "pipe__chip"; step.appendChild(chip); }
      chip.classList.remove("is-live");
      chip.textContent = chips[i] || "";
      var show = function () { chip.classList.add("is-live"); };
      if (reduceMotion) show(); else setTimeout(show, 120 + i * 200);
    });
  }

  /* ---------- Formular ---------- */
  var fromIn = $("#demo-from"), toIn = $("#demo-to"), depotIn = $("#demo-depot");
  var msg = $("#demo-msg"), submit = $("#demo-submit");
  var kindInputs = $$('input[name="kind"]');
  var PARAMS = ["rate", "dayMin", "extraDriver", "night", "pct"];

  function kind() { var k = kindInputs.filter(function (i) { return i.checked; })[0]; return k ? k.value : "round"; }
  function syncKind() {
    var k = kind();
    $$("[data-kind]").forEach(function (el) { el.hidden = el.getAttribute("data-kind") !== k; });
  }
  function showMsg(text, warn) {
    if (!msg) return;
    msg.textContent = text || "";
    msg.hidden = !text;
    msg.classList.toggle("is-warn", !!warn);
  }
  function setBusy(b) {
    if (!submit) return;
    submit.disabled = b;
    submit.textContent = b ? T.busy : T.calc;
  }
  function num(name) { var el = form.elements[name]; return el ? parseFloat(String(el.value).replace(",", ".")) : NaN; }
  function invalid(el, bad) {
    var q = el.closest(".q");
    if (q) q.classList.toggle("is-invalid", bad);
    return bad;
  }
  function read() {
    var bad = [];
    var date = parseDate(form.elements.date.value), ret = parseDate(form.elements.returnDate.value);
    var pax = parseInt(form.elements.pax.value, 10);
    if (invalid(fromIn, !fromIn.value.trim())) bad.push(fromIn);
    if (invalid(toIn, !toIn.value.trim())) bad.push(toIn);
    if (invalid(form.elements.date, !date)) bad.push(form.elements.date);
    if (kind() === "round" && invalid(form.elements.returnDate, !ret || (date && ret < date))) bad.push(form.elements.returnDate);
    if (invalid(form.elements.pax, !(pax >= 1 && pax <= 74))) bad.push(form.elements.pax);
    var p = {};
    PARAMS.forEach(function (k) {
      var v = num(k);
      var ok = isFinite(v) && (k === "pct" ? v >= -100 && v <= 300 : k === "rate" ? v > 0 : v >= 0);
      if (invalid(form.elements[k], !ok)) bad.push(form.elements[k]);
      p[k] = v;
    });
    if (bad.length) { bad[0].focus(); showMsg(T.errFields, true); return null; }
    var t = form.elements.time && form.elements.time.value ? form.elements.time.value.split(":").map(Number) : null;
    return { inp: { kind: kind(), date: date, returnDate: ret, pax: pax, time: t && t.length === 2 ? t : null }, p: p };
  }
  function saveParams() {
    var p = {};
    PARAMS.forEach(function (k) { p[k] = form.elements[k] ? form.elements[k].value : ""; });
    if (depotIn) p.depot = depotIn.value;
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) { /* privater Modus */ }
  }
  function restoreParams() {
    try {
      var p = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (p) PARAMS.forEach(function (k) { if (form.elements[k] && p[k] !== undefined && p[k] !== "") form.elements[k].value = p[k]; });
      if (p && depotIn && typeof p.depot === "string") depotIn.value = p.depot;
    } catch (e) { /* ignorieren */ }
  }
  function defaultDates() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var d = form.elements.date, r = form.elements.returnDate;
    var min = isoDate(addDays(today, 1));
    if (d) { d.min = min; if (!d.value) d.value = isoDate(addDays(today, 14)); }
    if (r) { r.min = min; if (!r.value) r.value = isoDate(addDays(parseDate(d.value) || today, 2)); }
  }

  function debounce(fn, ms) {
    var t;
    return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); };
  }
  [[fromIn, "#demo-from-list"], [toIn, "#demo-to-list"], [depotIn, "#demo-depot-list"]].forEach(function (pair) {
    var list = $(pair[1]);
    if (pair[0] && list) pair[0].addEventListener("input", debounce(function () { suggest(pair[0], list); }, 300));
  });
  kindInputs.forEach(function (i) { i.addEventListener("change", syncKind); });
  form.addEventListener("input", function (e) {
    var q = e.target.closest(".q");
    if (q && q.classList.contains("is-invalid")) q.classList.remove("is-invalid");
    if (PARAMS.indexOf(e.target.name) >= 0 || e.target.name === "depot") saveParams();
  });
  form.addEventListener("change", function (e) {
    if (e.target.name === "date" && form.elements.returnDate) {
      var d = parseDate(e.target.value), r = parseDate(form.elements.returnDate.value);
      if (d && (!r || r < d)) form.elements.returnDate.value = isoDate(addDays(d, 2));
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = read();
    if (!data) return;
    showMsg("");
    setBusy(true);
    var depotQ = depotIn ? depotIn.value.trim() : "";
    var geos = [geocode(fromIn.value.trim()), geocode(toIn.value.trim())];
    if (depotQ) geos.push(geocode(depotQ));
    Promise.all(geos).then(function (pl) {
      var places = { from: pl[0], to: pl[1], depot: pl[2] || null };
      /* Teilstrecken: Fahrgäste A→B; mit Betriebshof dazu D→A und – nur beim Transfer – B→D */
      var routes = [route(places.from, places.to)];
      if (places.depot) {
        routes.push(route(places.depot, places.from));
        if (data.inp.kind === "transfer") routes.push(route(places.to, places.depot));
      }
      return Promise.all(routes).then(function (rs) {
        var legs = { main: rs[0], toA: rs[1] || null, back: rs[2] || null };
        return Promise.all([loadCountries(), loadLeaflet().catch(function () { return null; })]).then(function (deps) {
          var res = calc(legs, data.inp, data.p);
          render(res, legs, data.inp, data.p, deps[0], places);
          if (deps[1]) drawMap(deps[1], places, legs);
          if (res.estimated) showMsg(T.errRoute, true);
        });
      });
    }).catch(function (err) {
      if (err && err.kind === "place") {
        var el = [fromIn, toIn, depotIn].filter(function (i) { return i && i.value.trim() === err.q; })[0] || fromIn;
        invalid(el, true);
        el.focus();
        showMsg(fmt(T.errPlace, { q: err.q }), true);
      } else {
        showMsg(T.errHard, true);
      }
    }).finally(function () { setBusy(false); });
  });

  restoreParams();
  defaultDates();
  syncKind();
})();
