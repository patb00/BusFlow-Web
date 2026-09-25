/* BusFlow landing — ponašanje stranice: postavke iz config.js, mobilni izbornik, skaliranje hero-filma,
   tračnica (autobus + ispuna + paljenje stanica), ulazne animacije sekcija, putna karta (korak 1 → upit.html)
   i gumb za kalendar termina (Microsoft Bookings). Bez ovisnosti. */
(function () {
  "use strict";

  var html = document.documentElement;
  html.classList.add("js");

  var cfg = window.BUSFLOW || {};
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  var LANG = (html.lang || "de").slice(0, 2).toLowerCase();
  var MIN = { de: "Min.", hr: "min", en: "min" }[LANG] || "min";
  /* vrijednost iz config.js; { de: …, hr: …, en: … } daje tekst za jezik stranice */
  function localize(v) { return v && typeof v === "object" && ("de" in v || "hr" in v) ? (LANG in v ? v[LANG] : v.de) : v; }
  function get(key) { return localize(key.split(".").reduce(function (o, p) { return o && o[p]; }, cfg)); }

  /* ---------- Postavke iz config.js ---------- */
  function applyConfig() {
    var phone = (get("phone") || "").toString().trim();
    var phoneDisplay = (get("phoneDisplay") || phone).toString().trim();

    $$("[data-cfg]").forEach(function (el) {
      var key = el.getAttribute("data-cfg");
      var v;
      if (key === "phoneDisplay") v = phoneDisplay;
      else if (key === "meetingMinutes") v = get("meetingMinutes") ? get("meetingMinutes") + " " + MIN : "";
      else v = get(key);
      if (v === undefined || v === null || v === "") {
        if (key === "phoneDisplay") el.hidden = true; /* bez telefona u configu nema oznake [Telefon] */
        return;
      }
      el.textContent = String(v);
    });

    $$("[data-cfg-href]").forEach(function (el) {
      var key = el.getAttribute("data-cfg-href");
      var v = key === "phone" ? phone : get(key);
      if (!v) { if (key === "phone") el.hidden = true; return; }
      if (key === "phone") el.setAttribute("href", "tel:" + String(v).replace(/[^+\d]/g, ""));
      else if (key === "email") el.setAttribute("href", "mailto:" + v);
      else el.setAttribute("href", String(v));
      el.removeAttribute("aria-disabled");
    });
  }

  /* ---------- Mobilni izbornik ---------- */
  function setupNav() {
    var toggle = $(".nav-toggle");
    var nav = document.getElementById("nav");
    if (!toggle || !nav) return;
    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
    });
  }

  /* ---------- Skaliranje hero-filma (pozornica 720×540 u okvir) ---------- */
  function setupStageScale() {
    var frames = $$(".stage-frame");
    if (!frames.length) return;
    function fit(frame) {
      var stage = $(".stage", frame);
      var w = frame.getBoundingClientRect().width;
      if (stage && w > 0) stage.style.setProperty("--stage-scale", (w / 720).toFixed(5));
    }
    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function (entries) { entries.forEach(function (e) { fit(e.target); }); });
      frames.forEach(function (f) { ro.observe(f); });
    } else {
      window.addEventListener("resize", function () { frames.forEach(fit); });
    }
    frames.forEach(fit);
  }

  /* ---------- Tračnica: autobus, ispuna i paljenje stanica ---------- */
  function supportsScrollTimeline() {
    return typeof CSS !== "undefined" && CSS.supports && CSS.supports("animation-timeline: scroll()");
  }

  function setupRail() {
    var page = $(".page");
    var prog = $(".rail-progress");
    if (!page || !prog) return;

    var sda = supportsScrollTimeline();
    if (!sda) html.classList.add("no-sda");

    var fill = $(".rail-fill", prog);
    var bus = $(".rail-bus", prog);
    var pFill = $(".progress__fill");
    var pBus = $(".progress__bus");
    var badges = $$(".st__rail .badge[data-badge]");
    var startBadge = $('.st__rail .badge[data-badge="0"]');
    var endBadge = $('.st__rail .badge[data-badge="9"]');

    var railTop = 124, railH = 0, badgeY = [];

    function measure() {
      var pageTop = page.getBoundingClientRect().top + window.scrollY;
      pageTopCache = pageTop;
      var pageH = page.offsetHeight;
      var startLabel = $(".st__rail--start .rail-label");
      var startEl = startLabel || startBadge;
      if (startEl) {
        var r = startEl.getBoundingClientRect();
        railTop = r.bottom + window.scrollY - pageTop + 30; /* autobus (44 px, centriran na vrh ispune) kreće 8 px ispod natpisa Polazak */
      }
      var railBottom = 0;
      if (endBadge) {
        var e = endBadge.getBoundingClientRect();
        railBottom = pageH - (e.top + window.scrollY - pageTop);
      }
      prog.style.setProperty("--rail-top", railTop + "px");
      prog.style.setProperty("--rail-bottom", Math.max(0, railBottom) + "px");
      railH = pageH - railTop - Math.max(0, railBottom);
      badgeY = badges.map(function (b) {
        var rb = b.getBoundingClientRect();
        return rb.top + window.scrollY - pageTop + rb.height / 2;
      });
      if (startBadge) startBadge.classList.add("is-on");
    }

    var ticking = false;
    var pageTopCache = 0;
    function update() {
      ticking = false;
      var max = html.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

      /* autobus kreće s Polaska i vozi 1:1 sa skrolom (ostaje na istoj visini ekrana), do Odredišta */
      var offset = Math.min(railH, Math.max(0, window.scrollY));
      var busY = railTop + offset;
      if (fill) fill.style.height = offset.toFixed(1) + "px";
      if (bus) bus.style.top = offset.toFixed(1) + "px";

      var atEnd = offset >= railH - 0.5;
      badges.forEach(function (b, i) {
        if (b === startBadge) return;
        if (atEnd || badgeY[i] <= busY + 30) b.classList.add("is-on");
      });

      if (!sda) {
        if (pFill) pFill.style.width = "calc(" + (p * 100).toFixed(2) + "% - " + (p * 8).toFixed(1) + "px)";
        if (pBus) pBus.style.left = "calc(" + (p * 100).toFixed(2) + "% - " + (p * 28).toFixed(1) + "px)";
      }
    }
    function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { measure(); update(); });
    window.addEventListener("load", function () { measure(); update(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); update(); });
  }

  /* ---------- Ulazne animacije („dolazak na stanicu“) ---------- */
  function setupEntry() {
    var targets = $$(".rev, .cmp__row, .map, .pipe, .phases");
    if (!targets.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        /* ulazi u kadar, ili je već iznad kadra (učitavanje sa sidrom) */
        if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Putna karta: korak 1 na stranici → upit.html korak 2 ---------- */
  var STORAGE_KEY = "busflow-upit";

  function setupTicket() {
    var form = document.getElementById("karta-upit");
    if (!form) return;

    function values() {
      var out = {};
      $$("input, select", form).forEach(function (el) { if (el.name) out[el.name] = el.value.trim(); });
      return out;
    }
    function updateStub() {
      var v = values();
      var t = $('[data-stub="tvrtka"]', form);
      var k = $('[data-stub="kontakt"]', form);
      if (t) { t.textContent = v.tvrtka || "—"; t.classList.toggle("is-empty", !v.tvrtka); }
      var kontakt = [v.ime, v.telefon].filter(Boolean).join(" · ");
      if (k) { k.textContent = kontakt || "—"; k.classList.toggle("is-empty", !kontakt); }
    }
    function validate() {
      var ok = true, first = null;
      $$(".q", form).forEach(function (q) {
        var input = $("input, select", q);
        var valid = !input || input.checkValidity();
        q.classList.toggle("is-invalid", !valid);
        if (!valid) { ok = false; if (!first) first = input; }
      });
      if (first) first.focus();
      return ok;
    }

    form.addEventListener("input", function (e) {
      var q = e.target.closest(".q");
      if (q && q.classList.contains("is-invalid") && e.target.checkValidity()) q.classList.remove("is-invalid");
      updateStub();
    });
    form.addEventListener("change", updateStub);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;
      var v = values();
      var saved = null;
      try { saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null"); } catch (err) { saved = null; }
      /* novi zapis: zadržavaju se samo već upisani odgovori (npr. korak 2), ne i stariji ključevi */
      var state = { step: 2, values: {} };
      var prev = (saved && typeof saved === "object" && saved.values && typeof saved.values === "object") ? saved.values : {};
      Object.keys(prev).forEach(function (key) { state.values[key] = prev[key]; });
      ["tvrtka", "ime", "email", "telefon", "drzava"].forEach(function (key) { state.values[key] = v[key] || ""; });
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (err) { /* privatni način: upit.html kreće od koraka 1 */ }
      window.location.href = "upit.html";
    });

    /* ako se posjetitelj vratio sa stranice upita, prikaži već upisano */
    try {
      var prev = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (prev && prev.values) {
        $$("input, select", form).forEach(function (el) { if (el.name && prev.values[el.name]) el.value = prev.values[el.name]; });
      }
    } catch (err) { /* ignoriraj */ }
    updateStub();
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyConfig();
    setupNav();
    setupStageScale();
    setupRail();
    setupEntry();
    setupTicket();
  });
})();
