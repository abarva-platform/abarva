#!/usr/bin/env node
/**
 * Rewrites integration references from provenance ids to the declared business identity.
 *
 * One tenant's integration rows name systems by an `APP-nnnn` id that exists only in
 * `04_applications_systems.original_row_id` -- a provenance column. Every reference resolves
 * there and none against `system_name`, which is what the template declares and what the other
 * tenant uses. Both files are individually valid, so nothing failed: a consumer joining on the
 * documented key simply got an empty topology and reported success.
 *
 * The rewrite is exact or it does not happen. No fuzzy matching, no nearest-name, no partial run:
 * an unresolved reference aborts, because a topology that is 99% right is one nobody can trust and
 * everybody will quote.
 *
 * The original ids are preserved in explicit provenance columns rather than discarded. They are
 * how this file joins back to whatever produced it, and losing them would trade one broken lineage
 * for another.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && q && n === '"') { cell += '"'; i += 1; continue; }
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { row.push(cell); cell = ""; continue; }
    if ((c === "\n" || c === "\r") && !q) {
      if (c === "\r" && n === "\n") i += 1;
      row.push(cell); rows.push(row); row = []; cell = ""; continue;
    }
    cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const esc = (v) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const toCsv = (headers, rows) =>
  [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(","))].join("\n") + "\n";

function load(p) {
  const raw = parseCsv(fs.readFileSync(p, "utf8"));
  const headers = (raw.shift() ?? []).map((h) => h.trim());
  const rows = raw
    .filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));
  return { headers, rows };
}

const tenantKey = process.argv[process.argv.indexOf("--tenant") + 1];
const root = path.join(ROOT, "datasets/tenant-inputs/active", tenantKey, "current");
const fourPath = path.join(root, "04_applications_systems.csv");
const fivePath = path.join(root, "05_data_assets_integrations.csv");

const four = load(fourPath);
const five = load(fivePath);

// The mapping must be a function, not a relation. A provenance id pointing at two system names is
// not a key, and silently taking the first would fabricate a topology.
const byProvenance = new Map();
const ambiguous = [];
for (const row of four.rows) {
  const id = (row.original_row_id ?? "").trim();
  const name = (row.system_name ?? "").trim();
  if (!id || !name) continue;
  if (byProvenance.has(id) && byProvenance.get(id) !== name) ambiguous.push(id);
  byProvenance.set(id, name);
}
if (ambiguous.length) {
  console.error(`ABORT: ${ambiguous.length} provenance ids map to more than one system name: ${ambiguous.slice(0, 5).join(", ")}`);
  process.exit(1);
}

const REF_COLUMNS = ["source_system", "target_system"];
const PROVENANCE_FOR = { source_system: "source_system_ref_id", target_system: "target_system_ref_id" };

const unresolved = new Map();
let rewritten = 0, alreadyName = 0;

for (const row of five.rows) {
  for (const col of REF_COLUMNS) {
    const value = (row[col] ?? "").trim();
    if (!value) continue;
    const mapped = byProvenance.get(value);
    if (mapped) {
      row[PROVENANCE_FOR[col]] = value;
      row[col] = mapped;
      rewritten += 1;
      continue;
    }
    // Already a business name is fine and is left alone.
    if (four.rows.some((r) => (r.system_name ?? "").trim() === value)) { alreadyName += 1; continue; }
    unresolved.set(value, (unresolved.get(value) ?? 0) + 1);
  }
}

const headers = [...five.headers];
for (const col of Object.values(PROVENANCE_FOR)) if (!headers.includes(col)) headers.push(col);

console.log(`tenant: ${tenantKey}`);
console.log(`  systems in 04:            ${four.rows.length}`);
console.log(`  integration rows in 05:   ${five.rows.length}`);
console.log(`  references rewritten:     ${rewritten}`);
console.log(`  already business names:   ${alreadyName}`);
console.log(`  unresolved:               ${unresolved.size} distinct`);

if (unresolved.size) {
  console.error(`\nABORT: unresolved references. Exact or not at all -- a topology that is 99% right is one nobody can trust and everybody will quote.`);
  for (const [value, count] of [...unresolved].slice(0, 10)) console.error(`    ${value}  (${count} occurrences)`);
  process.exit(1);
}

if (!APPLY) { console.log(`\n(dry run — pass --apply to write)`); process.exit(0); }
fs.writeFileSync(fivePath, toCsv(headers, five.rows), "utf8");
console.log(`\nwrote ${path.relative(ROOT, fivePath)}`);
