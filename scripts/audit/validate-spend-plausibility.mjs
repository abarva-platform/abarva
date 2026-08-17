#!/usr/bin/env node
/**
 * Spend plausibility and grain gate.
 *
 * An $81B airline was loaded with a $663M technology budget — 0.81% of revenue, against an industry
 * norm of 2–4%. A $24B health system was loaded with $5.4B of "spend", which is 22.6% of revenue and
 * is not a technology budget at all: that sheet lists enterprise spend by business function, of
 * which the IT line is $103M.
 *
 * Both loaded cleanly. Every layer tied, every record carried evidence, and the numbers reached a
 * product. Nothing in the pipeline asked whether they were *believable*, because correctness had
 * been defined as "the number we stored equals the number supplied" — which it did, in both cases.
 *
 * This gate asks the other question. It is deliberately wide: it exists to catch a figure that is
 * wrong by an order of magnitude, not to second-guess a client whose spend is genuinely unusual.
 *
 * It reports two distinct failures, and conflating them is the mistake it is built to prevent:
 *
 *   SCALE — the total is outside a plausible band for the industry. Probably a units or coverage
 *           error in the intake.
 *   GRAIN — the sheet is not measuring what its name implies. The categories look like business
 *           functions rather than technology categories, so the total is enterprise spend and must
 *           never be quoted as a technology budget.
 *
 * Usage:
 *   node scripts/audit/validate-spend-plausibility.mjs [--strict]
 *
 * Exit 0 when every tenant passes, or when only warnings are present and --strict is not set.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STRICT = process.argv.includes("--strict");
const ACTIVE = path.join(ROOT, "datasets/tenant-inputs/active");

/**
 * Plausible technology spend as a share of revenue, by industry.
 *
 * These are wide on purpose. The bands are drawn to flag an order-of-magnitude error, which is the
 * failure that actually occurred, rather than to enforce a benchmark on a real client.
 */
const SPEND_BANDS = [
  { match: /airline|air transport|aviation/i, low: 0.015, high: 0.05, label: "airlines" },
  { match: /health|hospital|payer|provider/i, low: 0.02, high: 0.08, label: "healthcare" },
  { match: /bank|financial|insur|capital/i, low: 0.04, high: 0.12, label: "financial services" },
  { match: /retail|consumer|grocery/i, low: 0.01, high: 0.04, label: "retail" },
];
const DEFAULT_BAND = { low: 0.01, high: 0.1, label: "cross-industry default" };

/**
 * Words that mark a spend category as a business function rather than a technology category. A sheet
 * whose categories are mostly these is measuring enterprise cost, whatever the column is called.
 */
const BUSINESS_FUNCTION_MARKERS =
  /facilit|real estate|human resources|workforce|marketing|behavioral|clinical operation|nursing|pharmacy|emergency|actuarial|underwriting|legal|procurement|population health|patient access|care management/i;

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let quoted = false;
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
  if (field || row.length > 0) { row.push(field); rows.push(row); }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((v) => v.trim())).map((r) =>
    Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])),
  );
}

const num = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const findings = [];
const report = [];

const tenants = fs.existsSync(ACTIVE)
  ? fs.readdirSync(ACTIVE).filter((d) => fs.statSync(path.join(ACTIVE, d)).isDirectory())
  : [];

for (const tenantKey of tenants) {
  const dir = path.join(ACTIVE, tenantKey, "current");
  const profilePath = path.join(dir, "00_enterprise_profile.csv");
  const spendPath = path.join(dir, "08_spend_value.csv");
  if (!fs.existsSync(profilePath) || !fs.existsSync(spendPath)) continue;

  const profile = parseCsv(fs.readFileSync(profilePath, "utf8"))[0];
  const spend = parseCsv(fs.readFileSync(spendPath, "utf8"));
  if (!profile || spend.length === 0) continue;

  const revenue = num(profile.revenue_usd);
  const industry = profile.industry ?? "";
  const total = spend.reduce((sum, r) => sum + num(r.annual_spend_usd), 0);
  if (revenue <= 0 || total <= 0) continue;

  const share = total / revenue;
  const band = SPEND_BANDS.find((b) => b.match.test(industry)) ?? DEFAULT_BAND;

  const functionLike = spend.filter((r) => BUSINESS_FUNCTION_MARKERS.test(r.spend_category ?? "")).length;
  const functionShare = functionLike / spend.length;

  const row = {
    tenantKey,
    industry,
    revenue,
    total,
    sharePct: Number((share * 100).toFixed(2)),
    band: `${(band.low * 100).toFixed(0)}–${(band.high * 100).toFixed(0)}% (${band.label})`,
    categories: spend.length,
    functionLikeCategories: functionLike,
    verdict: "pass",
  };

  // GRAIN is checked first: if the sheet is measuring the wrong thing, its share of revenue is not
  // even the right question to ask.
  if (functionShare >= 0.3) {
    row.verdict = "grain";
    findings.push({
      tenantKey,
      kind: "GRAIN",
      message:
        `${functionLike} of ${spend.length} spend categories name business functions, not technology categories. ` +
        `This sheet totals enterprise spend ($${(total / 1e9).toFixed(2)}B), not a technology budget. ` +
        `It must not be quoted as one, and the intake must declare the sheet's scope.`,
    });
  } else if (share < band.low || share > band.high) {
    row.verdict = "scale";
    findings.push({
      tenantKey,
      kind: "SCALE",
      message:
        `Declared spend is ${(share * 100).toFixed(2)}% of revenue ($${(total / 1e6).toFixed(0)}M against ` +
        `$${(revenue / 1e9).toFixed(1)}B), outside the plausible ${row.band} band. ` +
        `A figure this far off is a units or coverage error in the intake, not an unusual client.`,
    });
  }
  report.push(row);
}

console.log(JSON.stringify({ tenantsChecked: report.length, report, findings }, null, 2));

if (findings.length === 0) {
  console.log("\npass — declared spend is plausible and correctly grained for every tenant.");
  process.exit(0);
}

console.error(`\n${findings.length} spend plausibility finding(s):`);
for (const f of findings) console.error(`  [${f.kind}] ${f.tenantKey}: ${f.message}`);

// Not strict by default. Both active tenants fail today, and a gate that fails every build from the
// day it lands gets disabled rather than fixed. It reports loudly now and blocks once the fixtures
// are corrected — at which point --strict becomes the default and a regression cannot land quietly.
if (STRICT) {
  console.error("\nfail — run without --strict only while known fixture defects are outstanding.");
  process.exit(1);
}
console.error("\nwarn — not blocking. Run with --strict once the intake defects above are corrected.");
process.exit(0);
