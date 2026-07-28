import crypto from "node:crypto";

export const REVIEW_POLICY_VERSION = "knowledge-review-decision-policy-v1";

export const REVIEW_CANDIDATE_CLASSES = Object.freeze([
  "auto_accept_eligible",
  "batch_review_required",
  "individual_review_required",
  "reject",
  "defer",
]);

export const REVIEW_DECISIONS = Object.freeze(["accepted", "rejected", "deferred"]);

const MODEL_DERIVED_MARKERS = /(?:model[-_ ]?derived|claude|llm|generated_model|ai[-_ ]?enriched|synthetic[-_ ]?only)/i;
const COMMERCIAL_MARKERS = /(?:commercial[_ -]?term|contract[_ -]?value|rate[_ -]?card|pricing|invoice|bafo|proposal|sourcing[_ -]?decision|award[_ -]?recommendation)/i;
const KPI_MARKERS = /(?:kpi|metric[_ -]?definition|target[_ -]?state|outcome[_ -]?target|benefit[_ -]?target|realized[_ -]?value)/i;
const HIGH_IMPACT_RELATIONSHIP_TYPES = new Set([
  "depends_on",
  "blocks",
  "governs",
  "owns",
  "is_control_for",
  "feeds",
  "measures",
  "contracted_by",
  "supports_decision",
]);

function stableJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
    .join(",")}}`;
}

function sha256Value(value) {
  return crypto.createHash("sha256").update(stableJson(value)).digest("hex");
}

function normalizeRef(row, ...keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeCandidate(row = {}) {
  const candidateType = normalizeRef(row, "candidateType", "candidate_type", "targetKind", "target_kind", "reviewedObjectSchema", "reviewed_object_schema") || inferCandidateType(row);
  const candidateRef = normalizeRef(row, "candidateRef", "candidate_ref", "reviewedObjectRef", "reviewed_object_ref");
  const sourceVersionRef = normalizeRef(row, "sourceVersionRef", "source_version_ref");
  const evidenceRefs = normalizeArray(row.evidenceRefs ?? row.evidence_refs);

  if (candidateType === "entity_candidate") {
    return {
      candidateType,
      candidateRef,
      sourceVersionRef,
      evidenceRefs,
      confidence: Number(row.confidence ?? 0),
      content: {
        entityType: row.entityType ?? row.entity_type ?? "",
        displayName: row.displayName ?? row.display_name ?? "",
        payload: row.payload ?? row.candidatePayload ?? row.candidate_payload ?? {},
      },
      raw: row,
    };
  }

  if (candidateType === "fact_candidate") {
    return {
      candidateType,
      candidateRef,
      sourceVersionRef,
      evidenceRefs,
      confidence: Number(row.confidence ?? 0),
      content: {
        subjectCandidateRef: row.subjectCandidateRef ?? row.subject_candidate_ref ?? "",
        factType: row.factType ?? row.fact_type ?? "",
        factValue: row.factValue ?? row.fact_value ?? {},
      },
      raw: row,
    };
  }

  return {
    candidateType,
    candidateRef,
    sourceVersionRef,
    evidenceRefs,
    confidence: Number(row.confidence ?? 0),
    content: {
      fromCandidateRef: row.fromCandidateRef ?? row.from_candidate_ref ?? row.fromRef ?? "",
      toCandidateRef: row.toCandidateRef ?? row.to_candidate_ref ?? row.toRef ?? "",
      relationshipTypeRef: row.relationshipTypeRef ?? row.relationship_type_ref ?? "",
      currentTargetState: row.currentTargetState ?? row.current_target_state ?? "unknown",
    },
    raw: row,
  };
}

function inferCandidateType(row = {}) {
  if (row.factType || row.fact_type || row.factValue || row.fact_value) return "fact_candidate";
  if (row.relationshipTypeRef || row.relationship_type_ref || row.fromCandidateRef || row.toCandidateRef) return "relationship_candidate";
  return "entity_candidate";
}

export function candidateContentHash(candidate) {
  const normalized = normalizeCandidate(candidate);
  return sha256Value({
    candidateType: normalized.candidateType,
    candidateRef: normalized.candidateRef,
    sourceVersionRef: normalized.sourceVersionRef,
    evidenceRefs: normalized.evidenceRefs,
    content: normalized.content,
  });
}

export function classifyCandidateForReview(candidate, options = {}) {
  const normalized = normalizeCandidate(candidate);
  const serialized = stableJson(normalized.raw);
  const reasons = [];

  if (!normalized.candidateRef || !normalized.candidateType) {
    return { candidateClass: "reject", reasons: ["missing_candidate_identity"] };
  }
  if (normalized.raw.reviewState === "quarantined" || normalized.raw.review_state === "quarantined" || /quarantine|hidden[_ -]?truth|broken[_ -]?endpoint/i.test(serialized)) {
    return { candidateClass: "reject", reasons: ["quarantine_or_blocker_marker"] };
  }
  if (normalized.confidence > 0 && normalized.confidence < 0.72) {
    reasons.push("low_confidence");
  }
  if (/probabilistic|ambiguous|conflict|interpreted|inferred/i.test(serialized)) {
    reasons.push("probabilistic_or_interpreted");
  }
  if (MODEL_DERIVED_MARKERS.test(serialized)) {
    reasons.push("model_derived_candidate");
  }
  if (COMMERCIAL_MARKERS.test(serialized)) {
    reasons.push("commercial_or_sourcing_term");
  }
  if (KPI_MARKERS.test(serialized)) {
    reasons.push("kpi_or_target_assertion");
  }
  if (
    normalized.candidateType === "relationship_candidate" &&
    HIGH_IMPACT_RELATIONSHIP_TYPES.has(String(normalized.content.relationshipTypeRef).toLowerCase())
  ) {
    reasons.push("high_impact_relationship");
  }

  if (reasons.length > 0) {
    return { candidateClass: "individual_review_required", reasons };
  }

  if (!normalized.sourceVersionRef || normalized.evidenceRefs.length === 0) {
    return { candidateClass: "defer", reasons: ["missing_source_or_evidence_lineage"] };
  }

  if (options.semanticValidationPassed === false || options.sourceReleaseFrozen === false || options.tenantFencePassed === false) {
    return { candidateClass: "batch_review_required", reasons: ["upstream_gate_not_bound"] };
  }

  const allowedAutoTypes = new Set(options.autoAcceptCandidateTypes ?? ["entity_candidate"]);
  if (allowedAutoTypes.has(normalized.candidateType) && normalized.confidence >= 0.86) {
    return { candidateClass: "auto_accept_eligible", reasons: ["deterministic_high_confidence_evidence_backed"] };
  }

  return { candidateClass: "batch_review_required", reasons: ["deterministic_batch_review"] };
}

export function buildReviewBatches({ tenantKey, candidates, policyVersion = REVIEW_POLICY_VERSION, validationRunRef, sourceVersionRef, options = {} }) {
  const grouped = new Map();
  for (const candidate of candidates) {
    const normalized = normalizeCandidate(candidate);
    const classification = classifyCandidateForReview(candidate, options);
    const key = [classification.candidateClass, normalized.candidateType].join(":");
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push({ ...normalized, candidateContentHash: candidateContentHash(candidate), classification });
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, rows]) => {
      const [candidateClass, candidateType] = key.split(":");
      const ordered = rows.sort((a, b) => a.candidateRef.localeCompare(b.candidateRef));
      const manifest = ordered.map((row) => ({
        candidateRef: row.candidateRef,
        candidateContentHash: row.candidateContentHash,
        reasons: row.classification.reasons,
      }));
      const batchContentHash = sha256Value({ tenantKey, candidateClass, candidateType, policyVersion, validationRunRef, sourceVersionRef, manifest });
      return {
        tenantKey,
        reviewBatchRef: `review-batch:${tenantKey}:${policyVersion}:${candidateClass}:${candidateType}:${batchContentHash.slice(0, 16)}`,
        candidateClass,
        candidateType,
        policyVersion,
        validationRunRef,
        sourceVersionRef,
        candidateCount: ordered.length,
        batchContentHash,
        candidates: ordered,
      };
    });
}

export function buildDecisionRowsForBatch({ batch, decision = "accepted", reviewerIdentity, decisionBasis = "approved_review_batch" }) {
  if (!REVIEW_DECISIONS.includes(decision)) {
    throw new Error(`Unsupported review decision: ${decision}`);
  }
  return batch.candidates.map((candidate) => ({
    tenantKey: batch.tenantKey,
    reviewRef: `review:${candidate.candidateRef}:${candidate.candidateContentHash.slice(0, 12)}`,
    reviewedObjectSchema: "working",
    reviewedObjectRef: candidate.candidateRef,
    reviewState: decision === "deferred" ? "needs_correction" : decision === "rejected" ? "rejected" : "accepted",
    candidateType: candidate.candidateType,
    candidateRef: candidate.candidateRef,
    candidateContentHash: candidate.candidateContentHash,
    decision,
    decisionBasis,
    policyVersion: batch.policyVersion,
    reviewBatchRef: batch.reviewBatchRef,
    reviewerIdentity,
    validationRunRef: batch.validationRunRef,
    sourceVersionRef: candidate.sourceVersionRef || batch.sourceVersionRef,
    evidenceRefs: candidate.evidenceRefs,
  }));
}

export function validateAcceptedDecision(candidate, decision, options = {}) {
  const normalized = normalizeCandidate(candidate);
  const blockers = [];
  if (!decision) {
    return ["no_review_decision"];
  }
  const reviewState = decision.reviewState ?? decision.review_state;
  const decisionValue = decision.decision ?? (reviewState === "accepted" ? "accepted" : reviewState);
  if (reviewState !== "accepted" || decisionValue !== "accepted") blockers.push("decision_not_accepted");
  if ((decision.candidateType ?? decision.candidate_type) !== normalized.candidateType) blockers.push("candidate_type_mismatch");
  if ((decision.candidateRef ?? decision.candidate_ref ?? decision.reviewedObjectRef ?? decision.reviewed_object_ref) !== normalized.candidateRef) blockers.push("candidate_ref_mismatch");
  if ((decision.candidateContentHash ?? decision.candidate_content_hash) !== candidateContentHash(candidate)) blockers.push("stale_candidate_hash");
  if (!(decision.policyVersion ?? decision.policy_version)) blockers.push("missing_policy_version");
  const reviewBatchRef = decision.reviewBatchRef ?? decision.review_batch_ref;
  if (!reviewBatchRef) blockers.push("missing_review_batch_ref");
  const reviewer = decision.reviewerIdentity ?? decision.reviewer_identity ?? decision.reviewerRef ?? decision.reviewer_ref;
  if (!reviewer) blockers.push("missing_reviewer_identity");
  const authorized = new Set(options.authorizedReviewers ?? []);
  if (authorized.size > 0 && !authorized.has(reviewer)) blockers.push("unauthorized_reviewer");
  const approvedBatchManifest = reviewBatchRef ? options.approvedBatchManifests?.get?.(reviewBatchRef) : null;
  if (approvedBatchManifest) {
    const decisionHash = decision.candidateContentHash ?? decision.candidate_content_hash;
    const manifestHasCandidate = approvedBatchManifest.some((item) =>
      (item.candidateRef ?? item.candidate_ref) === normalized.candidateRef &&
      (item.candidateContentHash ?? item.candidate_content_hash) === decisionHash
    );
    if (!manifestHasCandidate) blockers.push("candidate_not_in_approved_batch_manifest");
  }
  if (options.validationRunRef && (decision.validationRunRef ?? decision.validation_run_ref) !== options.validationRunRef) blockers.push("validation_run_mismatch");
  if ((decision.sourceVersionRef ?? decision.source_version_ref) && normalized.sourceVersionRef && (decision.sourceVersionRef ?? decision.source_version_ref) !== normalized.sourceVersionRef) {
    blockers.push("source_version_mismatch");
  }
  if (normalizeArray(decision.evidenceRefs ?? decision.evidence_refs).length === 0 && normalized.evidenceRefs.length === 0) {
    blockers.push("missing_evidence_lineage");
  }
  return blockers;
}

export function createReviewSummary(batches) {
  return batches.reduce(
    (summary, batch) => {
      summary.totalCandidates += batch.candidateCount;
      summary.byClass[batch.candidateClass] = (summary.byClass[batch.candidateClass] ?? 0) + batch.candidateCount;
      summary.byType[batch.candidateType] = (summary.byType[batch.candidateType] ?? 0) + batch.candidateCount;
      return summary;
    },
    { totalCandidates: 0, byClass: {}, byType: {} },
  );
}
