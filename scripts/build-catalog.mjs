#!/usr/bin/env node
// Builds the static medicine catalogue served at /catalog/* from open data.
//
// Sources (both MIT licensed):
//   - junioralive/Indian-Medicine-Dataset — ~254k Indian products with MRP
//   - SRJ-ai/dawasaver jan_aushadhi_seed.csv — indicative Jan Aushadhi prices
//
// Usage: node scripts/build-catalog.mjs [--force] [market.csv] [jan_aushadhi.csv]
// With no file arguments the sources are downloaded from GitHub. Without
// --force an existing catalogue is kept (fast local dev and rebuilds).
//
// Output (web/public/catalog):
//   meta.json            counts, sources, licences, build date
//   idx/<pp>.json        search shard by 2-char prefix: [label, kind, gid, productId]
//   grp/<bucket>.json    { m: [manufacturers], p: [pack labels], g: { gid: { k, l, f, g, c, i } } }
//                        group: k=key, l=label, f=form, g=generics, c=controlled class, i=items
//                        item:  [id, name, mrp, packCount, unitKind, manufacturerIdx, packIdx, janAushadhi]

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "web/public/catalog");
const MARKET_URL = "https://raw.githubusercontent.com/junioralive/Indian-Medicine-Dataset/main/DATA/indian_medicine_data.csv";
const JA_URL = "https://raw.githubusercontent.com/SRJ-ai/dawasaver/main/pipeline/sources/jan_aushadhi_seed.csv";
const BUCKETS = 256;

// Reuse the TypeScript normalisers so the app and the pipeline agree exactly
// (run with --experimental-strip-types; see the "catalog" npm script).
const { detectForm, groupDisplayLabel, parseIngredient, saltKey, saltLabel, toGeneric } = await import("../packages/find/src/salt.ts");
const { parsePack } = await import("../packages/find/src/pack.ts");
const { controlledClass } = await import("../packages/find/src/controlled.ts");

async function load(pathOrUrl) {
  if (pathOrUrl.startsWith("http")) {
    const res = await fetch(pathOrUrl);
    if (!res.ok) throw new Error(`download failed ${res.status}: ${pathOrUrl}`);
    return res.text();
  }
  return readFileSync(pathOrUrl, "utf8");
}

// RFC 4180 CSV parser (handles quoted fields with commas/newlines).
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", i = 0, q = false;
  while (i < text.length) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } q = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { q = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = ""; i++; continue;
    }
    field += c; i++;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  return body.filter((r) => r.length >= header.length).map((r) => Object.fromEntries(header.map((h, j) => [h, r[j]])));
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const [marketSrc = MARKET_URL, jaSrc = JA_URL] = args.filter((a) => a !== "--force");
if (!force && args.length === 0 && existsSync(join(OUT, "meta.json"))) {
  console.log("catalog: already built (use --force to rebuild)");
  process.exit(0);
}
const market = parseCsv(await load(marketSrc));
const ja = parseCsv(await load(jaSrc));

const groups = new Map(); // key -> group
let kept = 0, dropped = 0;

function addProduct(row, { id, price, janAushadhi }) {
  const ingredients = [row.short_composition1, row.short_composition2].map(parseIngredient).filter(Boolean);
  if (!ingredients.length || !(price > 0)) { dropped++; return; }
  const form = detectForm(row.name, row.pack_size_label);
  const key = saltKey(ingredients, form);
  let g = groups.get(key);
  if (!g) {
    const generics = [...new Set(ingredients.map((i) => toGeneric(i.name)))];
    g = { key, label: saltLabel(ingredients), form, generics, controlled: generics.map(controlledClass).find(Boolean) ?? null, items: [] };
    groups.set(key, g);
  }
  const pack = parsePack(row.pack_size_label ?? "");
  g.items.push([id, row.name.trim(), Math.round(price * 100) / 100, pack?.count ?? null, pack?.kind ?? null, (row.manufacturer_name ?? "").trim(), (row.pack_size_label ?? "").trim(), janAushadhi ? 1 : 0]);
  kept++;
}

for (const row of market) {
  if (row.Is_discontinued !== "FALSE" || row.type !== "allopathy") { dropped++; continue; }
  addProduct(row, { id: Number(row.id), price: Number(row["price(₹)"]), janAushadhi: false });
}
let jaMerged = 0;
for (const row of ja) {
  const before = kept;
  addProduct(row, { id: 1_000_000 + Number(row.drug_code), price: Number(row.price), janAushadhi: true });
  if (kept > before) jaMerged++;
}

// Stable group ids: sorted by key.
const ordered = [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
const unit = (it) => (it[3] ? it[2] / it[3] : Infinity);
ordered.forEach((g, gid) => {
  g.gid = gid;
  g.items.sort((a, b) => unit(a) - unit(b) || a[2] - b[2]);
});

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "idx"), { recursive: true });
mkdirSync(join(OUT, "grp"), { recursive: true });

// Each shard interns manufacturer names and pack labels (both highly repetitive).
const buckets = Array.from({ length: BUCKETS }, () => ({ m: [], p: [], g: {}, mi: new Map(), pi: new Map() }));
const intern = (list, index, value) => {
  if (!index.has(value)) { index.set(value, list.length); list.push(value); }
  return index.get(value);
};
for (const g of ordered) {
  const b = buckets[g.gid % BUCKETS];
  const items = g.items.map(([id, name, mrp, count, kind, mfr, pack, jaFlag]) => [id, name, mrp, count, kind, intern(b.m, b.mi, mfr), intern(b.p, b.pi, pack), jaFlag]);
  b.g[g.gid] = { k: g.key, l: g.label, f: g.form, g: g.generics, c: g.controlled, i: items };
}
buckets.forEach(({ m, p, g }, n) => writeFileSync(join(OUT, "grp", `${n}.json`), JSON.stringify({ m, p, g })));

// Search index: brand names (kind 0) and salt labels (kind 1), sharded by prefix.
const prefix = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 2);
const shards = new Map();
const push = (label, entry) => {
  const p = prefix(label);
  if (p.length < 2) return;
  if (!shards.has(p)) shards.set(p, []);
  shards.get(p).push(entry);
};
for (const g of ordered) {
  const display = groupDisplayLabel(g.label, g.form);
  push(display, [display, 1, g.gid, null]);
  for (const it of g.items) push(it[1], [it[1], 0, g.gid, it[0]]);
}
for (const [p, entries] of shards) {
  entries.sort((a, b) => a[0].length - b[0].length || a[0].localeCompare(b[0]));
  writeFileSync(join(OUT, "idx", `${p}.json`), JSON.stringify(entries));
}

const meta = {
  builtAt: new Date().toISOString(),
  products: kept,
  groups: ordered.length,
  janAushadhiProducts: jaMerged,
  buckets: BUCKETS,
  sources: [
    { name: "Indian Medicine Dataset", url: "https://github.com/junioralive/Indian-Medicine-Dataset", licence: "MIT", note: "MRP snapshot; verify on the pack" },
    { name: "DawaSaver Jan Aushadhi seed", url: "https://github.com/SRJ-ai/dawasaver", licence: "MIT", note: "Indicative Jan Aushadhi prices" },
  ],
};
writeFileSync(join(OUT, "meta.json"), JSON.stringify(meta, null, 2));
console.log(`catalog: ${kept} products, ${ordered.length} groups, ${shards.size} index shards, ${jaMerged} Jan Aushadhi (dropped ${dropped})`);
