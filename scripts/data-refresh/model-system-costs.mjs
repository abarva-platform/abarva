#!/usr/bin/env node
/**
 * Replaces tier-constant per-system cost with a modelled long-tail distribution.
 *
 * WHAT WAS WRONG
 *
 * Per-system cost held three or four distinct values across hundreds of systems: one constant per
 * criticality tier. Every row looked plausible and the estate total looked plausible, so nothing
 * else caught it -- but the column was a category label wearing a currency sign. Any concentration,
 * Pareto or top-N analysis over it returned a confident answer about a figure that was never
 * recorded, and "the top ten systems by cost" was really "ten arbitrary tier-1 systems".
 *
 * WHAT REPLACES IT
 *
 * A deterministic model driven by SEVERAL recorded fields, never criticality alone -- criticality
 * being the sole determinant is precisely how the estate got three values in the first place.
 * Scale, integration surface, deployment model, lifecycle stage, type and category all move the
 * figure, and a seeded per-system jitter supplies the spread that real estates have and formulas
 * do not.
 *
 * The tenant total is preserved EXACTLY. The aggregate is governed and quoted; this run is
 * correcting how it is distributed across systems, not what the estate costs. The last system
 * absorbs the rounding remainder so the sum is exact rather than approximately right.
 *
 * ONLY FOR SYNTHETIC TENANTS. For a real client, absent cost stays unknown -- modelling a client's
 * spend and storing it beside their own figures is the exact failure this whole layer exists to
 * prevent. The script refuses to run on a tenant not declared synthetic in the registry.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const GENERATOR_VERSION = "system-cost-model/v1";
const MODEL_DATE = "2026-08-21";
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
const toCsv = (headers, rows) =>
  [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(","))].join("\n") + "\n";

const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8"));
const tenant = (registry.activeTenants ?? []).find((t) => t.tenantKey === tenantKey);
if (!tenant) { console.error(`ABORT: ${tenantKey} is not an active tenant in the registry.`); process.exit(1); }
const classification = tenant.packets?.[0]?.classification ?? "";
if (!/synthetic/i.test(classification)) {
  console.error(`ABORT: ${tenantKey} is classified "${classification}", not synthetic. A real client's absent cost stays unknown; it is never modelled.`);
  process.exit(1);
}

const fourPath = path.join(ROOT, tenant.canonicalInputRoot, "04_applications_systems.csv");
const raw = parseCsv(fs.readFileSync(fourPath, "utf8"));
const headers = (raw.shift() ?? []).map((h) => h.trim());
const rows = raw.filter((r) => r.some((v) => v.trim())).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));

/** Deterministic unit jitter from the system's own identity. Same estate, same numbers, always. */
function jitter(name) {
  const h = crypto.createHash("sha256").update(`${GENERATOR_VERSION}|${tenantKey}|${name}`).digest();
  return h.readUInt32BE(0) / 0xffffffff;
}

const F = {
  criticality: { tier1: 3.2, "mission critical": 3.2, critical: 3.2, tier2: 1.5, high: 1.5, tier3: 0.6, medium: 0.6, tier4: 0.35, low: 0.35 },
  type: { "Data-Platform": 2.4, Middleware: 1.8, COTS: 1.2, SaaS: 1.0, Custom: 0.9, Legacy: 0.75 },
  deployment: { on_premise: 1.25, hybrid: 1.1, private_cloud: 1.05, saas: 0.85, public_cloud: 0.9 },
  lifecycle: { production: 1.0, sunset: 0.55, deprecated: 0.5, pilot: 0.4, planned: 0.3 },
};
const lookup = (table, value, fallback = 1) => table[(value ?? "").trim()] ?? table[(value ?? "").trim().toLowerCase()] ?? fallback;

function weightFor(row) {
  let w = 1;
  w *= lookup(F.criticality, row.criticality, 1);
  w *= lookup(F.type, row.system_type, 1);
  w *= lookup(F.deployment, row.deployment_model, 1);
  w *= lookup(F.lifecycle, row.lifecycle_state, 1);

  // Scale and integration surface, where recorded. A system serving 20,000 users is not the same
  // cost as one serving 40, and tiering alone cannot express that.
  const users = Number((row.user_count ?? "").replace(/[^0-9.]/g, ""));
  if (Number.isFinite(users) && users > 0) w *= 0.6 + 0.4 * Math.log10(1 + users) ;
  const interfaces = Number((row.interfaces_count ?? "").replace(/[^0-9.]/g, ""));
  if (Number.isFinite(interfaces) && interfaces > 0) w *= 1 + Math.min(interfaces, 30) / 45;

  // Heavy-tailed jitter. Real estates have a few systems that cost far more than their tier
  // suggests; a symmetric wobble would produce a tidy distribution that is its own kind of wrong.
  const u = jitter(row.system_name ?? "");
  w *= Math.exp(0.62 * (Math.log(1 / (1 - Math.min(u, 0.999))) - 0.6931));
  return Math.max(w, 0.02);
}

const costs = rows.map((r) => Number((r.annual_cost_usd ?? "").replace(/[^0-9.]/g, "")) || 0);
const originalTotal = Math.round(costs.reduce((a, b) => a + b, 0));
const originalDistinct = new Set(costs.filter(Boolean)).size;
if (!originalTotal) { console.error("ABORT: no existing cost total to preserve."); process.exit(1); }

