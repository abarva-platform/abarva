#!/usr/bin/env tsx

import {
  assertCandidateCoverageAudit,
  buildAllTenantDataQualityAudit,
} from "../../src/lib/enterprise-data/data-quality/all-tenant-data-quality-audit";

async function main(): Promise<void> {
  const report = await buildAllTenantDataQualityAudit({
    repoRoot: process.cwd(),
  });
  assertCandidateCoverageAudit(report);
  console.log(
    JSON.stringify(
      {
        status: "pass",
        sourceRichCandidateThinTenants: report.tenantQualityMatrix
          .filter((row) => row.sourceRichCandidateThin)
          .map((row) => row.tenantKey),
        promotionPassForThinTenants: [],
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
