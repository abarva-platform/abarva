#!/usr/bin/env tsx

import {
  buildCandidateVersionBuildReport,
  evaluateCandidateVersionBuildReport,
} from "../../src/lib/enterprise-data/candidate-version-build/candidate-version-build";

async function main(): Promise<void> {
  const report = await buildCandidateVersionBuildReport({
    repoRoot: process.cwd(),
  });
  const evaluation = evaluateCandidateVersionBuildReport(report);
  const failedGates = report.candidateVersions.flatMap((candidate) =>
    candidate.qualityGates
      .filter((gate) => gate.status === "fail")
      .map((gate) => `${candidate.tenantKey}:${gate.id}`),
  );
  console.log(JSON.stringify({
    audit: "candidate-version",
    ok: evaluation.ok && failedGates.length === 0,
    tenantsProcessed: report.summary.tenantsProcessed,
    candidateVersionsCreated: report.summary.candidateVersionsCreated,
    tenantsBlocked: report.summary.tenantsBlocked,
    failedGates,
    errors: evaluation.errors,
    promotionEnabled: false,
    activeTenantAccessLayerUpdated: report.guardrails.activeTenantAccessLayerUpdated,
    candidatePromoted: report.guardrails.candidatePromoted,
    defaultHomeReadsCandidateData: report.guardrails.defaultHomeReadsCandidateData,
    moduleReadsCandidateByDefault: report.guardrails.moduleReadsCandidateByDefault,
  }, null, 2));

  if (!evaluation.ok || failedGates.length > 0) {
    throw new Error(
      `Candidate version audit failed: ${[...evaluation.errors, ...failedGates].join("; ")}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
