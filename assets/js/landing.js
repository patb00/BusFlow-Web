/* BusFlow landing — ponašanje stranice: mobilni izbornik, skaliranje hero-filma, tračnica (autobus + ispuna +
   paljenje stanica), ulazne animacije sekcija i tabovi modula Fahrer. Postavke iz config.js primjenjuje site.js, a
   kratki upit na putnoj karti upit.js. Bez ovisnosti. */
(function () {
  "use strict";

  var html = document.documentElement;
  html.classList.add("js");

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

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

  /* ---------- Modul Fahrer: tabovi Übersicht / Einsatzplan / Stunden (sekcija 03) ---------- */
  function setupRoster() {
    $$('.roster__tabs[role="tablist"]').forEach(function (list) {
      var tabs = $$('[role="tab"]', list);
      function select(tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute("aria-selected", on ? "true" : "false");
          t.tabIndex = on ? 0 : -1;
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
      }
      tabs.forEach(function (t, i) {
        t.addEventListener("click", function () { select(t); });
        t.addEventListener("keydown", function (e) {
          var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "Home" ? -i : e.key === "End" ? tabs.length - 1 - i : 0;
          if (!d) return;
          e.preventDefault();
          select(tabs[(i + d + tabs.length) % tabs.length], true);
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupNav();
    setupStageScale();
    setupRail();
    setupEntry();
    setupRoster();
  });
})();
