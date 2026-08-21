#!/usr/bin/env npx tsx
/**
 * Renders the intake review queue to static HTML so it can be looked at.
 *
 * A review surface is judged by whether a person can actually make the decisions on it, and that
 * is not visible in a type or a test. This builds a queue with the shapes that matter -- a wide
 * bulk group, a lone proposal, a contested row, a proposal with blank evidence -- and writes the
 * page, so the layout is inspected rather than asserted.
 */
import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

import { IntakeReviewQueue } from "../../src/components/admin/intake-review/IntakeReviewQueue";
import { buildReviewQueue } from "../../src/lib/enterprise-data/intake/review-read-model";
import type { EnrichmentProposal } from "../../src/lib/enterprise-data/intake/enrichment-proposals";

const OUT = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "/tmp/intake-review-proof";

const SYSTEMS: Array<[string, string, string, string]> = [
  ["r1", "Revenue Cycle Mart", "SQL Server database/mart", "data_mart"],
  ["r2", "Radiology Utilization Mart", "SQL Server database/mart", "data_mart"],
  ["r3", "Claims Analytics Mart", "SQL Server database/mart", "data_mart"],
  ["r4", "Pharmacy Spend Mart", "SQL Server database/mart", "data_mart"],
  ["r5", "Supply Chain Mart", "SQL Server database/mart", "data_mart"],
  ["r6", "Quality Measures Mart", "SQL Server database/mart", "data_mart"],
  ["r7", "Enterprise Data Warehouse", "Warehouse appliance", "enterprise_data_warehouse"],
  ["r8", "Clinical Reporting Database", "Reporting database", "operational_reporting_database"],
  ["r9", "Unnamed extract job", "", "batch_etl"],
];

const rows = new Map<string, Record<string, string>>(
  SYSTEMS.map(([id, name, category]) => [id, { system_name: name, system_category: category }]),
);

function proposal(rowId: string, value: string, attribute = "architectureRole"): EnrichmentProposal {
  return {
    proposalId: `${rowId}-${attribute}-${value}`,
    tenantKey: "fixture",
    templateFile: "04_applications_systems.csv",
    schemaVersion: "2026-08-v1",
    sourceRowId: rowId,
    sourceColumn: "drv__architecture_role",
    targetAttribute: attribute,
    basis: "derived",
    proposedValue: value,
    evidenceFields: ["system_name", "system_category"],
    evidenceDependencyHash: "h",
    enrichmentRunId: "run-1",
    model: "gpt-enterprise",
    promptVersion: "2026-08-v1",
    status: "proposed",
  };
}

const proposals: EnrichmentProposal[] = [
  ...SYSTEMS.filter(([, , , v]) => v === "data_mart").map(([id, , , v]) => proposal(id, v)),
  proposal("r7", "enterprise_data_warehouse"),
  proposal("r8", "operational_reporting_database"),
  // A row given two answers, and a row whose cited evidence is entirely blank.
  proposal("r8", "data_mart"),
  proposal("r9", "data_mart"),
  proposal("r1", "SQL Server On-Prem", "hostingPlatform"),
  proposal("r2", "SQL Server On-Prem", "hostingPlatform"),
];

const queue = buildReviewQueue({
  tenantKey: "fixture",
  enrichmentRunId: "run-1",
  proposals,
  recordedRows: rows,
  declined: [
    { sourceRowId: "r10", targetAttribute: "architectureRole" },
    { sourceRowId: "r11", targetAttribute: "architectureRole" },
    { sourceRowId: "r12", targetAttribute: "movementMechanism" },
  ],
});

const body = renderToStaticMarkup(<IntakeReviewQueue queue={queue} tenantName="Fixture Tenant" />);

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Intake review proof</title>
<style>
  body { margin:0; background:#FBFAF7; font-family: Inter, -apple-system, system-ui, sans-serif; color:#070707; }
  .page { padding: 48px 56px; }
</style></head><body><div class="page">${body}</div></body></html>`;

fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, "intake-review.html");
fs.writeFileSync(file, html, "utf8");

console.log(`wrote ${file}`);
console.log(`proposals: ${queue.summary.proposalCount}`);
console.log(`decisions: ${queue.summary.decisionCount}`);
console.log(`individual: ${queue.summary.individualCount}`);
console.log(`declined:   ${queue.summary.declinedCount}`);
console.log("");
for (const g of queue.groups) {
  console.log(`${g.kind === "individual_only" ? "  [1]" : `  [${g.rowCount}]`} ${g.targetAttribute} = ${g.proposedValue}${g.individualReason ? `  (${g.individualReason})` : ""}`);
}
