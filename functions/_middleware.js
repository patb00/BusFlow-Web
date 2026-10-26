// Cloudflare Pages Function: stare adrese dosadašnje stranice. _routes.json je poziva samo za /, /demo i /klijenti/…,
// sve ostalo Cloudflare poslužuje izravno iz dist/. Pravila su ovdje, a ne u _redirects, jer ovise o ?lang=.
// redirects.json: adresa → odredište po jeziku (?lang=hr|en, inače "de"); npm run lint provjerava odredišta.
import REDIRECTS from "./redirects.json";

export function onRequest({ request, next }) {
  const url = new URL(request.url);
  const targets = REDIRECTS[url.pathname.startsWith("/klijenti/") ? "/klijenti" : url.pathname];
  const lang = url.searchParams.get("lang");
  const to = targets && (Object.hasOwn(targets, lang) ? targets[lang] : targets.de);
  return to ? Response.redirect(new URL(to, url).href, 307) : next();
}
