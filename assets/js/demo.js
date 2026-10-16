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
    return s && s.src ? s.src.replace(/js\/demo\.js(\?.*)?$/, "") : "assets/";
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
      crewSingle: "1 Fahrer: {h} Lenkzeit je Richtung, {b} × 45 Min. Pause, {d} je Richtung.",
      crewTeam: "2 Fahrer (Doppelbesatzung): {h} Lenkzeit je Richtung, bis zu 18 Std. am Tag, {d} je Richtung.",
      legDays: { 1: "1 Fahrtag", n: "{n} Fahrtage" },
      kindTransfer: "Transfer: Fahrgäste nur hin; der Bus kommt leer zurück (Leerfahrt {km}).",
      kindRound: "Hin- und Rückfahrt: Bus und Fahrer bleiben {n} bei der Gruppe.",
      kindDay: "Tagesfahrt: Hin- und Rückfahrt am selben Tag, {h} Lenkzeit gesamt.",
      arrive: "Ankunft gegen {t} Uhr.", arriveNext: "Ankunft am Folgetag gegen {t} Uhr.",
      feasOk: "Machbar nach EU 561/2006.", feasTight: "Knapp: rund {h} Std. Dienst für einen Fahrer – BusFlow prüft hier die Variante mit zweitem Fahrer.",
      feasNoDay: "An einem Tag nicht machbar ({h} Lenkzeit) – BusFlow schlägt Übernachtungen vor; gerechnet mit {n}.",
      feasReturn: "Rückfahrt frühestens am {date} – gerechnet mit {n}.",
      countriesNone: "Keine Länderzuordnung möglich (grobe Grenzen).", other: "sonstige",
      lineKm: "{km} × {rate}/km", lineMin: "Tagesminimum greift: {days} × {rate}",
      lineExtra: "Zusätzlicher Fahrer: {n} × {days} × {rate}", lineHotel: "Übernachtungen: {nights} × {d} × {rate}",
      lineKind: "Fahrtart {pct} %", perPerson: "{p} pro Person",
      chipKind: { transfer: "Transfer", round: "Hin & Rück", day: "Tagesfahrt" }, chipPax: "{n} Pers. · {kind}",
      chipCrew: "{d} · {n}", chipPrice: "{p} netto",
      busy: "Berechne …", calc: "Fahrpreis berechnen",
      errPlace: "„{q}“ wurde nicht gefunden. Bitte wählen Sie einen Ort aus der Liste.",
      errRoute: "Routing-Dienst gerade nicht erreichbar – Entfernung als Luftlinie × 1,3 geschätzt.",
      errHard: "Ortssuche gerade nicht erreichbar. Bitte versuchen Sie es in einer Minute noch einmal.",
      errFields: "Bitte prüfen Sie die markierten Felder.",
      mapAttr: "© OpenStreetMap-Mitwirkende", mapFrom: "Abfahrt", mapTo: "Ziel"
    },
    hr: {
      bus: { kleinbus: "Kombi", minibus: "Minibus", midibus: "Midibus", reisebus: "Turistički autobus", doppeldecker: "Autobus na kat" },
      seats: "{n} mjesta", km: "{n} km", kmEst: "{n} km (procjena)", dur: "{h} h {m} min", durShort: "{h} h",
      days: { 1: "1 dan", n: "{n} dana" }, nights: { 0: "bez noćenja", 1: "1 noćenje", n: "{n} noćenja" },
      drivers: { 1: "1 vozač", n: "{n} vozača" },
      crewSingle: "1 vozač: {h} vožnje po smjeru, {b} × 45 min pauze, {d} po smjeru.",
      crewTeam: "2 vozača (dvostruka posada): {h} vožnje po smjeru, do 18 h dnevno, {d} po smjeru.",
      legDays: { 1: "1 dan vožnje", n: "{n} dana vožnje" },
      kindTransfer: "Transfer: putnici samo u odlasku; autobus se vraća prazan (prazna vožnja {km}).",
      kindRound: "Povratna vožnja: autobus i vozači ostaju {n} s grupom.",
      kindDay: "Jednodnevna vožnja: odlazak i povratak isti dan, {h} vožnje ukupno.",
      arrive: "Dolazak oko {t}.", arriveNext: "Dolazak sutradan oko {t}.",
      feasOk: "Izvedivo prema EU 561/2006.", feasTight: "Tijesno: oko {h} h dužnosti za jednog vozača – BusFlow ovdje provjerava varijantu s drugim vozačem.",
      feasNoDay: "Nije izvedivo u jednom danu ({h} vožnje) – BusFlow predlaže noćenja; računano s {n}.",
      feasReturn: "Povratak najranije {date} – računano s {n}.",
      countriesNone: "Države nije moguće odrediti (grube granice).", other: "ostalo",
      lineKm: "{km} × {rate}/km", lineMin: "Vrijedi dnevni minimum: {days} × {rate}",
      lineExtra: "Dodatni vozač: {n} × {days} × {rate}", lineHotel: "Noćenja: {nights} × {d} × {rate}",
      lineKind: "Vrsta vožnje {pct} %", perPerson: "{p} po osobi",
      chipKind: { transfer: "Transfer", round: "Povratna", day: "Jednodnevna" }, chipPax: "{n} os. · {kind}",
      chipCrew: "{d} · {n}", chipPrice: "{p} neto",
      busy: "Računam …", calc: "Izračunajte cijenu",
      errPlace: "„{q}“ nije pronađeno. Odaberite mjesto s popisa.",
      errRoute: "Servis za rutiranje trenutačno nije dostupan – udaljenost je procijenjena kao zračna × 1,3.",
      errHard: "Pretraga mjesta trenutačno nije dostupna. Pokušajte ponovno za minutu.",
      errFields: "Provjerite označena polja.",
      mapAttr: "© suradnici OpenStreetMapa", mapFrom: "Polazak", mapTo: "Odredište"
    },
    en: {
      bus: { kleinbus: "Minivan", minibus: "Minibus", midibus: "Midibus", reisebus: "Coach", doppeldecker: "Double-decker" },
      seats: "{n} seats", km: "{n} km", kmEst: "{n} km (estimated)", dur: "{h} h {m} min", durShort: "{h} h",
      days: { 1: "1 day", n: "{n} days" }, nights: { 0: "no overnight stay", 1: "1 overnight stay", n: "{n} overnight stays" },
      drivers: { 1: "1 driver", n: "{n} drivers" },
      crewSingle: "1 driver: {h} driving per direction, {b} × 45 min break, {d} per direction.",
      crewTeam: "2 drivers (multi-manning): {h} driving per direction, up to 18 h a day, {d} per direction.",
      legDays: { 1: "1 driving day", n: "{n} driving days" },
      kindTransfer: "Transfer: passengers one way; the coach returns empty (empty run {km}).",
      kindRound: "Round trip: coach and drivers stay {n} with the group.",
      kindDay: "Day trip: out and back on the same day, {h} driving in total.",
      arrive: "Arrival at about {t}.", arriveNext: "Arrival the next day at about {t}.",
      feasOk: "Feasible under EU 561/2006.", feasTight: "Tight: about {h} h on duty for one driver – BusFlow checks the second-driver option here.",
      feasNoDay: "Not feasible in one day ({h} driving) – BusFlow suggests overnight stays; calculated with {n}.",
      feasReturn: "Return at the earliest on {date} – calculated with {n}.",
      countriesNone: "Countries could not be assigned (coarse borders).", other: "other",
      lineKm: "{km} × {rate}/km", lineMin: "Daily minimum applies: {days} × {rate}",
      lineExtra: "Additional driver: {n} × {days} × {rate}", lineHotel: "Overnight stays: {nights} × {d} × {rate}",
      lineKind: "Trip type {pct} %", perPerson: "{p} per person",
      chipKind: { transfer: "Transfer", round: "Round trip", day: "Day trip" }, chipPax: "{n} pax · {kind}",
      chipCrew: "{d} · {n}", chipPrice: "{p} net",
      busy: "Calculating …", calc: "Calculate the fare",
      errPlace: "“{q}” was not found. Please pick a place from the list.",
      errRoute: "Routing service unavailable right now – distance estimated as great-circle × 1.3.",
      errHard: "Place search unavailable right now. Please try again in a minute.",
      errFields: "Please check the highlighted fields.",
      mapAttr: "© OpenStreetMap contributors", mapFrom: "Departure", mapTo: "Destination"
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
      return { km: r.distance / 1000, hours: r.duration / 3600, coords: r.geometry.coordinates, estimated: false };
    }).catch(function () {
      var km = haversine(from, to) * AIR_FACTOR;
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
  function drawMap(L, from, to, coords) {
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
    var latlngs = coords.map(function (c) { return [c[1], c[0]]; });
    layer = L.featureGroup([
      L.polyline(latlngs, { color: "#0D1C42", weight: 5, opacity: 0.95 }),
      L.marker([from.lat, from.lon], { title: T.mapFrom }).bindPopup(from.label),
      L.marker([to.lat, to.lon], { title: T.mapTo }).bindPopup(to.label)
    ]).addTo(map);
    map.invalidateSize();
    map.fitBounds(layer.getBounds(), { padding: [28, 28] });
  }

  /* ---------- Rechenkern: Besatzung, Tage, Preis ---------- */
  function busFor(pax) {
    for (var i = 0; i < BUSES.length; i++) if (pax <= BUSES[i][0]) return { seats: BUSES[i][0], key: BUSES[i][1] };
    return { seats: 74, key: "doppeldecker" };
  }
  function calc(r, inp, p) {
    var h = r.hours * COACH_FACTOR;                       /* Lenkzeit je Richtung */
    var breaks = Math.floor(h / BREAK_EVERY);
    var drivers = h <= DAY_DRIVE ? 1 : 2;
    var perDay = drivers === 1 ? DAY_DRIVE : TEAM_DRIVE;
    var legDays = Math.max(1, Math.ceil(h / perDay));
    var out = { h: h, breaks: breaks, drivers: drivers, legDays: legDays, kind: inp.kind, km: r.km * 2, warn: null, tight: false };

    if (inp.kind === "transfer") {
      out.days = Math.max(legDays, Math.ceil(2 * h / perDay));
      out.nights = out.days - 1;
      out.leer = r.km;
    } else if (inp.kind === "round") {
      var minDays = 2 * legDays;
      var span = Math.round((inp.returnDate - inp.date) / 864e5) + 1;
      out.days = Math.max(span, minDays);
      out.nights = out.days - 1;
      if (span < minDays) out.warn = fmt(T.feasReturn, { date: fmtDate(addDays(inp.date, minDays - 1)), n: plural(T.days, out.days) });
    } else { /* Tagesfahrt / Andere: hin und zurück am selben Tag */
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
    if (inp.time) { /* Ankunft der Hinfahrt */
      var dep = new Date(inp.date);
      dep.setHours(inp.time[0], inp.time[1], 0, 0);
      var arr = new Date(dep.getTime() + (h + (out.drivers === 1 ? breaks * BREAK_H : 0)) * 36e5);
      out.arrive = { time: fmtTime(arr), next: arr.getDate() !== dep.getDate() };
    }
    out.bus = busFor(inp.pax);

    var kmPrice = out.km * p.rate;
    var minimum = out.days * p.dayMin;
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
  function render(res, r, inp, p, countries) {
    var box = $("#demo-result");
    setOut("km", fmtKm(r.km, r.estimated));
    setOut("dur", fmtDur(res.h));
    setOut("bus", T.bus[res.bus.key] + " · " + fmt(T.seats, { n: res.bus.seats }));
    setOut("days", plural(T.days, res.days) + " · " + plural(T.nights, res.nights));

    var crew = res.drivers === 1
      ? fmt(T.crewSingle, { h: fmtDur(res.h), b: res.breaks, d: plural(T.legDays, res.legDays) })
      : fmt(T.crewTeam, { h: fmtDur(res.h), d: plural(T.legDays, res.legDays) });
    var kindText = res.kind === "transfer" ? fmt(T.kindTransfer, { km: fmtKm(res.leer, r.estimated) })
      : res.kind === "round" ? fmt(T.kindRound, { n: plural(T.days, res.days) })
      : fmt(T.kindDay, { h: fmtDur(res.hTotal) });
    if (res.arrive) kindText += " " + fmt(res.arrive.next ? T.arriveNext : T.arrive, { t: res.arrive.time });
    setOut("crew", crew + " " + kindText);
    var feas = res.warn ? res.warn : res.tight ? fmt(T.feasTight, { h: Math.round(res.duty) }) : T.feasOk;
    var feasEl = $('[data-out="feasible"]');
    if (feasEl) { feasEl.textContent = feas; feasEl.classList.toggle("is-warn", !!(res.warn || res.tight)); }

    var split = countries ? splitByCountry(countries, r.coords) : [];
    var cEl = $('[data-out="countries"]');
    if (cEl) {
      cEl.innerHTML = "";
      if (!split.length) cEl.textContent = T.countriesNone;
      split.forEach(function (e) {
        var s = document.createElement("span");
        s.className = "demo__country";
        s.innerHTML = "<b></b> <span></span>";
        s.firstChild.textContent = e.code === "?" ? T.other : e.code;
        s.lastChild.textContent = fmtKm(e.km * 2); /* hin und zurück bzw. inkl. Leerfahrt */
        cEl.appendChild(s);
      });
    }

    setOut("total", eur.format(res.total));
    setOut("perPerson", fmt(T.perPerson, { p: eur.format(res.perPerson) }));
    var lines = $('[data-out="lines"]');
    if (lines) {
      lines.innerHTML = "";
      var items = [];
      items.push([res.minApplies
        ? fmt(T.lineMin, { days: plural(T.days, res.days), rate: eur.format(p.dayMin) })
        : fmt(T.lineKm, { km: fmtKm(res.km, r.estimated), rate: eur2.format(p.rate) }), res.base]);
      if (res.extra) items.push([fmt(T.lineExtra, { n: res.drivers - 1, days: plural(T.days, res.days), rate: eur.format(p.extraDriver) }), res.extra]);
      if (res.hotel) items.push([fmt(T.lineHotel, { nights: res.nights, d: plural(T.drivers, res.drivers), rate: eur.format(p.night) }), res.hotel]);
      if (res.kindAdj) items.push([fmt(T.lineKind, { pct: (p.pct > 0 ? "+" : "") + p.pct }), res.kindAdj]);
      items.forEach(function (it) {
        var li = document.createElement("li");
        li.innerHTML = "<span></span><b></b>";
        li.firstChild.textContent = it[0];
        li.lastChild.textContent = eur.format(it[1]);
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
  var fromIn = $("#demo-from"), toIn = $("#demo-to");
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
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) { /* privater Modus */ }
  }
  function restoreParams() {
    try {
      var p = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (p) PARAMS.forEach(function (k) { if (form.elements[k] && p[k] !== undefined && p[k] !== "") form.elements[k].value = p[k]; });
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
  [[fromIn, "#demo-from-list"], [toIn, "#demo-to-list"]].forEach(function (pair) {
    var list = $(pair[1]);
    if (pair[0] && list) pair[0].addEventListener("input", debounce(function () { suggest(pair[0], list); }, 300));
  });
  kindInputs.forEach(function (i) { i.addEventListener("change", syncKind); });
  form.addEventListener("input", function (e) {
    var q = e.target.closest(".q");
    if (q && q.classList.contains("is-invalid")) q.classList.remove("is-invalid");
    if (PARAMS.indexOf(e.target.name) >= 0) saveParams();
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
    Promise.all([geocode(fromIn.value.trim()), geocode(toIn.value.trim())]).then(function (pl) {
      return route(pl[0], pl[1]).then(function (r) {
        return Promise.all([loadCountries(), loadLeaflet().catch(function () { return null; })]).then(function (deps) {
          var res = calc(r, data.inp, data.p);
          render(res, r, data.inp, data.p, deps[0]);
          if (deps[1]) drawMap(deps[1], pl[0], pl[1], r.coords);
          if (r.estimated) showMsg(T.errRoute, true);
        });
      });
    }).catch(function (err) {
      if (err && err.kind === "place") {
        var el = fromIn.value.trim() === err.q ? fromIn : toIn;
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
