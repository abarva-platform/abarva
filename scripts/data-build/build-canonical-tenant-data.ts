#!/usr/bin/env tsx
import path from "node:path";

import {
  CANONICAL_DATA_BUILD_REPORT_DIR,
  buildCanonicalTenantDataReport,
} from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";

async function main() {
  const repoRoot = path.resolve(__dirname, "../..");
  const report = await buildCanonicalTenantDataReport({
    repoRoot,
    outputDir: CANONICAL_DATA_BUILD_REPORT_DIR,
  });

  console.log(
    `Canonical tenant data build complete: ${report.summary.tenantsProcessed} tenants, ${report.summary.sourceMentionsRepresented} source mentions, ${report.summary.distinctEntitiesAccepted} distinct entities, ${report.summary.referencesResolved}/${report.summary.referenceMentions} references resolved.`,
  );
  console.log(`Proof bundle: ${CANONICAL_DATA_BUILD_REPORT_DIR}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
