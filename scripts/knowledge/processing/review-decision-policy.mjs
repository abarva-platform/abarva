import crypto from "node:crypto";

// v2: the v1 classifier matched every marker regex against the ENTIRE raw-row
// JSON (`stableJson(normalized.raw)`), so field NAMES tripped the reasons — most
// notably every relationship's `current_target_state` field matched the KPI
// marker `target_state`, collapsing 100% of candidates into individual review
// and defeating the governed batch model. v2 matches markers against the
// candidate's SEMANTIC CONTENT only (entity/fact/relationship type + payload/
// value), separates deterministic source-derived candidates from
// judgment-dependent ones, adds explicit evidence inheritance for entities, and
// splits batches across the governed review dimensions. Governance is not
// weakened: judgment-dependent candidates still require individual review, and
// evidence-less entities are never auto-accepted.
export const REVIEW_POLICY_VERSION = "knowledge-review-decision-policy-v2";

export const REVIEW_CANDIDATE_CLASSES = Object.freeze([
  "auto_accept_eligible",
  "batch_review_required",
  "individual_review_required",
  "reject",
  "defer",
]);

export const REVIEW_DECISIONS = Object.freeze(["accepted", "rejected", "deferred"]);

// Markers are matched against specific SEMANTIC content, never the raw row.
const MODEL_DERIVED_MARKERS = /(?:model[-_ ]?derived|claude|llm|generated_model|ai[-_ ]?enriched|synthetic[-_ ]?only|inferred|estimated|interpreted|judgment)/i;
const COMMERCIAL_MARKERS = /(?:commercial[_ -]?term|contract[_ -]?value|rate[_ -]?card|pricing|price|invoice|bafo|proposal|sourcing[_ -]?decision|award[_ -]?recommendation|spend|discount|savings)/i;
const KPI_DEFINITION_MARKERS = /(?:kpi|metric[_ -]?definition|benefit[_ -]?target|outcome[_ -]?target|realized[_ -]?value|service[_ -]?level|sla[_ -]?target)/i;
const TARGET_STATE_FACT_MARKERS = /(?:target[_ -]?state|future[_ -]?state|to[_ -]?be[_ -]?state|to[_ -]?be[_ -]?architecture|desired[_ -]?state)/i;
const PROBABILISTIC_IDENTITY_MARKERS = /(?:probabilistic|fuzzy[_ -]?match|ambiguous[_ -]?match|multiple[_ -]?candidate|low[_ -]?similarity|unresolved[_ -]?alias|possible[_ -]?duplicate)/i;

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

// current/target values that are genuinely ambiguous (needing judgment). NOTE:
// "unknown" is NOT ambiguous — it is the normal value for a structural
// relationship that has no current/target dimension, and must not force review.
const AMBIGUOUS_TARGET_STATES = new Set(["conflicting", "ambiguous", "disputed", "mixed", "contested"]);

const LOW_CONFIDENCE_THRESHOLD = 0.72;
const AUTO_ACCEPT_CONFIDENCE = 0.86;

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

