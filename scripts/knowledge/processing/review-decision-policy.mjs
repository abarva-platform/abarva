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
  "governed_by",
  "owns",
  "is_control_for",
  "feeds",
  "measures",
  "measured_by_kpi",
  "contracted_by",
  "supports_decision",
  "targets_contract",
  "realized_through",
  "mitigated_by",
]);

const INDIVIDUAL_REVIEW_ENTITY_TYPES = new Set([
  "contract",
  "kpi",
  "metric",
  "procurement_event",
  "sourcing_event",
]);

const INDIVIDUAL_REVIEW_SOURCE_ROW_FACT_TYPES = new Set([
  "contract_source_row",
  "kpi_source_row",
  "metric_source_row",
  "procurement_event_source_row",
  "sourcing_event_source_row",
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

function directReviewText(candidate) {
  const normalized = normalizeCandidate(candidate);
  return stableJson(normalized.content);
}

function normalizeSourceFamily(candidate) {
  const normalized = normalizeCandidate(candidate);
  const raw = normalized.raw ?? {};
  const payload = normalized.content?.payload ?? raw.candidatePayload ?? raw.candidate_payload ?? {};
  return normalizeRef(raw, "sourceFamily", "source_family", "sourceRef", "source_ref") || normalizeRef(payload, "source_family") || normalized.sourceVersionRef;
}

function normalizeEntityType(candidate) {
  const normalized = normalizeCandidate(candidate);
  return String(normalized.content.entityType ?? normalized.raw?.entityType ?? normalized.raw?.entity_type ?? "").trim().toLowerCase();
}

function normalizeFactType(candidate) {
  const normalized = normalizeCandidate(candidate);
  return String(normalized.content.factType ?? normalized.raw?.factType ?? normalized.raw?.fact_type ?? "").trim().toLowerCase();
}

function normalizeRelationshipType(candidate) {
  const normalized = normalizeCandidate(candidate);
  return String(normalized.content.relationshipTypeRef ?? normalized.raw?.relationshipTypeRef ?? normalized.raw?.relationship_type_ref ?? "").trim().toLowerCase();
}

function normalizeCurrentTargetState(candidate) {
  const normalized = normalizeCandidate(candidate);
  const factValue = normalized.content?.factValue ?? normalized.raw?.factValue ?? normalized.raw?.fact_value ?? {};
  return String(normalized.content.currentTargetState ?? normalized.raw?.currentTargetState ?? normalized.raw?.current_target_state ?? factValue.current_target_state ?? factValue.state ?? "").trim().toLowerCase();
}

function isDirectSourceRecord(candidate) {
  const normalized = normalizeCandidate(candidate);
  const sourceFamily = normalizeSourceFamily(candidate);
  const factType = normalizeFactType(candidate);
  return (
    sourceFamily === "parser_visible_source_sample" ||
    /(?:source[_-]?row|source[_-]?sample|inventory|extract|register|registry|interview|transcript|ledger|lineage)/i.test(sourceFamily) ||
    factType.endsWith("_source_row")
  );
}

function hasSensitiveCandidateContent(candidate) {
  const normalized = normalizeCandidate(candidate);
  const reviewText = directReviewText(candidate);
  const entityType = normalizeEntityType(candidate);
  const factType = normalizeFactType(candidate);
  const relationshipType = normalizeRelationshipType(candidate);
  const currentTargetState = normalizeCurrentTargetState(candidate);
  const reasons = [];

  if (/probabilistic|ambiguous|conflict|interpreted|inferred/i.test(reviewText)) {
    reasons.push("probabilistic_or_interpreted");
  }
  if (MODEL_DERIVED_MARKERS.test(reviewText)) {
    reasons.push("model_derived_candidate");
  }
  if (COMMERCIAL_MARKERS.test(reviewText) || /commercial|contract|procurement|sourcing|invoice|proposal|rate[_ -]?card/i.test(factType)) {
    reasons.push("commercial_or_sourcing_term");
  }
  if (
    normalized.candidateType !== "relationship_candidate" &&
    (KPI_MARKERS.test(reviewText) || /(?:^|[_-])kpi(?:$|[_-])|metric|target|benefit|outcome/i.test(factType))
  ) {
    reasons.push("kpi_or_target_assertion");
  }
  if (INDIVIDUAL_REVIEW_ENTITY_TYPES.has(entityType)) {
    reasons.push("decision_sensitive_entity");
  }
  if (INDIVIDUAL_REVIEW_SOURCE_ROW_FACT_TYPES.has(factType)) {
    reasons.push("decision_sensitive_source_row");
  }
  if (currentTargetState === "target") {
    reasons.push("target_state_claim");
  }
  if (
    normalized.candidateType === "relationship_candidate" &&
    HIGH_IMPACT_RELATIONSHIP_TYPES.has(relationshipType)
  ) {
    reasons.push("high_impact_relationship");
  }

  return [...new Set(reasons)];
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
  const reasons = hasSensitiveCandidateContent(candidate);

  if (!normalized.candidateRef || !normalized.candidateType) {
    return { candidateClass: "reject", reasons: ["missing_candidate_identity"] };
  }
  if (normalized.raw.reviewState === "quarantined" || normalized.raw.review_state === "quarantined" || /quarantine|hidden[_ -]?truth|broken[_ -]?endpoint/i.test(serialized)) {
    return { candidateClass: "reject", reasons: ["quarantine_or_blocker_marker"] };
  }

  const confidence = Number(normalized.confidence ?? 0);
  if (confidence > 0 && confidence < 0.6) {
    reasons.push("low_confidence");
  }

  if (reasons.length > 0) {
    return { candidateClass: "individual_review_required", reasons };
  }

  if (!normalized.sourceVersionRef || normalized.evidenceRefs.length === 0) {
    if (
      normalized.candidateType === "entity_candidate" &&
      isDirectSourceRecord(candidate) &&
      confidence >= 0.6
    ) {
      return { candidateClass: "batch_review_required", reasons: ["deterministic_source_record_batch_review"] };
    }
    // Explicit evidence inheritance: an evidence-less entity referenced by a
    // source-backed, evidence-bearing fact candidate inherits that lineage and is
    // routed to batch review (never auto-accepted). Without such a fact it defers.
    if (
      normalized.candidateType === "entity_candidate" &&
      options.evidenceIndex?.get?.(normalized.candidateRef)
    ) {
      return { candidateClass: "batch_review_required", reasons: ["evidence_inherited_from_source_fact"] };
    }
    return { candidateClass: "defer", reasons: ["missing_source_or_evidence_lineage"] };
  }

  if (options.semanticValidationPassed === false || options.sourceReleaseFrozen === false || options.tenantFencePassed === false) {
    return { candidateClass: "batch_review_required", reasons: ["upstream_gate_not_bound"] };
  }

  const allowedAutoTypes = new Set(options.autoAcceptCandidateTypes ?? ["entity_candidate", "fact_candidate"]);
  const minimumAutoConfidence = Number(options.minimumAutoConfidence ?? 0.68);
  if (
    allowedAutoTypes.has(normalized.candidateType) &&
    confidence >= minimumAutoConfidence &&
    isDirectSourceRecord(candidate)
  ) {
    return { candidateClass: "auto_accept_eligible", reasons: ["deterministic_high_confidence_evidence_backed"] };
  }

  return {
    candidateClass: "batch_review_required",
    reasons: [confidence > 0 && confidence < 0.72 ? "moderate_confidence_evidence_backed_batch_review" : "deterministic_batch_review"],
  };
}

/** entityRef -> true when a source-backed, evidence-bearing fact references it.
 *  Powers explicit evidence inheritance for evidence-less entities. */
export function buildEvidenceInheritanceIndex(candidates) {
  const index = new Map();
  for (const candidate of candidates) {
    const n = normalizeCandidate(candidate);
    if (n.candidateType === "fact_candidate" && n.sourceVersionRef && n.evidenceRefs.length > 0) {
      const subject = n.content.subjectCandidateRef;
      if (subject) index.set(subject, true);
    }
  }
  return index;
}

function confidenceBand(conf) {
  const c = Number(conf ?? 0);
  if (!(c > 0)) return "unscored";
  if (c >= 0.86) return "high";
  if (c >= 0.72) return "medium";
  return "low";
}
function evidenceCompleteness(n) {
  if (n.evidenceRefs.length > 0 && n.sourceVersionRef) return "evidence_and_source";
  if (n.evidenceRefs.length > 0) return "evidence_only";
  if (n.sourceVersionRef) return "source_only";
  return "incomplete";
}
function candidateDomain(candidate, n) {
  return normalizeRef(n.raw, "domain", "domain_ref", "domainKey", "domain_key") ||
    (n.candidateType === "entity_candidate" ? (normalizeEntityType(candidate) || "unclassified") :
     n.candidateType === "fact_candidate" ? (normalizeFactType(candidate).split(/[._]/)[0] || "unclassified") :
     (normalizeRelationshipType(candidate) || "relationship"));
}
function commercialSensitivity(candidate, n) {
  return n.candidateType === "fact_candidate" && COMMERCIAL_MARKERS.test(normalizeFactType(candidate)) ? "commercial" : "standard";
}
function relationshipImpact(candidate, n) {
  if (n.candidateType !== "relationship_candidate") return "not_applicable";
  return HIGH_IMPACT_RELATIONSHIP_TYPES.has(normalizeRelationshipType(candidate)) ? "high" : "standard";
}
function sampleSummary(n) {
  if (n.candidateType === "entity_candidate") return `${n.content.entityType || "entity"}: ${n.content.displayName || n.candidateRef}`;
  if (n.candidateType === "fact_candidate") return `${n.content.factType || "fact"} on ${n.content.subjectCandidateRef || "?"}`;
  return `${n.content.relationshipTypeRef || "rel"} [${n.content.currentTargetState}]`;
}

export function buildReviewBatches({ tenantKey, candidates, policyVersion = REVIEW_POLICY_VERSION, validationRunRef, sourceVersionRef, options = {}, samplesPerBatch = 5 }) {
  // Evidence-inheritance index is available to classification for evidence-less entities.
  const evidenceIndex = options.evidenceIndex ?? buildEvidenceInheritanceIndex(candidates);
  const opts = { ...options, evidenceIndex };
  const grouped = new Map();

  for (const candidate of candidates) {
    const normalized = normalizeCandidate(candidate);
    const classification = classifyCandidateForReview(candidate, opts);
    // Governed review dimensions (req 5): split batches by these facets so review
    // is homogeneous within a batch and reviewers can approve a coherent slice.
    const dimensions = {
      domain: candidateDomain(candidate, normalized),
      sourceFamily: normalizeSourceFamily(candidate) || "unknown_source",
      evidenceCompleteness: evidenceCompleteness(normalized),
      confidenceBand: confidenceBand(normalized.confidence),
      currentTargetState: normalized.candidateType === "relationship_candidate" ? (normalizeCurrentTargetState(candidate) || "unknown") : "not_applicable",
      commercialSensitivity: commercialSensitivity(candidate, normalized),
      relationshipImpact: relationshipImpact(candidate, normalized),
    };
    const key = [
      classification.candidateClass, normalized.candidateType, dimensions.domain, dimensions.sourceFamily,
      dimensions.evidenceCompleteness, dimensions.confidenceBand, dimensions.currentTargetState,
      dimensions.commercialSensitivity, dimensions.relationshipImpact,
    ].join("|");
    if (!grouped.has(key)) grouped.set(key, { dimensions, rows: [] });
    grouped.get(key).rows.push({ ...normalized, candidateContentHash: candidateContentHash(candidate), classification });
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, { dimensions, rows }]) => {
      const [candidateClass, candidateType] = key.split("|");
      const ordered = rows.sort((a, b) => a.candidateRef.localeCompare(b.candidateRef));
      const manifest = ordered.map((row) => ({
        candidateRef: row.candidateRef,
        candidateContentHash: row.candidateContentHash,
        reasons: row.classification.reasons,
      }));
      const batchContentHash = sha256Value({ tenantKey, candidateClass, candidateType, policyVersion, validationRunRef, sourceVersionRef, dimensions, manifest });
      const representativeSamples = ordered.slice(0, Math.max(1, samplesPerBatch)).map((row) => ({
        candidateRef: row.candidateRef,
        reasons: row.classification.reasons,
        confidence: row.confidence,
        evidenceCount: row.evidenceRefs.length,
        sourceVersionRef: row.sourceVersionRef,
        summary: sampleSummary(row),
      }));
      return {
        tenantKey,
        reviewBatchRef: `review-batch:${tenantKey}:${policyVersion}:${candidateClass}:${candidateType}:${batchContentHash.slice(0, 16)}`,
        candidateClass,
        candidateType,
        policyVersion,
        validationRunRef,
        sourceVersionRef,
        dimensions,
        candidateCount: ordered.length,
        batchContentHash,
        representativeSamples,
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

function bump(obj, key, n) {
  if (key === undefined || key === null) return;
  obj[key] = (obj[key] ?? 0) + n;
}

export function createReviewSummary(batches) {
  const summary = {
    totalCandidates: 0,
    byClass: {},
    byType: {},
    byDomain: {},
    bySourceFamily: {},
    byEvidenceCompleteness: {},
    byConfidenceBand: {},
    byReason: {},
  };
  for (const batch of batches) {
    summary.totalCandidates += batch.candidateCount;
    bump(summary.byClass, batch.candidateClass, batch.candidateCount);
    bump(summary.byType, batch.candidateType, batch.candidateCount);
    const d = batch.dimensions ?? {};
    bump(summary.byDomain, d.domain, batch.candidateCount);
    bump(summary.bySourceFamily, d.sourceFamily, batch.candidateCount);
    bump(summary.byEvidenceCompleteness, d.evidenceCompleteness, batch.candidateCount);
    bump(summary.byConfidenceBand, d.confidenceBand, batch.candidateCount);
    for (const candidate of batch.candidates ?? []) {
      for (const reason of candidate.classification?.reasons ?? []) bump(summary.byReason, reason, 1);
    }
  }
  return summary;
}
