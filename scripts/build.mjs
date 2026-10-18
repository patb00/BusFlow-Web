// BusFlow landing: provjerava statičnu stranicu i kopira je u dist/ (Vercel i GitHub Pages).
//   node scripts/build.mjs          provjera, zatim kopija u dist/ (CSS i JS s hashom u imenu) te robots.txt i sitemap.xml
//   node scripts/build.mjs --check  samo provjera (npm run lint)
// VITE_SITE_URL  apsolutna adresa za robots.txt i sitemap.xml (zadano https://busflow.email)
// VITE_BASE      prefiks za root-apsolutne poveznice u 404.html ("/BusFlow-Web/" na GitHub Pages)
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { Script } from "node:vm";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");
const SITE = (process.env.VITE_SITE_URL || "https://busflow.email").trim().replace(/\/+$/, "");
const PROD = "https://busflow.email"; // kanonska adresa upisana u HTML (canonical, hreflang, og:image, JSON-LD), neovisna o hostingu
const BASE = (process.env.VITE_BASE || "/").replace(/\/*$/, "/");
const COPY = ["index.html", "upit.html", "impressum.html", "datenschutz.html", "404.html", "hr", "en", "kontakt", "assets",
  "favicon.ico", "llms.txt"];
const HASHED = ["assets/css", "assets/js"]; // u dist/ dobivaju hash u imenu, pa ih vercel.json kešira godinu dana (immutable)
const HTML = ["index.html", "upit.html", "impressum.html", "datenschutz.html", "hr/index.html", "hr/upit.html",
  "hr/impresum.html", "hr/privatnost.html", "en/index.html", "en/upit.html", "en/legal-notice.html", "en/privacy.html",
  "kontakt/index.html", "404.html"];
const LANGS = { de: "/", hr: "/hr/", en: "/en/" }; // ista stranica na tri jezika; x-default = de
const SEO = { title: [20, 65], description: [70, 160] }; // dopuštene duljine u znakovima

const read = (file) => readFileSync(join(ROOT, file), "utf8");
const idsOf = (file) => new Set([...read(file).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const text = (s) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&shy;/g, "").replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

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
  errors.push(...checkSeo());
  // vercel.json: odredište svakog preusmjeravanja postoji (i sidro u njemu), a izvor nije postojeća datoteka;
  // iznimka je …/index.html → …/ (jedan URL po stranici umjesto duplikata)
  const { redirects = [] } = JSON.parse(read("vercel.json"));
  for (const { source, destination } of redirects) {
    if (!destination.startsWith("/")) continue;
    const [pathQ, id] = destination.split("#");
    const path = pathQ.split("?")[0];
    const rel = path.replace(/^\//, "") + (path.endsWith("/") ? "index.html" : "");
    if (!existsSync(join(ROOT, rel)) || !statSync(join(ROOT, rel)).isFile()) errors.push(`vercel.json: odredište ${destination} ne postoji`);
    else if (id && !idsOf(rel).has(id)) errors.push(`vercel.json: nema id-a "${id}" u ${rel}`);
    const src = join(ROOT, source);
    const toOwnDir = source.endsWith("/index.html") && destination === source.slice(0, -"index.html".length);
    if (!toOwnDir && !source.includes(":") && existsSync(src) && statSync(src).isFile()) errors.push(`vercel.json: izvor ${source} je postojeća datoteka`);
  }
  // llms.txt: svaka poveznica na PROD vodi na postojeću stranicu (i sidro u njoj)
  for (const [, url] of read("llms.txt").matchAll(/\]\((https:\/\/[^)\s]+)\)/g)) {
    if (!url.startsWith(PROD + "/")) continue;
    const [path, id] = url.slice(PROD.length + 1).split("#");
    const rel = path + (path === "" || path.endsWith("/") ? "index.html" : "");
    if (!existsSync(join(ROOT, rel))) errors.push(`llms.txt: ${url} ne postoji`);
    else if (id && !idsOf(rel).has(id)) errors.push(`llms.txt: nema id-a "${id}" u ${rel}`);
  }
  if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
  const iban = HTML.filter((file) => read(file).includes("[IBAN]"));
  if (iban.length) console.warn(`upozorenje: IBAN još nije upisan (${iban.join(", ")})`);
  console.log(`check: ${HTML.length} HTML datoteka u redu`);
}

// SEO: tri indeksirane stranice imaju title/description prave duljine, jedan <h1>, canonical i hreflang na PROD,
// og:image koja postoji, twitter:card i JSON-LD čiji FAQ odgovara pitanjima na stranici; sve ostale stranice su noindex.
function checkSeo() {
  const errors = [];
  const indexed = Object.values(LANGS).map((path) => path.replace(/^\//, "") + "index.html");
  for (const [lang, path] of Object.entries(LANGS)) {
    const file = path.replace(/^\//, "") + "index.html";
    const html = read(file);
    const err = (msg) => errors.push(`${file}: ${msg}`);
    const attr = (re) => { const m = html.match(re); return m ? text(m[1]) : ""; };
    const title = attr(/<title>([^<]*)<\/title>/);
    const description = attr(/<meta name="description" content="([^"]*)">/);
    if (title.length < SEO.title[0] || title.length > SEO.title[1]) err(`title ima ${title.length} znakova (${SEO.title.join("–")})`);
    if (description.length < SEO.description[0] || description.length > SEO.description[1]) err(`description ima ${description.length} znakova (${SEO.description.join("–")})`);
    const h1 = (html.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) err(`${h1} <h1>, očekivan 1`);
    if (/<meta name="robots" content="[^"]*noindex/.test(html)) err("indeksirana stranica ima noindex");
    if (!html.includes(`<link rel="canonical" href="${PROD}${path}">`)) err(`canonical nije ${PROD}${path}`);
    for (const [l, p] of [...Object.entries(LANGS), ["x-default", LANGS.de]]) {
      if (!html.includes(`<link rel="alternate" hreflang="${l}" href="${PROD}${p}">`)) err(`nema hreflang="${l}" za ${PROD}${p}`);
    }
    const image = attr(/<meta property="og:image" content="([^"]*)">/);
    if (!image.startsWith(PROD + "/")) err(`og:image nije na ${PROD}`);
    else if (!existsSync(join(ROOT, image.slice(PROD.length + 1)))) err(`og:image ${image} ne postoji`);
    for (const tag of ['<meta property="og:title"', '<meta property="og:description"', `<meta property="og:url" content="${PROD}${path}">`,
      '<meta name="twitter:card" content="summary_large_image">', '<meta name="twitter:image"']) {
      if (!html.includes(tag)) err(`nema ${tag}`);
    }
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!ld) { err("nema JSON-LD"); continue; }
    let graph;
    try { graph = JSON.parse(ld[1])["@graph"] || []; } catch (e) { err(`JSON-LD: ${e.message}`); continue; }
    for (const type of ["Organization", "WebSite", "WebPage", "SoftwareApplication", "FAQPage"]) {
      if (!graph.some((n) => n["@type"] === type)) err(`JSON-LD bez ${type}`);
    }
    const faq = graph.find((n) => n["@type"] === "FAQPage");
    const onPage = [...html.matchAll(/<h3 class="faq__q">([\s\S]*?)<\/h3>\s*<p class="faq__a">([\s\S]*?)<\/p>/g)]
      .map((m) => [text(m[1].replace(/<span class="faq__mark"[^>]*>\?<\/span>/, "")), text(m[2])]);
    const inLd = (faq?.mainEntity || []).map((q) => [q.name, q.acceptedAnswer?.text]);
    if (JSON.stringify(onPage) !== JSON.stringify(inLd)) err("FAQPage u JSON-LD-u ne odgovara pitanjima i odgovorima u sekciji 08");
    if (faq && faq.inLanguage !== lang) err(`FAQPage inLanguage nije ${lang}`);
  }
  for (const file of HTML.filter((f) => !indexed.includes(f))) {
    if (!/<meta name="robots" content="[^"]*noindex/.test(read(file))) errors.push(`${file}: stranica izvan sitemapa mora imati noindex`);
  }
  return errors;
}

function lastmod() {
  try {
    const date = execFileSync("git", ["log", "-1", "--format=%cI"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
  } catch { /* bez gita (npr. ZIP): datum builda */ }
  return new Date().toISOString().slice(0, 10);
}

