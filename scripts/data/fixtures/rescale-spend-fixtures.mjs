#!/usr/bin/env node
/**
 * Rescale synthetic spend fixtures to published industry benchmarks.
 *
 * Two defects made the fixtures indefensible in front of anyone who knows the industries.
 *
 * The airline declared $663M of technology spend against $81.4B of revenue — 0.81%, where SITA and
 * TNMT put airline IT at roughly 4% of revenue today (5% pre-pandemic, 6–8% the recommended target
 * for carriers investing in modernisation). Southwest alone budgeted $1.7B on ~$27.5B of revenue.
 * A carrier twice that size spending a third as much is not a lean operator; it is a typo.
 *
 * The health system's spend sheet was not a technology budget at all. Its categories were business
 * functions — facilities, HR, behavioural health — so it totalled $5.4B of enterprise operating cost
 * on $24B of revenue, of which the actual IT line was $103M. Any product quoting that total as a
 * technology budget overstates it more than fiftyfold, and the grain error is invisible to every
 * structural check because the file is perfectly well formed.
 *
 * This regenerates both spend sheets from an explicit segment model, so every figure traces to a
 * stated assumption rather than to whoever typed it. Rerunning produces identical output.
 *
 * Usage:
 *   node scripts/data/fixtures/rescale-spend-fixtures.mjs [--write]
 *
 * Dry-run by default; prints the model, the resulting sheet, and the resulting share of revenue.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");

/**
 * Segment models.
 *
 * Every spend line is expressed as a share of a *segment's* revenue, not of the enterprise total,
 * because that is how these budgets are actually set and how a benchmark is quoted. A provider
 * organisation spends 5–8% of patient revenue on IT; a health plan spends 2–4% of premium revenue.
 * Blending them first and applying one rate to the total is the mistake that produced the original
 * numbers.
 */
const MODELS = {
  "meridian-health": {
    entity: "integrated delivery network with an owned health plan",
    revenueUsd: 25e9,
    // 60% provider / 40% plan, per the operating model.
    segments: [
      { key: "provider", label: "Hospitals & physician network", share: 0.6, itRate: 0.05 },
      { key: "plan", label: "Health plan operations", share: 0.4, itRate: 0.021 },
    ],
    // Within the plan: 70% Medicare, 30% commercial.
    planMix: [
      { key: "medicare", label: "Medicare Advantage & Medicare FFS", share: 0.7 },
      { key: "commercial", label: "Commercial & Medicaid managed care", share: 0.3 },
    ],
    hospitals: 34,
    /**
     * Benchmarks: providers 5–8% of revenue (large IDNs at the top of the range), payers 3–5% of
     * operating revenue. A 5% provider rate and 2.1% plan rate blend to ~3.8% of total — inside the
     * 3–4% target for this fixture, and at the conservative end of what a blended IDN would report.
     */
    categories: [
      // Provider — clinical core
      ["Epic EHR Platform & Clinical Applications", "provider", 0.185],
      ["Clinical Ancillary Systems (Lab, Pharmacy, Periop)", "provider", 0.062],
      ["Imaging, PACS & Enterprise VNA", "provider", 0.048],
      ["Medical Device Integration & Clinical Engineering IT", "provider", 0.034],
      ["Revenue Cycle Applications", "provider", 0.071],
      ["Patient Access & Digital Front Door", "provider", 0.043],
      ["Care Management & Population Health", "provider", 0.039],
      ["Ambulatory & Physician Network Technology", "provider", 0.036],
      // Plan
      ["Core Claims Administration Platform", "plan", 0.052],
      ["Enrollment, Billing & Member Services Systems", "plan", 0.031],
      ["Utilization & Care Management Platform", "plan", 0.024],
      ["Risk Adjustment, STARS & HEDIS Analytics", "plan", 0.033],
      ["Provider Network & Contracting Systems", "plan", 0.019],
      ["Pharmacy Benefit Integration", "plan", 0.015],
      // Shared enterprise
      ["Infrastructure & Hybrid Cloud", "shared", 0.108],
      ["Data & Analytics Platform", "shared", 0.058],
      ["Interoperability & Integration Engine", "shared", 0.027],
      ["Cybersecurity & IT Risk", "shared", 0.064],
      ["ERP & Finance Applications", "shared", 0.036],
      ["HR & Workforce Applications", "shared", 0.024],
      ["Enterprise Collaboration & Productivity", "shared", 0.021],
      ["IT Service Management & Service Desk", "shared", 0.026],
      ["GenAI / AI Platform", "shared", 0.014],
      ["Acquisition Legacy & Integration Debt", "shared", 0.03],
    ],
  },

  "skyharbor-air": {
    entity: "global network carrier",
    revenueUsd: 81.4e9,
    /**
     * Benchmarks: airline IT is ~4% of revenue today, down from 5% pre-pandemic; 6–8% is the
     * recommended target for modernising carriers. Southwest budgeted $1.7B on ~$27.5B (6.2%).
     * SkyHarbor is mid-modernisation — Teradata to Snowflake, NDC distribution, an AI platform — so
     * 4.2% sits just above the industry current rate without claiming best-in-class.
     */
    segments: [{ key: "airline", label: "Airline operations", share: 1, itRate: 0.042 }],
    categories: [
      ["Passenger Service System & Distribution", "airline", 0.128],
      ["Digital Channels, NDC & Offer/Order Platform", "airline", 0.061],
      ["Loyalty & Marketing Technology", "airline", 0.038],
      ["Crew & Flight Operations Applications", "airline", 0.072],
      ["Network Planning, Scheduling & Revenue Management", "airline", 0.056],
      ["Airport, Common-Use & Baggage Technology", "airline", 0.054],
      ["MRO & Engineering Applications", "airline", 0.047],
      ["Cargo Applications", "airline", 0.023],
      ["Contact Center & CX Applications", "airline", 0.045],
      ["Safety, Compliance & Regulatory Systems", "airline", 0.022],
      ["Infrastructure & Cloud", "airline", 0.142],
      ["Mainframe & Core Transaction Estate", "airline", 0.049],
      ["Data & Analytics Platforms", "airline", 0.063],
      ["GenAI / AI Platform", "airline", 0.019],
      ["Cybersecurity & IT Risk", "airline", 0.061],
      ["ERP & Finance Applications", "airline", 0.038],
      ["HR & Workforce Applications", "airline", 0.026],
      ["Enterprise Collaboration & Productivity", "airline", 0.021],
      ["IT Service Management & Service Desk", "airline", 0.024],
      ["Application Managed Services (non-core)", "airline", 0.029],
      ["Facilities & Corporate Technology", "airline", 0.014],
      ["Meridian Regional Legacy & Integration", "airline", 0.021],
      ["Enterprise Integration & API Platform", "airline", 0.027],
    ],
  },
};

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

