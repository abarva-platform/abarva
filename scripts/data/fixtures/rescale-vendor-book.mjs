#!/usr/bin/env node
/**
 * Rescale a tenant's vendor contract values to a credible book.
 *
 * Two defects, and only one of them was what it first looked like.
 *
 * The airline's vendor book totalled $778M against a $3.42B technology budget — 23%, where
 * third-party spend is normally 50–70% of IT. And its largest contract was 8.0% of the book, with a
 * flat ceiling at $62M: four contracts within $21M of each other at the top. A portfolio shaped like
 * that has no concentration to find, so it cannot demonstrate renewal leverage, concentration risk,
 * or a savings case — the three things the product exists to show.
 *
 * What it looked like was a count problem: 65 contracts for an $81B carrier, against a rule
 * demanding ~204. Checking the estate first showed that was wrong. **Every supplier named in the
 * application inventory already had a contract.** Meeting that count would have meant inventing 140
 * vendors appearing nowhere in the estate, breaking a register-to-estate consistency that is one of
 * this fixture's real strengths. The register was complete. The money was wrong.
 *
 * So this rescales values and does not add rows.
 *
 * Weighting is grounded rather than random: a supplier's share of the book is driven by how much of
 * the estate it actually supplies — the number of applications naming it, weighted by their
 * criticality — with existing value as a tiebreak. The carrier's passenger service platform vendor
 * ends up dominant because it genuinely underpins the most tier-1 systems, not because a curve
 * needed a head.
 *
 * Usage:
 *   node scripts/data/fixtures/rescale-vendor-book.mjs [--tenant <key>]... [--write]
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");
const TENANT_ARGS = [];
process.argv.forEach((a, i) => {
  if (a === "--tenant") TENANT_ARGS.push(process.argv[i + 1]);
});
const TENANTS = TENANT_ARGS.length ? TENANT_ARGS : ["skyharbor-air", "meridian-health"];

/** Third-party share of the technology budget. Mid-band of the 50–70% norm. */
const TARGET_SHARE = 0.6;
/** Leave a book alone when it already sits in this band — churning a passing number is not a fix. */
const ACCEPTABLE_SHARE = [0.45, 0.8];
/**
 * Ceiling on any single contract, as a share of the book.
 *
 * Concentration is the point, but an uncapped power law put the airline's most estate-pervasive
 * supplier at $360M — roughly a quarter of that vendor's entire global revenue from one customer.
 * The estate's tier-1 attribution is a good signal of importance and a poor one of billing scale.
 */
const MAX_CONTRACT_SHARE = 0.14;

/**
 * Criticality weighting.
 *
 * A vendor supplying twenty tier-3 utilities is not the commercial equal of one supplying three
 * tier-1 platforms, and a book that treats them alike produces the flat ceiling this fixes.
 */
const CRITICALITY_WEIGHT = { tier1: 6, tier2: 3, tier3: 1.4, tier4: 1 };

