#!/usr/bin/env tsx

import {
  buildCandidateVersionBuildReport,
  CANDIDATE_VERSION_BUILD_REPORT_DIR,
  evaluateCandidateVersionBuildReport,
} from "../../src/lib/enterprise-data/candidate-version-build/candidate-version-build";

async function main(): Promise<void> {
  const report = await buildCandidateVersionBuildReport({
    repoRoot: process.cwd(),
    outputDir: CANDIDATE_VERSION_BUILD_REPORT_DIR,
  });
  const evaluation = evaluateCandidateVersionBuildReport(report);
  console.log(JSON.stringify({
    outputDir: CANDIDATE_VERSION_BUILD_REPORT_DIR,
    sourceBuildId: report.sourceBuildId,
    sourceBuildFingerprint: report.sourceBuildFingerprint,
    tenantsProcessed: report.summary.tenantsProcessed,
    candidateVersionsCreated: report.summary.candidateVersionsCreated,
    tenantsBlocked: report.summary.tenantsBlocked,
    canonicalRecordsRepresented: report.summary.canonicalRecordsRepresented,
    evidenceAttachmentsRepresented: report.summary.evidenceAttachmentsRepresented,
    relationshipCandidatesRepresented: report.summary.relationshipCandidatesRepresented,
    skyharborApplicationsSystems:
      report.skyharborPreview?.domainCounts.find((entry) => entry.domain === "applications_systems")
        ?.acceptedRecords ?? 0,
    meridianApplicationsSystems:
      report.meridianPreview?.domainCounts.find((entry) => entry.domain === "applications_systems")
        ?.acceptedRecords ?? 0,
    guardrails: report.guardrails,
    ok: evaluation.ok,
    errors: evaluation.errors,
  }, null, 2));

  if (!evaluation.ok) {
    throw new Error(`Candidate version build failed: ${evaluation.errors.join("; ")}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