// landing.css → landing.<hash>.css u dist/ i u poveznicama svih HTML stranica; promijenjen sadržaj = novo ime,
// pa preglednik nikad ne drži staru verziju. Izvorne datoteke i lint rade s imenima bez hasha.
function fingerprint() {
  const names = {};
  for (const dir of HASHED) {
    for (const file of readdirSync(join(DIST, dir))) {
      const m = file.match(/^(.+)\.(css|js)$/);
      if (!m) continue;
      const hash = createHash("sha256").update(readFileSync(join(DIST, dir, file))).digest("hex").slice(0, 10);
      renameSync(join(DIST, dir, file), join(DIST, dir, `${m[1]}.${hash}.${m[2]}`));
      names[`${dir}/${file}`] = `${dir}/${m[1]}.${hash}.${m[2]}`;
    }
  }
  for (const file of HTML) {
    const path = join(DIST, file);
    writeFileSync(path, readFileSync(path, "utf8").replace(/(\s(?:href|src)="[^"]*?)(assets\/(?:css|js)\/[^"?#]+)(?=["?#])/g, (_, pre, asset) => {
      if (!names[asset]) throw new Error(`${file}: ${asset} nije u dist/`);
      return pre + names[asset];
    }));
  }
  return Object.keys(names).length;
}

function build() {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST);
  for (const entry of COPY) cpSync(join(ROOT, entry), join(DIST, entry), { recursive: true });
  if (BASE !== "/") { // 404.html se poslužuje na bilo kojoj adresi, pa su mu poveznice root-apsolutne
    const file = join(DIST, "404.html");
    writeFileSync(file, readFileSync(file, "utf8").replace(/(\s(?:href|src)=")\//g, `$1${BASE}`));
  }
  const hashed = fingerprint();
  const date = lastmod();
  const alt = [...Object.entries(LANGS), ["x-default", LANGS.de]]
    .map(([lang, path]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE}${path}"/>`);
  const urls = Object.values(LANGS).map((path) => ["  <url>", `    <loc>${SITE}${path}</loc>`, `    <lastmod>${date}</lastmod>`, ...alt, "  </url>"].join("\n"));
  writeFileSync(join(DIST, "sitemap.xml"), ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls, "</urlset>", ""].join("\n"));
  writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  console.log(`build: dist/ za ${SITE} (base ${BASE}, lastmod ${date}, ${hashed} CSS/JS s hashom)`);
}

check();
if (!process.argv.includes("--check")) build();
