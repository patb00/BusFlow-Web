/* BusFlow — kratki upit: e-mail, broj vozila i poruka po želji. Radi za svaki <form data-upit> na stranici (putna karta
   na početnim stranicama i upit.html; DE na /, HR na /hr/, EN na /en/). Upit ide na formEndpoint (Formspree) kao JSON;
   bez endpointa, ili kad slanje ne uspije ili traje dulje od 15 s, ide e-mailom iz preglednika (mailto s ispunjenim
   tekstom) uz gumb za kopiranje. Jezik dolazi iz <html lang>; tekstovi koje piše skripta su u rječniku I18N.
   Postavke iz config.js na stranicu stavlja site.js. Bez ovisnosti. */
(function () {
  "use strict";

  var cfg = window.BUSFLOW || {};
  var MAILTO_MAX = 1900; /* najkraća granica među mail programima je oko 2000 znakova */
  var SEND_TIMEOUT = 15000; /* ms; ako slanje traje dulje, nudi se e-mail program (rezerva) */
  var LANG = (document.documentElement.lang || "de").slice(0, 2).toLowerCase();

  var I18N = {
    de: {
      title: "Anfrage zu BusFlow", rows: { email: "E-Mail", flota: "Anzahl Fahrzeuge", poruka: "Nachricht" },
      sentFrom: "Gesendet von: ", subject: "Anfrage zu BusFlow – {n} Fahrzeuge",
      vehicles: "{n} Fahrzeuge", replyFallback: "innerhalb eines Werktages",
      tag: { sent: "Gesendet", mail: "Bereit", failed: "Nicht gesendet" },
      head: { sent: "Anfrage gesendet.", mail: "Jetzt nur noch die E-Mail senden.", failed: "Der Versand hat nicht geklappt." },
      doneSent: "Sie ist bei {to} eingegangen. Wir melden uns {reply} unter {visitor}.",
      doneMail: "Wir haben Ihr E-Mail-Programm mit einer Nachricht an {to} geöffnet. Bitte prüfen und senden Sie sie. Öffnet sich nichts? Kopieren Sie die Anfrage und senden Sie sie an diese Adresse.",
      doneFailed: "Senden Sie die Anfrage bitte aus Ihrem E-Mail-Programm: Die Nachricht an {to} ist schon ausgefüllt. Oder kopieren Sie die Anfrage und senden Sie sie selbst.",
      doneCopy: "Kopieren Sie die Anfrage und senden Sie sie uns per E-Mail.",
      mailAgain: "Nachricht erneut öffnen", mailSend: "Per E-Mail senden",
      noteCut: " … (der Rest steht in der Kopie der Anfrage)", noteMoved: "(die Nachricht steht in der Kopie der Anfrage)",
      copied: "Anfrage kopiert.", copyManual: "Der Text ist markiert: Drücken Sie Strg+C (Cmd+C auf dem Mac).",
      checkFields: "Bitte prüfen Sie die markierten Felder.", ourEmail: "unsere E-Mail-Adresse"
    },
    hr: {
      title: "Upit za BusFlow", rows: { email: "E-mail", flota: "Broj vozila", poruka: "Poruka" },
      sentFrom: "Poslano sa: ", subject: "Upit za BusFlow – {n} vozila",
      vehicles: "{n} vozila", replyFallback: "unutar 1 radnog dana",
      tag: { sent: "Poslano", mail: "Spremno", failed: "Nije poslano" },
      head: { sent: "Upit je poslan.", mail: "Još samo pošaljite e-mail.", failed: "Slanje nije uspjelo." },
      doneSent: "Stigao je na {to}. Javljamo se {reply} na {visitor}.",
      doneMail: "Otvorili smo vaš e-mail program s porukom za {to}; provjerite je i pošaljite. Ne otvara se? Kopirajte upit i pošaljite ga na tu adresu.",
      doneFailed: "Pošaljite upit iz svog e-mail programa: poruka za {to} je već ispunjena. Ili kopirajte upit i pošaljite ga sami.",
      doneCopy: "Kopirajte upit i pošaljite nam ga e-mailom.",
      mailAgain: "Otvori poruku ponovno", mailSend: "Pošaljite e-mailom",
      noteCut: " … (ostatak poruke je u kopiji upita)", noteMoved: "(poruka je u kopiji upita)",
      copied: "Upit je kopiran.", copyManual: "Tekst je označen: pritisnite Ctrl+C (Cmd+C na Macu).",
      checkFields: "Provjerite označena polja.", ourEmail: "našu e-mail adresu"
    },
    en: {
      title: "Inquiry about BusFlow", rows: { email: "Email", flota: "Number of vehicles", poruka: "Message" },
      sentFrom: "Sent from: ", subject: "Inquiry about BusFlow – {n} vehicles",
      vehicles: "{n} vehicles", replyFallback: "within one working day",
      tag: { sent: "Sent", mail: "Ready", failed: "Not sent" },
      head: { sent: "Inquiry sent.", mail: "Now just send the email.", failed: "Sending didn't work." },
      doneSent: "It has reached {to}. We'll get back to you {reply} at {visitor}.",
      doneMail: "We've opened your email program with a message to {to}; please check it and send it. Nothing opened? Copy the inquiry and send it to that address.",
      doneFailed: "Please send the inquiry from your email program: the message to {to} is already filled in. Or copy the inquiry and send it yourself.",
      doneCopy: "Copy the inquiry and send it to us by email.",
      mailAgain: "Open the message again", mailSend: "Send by email",
      noteCut: " … (the rest is in the copy of the inquiry)", noteMoved: "(the message is in the copy of the inquiry)",
      copied: "Inquiry copied.", copyManual: "The text is selected: press Ctrl+C (Cmd+C on a Mac).",
      checkFields: "Please check the highlighted fields.", ourEmail: "our email address"
    }
  };
  var DICT = I18N[LANG] || I18N.de;
  function t(key, vars) {
    var s = key.split(".").reduce(function (o, p) { return o && o[p]; }, DICT);
    if (typeof s !== "string") return s === undefined ? key : s;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return vars && k in vars ? vars[k] : m; });
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  /* vrijednost iz config.js; { de: …, hr: …, en: … } daje tekst za jezik stranice */
  function localize(v) { return v && typeof v === "object" && ("de" in v || "hr" in v) ? (LANG in v ? v[LANG] : v.de) : v; }
  function text(key) {
    var v = localize(key.split(".").reduce(function (o, p) { return o && o[p]; }, cfg));
    return v === undefined || v === null ? "" : String(v).trim();
  }

  /* ---------- Tekst upita (e-mail poruka i kopiranje) ---------- */
  function summaryText(v) {
    var rows = t("rows");
    var lines = [t("title"), "", rows.email + ": " + v.email, rows.flota + ": " + v.flota];
    if (v.poruka) lines.push("", rows.poruka + ":", v.poruka);
    lines.push("", t("sentFrom") + location.href.split("#")[0]);
    return lines.join("\n");
  }
  function subjectFor(v) { return t("subject", { n: v.flota }); }

  function mailtoHref(email, subject, body) {
    return "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body.replace(/\r?\n/g, "\r\n"));
  }

  /* Poveznica za e-mail; ako je preduga, poruka se skraćuje (cijeli tekst ostaje na stranici i u kopiji). */
  function mailtoFor(v, email) {
    var href = mailtoHref(email, subjectFor(v), summaryText(v));
    var note = v.poruka || "";
    var cut = note.length;
    while (href.length > MAILTO_MAX && cut > 0) {
      cut = Math.max(0, cut - 80);
      var shorter = { email: v.email, flota: v.flota, poruka: cut ? note.slice(0, cut) + t("noteCut") : t("noteMoved") };
      href = mailtoHref(email, subjectFor(v), summaryText(shorter));
    }
    return href;
  }

  function setupForm(form) {
    var fields = $("[data-upit-fields]", form);
    var done = $("[data-upit-done]", form);
    var status = $("[data-upit-status]", form);
    var submitBtn = $("button[type=submit]", form);
    var sending = false;

    function values() {
      var flota = $("input[name=flota]:checked", form);
      return {
        email: ($("input[name=email]", form).value || "").trim(),
        flota: flota ? flota.value : "",
        poruka: ($("textarea[name=poruka]", form).value || "").trim()
      };
    }

    /* Talon na putnoj karti (početne stranice) prati upisano. */
    function updateStub() {
      var v = values();
      var poruka = v.poruka.length > 60 ? v.poruka.slice(0, 60) + "…" : v.poruka;
      [["email", v.email], ["flota", v.flota ? t("vehicles", { n: v.flota }) : ""], ["poruka", poruka]].forEach(function (r) {
        var el = $('[data-upit-stub="' + r[0] + '"]', form);
        if (!el) return;
        el.textContent = r[1] || "—";
        el.classList.toggle("is-empty", !r[1]);
      });
    }

    function validate() {
      var firstBad = null;
      $$(".q", fields).forEach(function (q) {
        var radios = $$("input[type=radio]", q);
        var input = $("input, textarea", q);
        var valid = radios.length ? radios.some(function (r) { return r.checked; }) : !input || input.checkValidity();
        q.classList.toggle("is-invalid", !valid);
        if (!valid && !firstBad) firstBad = q;
      });
      if (firstBad) {
        var target = $("input, textarea", firstBad);
        if (target) target.focus();
        firstBad.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return !firstBad;
    }

    function copySummary() {
      var pre = $("[data-upit-summary]", form);
      var copyStatus = $("[data-upit-copy-status]", form);
      function fallback() {
        var range = document.createRange();
        range.selectNodeContents(pre);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { /* stari preglednik */ }
        copyStatus.textContent = ok ? t("copied") : t("copyManual");
      }
      if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pre.textContent).then(function () { copyStatus.textContent = t("copied"); }, fallback);
      } else {
        fallback();
      }
    }

    /* mode: "sent" (stiglo na endpoint), "mail" (endpoint nije postavljen) ili "failed" (slanje nije uspjelo) */
    function showDone(mode) {
      var v = values();
      var sent = mode === "sent";
      var email = text("email");
      var href = (!sent && email) ? mailtoFor(v, email) : "";
      var vars = { to: email || t("ourEmail"), reply: text("replyWithin") || t("replyFallback"), visitor: v.email };

      $("[data-upit-done-tag]", form).textContent = t("tag." + mode);
      $("[data-upit-done-tag]", form).classList.toggle("tag--warn", mode === "failed");
      $("[data-upit-done-title]", form).textContent = t("head." + mode);
      $("[data-upit-done-text]", form).textContent = sent ? t("doneSent", vars)
        : !href ? t("doneCopy") : mode === "mail" ? t("doneMail", vars) : t("doneFailed", vars);

      var mail = $("[data-upit-mail]", form);
      mail.hidden = !href;
      if (href) mail.setAttribute("href", href); else mail.removeAttribute("href");
      $("[data-upit-mail-label]", form).textContent = mode === "failed" ? t("mailSend") : t("mailAgain");
      /* Poslan upit: termin je sljedeći korak, pa je to glavni gumb; inače je glavni e-mail. */
      var book = $("[data-upit-book]", form);
      if (book) {
        book.classList.toggle("btn--navy", sent);
        book.classList.toggle("btn--ghost", !sent);
      }
      $("[data-upit-copy]", form).hidden = sent;
      $("[data-upit-edit]", form).hidden = sent;
      $("[data-upit-copy-status]", form).textContent = "";
      var pre = $("[data-upit-summary]", form);
      pre.hidden = sent;
      pre.textContent = summaryText(v);

      fields.hidden = true;
      done.hidden = false;
      done.focus({ preventScroll: true });
      /* Obrazac se upravo skratio (polja su skrivena), a preglednik je zadržao položaj; tek nakon novog rasporeda
         vrati vrh obrasca u vidno polje, inače potvrda ostane iznad ekrana (mobitel). */
      requestAnimationFrame(function () {
        var top = form.getBoundingClientRect().top;
        if (top < 0 || top > window.innerHeight * 0.5) form.scrollIntoView({ block: "start", behavior: "smooth" });
      });

      if (mode === "mail" && href) window.location.href = href;
    }

    function showFields() {
      done.hidden = true;
      fields.hidden = false;
      var first = $("input[name=email]", form);
      if (first) first.focus();
    }

    function submit() {
      if (sending) return; /* dvostruki klik ili Enter dok zahtjev traje */
      if (!validate()) { status.textContent = t("checkFields"); return; }
      status.textContent = "";

      /* Robot je ispunio skriveno polje: ne šaljemo ništa, a robot vidi uspjeh. */
      var trap = $("input[name=_gotcha]", form);
      if (trap && trap.value) { showDone("sent"); return; }

      var endpoint = text("formEndpoint");
      if (!endpoint) { showDone("mail"); return; }

      var v = values();
      sending = true;
      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-busy", "true");
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, SEND_TIMEOUT) : 0;
      /* Formspree: _subject = predmet poruke, _replyto = odgovor ide posjetitelju; ostala polja redom ulaze u poruku. */
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          _subject: subjectFor(v),
          _replyto: v.email,
          email: v.email,
          flota: v.flota,
          poruka: v.poruka || "—",
          lang: LANG,
          page: location.href.split("#")[0],
          sent_at: new Date().toISOString()
        }),
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          showDone("sent");
        })
        .catch(function (err) {
          console.error("BusFlow: slanje upita nije uspjelo", err);
          showDone("failed");
        })
        .then(function () {
          clearTimeout(timer);
          sending = false;
          submitBtn.disabled = false;
          submitBtn.removeAttribute("aria-busy");
        });
    }

    form.addEventListener("input", function (e) {
      var q = e.target.closest(".q");
      if (q && q.classList.contains("is-invalid") && e.target.type !== "radio" && e.target.checkValidity()) q.classList.remove("is-invalid");
      updateStub();
    });
    form.addEventListener("change", function (e) {
      var q = e.target.closest(".q");
      if (q && e.target.type === "radio") q.classList.remove("is-invalid");
      updateStub();
    });
    form.addEventListener("click", function (e) {
      if (e.target.closest("[data-upit-copy]")) copySummary();
      else if (e.target.closest("[data-upit-edit]")) showFields();
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); submit(); });

    updateStub();
  }

  function start() { $$("form[data-upit]").forEach(setupForm); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