function parseCsv(text) {
  const rows = [];
  let field = "", row = [], quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const objects = (rows) => {
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
};
const num = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
/** Contract values are negotiated, not computed — round to something a procurement team would sign. */
function tidy(n) {
  if (n >= 100e6) return Math.round(n / 5e6) * 5e6;
  if (n >= 10e6) return Math.round(n / 1e6) * 1e6;
  if (n >= 1e6) return Math.round(n / 1e5) * 1e5;
  return Math.round(n / 1e4) * 1e4;
}

const summary = [];

for (const tenantKey of TENANTS) {
  const dir = path.join(ROOT, "datasets/tenant-inputs/active", tenantKey, "current");
  const vendorPath = path.join(dir, "07_vendors_contracts.csv");
  const appPath = path.join(dir, "04_applications_systems.csv");
  const spendPath = path.join(dir, "08_spend_value.csv");
  if (!fs.existsSync(vendorPath) || !fs.existsSync(spendPath)) continue;

  const vendorRows = parseCsv(fs.readFileSync(vendorPath, "utf8"));
  const header = vendorRows[0].map((h) => h.trim());
  const vendors = objects(vendorRows);
  const apps = fs.existsSync(appPath) ? objects(parseCsv(fs.readFileSync(appPath, "utf8"))) : [];
  const itBudget = objects(parseCsv(fs.readFileSync(spendPath, "utf8")))
    .reduce((sum, r) => sum + num(r.annual_spend_usd), 0);
  if (itBudget <= 0) continue;

  const currentTotal = vendors.reduce((sum, v) => sum + num(v.annual_spend_usd), 0);
  const currentShare = currentTotal / itBudget;
  if (currentShare >= ACCEPTABLE_SHARE[0] && currentShare <= ACCEPTABLE_SHARE[1]) {
    summary.push({
      tenantKey,
      contracts: vendors.length,
      skipped: `book is ${(currentShare * 100).toFixed(1)}% of the technology budget, already inside the ${ACCEPTABLE_SHARE[0] * 100}–${ACCEPTABLE_SHARE[1] * 100}% band`,
    });
    continue;
  }
  const targetTotal = itBudget * TARGET_SHARE;

  // Estate footprint per supplier: applications supplied, weighted by criticality.
  const footprint = new Map();
  for (const app of apps) {
    const vendor = (app.vendor ?? "").trim();
    if (!vendor) continue;
    const weight = CRITICALITY_WEIGHT[(app.criticality ?? "").trim().toLowerCase()] ?? 1;
    footprint.set(vendor, (footprint.get(vendor) ?? 0) + weight);
  }

  // Blend estate footprint with the existing value. Footprint alone would flatten deliberate
  // commercial shape — an outsourced managed-service contract can be large while naming few systems
  // — so existing value carries real information and is kept as the minority term.
  const scored = vendors.map((v) => {
    const name = (v.vendor_name ?? "").trim();
    const foot = footprint.get(name) ?? 0;
    const existing = num(v.annual_spend_usd);
    return { row: v, name, foot, existing };
  });
  const footSum = scored.reduce((s, x) => s + x.foot, 0) || 1;
  const existSum = scored.reduce((s, x) => s + x.existing, 0) || 1;
  const weights = scored.map((x) => ({
    ...x,
    // Squared footprint share creates the concentration a real portfolio has: the biggest supplier
    // pulls away rather than sitting in a line with the next four.
    weight: 0.72 * Math.pow(x.foot / footSum, 1.55) + 0.28 * (x.existing / existSum),
  }));
  const weightSum = weights.reduce((s, x) => s + x.weight, 0) || 1;

  // Cap the head, then redistribute what the cap removed across everything below it, so the book
  // still totals the target rather than quietly shrinking to satisfy the ceiling.
  const capped = weights.map((x) => ({ ...x, share: x.weight / weightSum }));
  let overflow = 0;
  for (const x of capped) {
    if (x.share > MAX_CONTRACT_SHARE) {
      overflow += x.share - MAX_CONTRACT_SHARE;
      x.share = MAX_CONTRACT_SHARE;
      x.atCap = true;
    }
  }
  const belowCapWeight = capped.filter((x) => !x.atCap).reduce((s, x) => s + x.share, 0) || 1;
  for (const x of capped) {
    if (!x.atCap) x.share += overflow * (x.share / belowCapWeight);
  }

  const out = capped.map((x) => {
    const value = tidy(Math.max(240_000, x.share * targetTotal));
    return { ...x.row, annual_spend_usd: String(value) };
  });

  const newTotal = out.reduce((s, r) => s + num(r.annual_spend_usd), 0);
  const sorted = out.map((r) => num(r.annual_spend_usd)).sort((a, b) => b - a);
  summary.push({
    tenantKey,
    contracts: out.length,
    itBudget,
    beforeTotal: currentTotal,
    beforeShare: Number((currentShare * 100).toFixed(1)),
    afterTotal: newTotal,
    afterShare: Number(((newTotal / itBudget) * 100).toFixed(1)),
    topShare: Number(((sorted[0] / newTotal) * 100).toFixed(1)),
    top10Share: Number(((sorted.slice(0, 10).reduce((a, b) => a + b, 0) / newTotal) * 100).toFixed(1)),
    top5: sorted.slice(0, 5),
    largest: out
      .slice()
      .sort((a, b) => num(b.annual_spend_usd) - num(a.annual_spend_usd))
      .slice(0, 5)
      .map((r) => `${r.vendor_name} $${(num(r.annual_spend_usd) / 1e6).toFixed(0)}M`),
  });

  if (WRITE) {
    const csv = [header.join(","), ...out.map((r) => header.map((h) => esc(r[h])).join(","))].join("\n") + "\n";
    fs.writeFileSync(vendorPath, csv);
  }
}

console.log(JSON.stringify({ mode: WRITE ? "write" : "dry-run", targetShare: TARGET_SHARE, summary }, null, 2));
for (const s of summary) {
  if (s.skipped) { console.log(`\n${s.tenantKey} — left unchanged: ${s.skipped}`); continue; }
  console.log(`\n${s.tenantKey} — ${s.contracts} contracts, no rows added`);
  console.log(`  book $${(s.beforeTotal / 1e6).toFixed(0)}M (${s.beforeShare}% of IT) -> $${(s.afterTotal / 1e6).toFixed(0)}M (${s.afterShare}%)`);
  console.log(`  concentration: top contract ${s.topShare}% of book, top ten ${s.top10Share}%`);
  console.log(`  largest: ${s.largest.join(" · ")}`);
}
if (!WRITE) console.log("\ndry-run — pass --write to update the register.");
