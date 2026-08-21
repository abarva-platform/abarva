#!/usr/bin/env node
/**
 * Qualifies generic data-asset names that describe more than one real asset.
 *
 * WHAT WAS WRONG
 *
 * Canonical identity for a data asset is its name. Eighty-five distinct integration rows -- one per
 * outstation, each to a different named system -- all carried the same generic asset name, so the
 * build collapsed eighty-five real assets into one record. That is the entire explanation for a
 * canonical snapshot holding a few hundred assets against a source file of many more, and for the
 * airport estate looking far smaller downstream than the record actually is.
 *
 * Nothing was malformed. Each row was individually correct, the file parsed, no value was missing.
 * The defect only exists in the relationship between the name column and the target column.
 *
 * WHAT THIS DOES
 *
 * Where one asset name covers several distinct targets, the name is qualified with the
 * distinguishing part of the target that already exists in the record -- the station or instance
 * suffix. Nothing is invented: if the targets do not differ, the rows genuinely are the same asset
 * and are left alone, and if a name cannot be made distinct from recorded data the run aborts
 * rather than appending a counter, because "asset (3)" is an identity nobody can look up.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");
const tenantKey = process.argv[process.argv.indexOf("--tenant") + 1];

function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && q && n === '"') { cell += '"'; i += 1; continue; }
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { row.push(cell); cell = ""; continue; }
    if ((c === "\n" || c === "\r") && !q) { if (c === "\r" && n === "\n") i += 1; row.push(cell); rows.push(row); row = []; cell = ""; continue; }
    cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const esc = (v) => (/[",\n\r]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8"));
const tenant = (registry.activeTenants ?? []).find((t) => t.tenantKey === tenantKey);
const file = path.join(ROOT, tenant.canonicalInputRoot, "05_data_assets_integrations.csv");
const raw = parseCsv(fs.readFileSync(file, "utf8"));
const headers = (raw.shift() ?? []).map((h) => h.trim());
const rows = raw.filter((r) => r.some((v) => v.trim())).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));

/** The part of a system name that distinguishes one instance from its siblings. */
function qualifier(systemName) {
  const m = systemName.match(/[—–-]\s*(.+)$/);
  if (m) return m[1].trim();
  return systemName.trim();
}

const byName = new Map();
for (const row of rows) {
  const name = row.data_asset_name;
  if (!name) continue;
  if (!byName.has(name)) byName.set(name, []);
  byName.get(name).push(row);
}

let qualified = 0, leftAlone = 0;
const unfixable = [];

for (const [name, group] of byName) {
  if (group.length === 1) continue;
  const targets = new Set(group.map((r) => r.target_system).filter(Boolean));
  if (targets.size === 1) { leftAlone += group.length - 1; continue; }

  const proposed = new Map();
  for (const row of group) {
    const q = qualifier(row.target_system || row.source_system || "");
    const next = q && !name.includes(q) ? `${name} — ${q}` : name;
    proposed.set(row, next);
  }
  const distinct = new Set(proposed.values());
  if (distinct.size !== group.length) {
    unfixable.push({ name, rows: group.length, distinct: distinct.size });
    continue;
  }
  for (const [row, next] of proposed) { row.data_asset_name = next; qualified += 1; }
}

const finalNames = rows.map((r) => r.data_asset_name);
const finalDistinct = new Set(finalNames).size;

console.log(`tenant: ${tenantKey}`);
console.log(`  rows:                       ${rows.length}`);
console.log(`  distinct asset names before: ${byName.size}`);
console.log(`  names qualified:             ${qualified}`);
console.log(`  genuinely same asset:        ${leftAlone} rows left alone`);
console.log(`  distinct asset names after:  ${finalDistinct}`);

if (unfixable.length) {
  console.error(`\nABORT: ${unfixable.length} names cannot be made distinct from recorded data.`);
  for (const u of unfixable.slice(0, 6)) console.error(`    "${u.name}" — ${u.rows} rows collapse to ${u.distinct} names`);
  console.error(`  A counter suffix would produce an identity nobody can look up. The source needs a real distinguisher.`);
  process.exit(1);
}

if (!APPLY) { console.log(`\n(dry run — pass --apply to write)`); process.exit(0); }
fs.writeFileSync(file, [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(","))].join("\n") + "\n", "utf8");
console.log(`\nwrote ${path.relative(ROOT, file)}`);
