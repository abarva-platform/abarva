#!/usr/bin/env tsx

import {
  assertTenantIsolationAudit,
  buildAllTenantDataQualityAudit,
} from "../../src/lib/enterprise-data/data-quality/all-tenant-data-quality-audit";

async function main(): Promise<void> {
  const report = await buildAllTenantDataQualityAudit({
    repoRoot: process.cwd(),
  });
  assertTenantIsolationAudit(report);
  console.log(
    JSON.stringify(
      {
        status: "pass",
        tenantIsolationFailures: report.rollup.tenantIsolationFailures,
        tenantsScanned: report.rollup.tenantsScanned,
      },
      null,
      2,
    ),
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
