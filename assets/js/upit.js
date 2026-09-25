/* BusFlow — upit za prvi sastanak (DE na /upit.html, HR na /hr/upit.html): dva koraka, provjera, talon (sažetak), slanje upita
   na formEndpoint (Formspree) ili, kao rezerva, e-mailom iz preglednika (mailto s ispunjenim odgovorima), potvrda s poveznicom na kalendar termina
   (Microsoft Bookings). Jezik dolazi iz <html lang>; tekstovi koje piše skripta su u rječniku I18N. Odgovori se čuvaju u
   sessionStorage dok se upit ne pošalje (kodovi odgovora, pa vrijede u oba jezika). Bez ovisnosti. */
(function () {
  "use strict";

  var cfg = window.BUSFLOW || {};
  var form = document.getElementById("upit");
  if (!form) return;

  var STORAGE_KEY = "busflow-upit";
  var TOTAL_STEPS = 2;
  var MAILTO_MAX = 1900; /* najkraća granica među mail programima je oko 2000 znakova */
  var SEND_TIMEOUT = 15000; /* ms; ako slanje traje dulje, otvara se e-mail program (rezerva) */
  var state = { step: 1, sent: false, sending: false };

  var LANG = (document.documentElement.lang || "de").slice(0, 2).toLowerCase();

  /* Tekstovi koje piše skripta; tekst odgovora (čipovi, opcije) uzima se sa same stranice. */
  var I18N = {
    de: {
      eta1: "etwa eine Minute", eta2: "letzter Schritt",
      progress: "Fortschritt: Schritt {n} von {total}", progressSent: "Anfrage gesendet", progressReady: "Anfrage vorbereitet",
      stepSent: "GESENDET", stepReady: "BEREIT", tagSent: "Gesendet", tagReady: "Bereit",
      hSent: "Anfrage gesendet.", hReady: "Ihre Anfrage ist bereit.", min: "Min.", buses: "{n} Busse",
      rows: { tvrtka: "Firma", ime: "Name", email: "E-Mail", telefon: "Telefon", drzava: "Firmensitz", flota: "Anzahl Busse",
              usluge: "Leistungen", ponude: "Angebotserstellung heute", kada: "Gewünschter Start", imate: "Bereits vorhanden",
              format: "Gespräch", napomena: "Anmerkung" },
      title: "Anfrage zur Einführung von BusFlow", sentFrom: "Gesendet von: ", subject: "Anfrage zu BusFlow - ",
      noteCut: " … (der Rest der Anmerkung steht in der Kopie der Anfrage)", noteMoved: "(die Anmerkung steht in der Kopie der Anfrage)",
      copied: "Anfrage kopiert.", copyManual: "Der Text ist markiert: Drücken Sie Strg+C (Cmd+C auf dem Mac).",
      replyFallback: "[innerhalb eines Werktages]",
      doneSent: "Ihre Anfrage ist bei {email} eingegangen. Wir melden uns {reply}. Wenn Sie möchten, wählen Sie gleich einen Termin für das Erstgespräch.",
      doneMail: "Wir haben Ihr E-Mail-Programm mit einer Nachricht an {email} geöffnet. Bitte prüfen und senden Sie sie. Wählen Sie danach einen Termin für das Erstgespräch.",
      doneCopy: "Kopieren Sie die Anfrage und senden Sie sie uns per E-Mail. Wählen Sie danach einen Termin für das Erstgespräch.",
      noEmail: "In config.js ist keine E-Mail-Adresse hinterlegt. Bitte kopieren Sie die Anfrage.",
      checkFields: "Bitte prüfen Sie die markierten Felder.",
      sendFailed: "Der automatische Versand hat nicht geklappt. Bitte senden Sie die Anfrage aus Ihrem E-Mail-Programm."
    },
    hr: {
      eta1: "oko minutu", eta2: "zadnji korak",
      progress: "Napredak: korak {n} od {total}", progressSent: "Upit poslan", progressReady: "Upit pripremljen",
      stepSent: "POSLANO", stepReady: "SPREMNO", tagSent: "Poslano", tagReady: "Spremno",
      hSent: "Upit poslan.", hReady: "Upit je spreman.", min: "min", buses: "{n} autobusa",
      rows: { tvrtka: "Tvrtka", ime: "Ime i prezime", email: "E-mail", telefon: "Telefon", drzava: "Država", flota: "Broj autobusa",
              usluge: "Usluge", ponude: "Ponude danas", kada: "Kada krenuti", imate: "Već imamo", format: "Sastanak", napomena: "Napomena" },
      title: "Upit za uvođenje BusFlowa", sentFrom: "Poslano sa: ", subject: "Upit za BusFlow - ",
      noteCut: " … (ostatak napomene je u kopiji upita)", noteMoved: "(napomena je u kopiji upita)",
      copied: "Upit je kopiran.", copyManual: "Tekst je označen: pritisnite Ctrl+C (Cmd+C na Macu).",
      replyFallback: "[unutar 1 radnog dana]",
      doneSent: "Vaš upit je stigao na {email}. Javljamo se {reply}. Ako želite, odmah odaberite termin prvog sastanka.",
      doneMail: "Otvorili smo vaš e-mail program s porukom za {email}; provjerite je i pošaljite. Zatim odaberite termin prvog sastanka.",
      doneCopy: "Kopirajte upit i pošaljite nam ga e-mailom, zatim odaberite termin prvog sastanka.",
      noEmail: "E-mail adresa nije postavljena u config.js; kopirajte upit.",
      checkFields: "Provjerite označena polja.",
      sendFailed: "Automatsko slanje nije uspjelo, pa upit šaljete iz svog e-mail programa."
    }
  };
  var DICT = I18N[LANG] || I18N.de;
  function t(key, vars) {
    var s = key in DICT ? DICT[key] : I18N.de[key];
    if (typeof s !== "string") return s === undefined ? key : s;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return vars && k in vars ? vars[k] : m; });
  }
  var ETA = { 1: t("eta1"), 2: t("eta2"), 3: "" };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  /* vrijednost iz config.js; { de: …, hr: … } daje tekst za jezik stranice */
  function localize(v) { return v && typeof v === "object" && ("de" in v || "hr" in v) ? (LANG in v ? v[LANG] : v.de) : v; }
  function get(key) { return localize(key.split(".").reduce(function (o, p) { return o && o[p]; }, cfg)); }
  function text(key) { var v = get(key); return v === undefined || v === null ? "" : String(v).trim(); }

  /* ---------- Postavke iz config.js (kontakt, kalendar termina) ---------- */
  function applyConfig() {
    var phone = text("phone");
    var phoneDisplay = text("phoneDisplay") || phone;
    $$("[data-cfg]").forEach(function (el) {
      var key = el.getAttribute("data-cfg");
      var v;
      if (key === "phoneDisplay") v = phoneDisplay;
      else if (key === "meetingMinutes") v = get("meetingMinutes") ? get("meetingMinutes") + " " + t("min") : "";
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

  /* ---------- Vrijednosti obrasca ---------- */
  function values() {
    var out = {};
    $$("input, select, textarea", form).forEach(function (el) {
      if (!el.name) return;
      if (el.type === "checkbox") {
        if (!out[el.name]) out[el.name] = [];
        if (el.checked) out[el.name].push(el.value);
      } else if (el.type === "radio") {
        if (el.checked) out[el.name] = el.value;
        else if (!(el.name in out)) out[el.name] = "";
      } else {
        out[el.name] = el.value.trim();
      }
    });
    return out;
  }
  function consent() { return !!form.querySelector("input[name=privola]:checked"); }

  function save() {
    if (state.sent) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step: Math.min(state.step, TOTAL_STEPS), values: values() }));
    } catch (e) { /* privatni način rada: bez spremanja */ }
  }

  function restore() {
    var raw = null;
    try { raw = sessionStorage.getItem(STORAGE_KEY); } catch (e) { return; }
    if (!raw) return;
    var saved;
    try { saved = JSON.parse(raw); } catch (e) { return; }
    if (!saved || typeof saved !== "object") return;
    var v = saved.values || {};
    $$("input, select, textarea", form).forEach(function (el) {
      if (!el.name || el.name === "privola" || !(el.name in v)) return;
      if (el.type === "checkbox") el.checked = Array.isArray(v[el.name]) && v[el.name].indexOf(el.value) >= 0;
      else if (el.type === "radio") el.checked = v[el.name] === el.value;
      else el.value = typeof v[el.name] === "string" ? v[el.name] : "";
    });
    /* stariji zapis mogao je imati način razgovora koji više ne nudimo */
    if (!form.querySelector("input[name=format]:checked")) {
      var video = form.querySelector("input[name=format][value=video]");
      if (video) video.checked = true;
    }
    var step = parseInt(saved.step, 10) || 1;
    state.step = Math.min(Math.max(1, step), TOTAL_STEPS);
  }

  /* ---------- Koraci ---------- */
  function panelFor(n) { return form.querySelector('.step-panel[data-step="' + n + '"]'); }

  function showStep(n, focusHeading) {
    state.step = n;
    $$(".step-panel", form).forEach(function (p) { p.hidden = parseInt(p.getAttribute("data-step"), 10) !== n; });

    $$(".route-progress__bars span").forEach(function (b, i) {
      b.classList.toggle("is-done", i + 1 < n);
      b.classList.toggle("is-current", i + 1 === n);
    });
    $$(".route-progress__labels span").forEach(function (l, i) {
      l.classList.toggle("is-done", i + 1 < n);
      l.classList.toggle("is-current", i + 1 === n);
    });
    var done = n > TOTAL_STEPS;
    var prog = $("#progress");
    if (prog) prog.setAttribute("aria-label", done ? (state.sent ? t("progressSent") : t("progressReady")) : t("progress", { n: n, total: TOTAL_STEPS }));
    var eta = $("#eta");
    if (eta) eta.textContent = ETA[n] || "";
    var ts = $("#talon-step");
    if (ts) ts.textContent = done ? (state.sent ? t("stepSent") : t("stepReady")) : pad(n) + "/" + pad(TOTAL_STEPS);

    var active = panelFor(n);
    if (active && focusHeading) {
      var h = $("h1", active);
      if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    save();
  }

  function markInvalid(q, invalid) {
    q.classList.toggle("is-invalid", !!invalid);
    return !invalid;
  }

  function validateStep(n) {
    var panel = panelFor(n);
    var ok = true;
    var firstBad = null;
    if (!panel) return true;

    $$(".q", panel).forEach(function (q) {
      var valid = true;
      var input = $("input:not([type=radio]):not([type=checkbox]), select, textarea", q);
      if (input && input.closest(".q") !== q) input = null;
      if (input) valid = input.checkValidity();
      if (q.getAttribute("data-required") !== null) {
        var radios = $$("input[type=radio]", q);
        var checks = $$("input[type=checkbox]", q);
        if (radios.length) valid = radios.some(function (r) { return r.checked; });
        else if (checks.length) valid = checks.some(function (c) { return c.checked; });
      }
      if (!markInvalid(q, !valid)) { ok = false; if (!firstBad) firstBad = q; }
    });

    if (firstBad) {
      var target = $("input, select, textarea, button", firstBad);
      if (target) target.focus();
      firstBad.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    return ok;
  }

  /* ---------- Talon (sažetak) ---------- */
  function setTalon(key, value) {
    var el = $('[data-talon="' + key + '"]');
    if (!el) return;
    var t = (value || "").trim();
    el.textContent = t || "—";
    el.classList.toggle("is-empty", !t);
  }

  function updateTalon() {
    var v = values();
    setTalon("tvrtka", v.tvrtka);
    setTalon("kontakt", [v.ime, v.telefon].filter(Boolean).join(" · "));
    setTalon("flota", v.flota ? t("buses", { n: answerText("flota") }) : "");
    setTalon("usluge", answerText("usluge"));
    setTalon("sastanak", [answerText("format"), answerText("kada")].filter(Boolean).join(" · "));
  }

  /* ---------- Tekst upita (za e-mail poruku i kopiranje) ---------- */
  /* Čitljivi nazivi odgovora uzimaju se iz samog obrasca (tekst opcije, čipa ili kartice). */
  function answerText(name) {
    var els = $$('[name="' + name + '"]', form);
    if (!els.length) return "";
    var first = els[0];
    if (first.tagName === "SELECT") return first.value ? first.options[first.selectedIndex].text.trim() : "";
    if (first.type === "radio" || first.type === "checkbox") {
      return els.filter(function (el) { return el.checked; }).map(function (el) {
        var label = el.closest("label");
        var node = label && (label.querySelector("strong") || label.querySelector("span"));
        return (node ? node.textContent : (label ? label.textContent : el.value)).trim();
      }).join(", ");
    }
    return first.value.trim();
  }

  function summaryText(v) {
    var rows = [
      ["tvrtka", v.tvrtka], ["ime", v.ime], ["email", v.email], ["telefon", v.telefon], ["drzava", answerText("drzava")],
      ["flota", answerText("flota")], ["usluge", answerText("usluge")], ["ponude", answerText("ponude")],
      ["kada", answerText("kada")], ["imate", answerText("imate")], ["format", answerText("format")],
      ["napomena", v.napomena]
    ];
    var labels = t("rows");
    var lines = [t("title"), ""];
    rows.forEach(function (r) { if (r[1]) lines.push(labels[r[0]] + ": " + r[1]); });
    lines.push("", t("sentFrom") + location.href.split("#")[0]);
    return lines.join("\n");
  }

  function mailtoHref(email, subject, body) {
    return "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body.replace(/\r?\n/g, "\r\n"));
  }

  /* Poveznica za e-mail; ako je preduga, napomena se skraćuje (cijeli tekst ostaje na potvrdi i u kopiji). */
  function subjectFor(v) { return t("subject") + (v.tvrtka || "").slice(0, 60); }

  function mailtoFor(v, email) {
    var subject = subjectFor(v);
    var href = mailtoHref(email, subject, summaryText(v));
    var note = v.napomena || "";
    var cut = note.length;
    while (href.length > MAILTO_MAX && cut > 0) {
      cut = Math.max(0, cut - 80);
      var shorter = {};
      Object.keys(v).forEach(function (k) { shorter[k] = v[k]; });
      shorter.napomena = cut ? note.slice(0, cut) + t("noteCut") : t("noteMoved");
      href = mailtoHref(email, subject, summaryText(shorter));
    }
    return href;
  }

  function copySummary() {
    var pre = $("#done-summary");
    var status = $("#copy-status");
    function fallback() {
      var range = document.createRange();
      range.selectNodeContents(pre);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { /* stari preglednik */ }
      status.textContent = ok ? t("copied") : t("copyManual");
    }
    if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pre.textContent).then(function () { status.textContent = t("copied"); }, fallback);
    } else {
      fallback();
    }
  }

  /* ---------- Slanje ---------- */
  /* Formspree: _subject = predmet poruke, _replyto = odgovor ide posjetitelju, poruka = čitljiv sažetak (prvi u poruci) */
  function payload(v) {
    return {
      _subject: subjectFor(v),
      _replyto: v.email,
      poruka: summaryText(v),
      sent_at: new Date().toISOString(),
      page: location.href,
      lang: LANG,
      tvrtka: v.tvrtka, ime: v.ime, email: v.email, telefon: v.telefon, drzava: v.drzava,
      flota: v.flota, usluge: v.usluge || [], ponude: v.ponude, kada: v.kada, imate: v.imate || [],
      format: v.format, napomena: v.napomena, privola: consent()
    };
  }

  /* mode: "mail" (upit ide e-mailom iz preglednika) ili "sent" (poslan na formEndpoint) */
  function showDone(mode, noteText) {
    var v = values();
    var email = text("email");
    var sent = mode === "sent";
    var summary = summaryText(v);
    var href = (!sent && email) ? mailtoFor(v, email) : "";
    state.sent = sent;

    $("#done-tag").textContent = sent ? t("tagSent") : t("tagReady");
    $("#h-done").textContent = sent ? t("hSent") : t("hReady");
    var reply = text("replyWithin") || t("replyFallback");
    var doneText;
    if (sent) doneText = t("doneSent", { email: email, reply: reply });
    else if (href) doneText = t("doneMail", { email: email });
    else doneText = t("doneCopy");
    $("#done-text").textContent = doneText;

    var note = $("#done-note");
    var noteMsg = noteText || (!sent && !email ? t("noEmail") : "");
    note.hidden = !noteMsg;
    note.textContent = noteMsg;

    var again = $("#mail-again");
    again.hidden = !href;
    if (href) again.setAttribute("href", href); else again.removeAttribute("href");
    $("#copy").hidden = sent;
    $("#copy-status").textContent = "";
    $("#done-summary").textContent = summary;

    var talon = $(".talon-wrap");
    if (talon) talon.setAttribute("data-collapsed", "");
    showStep(TOTAL_STEPS + 1, true);

    if (sent) {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignoriraj */ }
    } else if (href) {
      window.location.href = href;
    }
  }

  function submit() {
    var status = $("#form-status");
    var btn = $("#submit");
    /* Enter u polju koraka 1 predaje obrazac: ponašaj se kao „Dalje“ */
    if (state.step < TOTAL_STEPS) { if (validateStep(state.step)) showStep(state.step + 1, true); return; }
    if (!validateStep(TOTAL_STEPS)) { status.textContent = t("checkFields"); return; }
    status.textContent = "";
    var endpoint = (cfg.formEndpoint || "").toString().trim();

    if (!endpoint) { showDone("mail"); return; }
    if (state.sending) return; /* dvostruki klik ili Enter dok zahtjev traje */

    state.sending = true;
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, SEND_TIMEOUT) : 0;
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload(values())),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        showDone("sent");
      })
      .catch(function (err) {
        console.error("BusFlow: automatsko slanje upita nije uspjelo", err);
        showDone("mail", t("sendFailed"));
      })
      .then(function () {
        clearTimeout(timer);
        state.sending = false;
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
      });
  }

  /* ---------- Događaji ---------- */
  form.addEventListener("click", function (e) {
    var next = e.target.closest("[data-next]");
    var prev = e.target.closest("[data-prev]");
    var copy = e.target.closest("#copy");
    if (next) { if (validateStep(state.step)) showStep(Math.min(TOTAL_STEPS, state.step + 1), true); }
    else if (prev) { showStep(Math.max(1, Math.min(TOTAL_STEPS, state.step - 1)), true); }
    else if (copy) { copySummary(); }
  });

  form.addEventListener("input", function (e) {
    var q = e.target.closest(".q");
    if (q && q.classList.contains("is-invalid")) {
      var input = e.target;
      if (input.type !== "radio" && input.type !== "checkbox" && input.checkValidity()) q.classList.remove("is-invalid");
    }
    updateTalon();
    save();
  });

  form.addEventListener("change", function (e) {
    var q = e.target.closest(".q");
    if (q && (e.target.type === "radio" || e.target.type === "checkbox")) q.classList.remove("is-invalid");
    updateTalon();
    save();
  });

  form.addEventListener("submit", function (e) { e.preventDefault(); submit(); });

  /* ---------- Start ---------- */
  applyConfig();
  restore();
  updateTalon();
  showStep(state.step, false);
})();
