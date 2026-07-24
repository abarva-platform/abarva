#!/usr/bin/env node
// Reshapes skyharbor-air's richest real application source
// (datasets/skyharbor-air-supporting-evidence/applications-systems/01_Application_Portfolio_InScope_412Apps.csv)
// into HomeV4ApplicationFullRow[] and injects it into the fixture's `apps` dimension
// data_tab.full_rows for the /home/v4-preview review route.
//
// Not a merge: the tenant's other application file
// (datasets/tenant-inputs/active/skyharbor-air/current/04_applications_systems.csv) uses the
// same APP-NNNN id scheme but for unrelated synthetic applications (checked APP-0001..0005 in
// both files — different names/domains per id in each). Combining them by id would fabricate
// correspondence between unrelated rows, so this script uses the 412-row file alone.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourceCsv = path.join(
  repoRoot,
  "datasets/skyharbor-air-supporting-evidence/applications-systems/01_Application_Portfolio_InScope_412Apps.csv",
);
const fixturePath = path.join(
  repoRoot,
  "src/app/(maestro)/home/v4-preview/_fixtures/skyharbor-air.json",
);

function parseCsv(text) {
  const lines = text.trim().split("\n").map((line) => line.replace(/\r$/, ""));
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row = {};
    header.forEach((key, i) => {
      row[key] = cells[i] ?? "";
    });
    return row;
  });
}

function toFullRow(row) {
  return {
    app_id: row.app_id,
    name: row.app_name,
    business_domain: row.business_domain || null,
    criticality: row.criticality || null,
    tech_stack: row.tech_stack || null,
    hosting: row.hosting || null,
    vendor: row.current_support_vendor || null,
    modernization_disposition: row.modernization_disposition || null,
    named_users: row.named_users ? Number(row.named_users) : null,
    annual_run_cost_usd: row.annual_run_cost_usd ? Number(row.annual_run_cost_usd) : null,
    interface_count: row.interface_count ? Number(row.interface_count) : null,
    // Confirmed absent from every tenant's application source as of the 2026-07-24 yield
    // audit — not inferred, not fabricated. See docs/audits/
    // HOME-KNOWLEDGE-CONTEXT-INTELLIGENCE-YIELD-AUDIT-2026-07-24.md.
    owner: null,
    sponsor: null,
    application_type: null,
    source_file:
      "datasets/skyharbor-air-supporting-evidence/applications-systems/01_Application_Portfolio_InScope_412Apps.csv",
  };
}

const csvText = fs.readFileSync(sourceCsv, "utf8");
const rows = parseCsv(csvText).map(toFullRow);

const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const appsDimension = fixture.dimensions?.find((d) => d.dimension_key === "apps");
if (!appsDimension) {
  console.error("No 'apps' dimension found in skyharbor-air fixture — nothing to patch.");
  process.exit(1);
}
appsDimension.data_tab = appsDimension.data_tab ?? {};
appsDimension.data_tab.full_rows = rows;

fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
console.log(
  `Wrote ${rows.length} real application rows into ${path.relative(repoRoot, fixturePath)} (apps.data_tab.full_rows)`,
);
