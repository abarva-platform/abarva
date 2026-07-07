// =============================================================================
// Context & Corpus Governance — tenant coverage report (PR-6, DB IO; ACA job)
// -----------------------------------------------------------------------------
// Read-only. Reads the PR-3 readiness ledger (governed_object_readiness) grouped
// by (client_key, agent_readiness_status, retrievability) and renders an
// end-to-end per-canonical-tenant coverage report via the pure aggregation in
// src/lib/governance/tenant-coverage.ts. Every canonical tenant is represented;
// one with no ledger rows is flagged "NO DATA FOUND".
//
// Run as a Container Apps Job in the VNet — the private DB is unreachable from a
// workstation. Never writes.
//
//   npx tsx src/scripts/governance/tenant-coverage-report.ts [--out <path>]
// =============================================================================

import fs from "node:fs/promises";
import path from "node:path";
import Module from "node:module";
import {
  aggregateTenantCoverage,
  renderTenantCoverageMarkdown,
  type LedgerGroup,
} from "@/lib/governance/tenant-coverage";

async function main(): Promise<void> {
  const m = Module as unknown as {
    _load: (r: string, p: unknown, i: boolean) => unknown;
  };
  const orig = m._load;
  m._load = (r, p, i) => (r === "server-only" ? {} : orig.call(m, r, p, i));
  const { azureRead } = await import("@/lib/data-plane/azureRead");

  const outIdx = process.argv.indexOf("--out");
  const outPath = path.resolve(
    outIdx >= 0
      ? process.argv[outIdx + 1]
      : "docs/governance/CONTEXT_CORPUS_TENANT_COVERAGE_2026-06-08.md",
  );

  const groups = await azureRead
    .query<LedgerGroup>(
      `SELECT client_key,
              agent_readiness_status,
              retrievability,
              COUNT(*)::int AS count
         FROM governed_object_readiness
        GROUP BY client_key, agent_readiness_status, retrievability`,
      [],
      { missingTable: "empty" },
    )
    .catch(() => [] as LedgerGroup[]);

  const report = aggregateTenantCoverage(groups);
  let md = renderTenantCoverageMarkdown(report, new Date().toISOString());
  if (groups.length === 0) {
    md +=
      "\n> Note: the readiness ledger is empty or unreachable. Apply the PR-3 " +
      "migration and run `npm run governance:readiness-backfill -- --commit` as " +
      "an ACA job first, then re-run this report.\n";
  }
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, md);
  console.log(
    `tenant coverage report written: ${outPath} ` +
      `(${report.grand_total} objects; ${report.grand_agent_ready} agent-ready; ` +
      `${report.missing_tenants.length} tenants with no rows)`,
  );
}

void main();
