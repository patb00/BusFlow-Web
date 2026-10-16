// BusFlow landing: iz Natural Earth 110m admin_0 GeoJSON-a (public domain) radi assets/data/europe-countries.json
// za demo konfigurator (km po državama na ruti). Izvorni GeoJSON se ne commita.
//   node scripts/make-europe.mjs <putanja do ne_110m_admin_0_countries.geojson>
// Izvor: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson
// Izlaz: { source, bbox, countries: [{ c: "DE", r: [[lon,lat,lon,lat,…], …] }] } – samo vanjski prstenovi dijelova koji
// sijeku okvir Europe (lon −12…45, lat 34…72), koordinate na 2 decimale (≈ 1 km; 110m je ionako grublji).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const src = process.argv[2];
if (!src) { console.error("uporaba: node scripts/make-europe.mjs <ne_110m_admin_0_countries.geojson>"); process.exit(1); }
const OUT = fileURLToPath(new URL("../assets/data/europe-countries.json", import.meta.url));
const BBOX = [-12, 34, 45, 72]; // minLon, minLat, maxLon, maxLat

const geo = JSON.parse(readFileSync(src, "utf8"));
const intersects = (ring) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  return maxX >= BBOX[0] && minX <= BBOX[2] && maxY >= BBOX[1] && minY <= BBOX[3];
};
const flat = (ring) => {
  const out = [];
  let px, py;
  for (const [x, y] of ring) {
    const rx = Math.round(x * 100) / 100, ry = Math.round(y * 100) / 100;
    if (rx === px && ry === py) continue; // susjedne točke koje zaokruživanje spoji
    out.push(rx, ry); px = rx; py = ry;
  }
  return out.length >= 8 ? out : null; // barem 4 točke (zatvoren trokut)
};

const countries = [];
for (const f of geo.features) {
  const p = f.properties;
  const code = (p.ISO_A2_EH && p.ISO_A2_EH !== "-99") ? p.ISO_A2_EH : (p.ISO_A2 !== "-99" ? p.ISO_A2 : null);
  if (!code) { console.warn(`preskačem bez ISO koda: ${p.NAME}`); continue; }
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  const rings = [];
  for (const poly of polys) {
    const outer = poly[0];
    if (!intersects(outer)) continue;
    const r = flat(outer);
    if (r) rings.push(r);
  }
  if (rings.length) countries.push({ c: code, r: rings });
}
countries.sort((a, b) => a.c.localeCompare(b.c));
const json = JSON.stringify({ source: "Natural Earth 110m admin_0 countries (public domain), bbox Europe", bbox: BBOX, countries });
writeFileSync(OUT, json + "\n");
console.log(`${countries.length} država (${countries.map((c) => c.c).join(" ")}), ${(json.length / 1024).toFixed(1)} KB → ${OUT}`);
