// BusFlow landing: provjerava statičnu stranicu i kopira je u dist/ (Vercel i GitHub Pages).
//   node scripts/build.mjs          provjera, zatim kopija u dist/ te robots.txt i sitemap.xml
//   node scripts/build.mjs --check  samo provjera (npm run lint)
// VITE_SITE_URL  apsolutna adresa za robots.txt i sitemap.xml (zadano https://busflow.email)
// VITE_BASE      prefiks za root-apsolutne poveznice u 404.html ("/BusFlow-Web/" na GitHub Pages)
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { Script } from "node:vm";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");
const SITE = (process.env.VITE_SITE_URL || "https://busflow.email").trim().replace(/\/+$/, "");
const BASE = (process.env.VITE_BASE || "/").replace(/\/*$/, "/");
const COPY = ["index.html", "upit.html", "impressum.html", "datenschutz.html", "404.html", "hr", "kontakt", "assets"];
const HTML = ["index.html", "upit.html", "impressum.html", "datenschutz.html", "hr/index.html", "hr/upit.html",
  "hr/impresum.html", "hr/privatnost.html", "kontakt/index.html", "404.html"];
const LANGS = { de: "/", hr: "/hr/" }; // ista stranica na dva jezika; x-default = de

const read = (file) => readFileSync(join(ROOT, file), "utf8");
const idsOf = (file) => new Set([...read(file).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

function check() {
  const errors = [];
  for (const f of readdirSync(join(ROOT, "assets/js")).filter((f) => f.endsWith(".js"))) {
    execFileSync(process.execPath, ["--check", join(ROOT, "assets/js", f)], { stdio: "inherit" });
  }
  for (const file of HTML) {
    const html = read(file);
    const ids = idsOf(file);
    for (const [, url] of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) { // \s preskače data-cfg-href
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url)) continue;           // https:, mailto:, tel:, data:
      if (url.startsWith("#")) {
        if (url.length > 1 && !ids.has(url.slice(1))) errors.push(`${file}: nema id-a za ${url}`);
        continue;
      }
      let target = join(ROOT, url.startsWith("/") ? "" : dirname(file), url.split(/[?#]/)[0]);
      if (existsSync(target) && statSync(target).isDirectory()) target = join(target, "index.html");
      if (!existsSync(target)) errors.push(`${file}: nedostaje ${url}`);
    }
    for (const [, code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      try { new Script(code, { filename: file }); } catch (e) { errors.push(`${file}: inline skripta: ${e.message}`); }
    }
  }
  // vercel.json: odredište svakog preusmjeravanja postoji (i sidro u njemu), a izvor nije postojeća datoteka
  const { redirects = [] } = JSON.parse(read("vercel.json"));
  for (const { source, destination } of redirects) {
    if (!destination.startsWith("/")) continue;
    const [pathQ, id] = destination.split("#");
    const path = pathQ.split("?")[0];
    const rel = path.replace(/^\//, "") + (path.endsWith("/") ? "index.html" : "");
    if (!existsSync(join(ROOT, rel)) || !statSync(join(ROOT, rel)).isFile()) errors.push(`vercel.json: odredište ${destination} ne postoji`);
    else if (id && !idsOf(rel).has(id)) errors.push(`vercel.json: nema id-a "${id}" u ${rel}`);
    const src = join(ROOT, source);
    if (!source.includes(":") && existsSync(src) && statSync(src).isFile()) errors.push(`vercel.json: izvor ${source} je postojeća datoteka`);
  }
  if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
  const iban = HTML.filter((file) => read(file).includes("[IBAN]"));
  if (iban.length) console.warn(`upozorenje: IBAN još nije upisan (${iban.join(", ")})`);
  console.log(`check: ${HTML.length} HTML datoteka u redu`);
}

function build() {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST);
  for (const entry of COPY) cpSync(join(ROOT, entry), join(DIST, entry), { recursive: true });
  if (BASE !== "/") { // 404.html se poslužuje na bilo kojoj adresi, pa su mu poveznice root-apsolutne
    const file = join(DIST, "404.html");
    writeFileSync(file, readFileSync(file, "utf8").replace(/(\s(?:href|src)=")\//g, `$1${BASE}`));
  }
  const alt = [...Object.entries(LANGS), ["x-default", LANGS.de]]
    .map(([lang, path]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE}${path}"/>`);
  const urls = Object.values(LANGS).map((path) => ["  <url>", `    <loc>${SITE}${path}</loc>`, ...alt, "  </url>"].join("\n"));
  writeFileSync(join(DIST, "sitemap.xml"), ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls, "</urlset>", ""].join("\n"));
  writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  console.log(`build: dist/ za ${SITE} (base ${BASE})`);
}

check();
if (!process.argv.includes("--check")) build();
