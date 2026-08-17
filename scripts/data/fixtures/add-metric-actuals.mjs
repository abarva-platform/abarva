#!/usr/bin/env node
/**
 * Add measured actuals and finance attestation to the metrics intake.
 *
 * Tower's Evidence tab reported every claim as missing baseline, target, actual, attribution,
 * guardrails and finance attestation. Projecting canonical into Tower's claim chain closed most of
 * that — the evidence existed and was simply never projected — but seventy-six claims still came back
 * missing `actual` and `finance_attestation`, and the reason was not client behaviour.
 *
 * **The metrics intake template has no actual column.** It asks for `baseline_value`,
 * `baseline_period` and `target_value`, and stops. A client filling it in perfectly still supplies a
 * metric nobody has measured since the baseline, so Tower correctly reports that no outcome can be
 * claimed — and the template made that outcome unavoidable.
 *
 * That is the more interesting class of defect. The pipeline was not losing data; the *question* was
 * never asked. No amount of loader or projector work would have surfaced it, because everything
 * downstream was faithfully carrying an absence that originated in a column that does not exist.
 *
 * This adds four columns and populates them:
 *
 *   actual_value                 what was measured most recently
 *   actual_period                when it was measured
 *   finance_attested_value_usd   the amount finance signed off, where they did
 *   value_claim_status           attested · measured · baseline_only
 *
 * Not every metric gets an actual, deliberately. A portfolio where every tracked metric has a
 * measured outcome and a finance signature is not a realistic enterprise — it is one that has already
 * solved the problem the product exists to work on. Roughly a third stay baseline-only so the gap
 * report has something true to report.
 *
 * Usage:
 *   node scripts/data/fixtures/add-metric-actuals.mjs [--write]
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");
const ACTIVE = path.join(ROOT, "datasets/tenant-inputs/active");
const TENANTS = ["skyharbor-air", "meridian-health"];

const NEW_COLUMNS = ["actual_value", "actual_period", "finance_attested_value_usd", "value_claim_status"];

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
const numOf = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const summary = [];

for (const tenantKey of TENANTS) {
  const file = path.join(ACTIVE, tenantKey, "current/14_metrics_outcomes.csv");
  if (!fs.existsSync(file)) continue;
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const header = rows[0].map((h) => h.trim());
  const body = rows.slice(1).filter((r) => r.some((v) => v.trim()));
  const outHeader = [...header, ...NEW_COLUMNS.filter((c) => !header.includes(c))];

  const out = body.map((raw, idx) => {
    const row = Object.fromEntries(header.map((h, i) => [h, (raw[i] ?? "").trim()]));
    const baseline = numOf(row.baseline_value);
    const target = numOf(row.target_value);

    // Deterministic, so a rerun produces the same fixture. Roughly a third of metrics are left
    // baseline-only; of the rest, most are measured and a subset carry a finance signature.
    const bucket = idx % 3 === 2 ? "baseline_only" : idx % 5 === 0 ? "attested" : "measured";

    if (bucket === "baseline_only" || baseline === null || target === null) {
      return {
        ...row,
        actual_value: "",
        actual_period: "",
        finance_attested_value_usd: "",
        value_claim_status: "baseline_only",
      };
    }

    // Progress toward target, short of it. A fixture where every metric has already landed on its
    // target has no improvement left to manage and nothing for a portfolio review to decide.
    const progress = 0.35 + ((idx * 13) % 45) / 100;
    const actual = baseline + (target - baseline) * progress;
    const decimals = Math.abs(target) < 100 ? 1 : 0;

    return {
      ...row,
      actual_value: actual.toFixed(decimals),
      actual_period: "FY2026 Q3",
      finance_attested_value_usd:
        bucket === "attested" ? String(Math.round(Math.abs(target - baseline) * 120_000)) : "",
      value_claim_status: bucket,
    };
  });

  const counts = out.reduce((acc, r) => {
    acc[r.value_claim_status] = (acc[r.value_claim_status] ?? 0) + 1;
    return acc;
  }, {});
  summary.push({ tenantKey, metrics: out.length, columnsAdded: outHeader.length - header.length, counts });

  if (WRITE) {
    const csv = [outHeader.join(","), ...out.map((r) => outHeader.map((h) => esc(r[h])).join(","))].join("\n") + "\n";
    fs.writeFileSync(file, csv);
  }
}

console.log(JSON.stringify({ mode: WRITE ? "write" : "dry-run", summary }, null, 2));
for (const s of summary) {
  console.log(`\n${s.tenantKey}: ${s.metrics} metrics, +${s.columnsAdded} columns`);
  console.log(`  ${Object.entries(s.counts).map(([k, v]) => `${k}: ${v}`).join(" · ")}`);
}
if (!WRITE) console.log("\ndry-run — pass --write to update the fixtures.");
