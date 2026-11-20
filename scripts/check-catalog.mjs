// scripts/check-catalog.mjs
//
// Checks src/config.js BEFORE it reaches customers. Run: npm run check
// Exit code 1 = at least one ERROR (do not publish).
//
// Checks: unique ids, known category, price tiers, quantity rules,
// media files really exist in public/ (exact file-name case, like Cloudflare),
// file sizes (Cloudflare Pages limit: 25 MiB per file).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const configPath = path.join(root, "src/config.js");
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

if (!fs.existsSync(configPath)) {
  console.error("check-catalog: src/config.js not found. Run this inside the app folder.");
  process.exit(1);
}

// Load through a temporary .mjs copy (works with any package.json "type").
const tmp = path.join(os.tmpdir(), `rawller-check-${process.pid}.mjs`);
fs.copyFileSync(configPath, tmp);
let cfg;
try {
  cfg = await import(pathToFileURL(tmp).href);
} catch (e) {
  fs.rmSync(tmp, { force: true });
  console.error("ERROR config.js cannot be loaded: " + e.message);
  process.exit(1);
}
fs.rmSync(tmp, { force: true });

const products = cfg.PRODUCTS;
const categories = new Set((cfg.CATEGORIES || []).map((c) => c.id));
if (!Array.isArray(products) || products.length === 0) {
  console.error("ERROR config.js has no PRODUCTS array");
  process.exit(1);
}

const MiB = 1024 * 1024;
const seen = new Set();
const sortSeen = new Map();
const rows = [];

for (const p of products) {
  const id = p?.id;
  if (typeof id !== "string" || !id) { err("a product has no id"); continue; }
  if (seen.has(id)) err(`${id}: duplicate id`);
  seen.add(id);

  if (!p.name) err(`${id}: no name`);
  if (!categories.has(p.category)) {
    err(`${id}: category "${p.category}" is not in CATEGORIES (${[...categories].join(", ")})`);
  }
  if (p.sortOrder != null) {
    if (sortSeen.has(p.sortOrder)) warn(`${id}: same sortOrder (${p.sortOrder}) as ${sortSeen.get(p.sortOrder)}`);
    sortSeen.set(p.sortOrder, id);
  }

  // price tiers
  const tiers = Array.isArray(p.prices) ? p.prices : [];
  if (tiers.length === 0) err(`${id}: no prices (the shop page would crash)`);
  const qtys = [];
  for (const t of tiers) {
    const q = t?.grams ?? t?.pcs;
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(t?.price) || t.price <= 0) {
      err(`${id}: bad price tier ${JSON.stringify(t)}`);
    } else qtys.push(q);
  }
  if (new Set(qtys).size !== qtys.length) err(`${id}: repeated quantity in prices`);
  for (let i = 1; i < qtys.length; i++) {
    if (qtys[i] <= qtys[i - 1]) warn(`${id}: tiers are not in rising order`);
  }
  if (p.minQty != null && qtys.length && p.minQty > qtys[0]) {
    err(`${id}: minQty ${p.minQty} is larger than the first tier ${qtys[0]} (it could not be added)`);
  }
  if (qtys.length > 1) {
    const unit = tiers.map((t) => t.price / (t.grams ?? t.pcs));
    for (let i = 1; i < unit.length; i++) {
      if (unit[i] > unit[i - 1] + 1e-9) warn(`${id}: price per unit goes UP at tier ${qtys[i]} (check the price)`);
    }
  }

  // media
  const media = Array.isArray(p.media) ? p.media : [];
  if (media.length === 0 && !p.image) err(`${id}: no media`);
  if (!media.some((m) => m.type === "image")) warn(`${id}: no image (cards and the home carousel need one)`);
  for (const m of media) {
    const url = String(m?.url || "");
    if (!url.startsWith("/")) { err(`${id}: media url must start with "/": ${url}`); continue; }
    const file = path.join(root, "public", decodeURIComponent(url));
    if (!fs.existsSync(file)) {
      err(`${id}: file missing in public/: ${url}`);
      continue;
    }
    const size = fs.statSync(file).size;
    if (size > 25 * MiB) err(`${id}: ${url} is ${(size / MiB).toFixed(1)} MiB, over the 25 MiB Cloudflare limit`);
    else if (m.type === "image" && size > 1 * MiB) warn(`${id}: ${url} is ${(size / MiB).toFixed(1)} MiB (shrink it, phones download it)`);
    else if (m.type === "video" && size > 20 * MiB) warn(`${id}: ${url} is ${(size / MiB).toFixed(1)} MiB (close to the 25 MiB limit)`);
  }

  rows.push({
    id, category: p.category, isNew: !!p.isNew, soldOut: !!p.soldOut,
    tiers: tiers.length, images: media.filter((m) => m.type === "image").length,
    videos: media.filter((m) => m.type === "video").length,
  });
}

console.table(rows);
for (const w of warns) console.log("WARN  " + w);
for (const e of errors) console.log("ERROR " + e);
console.log(errors.length
  ? `\ncheck-catalog: ${errors.length} error(s). Fix them before publishing.`
  : `\ncheck-catalog: OK (${rows.length} products, ${warns.length} warning(s))`);
process.exit(errors.length ? 1 : 0);