const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Round to two significant figures below $100M, whole millions above — budgets are never exact. */
function tidy(n) {
  if (n >= 100e6) return Math.round(n / 1e6) * 1e6;
  if (n >= 10e6) return Math.round(n / 1e5) * 1e5;
  return Math.round(n / 1e4) * 1e4;
}

const summary = [];

for (const [tenantKey, model] of Object.entries(MODELS)) {
  const file = path.join(ROOT, "datasets/tenant-inputs/active", tenantKey, "current/08_spend_value.csv");
  if (!fs.existsSync(file)) {
    console.error(`skip ${tenantKey}: no spend sheet`);
    continue;
  }
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const header = rows[0].map((h) => h.trim());
  const existing = rows.slice(1).filter((r) => r.some((v) => v.trim()));
  const template = Object.fromEntries(header.map((h, i) => [h, (existing[0]?.[i] ?? "").trim()]));

  const itTotal = model.segments.reduce(
    (sum, s) => sum + model.revenueUsd * s.share * s.itRate,
    0,
  );
  const weightSum = model.categories.reduce((sum, [, , w]) => sum + w, 0);

  const out = model.categories.map(([category, segment, weight]) => {
    const amount = tidy((weight / weightSum) * itTotal);
    const seg = model.segments.find((s) => s.key === segment);
    return {
      ...template,
      tenant_key: tenantKey,
      spend_category: category,
      cost_center_or_owner: seg ? seg.label : "Shared enterprise technology",
      annual_spend_usd: String(amount),
      // Savings opportunity is a share of the line, weighted toward the categories where a sourcing
      // lever actually exists — managed services, infrastructure, licences — not clinical safety
      // systems where nobody is renegotiating on price.
      savings_opportunity_usd: String(
        tidy(amount * (/managed service|infrastructure|collaboration|service desk|legacy|productivity/i.test(category) ? 0.14 : 0.06)),
      ),
      calculation_basis: `Segment model: ${seg ? `${(seg.share * 100).toFixed(0)}% of revenue at ${(seg.itRate * 100).toFixed(1)}% IT rate` : "shared allocation"}; category weight ${(weight / weightSum * 100).toFixed(1)}% of technology budget`,
      confidence: "medium",
    };
  });

  const total = out.reduce((sum, r) => sum + Number(r.annual_spend_usd), 0);
  summary.push({
    tenantKey,
    entity: model.entity,
    revenue: model.revenueUsd,
    itTotal: total,
    sharePct: Number(((total / model.revenueUsd) * 100).toFixed(2)),
    categories: out.length,
    segments: model.segments.map((s) => ({
      ...s,
      revenue: model.revenueUsd * s.share,
      it: model.revenueUsd * s.share * s.itRate,
    })),
    planMix: model.planMix?.map((m) => ({
      ...m,
      revenue: model.revenueUsd * (model.segments.find((s) => s.key === "plan")?.share ?? 0) * m.share,
    })),
  });

  if (WRITE) {
    const csv = [header.join(","), ...out.map((r) => header.map((h) => esc(r[h])).join(","))].join("\n") + "\n";
    fs.writeFileSync(file, csv);
  }
}

console.log(JSON.stringify({ mode: WRITE ? "write" : "dry-run", summary }, null, 2));
for (const s of summary) {
  console.log(`\n${s.tenantKey} — ${s.entity}`);
  console.log(`  revenue $${(s.revenue / 1e9).toFixed(1)}B · IT $${(s.itTotal / 1e6).toLocaleString()}M · ${s.sharePct}% of revenue · ${s.categories} categories`);
  for (const seg of s.segments) {
    console.log(`    ${seg.label}: $${(seg.revenue / 1e9).toFixed(1)}B revenue at ${(seg.itRate * 100).toFixed(1)}% → $${(seg.it / 1e6).toFixed(0)}M`);
  }
  for (const m of s.planMix ?? []) {
    console.log(`      plan mix · ${m.label}: $${(m.revenue / 1e9).toFixed(1)}B`);
  }
}
if (!WRITE) console.log("\ndry-run — pass --write to update the fixtures.");
