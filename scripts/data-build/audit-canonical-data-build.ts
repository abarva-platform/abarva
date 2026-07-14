#!/usr/bin/env tsx
import path from "node:path";

import {
  buildCanonicalTenantDataReport,
} from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";

async function main() {
  const repoRoot = path.resolve(__dirname, "../..");
  const report = await buildCanonicalTenantDataReport({ repoRoot });
  const failures: string[] = [];

  if (report.summary.tenantsProcessed === 0) failures.push("No active tenants were processed.");
  if (!report.guardrails.northstarExcluded) failures.push("Northstar is not explicitly retired/excluded.");
  if (report.guardrails.readsArchiveOrLegacyInputs) failures.push("Build read from archive or legacy input paths.");
  if (report.archiveReadViolations.length > 0) failures.push("Archive/legacy read violations were detected.");
  if (report.summary.canonicalRecordsAccepted === 0) failures.push("No canonical records were accepted.");
  if (report.summary.evidenceAttachments < report.summary.canonicalRecordsAccepted) {
    failures.push("Accepted canonical records do not all have evidence attachments.");
  }
  if (report.summary.errorCount > 0) {
    failures.push(`${report.summary.errorCount} error findings were emitted.`);
  }
  for (const tenant of report.canonicalRecordSummary) {
    if (tenant.totalAcceptedRecords === 0) {
      failures.push(`${tenant.tenantKey} produced zero accepted canonical records.`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Canonical data build audit failed:\n- ${failures.join("\n- ")}`);
  }

  console.log(
    `Canonical data build audit passed: ${report.summary.tenantsProcessed} tenants, ${report.summary.canonicalRecordsAccepted} records, ${report.summary.evidenceAttachments} evidence attachments.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