function inc(obj, key, n = 1) {
  if (!key && key !== 0) return;
  obj[key] = (obj[key] ?? 0) + n;
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

/** The SEMANTIC content of a candidate (type + payload/value) — never lineage refs
 *  or field names. Marker regexes run against this, not the raw row. */
function contentText(normalized) {
  const c = normalized.content || {};
  const parts = [];
  if (c.entityType) parts.push(String(c.entityType));
  if (c.displayName) parts.push(String(c.displayName));
  if (c.factType) parts.push(String(c.factType));
  if (c.relationshipTypeRef) parts.push(String(c.relationshipTypeRef));
  if (c.payload && Object.keys(c.payload).length) parts.push(stableJson(c.payload));
  if (c.factValue && Object.keys(c.factValue).length) parts.push(stableJson(c.factValue));
  return parts.join(" ");
}

function derivationBasis(raw) {
  return normalizeRef(raw, "derivationBasis", "derivation_basis", "sourceFamily", "source_family", "origin", "provenance");
}

/** entityRef -> true when a source-backed, evidence-bearing fact references it.
 *  Used to represent explicit evidence INHERITANCE for evidence-less entities. */
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

export function classifyCandidateForReview(candidate, options = {}) {
  const normalized = normalizeCandidate(candidate);
  const type = normalized.candidateType;
  const content = normalized.content;
  const cText = contentText(normalized);
  const basis = derivationBasis(normalized.raw);
  const reasons = [];

  if (!normalized.candidateRef || !type) {
    return { candidateClass: "reject", reasons: ["missing_candidate_identity"] };
  }

  const reviewState = normalized.raw.reviewState ?? normalized.raw.review_state;
  if (reviewState === "quarantined" || /\bhidden[_ -]?truth\b|\bbroken[_ -]?endpoint\b/i.test(cText)) {
    return { candidateClass: "reject", reasons: ["quarantine_or_blocker_marker"] };
  }

  // --- Judgment-dependent reasons → individual_review_required (field-specific) ---
  if (type === "entity_candidate" && (PROBABILISTIC_IDENTITY_MARKERS.test(cText) || PROBABILISTIC_IDENTITY_MARKERS.test(basis))) {
    reasons.push("probabilistic_identity_resolution");
  }
  // Model-derived / interpreted: derivation basis, or the candidate's semantic
  // content (fact value / entity payload) declaring model generation or
  // interpretation. Matching content (not raw-row field names) is correct.
  if (MODEL_DERIVED_MARKERS.test(basis) || ((type === "fact_candidate" || type === "entity_candidate") && MODEL_DERIVED_MARKERS.test(cText))) {
    reasons.push("model_derived_or_interpreted");
  }
  if (type === "fact_candidate" && (COMMERCIAL_MARKERS.test(String(content.factType)) || COMMERCIAL_MARKERS.test(cText))) {
    reasons.push("commercial_or_sourcing_conclusion");
  }
  if (type === "fact_candidate" && KPI_DEFINITION_MARKERS.test(String(content.factType))) {
    reasons.push("kpi_or_metric_definition");
  }
  // Target-state ASSERTION: a relationship explicitly scoped to target, or a fact
  // whose type asserts a target/future state. A relationship with an *unknown*
  // current/target is NOT a target-state assertion (v1's central error).
  if (
    (type === "relationship_candidate" && String(content.currentTargetState).toLowerCase() === "target") ||
    (type === "fact_candidate" && TARGET_STATE_FACT_MARKERS.test(String(content.factType)))
  ) {
    reasons.push("target_state_assertion");
  }
  if (type === "relationship_candidate" && AMBIGUOUS_TARGET_STATES.has(String(content.currentTargetState).toLowerCase())) {
    reasons.push("ambiguous_current_target_state");
  }
  if (type === "relationship_candidate" && HIGH_IMPACT_RELATIONSHIP_TYPES.has(String(content.relationshipTypeRef).toLowerCase())) {
    reasons.push("high_impact_relationship");
  }
  if (normalized.confidence > 0 && normalized.confidence < LOW_CONFIDENCE_THRESHOLD) {
    reasons.push("low_confidence");
  }

  if (reasons.length > 0) {
    return { candidateClass: "individual_review_required", reasons };
  }

  // --- Deterministic path: lineage + evidence must be present ---
  if (!normalized.sourceVersionRef) {
    return { candidateClass: "individual_review_required", reasons: ["incomplete_source_lineage"] };
  }

  const hasDirectEvidence = normalized.evidenceRefs.length > 0;
  if (!hasDirectEvidence) {
    // Evidence-less entity: it may INHERIT evidence from a source-backed fact that
    // references it — represented explicitly and routed to batch review (never
    // auto-accept). Without such a fact it needs individual review.
    if (type === "entity_candidate" && options.evidenceIndex?.get?.(normalized.candidateRef)) {
      return { candidateClass: "batch_review_required", reasons: ["evidence_inherited_from_source_fact"] };
    }
    return { candidateClass: "individual_review_required", reasons: ["no_evidence_lineage"] };
  }

  if (options.semanticValidationPassed === false || options.sourceReleaseFrozen === false || options.tenantFencePassed === false) {
    return { candidateClass: "batch_review_required", reasons: ["upstream_gate_not_bound"] };
  }

  // Deterministic, source-derived, directly evidence-backed, no judgment reasons.
  const autoTypes = new Set(options.autoAcceptCandidateTypes ?? ["entity_candidate", "fact_candidate"]);
  if (autoTypes.has(type) && normalized.confidence >= (options.autoAcceptConfidence ?? AUTO_ACCEPT_CONFIDENCE)) {
    return { candidateClass: "auto_accept_eligible", reasons: ["deterministic_high_confidence_evidence_backed"] };
  }
  // Relationships, and deterministic candidates below the auto-accept confidence,
  // are governed through batch review rather than individual.
  return { candidateClass: "batch_review_required", reasons: ["deterministic_evidence_backed_batch"] };
}

// --- Batch dimensions (req: split by type/domain/source/evidence/confidence/
//     derivation basis/current-target/commercial sensitivity/relationship impact) ---
function confidenceBand(conf) {
  if (!(conf > 0)) return "unscored";
  if (conf >= AUTO_ACCEPT_CONFIDENCE) return "high";
  if (conf >= LOW_CONFIDENCE_THRESHOLD) return "medium";
  return "low";
}
function evidenceCompleteness(n) {
  if (n.evidenceRefs.length > 0 && n.sourceVersionRef) return "evidence_and_source";
  if (n.evidenceRefs.length > 0) return "evidence_only";
  if (n.sourceVersionRef) return "source_only";
  return "incomplete";
}
function commercialSensitivity(n) {
  return n.candidateType === "fact_candidate" && COMMERCIAL_MARKERS.test(String(n.content.factType)) ? "commercial" : "standard";
}
function relationshipImpact(n) {
  if (n.candidateType !== "relationship_candidate") return "not_applicable";
  return HIGH_IMPACT_RELATIONSHIP_TYPES.has(String(n.content.relationshipTypeRef).toLowerCase()) ? "high" : "standard";
}
function candidateDomain(n) {
  return normalizeRef(n.raw, "domain", "domain_ref", "domainKey", "domain_key") ||
    (n.candidateType === "entity_candidate" ? String(n.content.entityType || "unclassified") :
     n.candidateType === "fact_candidate" ? String(n.content.factType || "unclassified").split(/[._]/)[0] :
     String(n.content.relationshipTypeRef || "relationship"));
}
function sourceFamily(n) {
  return derivationBasis(n.raw) || normalizeRef(n.raw, "sourceFamily", "source_family") || (n.sourceVersionRef ? n.sourceVersionRef.split(/[:@]/)[0] : "unknown_source");
}

function sampleSummary(n) {
  if (n.candidateType === "entity_candidate") return `${n.content.entityType || "entity"}: ${n.content.displayName || n.candidateRef}`;
  if (n.candidateType === "fact_candidate") return `${n.content.factType || "fact"} on ${n.content.subjectCandidateRef || "?"}`;
  return `${n.content.relationshipTypeRef || "rel"} [${n.content.currentTargetState}]`;
}

export function buildReviewBatches({ tenantKey, candidates, policyVersion = REVIEW_POLICY_VERSION, validationRunRef, sourceVersionRef, options = {}, samplesPerBatch = 5 }) {
  const evidenceIndex = options.evidenceIndex ?? buildEvidenceInheritanceIndex(candidates);
  const opts = { ...options, evidenceIndex };
  const grouped = new Map();

  for (const candidate of candidates) {
    const normalized = normalizeCandidate(candidate);
    const classification = classifyCandidateForReview(candidate, opts);
    const dimensions = {
      domain: candidateDomain(normalized),
      sourceFamily: sourceFamily(normalized),
      evidenceCompleteness: evidenceCompleteness(normalized),
      confidenceBand: confidenceBand(normalized.confidence),
      currentTargetState: normalized.candidateType === "relationship_candidate" ? String(normalized.content.currentTargetState || "unknown") : "not_applicable",
      commercialSensitivity: commercialSensitivity(normalized),
      relationshipImpact: relationshipImpact(normalized),
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
    inc(summary.byClass, batch.candidateClass, batch.candidateCount);
    inc(summary.byType, batch.candidateType, batch.candidateCount);
    const d = batch.dimensions ?? {};
    inc(summary.byDomain, d.domain, batch.candidateCount);
    inc(summary.bySourceFamily, d.sourceFamily, batch.candidateCount);
    inc(summary.byEvidenceCompleteness, d.evidenceCompleteness, batch.candidateCount);
    inc(summary.byConfidenceBand, d.confidenceBand, batch.candidateCount);
    for (const candidate of batch.candidates) {
      for (const reason of candidate.classification.reasons) inc(summary.byReason, reason, 1);
    }
  }
  return summary;
}