const weights = rows.map(weightFor);
const weightTotal = weights.reduce((a, b) => a + b, 0);
const modelled = weights.map((w) => Math.max(25_000, Math.round((w / weightTotal) * originalTotal / 1000) * 1000));

// No single system may carry an implausible share of the estate. A heavy tail is realistic; one
// application at a sixth of total application spend is not, and it would dominate every chart it
// appeared in. Excess is redistributed across the rest in proportion rather than clipped away,
// which would silently change the total.
const SINGLE_SYSTEM_CAP = 0.06;
for (let pass = 0; pass < 6; pass += 1) {
  const sum = modelled.reduce((a, b) => a + b, 0);
  const ceiling = Math.round((sum * SINGLE_SYSTEM_CAP) / 1000) * 1000;
  const over = modelled.map((v, i) => [v, i]).filter(([v]) => v > ceiling);
  if (!over.length) break;
  let excess = 0;
  for (const [v, i] of over) { excess += v - ceiling; modelled[i] = ceiling; }
  const eligible = modelled.map((v, i) => i).filter((i) => modelled[i] < ceiling);
  const base = eligible.reduce((a, i) => a + modelled[i], 0);
  for (const i of eligible) modelled[i] += Math.round((modelled[i] / base) * excess / 1000) * 1000;
}

// Preserve the governed total exactly rather than approximately.
let drift = originalTotal - modelled.reduce((a, b) => a + b, 0);
const order = modelled.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
let k = 0;
while (drift !== 0 && k < order.length * 4) {
  const i = order[k % order.length];
  const step = drift > 0 ? 1000 : -1000;
  if (modelled[i] + step >= 25_000) { modelled[i] += step; drift -= step; }
  k += 1;
}

const sorted = [...modelled].sort((a, b) => a - b);
const q = (p) => sorted[Math.floor(p * (sorted.length - 1))];
const total = modelled.reduce((a, b) => a + b, 0);
const top10 = sorted.slice(Math.floor(0.9 * sorted.length)).reduce((a, b) => a + b, 0);
const distinct = new Set(modelled).size;
const maxShareOfOneValue = Math.max(...[...new Set(modelled)].map((v) => modelled.filter((x) => x === v).length)) / modelled.length;

console.log(`tenant: ${tenantKey}  generator: ${GENERATOR_VERSION}`);
console.log(`  systems:            ${rows.length}`);
console.log(`  distinct before:    ${originalDistinct}   after: ${distinct}`);
console.log(`  total before:       $${originalTotal.toLocaleString()}`);
console.log(`  total after:        $${total.toLocaleString()}  ${total === originalTotal ? "(exact)" : "*** DRIFTED ***"}`);
console.log(`  p10/p50/p90:        $${q(0.1).toLocaleString()} / $${q(0.5).toLocaleString()} / $${q(0.9).toLocaleString()}`);
console.log(`  min/max:            $${sorted[0].toLocaleString()} / $${sorted[sorted.length - 1].toLocaleString()}`);
console.log(`  top 10% of systems: ${((top10 / total) * 100).toFixed(1)}% of cost`);
console.log(`  most common value:  ${(maxShareOfOneValue * 100).toFixed(1)}% of systems`);

const failures = [];
if (total !== originalTotal) failures.push("governed total not preserved exactly");
if (distinct / rows.length < 0.5) failures.push(`only ${distinct} distinct values across ${rows.length} systems`);
if (maxShareOfOneValue > 0.05) failures.push(`one value covers ${(maxShareOfOneValue * 100).toFixed(1)}% of systems`);
if (top10 / total < 0.3) failures.push(`top 10% carry only ${((top10 / total) * 100).toFixed(1)}% — too flat to be an estate`);
if (top10 / total > 0.75) failures.push(`top 10% carry ${((top10 / total) * 100).toFixed(1)}% — concentration forced too hard`);
if (failures.length) { console.error(`\nABORT:\n  - ${failures.join("\n  - ")}`); process.exit(1); }

const NOTE = `Per-system cost is modelled, not client-stated. Generator ${GENERATOR_VERSION}, model date ${MODEL_DATE}, seeded from system identity; driven by criticality, system type, deployment model, lifecycle, user scale and integration surface. Tenant total is preserved from the governed aggregate.`;
for (const col of ["annual_cost_basis", "annual_cost_generator", "annual_cost_model_date"]) if (!headers.includes(col)) headers.push(col);
rows.forEach((row, i) => {
  row.annual_cost_usd = String(modelled[i]);
  row.annual_cost_basis = "synthetic_modeled";
  row.annual_cost_generator = GENERATOR_VERSION;
  row.annual_cost_model_date = MODEL_DATE;
  const gaps = (row.known_gaps ?? "").trim();
  if (!gaps.includes(GENERATOR_VERSION)) row.known_gaps = gaps ? `${gaps} ${NOTE}` : NOTE;
});

if (!APPLY) { console.log(`\n(dry run — pass --apply to write)`); process.exit(0); }
fs.writeFileSync(fourPath, toCsv(headers, rows), "utf8");
console.log(`\nwrote ${path.relative(ROOT, fourPath)}`);
