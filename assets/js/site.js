/* BusFlow — postavke iz config.js na stranici (početne stranice i upit, DE / HR / EN):
   data-cfg="ključ"           → tekst elementa (prazna postavka ostavlja oznaku u uglatim zagradama; prazan telefon skriva stavku)
   data-cfg-href="ključ"      → poveznica (email → mailto:, phone → tel:, ostalo kako piše)
   data-cfg-requires="ključ"  → element se skriva dok postavka nije upisana (npr. gumbi za kalendar termina)
   Vrijednost { de: …, hr: …, en: … } daje tekst za jezik stranice (<html lang>). Bez ovisnosti. */
(function () {
  "use strict";

  var cfg = window.BUSFLOW || {};
  var LANG = (document.documentElement.lang || "de").slice(0, 2).toLowerCase();
  var MIN = { de: "Min.", hr: "min", en: "min" }[LANG] || "min";

  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function localize(v) { return v && typeof v === "object" && ("de" in v || "hr" in v) ? (LANG in v ? v[LANG] : v.de) : v; }
  function text(key) {
    var v = localize(key.split(".").reduce(function (o, p) { return o && o[p]; }, cfg));
    return v === undefined || v === null ? "" : String(v).trim();
  }

  function applyConfig() {
    var phone = text("phone");
    var phoneDisplay = text("phoneDisplay") || phone;

    $$("[data-cfg]").forEach(function (el) {
      var key = el.getAttribute("data-cfg");
      var v;
      if (key === "phoneDisplay") v = phoneDisplay;
      else if (key === "meetingMinutes") v = text("meetingMinutes") ? text("meetingMinutes") + " " + MIN : "";
      else v = text(key);
      if (!v) {
        if (key === "phoneDisplay") el.hidden = true; /* bez telefona u configu nema oznake [Telefon] */
        return;
      }
      el.textContent = v;
    });

    $$("[data-cfg-href]").forEach(function (el) {
      var key = el.getAttribute("data-cfg-href");
      var v = key === "phone" ? phone : text(key);
      if (!v) { if (key === "phone") el.hidden = true; return; }
      if (key === "phone") el.setAttribute("href", "tel:" + v.replace(/[^+\d]/g, ""));
      else if (key === "email") el.setAttribute("href", "mailto:" + v);
      else el.setAttribute("href", v);
      el.removeAttribute("aria-disabled");
    });

    $$("[data-cfg-requires]").forEach(function (el) {
      if (!text(el.getAttribute("data-cfg-requires"))) el.hidden = true;
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyConfig);
  else applyConfig();
})();
