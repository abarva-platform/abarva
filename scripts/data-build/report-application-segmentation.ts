#!/usr/bin/env npx tsx
/**
 * Prints the application-estate segmentation crosstabs, and writes them as JSON for a page packet.
 *
 *   npx tsx scripts/data-build/report-application-segmentation.ts --tenant meridian-health [--json <out>]
 *
 * Deterministic. No model call, no database, no network. Every cell is a filter over the source CSV.
 */
import fs from "node:fs";
import path from "node:path";
import { segmentApplications, crosstab, estateVersusRevenue, type SegmentationMap, type ApplicationRow } from "./application-segmentation";

const ROOT = process.cwd();
function arg(name: string, fallback: string | null = null): string | null {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] ?? fallback : fallback;
}

const tenant = arg("--tenant", "meridian-health")!;
const mapPath = arg("--map", "config/segmentation/health-system-v1.json")!;
const csvPath = path.join(ROOT, `datasets/tenant-inputs/active/${tenant}/current/04_applications_systems.csv`);

/** Minimal RFC4180 reader -- the estate file has quoted commas and embedded newlines in narratives. */
function parseCsv(text: string): ApplicationRow[] {
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
  return rows.filter((r) => r.some((c) => c.trim())).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])) as ApplicationRow);
}

const map = JSON.parse(fs.readFileSync(path.join(ROOT, mapPath), "utf8")) as SegmentationMap;
const apps = segmentApplications(parseCsv(fs.readFileSync(csvPath, "utf8")), map);

const usd = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n > 0 ? `$${Math.round(n / 1e3)}k` : "-";

function print(title: string, table: ReturnType<typeof crosstab>) {
  console.log(`\n${title}`);
  const w = Math.max(22, ...table.rows.map((r) => r.length + 1));
  console.log("  " + "".padEnd(w) + table.cols.map((c) => c.slice(0, 14).padStart(16)).join("") + "TOTAL".padStart(9) + "COST".padStart(10));
  for (const r of table.rows) {
    const cells = table.cols.map((c) => String(table.cells[r]?.[c]?.apps ?? "").padStart(16)).join("");
    console.log("  " + r.padEnd(w) + cells + String(table.rowTotals[r].apps).padStart(9) + usd(table.rowTotals[r].annualCostUsd).padStart(10));
  }
  const totals = table.cols.map((c) => String(table.colTotals[c].apps).padStart(16)).join("");
  console.log("  " + "TOTAL".padEnd(w) + totals + String(table.total.apps).padStart(9) + usd(table.total.annualCostUsd).padStart(10));
}

console.log(`\nApplication estate segmentation — ${tenant} — map ${map.map_id}`);
console.log(`source: ${path.relative(ROOT, csvPath)} (${apps.length} applications)`);

print("ARCHETYPE × HOSTING", crosstab(apps, "archetype", "hosting"));
print("BUSINESS LINE × HOSTING", crosstab(apps, "line", "hosting"));
print("BUSINESS LINE × ARCHETYPE", crosstab(apps, "line", "archetype"));
print("OFFICE LAYER × CLINICAL", crosstab(apps, "office", "clinical"));

// Revenue shares are declared facts from 00_enterprise_profile, not derived here.
const revenueShare = { provider: 60, plan: 40 };
console.log("\nESTATE SHARE vs REVENUE SHARE");
console.log("  line        apps  app%   cost%   rev%    gap(cost-rev)");
for (const r of estateVersusRevenue(apps, revenueShare)) {
  console.log(
    `  ${r.line.padEnd(11)} ${String(r.apps).padStart(4)} ${String(r.appShare).padStart(5)} ${String(r.costShare).padStart(7)} ` +
      `${(r.revenueShare ?? "-").toString().padStart(6)} ${(r.gapVsRevenue ?? "-").toString().padStart(15)}`,
  );
}

const unmapped = apps.flatMap((a) => a.unmapped);
console.log(`\nunmapped values: ${unmapped.length ? [...new Set(unmapped)].join(", ") : "none — the declared map covers every value in the source"}`);

const out = arg("--json");
if (out) {
  fs.writeFileSync(out, JSON.stringify({
    tenant, mapId: map.map_id, applicationCount: apps.length,
    crosstabs: {
      archetype_by_hosting: crosstab(apps, "archetype", "hosting"),
      line_by_hosting: crosstab(apps, "line", "hosting"),
      line_by_archetype: crosstab(apps, "line", "archetype"),
      office_by_clinical: crosstab(apps, "office", "clinical"),
    },
    estateVersusRevenue: estateVersusRevenue(apps, revenueShare),
    unmappedValues: [...new Set(unmapped)],
  }, null, 2));
  console.log(`\n-> ${out}`);
}
