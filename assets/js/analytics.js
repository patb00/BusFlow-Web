/* BusFlow — statistika posjeta preko Vercel Web Analytics (bez kolačića).
   Skripta /_vercel/insights/script.js postoji samo na busflow.email, i to tek kad je Web Analytics uključen u Vercel
   projektu i stranica ponovno objavljena. Zato se učitava samo na toj adresi; lokalno, na GitHub Pages i u pregledu
   se preskače. Opisano u Datenschutzu (DE) i Pravilima privatnosti (HR), odjeljak 4. */
(function () {
  "use strict";
  if (location.hostname !== "busflow.email") return;
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  var s = document.createElement("script");
  s.defer = true;
  s.src = "/_vercel/insights/script.js";
  document.head.appendChild(s);
})();
