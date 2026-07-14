#!/usr/bin/env tsx
import path from "node:path";

import {
  buildCanonicalTenantDataReport,
} from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";

async function main() {
  const repoRoot = path.resolve(__dirname, "../..");
  const report = await buildCanonicalTenantDataReport({ repoRoot });
  const failures: string[] = [];

  for (const readiness of report.homeAvaReadiness) {
    if (!readiness.evidenceReady) failures.push(`${readiness.tenantKey}: evidence attachments not ready.`);
    if (readiness.canonicalRecordCount === 0) failures.push(`${readiness.tenantKey}: no canonical records available.`);
    if (readiness.mustNotClaim.length === 0) failures.push(`${readiness.tenantKey}: must-not-claim guardrails missing.`);
  }
  if (report.guardrails.homeDefaultRuntimeChanged) failures.push("Home default runtime changed.");
  if (report.guardrails.moduleRuntimeConsumptionChanged) failures.push("Module runtime consumption changed.");

  if (failures.length > 0) {
    throw new Error(`Home/aVa build readiness audit failed:\n- ${failures.join("\n- ")}`);
  }

  console.log(
    `Home/aVa build readiness audit passed: ${report.homeAvaReadiness.length} tenants have deterministic readiness artifacts with caveats and guardrails.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
