/**
 * Read-only presentation contract for a governed review dry-run package.
 *
 * This is a UI/UX-lane type: it describes the shape the Knowledge product renders
 * so a human can READ a review package (counts, batches, samples, hashes). It is
 * NOT a generator and NOT an approval surface — the browser never produces a
 * package, applies decisions, or mutates the data plane. Package generation,
 * review/apply, publication and baseline activation are the foundation
 * (data-plane) lane's responsibility; this type is how their output is displayed.
 *
 * Field names mirror the governed builder's `review-decision-dry-run-package/v1`
 * output (scripts/knowledge/build-review-decision-ledger.mjs + the review-policy
 * batch dimensions), so a real package deserializes into this shape unchanged.
 */

export type ReviewCandidateClass =
  | "auto_accept_eligible"
  | "batch_review_required"
  | "individual_review_required"
  | "reject"
  | "defer";

export type ReviewCandidateType =
  | "entity_candidate"
  | "fact_candidate"
  | "relationship_candidate";

/** The governed batch dimensions a package splits on. */
export interface ReviewBatchDimensions {
  domain: string;
  sourceFamily: string;
  evidenceCompleteness: string;
  confidenceBand: string;
  currentTargetState: string;
  commercialSensitivity: string;
  relationshipImpact: string;
}

export interface ReviewRepresentativeSample {
  candidateRef: string;
  reasons: string[];
  confidence: number | null;
  evidenceCount: number;
  sourceVersionRef: string | null;
  summary: string;
}

export interface ReviewBatchSummary {
  reviewBatchRef: string;
  candidateClass: ReviewCandidateClass;
  candidateType: ReviewCandidateType;
  dimensions: ReviewBatchDimensions;
  candidateCount: number;
  batchContentHash: string;
  representativeSamples: ReviewRepresentativeSample[];
  /** Dry-run plan for the batch — never an applied decision. */
  proposedDecision: "defer_until_human_approval" | "reject";
}

export interface ReviewProposedDecisions {
  accept: number;
  reject: number;
  defer: number;
}

export interface ReviewPackageCounts {
  total: number;
  byType: Record<string, number>;
  byDomain: Record<string, number>;
  bySourceFamily: Record<string, number>;
  byEvidenceCompleteness: Record<string, number>;
  byConfidenceBand: Record<string, number>;
  /** eligible-after-approval per review class (dry-run never proposes accept). */
  eligibleAfterApproval: Partial<Record<ReviewCandidateClass, number>>;
  proposedDecisions: ReviewProposedDecisions;
}

export interface ReviewPackageSummaryV1 {
  schemaVersion: "review-decision-dry-run-package/v1";
  packageId: string;
  packageContentHash: string;
  candidateManifestHash: string;
  policyVersion: string;
  validationRunRef: string;
  sourceVersionRefs: string[];
  tenantKey: string;
  releaseId: string;
  generatedAt: string | null;

  byReviewClass: Record<ReviewCandidateClass, number>;
  counts: ReviewPackageCounts;
  /** Distribution of the classification reasons across all candidates. */
  reasonDistribution: Record<string, number>;
  batches: ReviewBatchSummary[];
  /** Counts held for review, keyed by class (individual/reject/defer). */
  exceptionQueues: Partial<Record<ReviewCandidateClass, number>>;

  /** Always true for a dry-run package. */
  humanApprovalRequired: true;
  /** Always false — a dry-run never authorizes apply. */
  applyAuthorized: false;
  /** e.g. "dry_run_only_no_review_decisions_written". */
  hardStop: string;
}

export const REVIEW_CLASS_LABELS: Record<ReviewCandidateClass, string> = {
  auto_accept_eligible: "Auto-accept eligible",
  batch_review_required: "Batch review",
  individual_review_required: "Individual review",
  reject: "Reject",
  defer: "Defer",
};
