/* BusFlow — statistika posjeta preko Cloudflare Web Analytics (bez kolačića i bez spremanja u preglednik).
   Učitava se samo na busflow.email i tek kad je TOKEN upisan (Cloudflare → Web Analytics → busflow.email → Manage site,
   ručna JS skripta); lokalno, na pages.dev pregledima i na GitHub Pages se preskače. Opisano u Datenschutzu (DE),
   Pravilima privatnosti (HR) i Privacy policyju (EN), odjeljak 4. */
(function () {
  "use strict";
  var TOKEN = "17482e39f7b44af6956adac1df20948d";
  var BEACON = "https://static.cloudflareinsights.com/beacon.min.js";
  if (location.hostname !== "busflow.email" || !TOKEN) return;
  var s = document.createElement("script");
  s.defer = true;
  s.src = BEACON;
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: TOKEN }));
  document.head.appendChild(s);
})();
