/**
 * ILLUSTRATIVE example review package for rendering/tests only.
 *
 * fixture_only. NOT a real tenant's review package — these numbers are invented
 * to exercise the ReviewPackageSummary UI. The real package is produced by the
 * governed foundation-lane run and rendered through the same component.
 */

import type { ReviewPackageSummaryV1 } from "../consumption-contracts";

export const EXAMPLE_REVIEW_PACKAGE: ReviewPackageSummaryV1 = {
  schemaVersion: "review-decision-dry-run-package/v1",
  packageId: "review-package:fixture-airline-demo-new:knowledge-review-decision-policy-v1:examplehash000000",
  packageContentHash: "example000000000000000000000000000000000000000000000000000000fixture",
  candidateManifestHash: "examplemanifest0000000000000000000000000000000000000000000000fixture",
  policyVersion: "knowledge-review-decision-policy-v1",
  validationRunRef: "fixture-airline-demo-new-knowledge-validate-v1-illustrative",
  sourceVersionRefs: ["fixture-source-corpus-v1.0.0"],
  tenantKey: "fixture-airline-demo-new",
  releaseId: "fixture-airline-demo-new-source-corpus-v1.0.0",
  generatedAt: "2026-07-28T00:00:00.000Z",

  byReviewClass: {
    auto_accept_eligible: 41200,
    batch_review_required: 168300,
    individual_review_required: 52730,
    defer: 1800,
    reject: 200,
  },
  counts: {
    total: 264230,
    byType: { entity_candidate: 99015, fact_candidate: 99015, relationship_candidate: 66200 },
    byDomain: { technology: 121000, vendors: 58000, data: 41000, risks: 24230, programs: 20000 },
    bySourceFamily: { parser_visible_source_sample: 210000, interview_transcript: 30000, inventory_extract: 24230 },
    byEvidenceCompleteness: { evidence_and_source: 205000, source_only: 51230, incomplete: 8000 },
    byConfidenceBand: { high: 41200, medium: 168300, low: 12500, unscored: 42230 },
    eligibleAfterApproval: { auto_accept_eligible: 41200, batch_review_required: 168300 },
    proposedDecisions: { accept: 0, reject: 200, defer: 264030 },
  },
  reasonDistribution: {
    deterministic_evidence_backed_batch: 168300,
    deterministic_high_confidence_evidence_backed: 41200,
    high_impact_relationship: 22000,
    kpi_or_metric_definition: 9000,
    commercial_or_sourcing_conclusion: 8000,
    target_state_assertion: 6000,
    low_confidence: 4730,
    no_evidence_lineage: 1800,
    quarantine_or_blocker_marker: 200,
  },
  batches: [
    {
      reviewBatchRef: "review-batch:fixture-airline-demo-new:knowledge-review-decision-policy-v1:auto_accept_eligible:fact_candidate:examplehash00",
      candidateClass: "auto_accept_eligible",
      candidateType: "fact_candidate",
      dimensions: { domain: "technology", sourceFamily: "parser_visible_source_sample", evidenceCompleteness: "evidence_and_source", confidenceBand: "high", currentTargetState: "not_applicable", commercialSensitivity: "standard", relationshipImpact: "not_applicable" },
      candidateCount: 41200,
      batchContentHash: "examplebatch0001",
      proposedDecision: "defer_until_human_approval",
      representativeSamples: [
        { candidateRef: "fact:hosting:app-crew-sched", reasons: ["deterministic_high_confidence_evidence_backed"], confidence: 0.95, evidenceCount: 2, sourceVersionRef: "fixture-source-corpus-v1.0.0", summary: "hosting_source_row on app-crew-sched" },
      ],
    },
    {
      reviewBatchRef: "review-batch:fixture-airline-demo-new:knowledge-review-decision-policy-v1:individual_review_required:relationship_candidate:examplehash01",
      candidateClass: "individual_review_required",
      candidateType: "relationship_candidate",
      dimensions: { domain: "technology", sourceFamily: "parser_visible_source_sample", evidenceCompleteness: "evidence_and_source", confidenceBand: "medium", currentTargetState: "unknown", commercialSensitivity: "standard", relationshipImpact: "high" },
      candidateCount: 22000,
      batchContentHash: "examplebatch0002",
      proposedDecision: "defer_until_human_approval",
      representativeSamples: [
        { candidateRef: "rel:depends_on:crew-dispatch", reasons: ["high_impact_relationship"], confidence: 0.8, evidenceCount: 1, sourceVersionRef: "fixture-source-corpus-v1.0.0", summary: "depends_on [unknown]" },
      ],
    },
  ],
  exceptionQueues: { individual_review_required: 52730, defer: 1800, reject: 200 },
  humanApprovalRequired: true,
  applyAuthorized: false,
  hardStop: "dry_run_only_no_review_decisions_written",
};
