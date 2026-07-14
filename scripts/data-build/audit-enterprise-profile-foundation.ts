#!/usr/bin/env tsx
import path from "node:path";

import {
  buildCanonicalTenantDataReport,
} from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";

async function main() {
  const repoRoot = path.resolve(__dirname, "../..");
  const report = await buildCanonicalTenantDataReport({ repoRoot });
  const failures = report.enterpriseProfileBuild
    .filter((profile) => profile.status === "missing")
    .map(
      (profile) =>
        `${profile.tenantKey}: missing enterprise profile source`,
    );

  if (!report.guardrails.northstarExcluded) {
    failures.push("northstar-clinical: not retired/excluded");
  }
  if (failures.length > 0) {
    throw new Error(`Enterprise profile foundation audit failed:\n- ${failures.join("\n- ")}`);
  }

  console.log(
    `Enterprise profile foundation audit passed: ${report.enterpriseProfileBuild.length} active tenant profiles found from canonical tenant inputs; field gaps remain reportable data-quality findings.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
