#!/usr/bin/env npx tsx
/**
 * Prints the cross-domain segment table: one row per declared business segment, one column per
 * source domain, with each segment's declared revenue share beside what it actually gets.
 *
 *   npx tsx scripts/data-build/report-segment-spine.ts --tenant meridian-health [--json <out>]
 *
 * Deterministic. No model call, no database, no network.
 */
import fs from "node:fs";
import path from "node:path";
import { attributeByFunction, attributeByDeclaredSegment, buildSegmentSpine, type DeclaredSegment, type FunctionSegmentMap } from "./segment-spine";

const ROOT = process.cwd();
const arg = (name: string, fallback: string | null = null) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] ?? fallback : fallback;
};
const tenant = arg("--tenant", "meridian-health")!;
const base = path.join(ROOT, `datasets/tenant-inputs/active/${tenant}/current`);

function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift() ?? [];
  return rows.filter((r) => r.some((c) => c.trim())).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}
const read = (file: string) => parseCsv(fs.readFileSync(path.join(base, file), "utf8"));
const money = (field: string) => (row: Record<string, string>) => {
  const n = Number(String(row[field] ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const map = (JSON.parse(fs.readFileSync(path.join(ROOT, "config/segmentation/health-system-v1.json"), "utf8"))
  .business_function_map) as FunctionSegmentMap;

// The spine itself is declared, not derived. Revenue share and P&L owner come from the intake.
const segments: DeclaredSegment[] = read("01b_business_segments.csv").map((row) => ({
  segmentKey: row.segment_key,
  segmentName: row.segment_name,
  revenueSharePct: Number(row.revenue_share_pct || 0),
  revenueUsd: Number(row.revenue_usd || 0),
  pnlOwnerRole: row.pnl_owner_role,
}));

const contributions = [
  attributeByFunction("applications", read("04_applications_systems.csv"), map, (r) => r.business_function, money("annual_cost_usd")),
  attributeByFunction("vendors", read("07_vendors_contracts.csv"), map, (r) => r.supported_functions, money("annual_spend_usd")),
  attributeByFunction("risks", read("11_risks_controls.csv"), map, (r) => r.business_function),
  attributeByFunction("workforce", read("03_workforce_roles.csv"), map, (r) => r.function_name, (r) => Number(r.role_count || 0)),
  attributeByFunction("metrics", read("14_metrics_outcomes.csv"), map, (r) => r.business_function),
  attributeByDeclaredSegment("ai_use_cases", read("10_ai_automation_use_cases.csv"), segments, (r) => r.business_segment),
];

const report = buildSegmentSpine(segments, contributions);
const usd = (n: number | undefined) => n === undefined ? "" : n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : n > 0 ? `$${Math.round(n / 1e3)}k` : "-";
const domains = contributions.map((c) => c.domain);

console.log(`\nSEGMENT SPINE — ${tenant}`);
console.log(`spine declared by 01b_business_segments.csv; every other domain joins through the function it names\n`);
console.log("  " + "segment".padEnd(30) + "rev%".padStart(6) + "revenue".padStart(10) + domains.map((d) => d.slice(0, 12).padStart(14)).join(""));
for (const row of report.segments) {
  console.log(
    "  " + row.segmentName.slice(0, 29).padEnd(30) +
      String(row.revenueSharePct).padStart(6) + usd(row.revenueUsd).padStart(10) +
      domains.map((d) => {
        const cell = row.domains[d];
        return (cell.money !== undefined ? `${cell.count} ${usd(cell.money)}` : String(cell.count)).padStart(14);
      }).join(""),
  );
}
console.log("  " + "unattributed".padEnd(30) + "".padStart(16) + domains.map((d) => String(report.unattributed[d]).padStart(14)).join(""));

console.log("\nSHARE OF EACH DOMAIN vs DECLARED REVENUE SHARE  (negative = gets less than its revenue implies)");
console.log("  " + "segment".padEnd(30) + "rev%".padStart(6) + domains.map((d) => d.slice(0, 12).padStart(14)).join(""));
for (const s of report.shareVsRevenue) {
  const name = segments.find((x) => x.segmentKey === s.segmentKey)!.segmentName;
  console.log(
    "  " + name.slice(0, 29).padEnd(30) + String(s.revenueSharePct).padStart(6) +
      domains.map((d) => {
        const g = s.shares[d].gapVsRevenue;
        return `${s.shares[d].sharePct}% (${g > 0 ? "+" : ""}${g})`.padStart(14);
      }).join(""),
  );
}

console.log("\nP&L OWNERS");
for (const row of report.segments) console.log(`  ${row.segmentName.padEnd(30)} ${row.pnlOwnerRole}`);

if (Object.keys(report.unresolvedByDomain).length) {
  console.log("\nUNRESOLVED JOIN VALUES (named, not dropped)");
  for (const [domain, values] of Object.entries(report.unresolvedByDomain)) {
    console.log(`  ${domain}: ${values.join(" | ")}`);
  }
}

const out = arg("--json");
if (out) { fs.writeFileSync(out, JSON.stringify({ tenant, ...report }, null, 2)); console.log(`\n-> ${out}`); }
