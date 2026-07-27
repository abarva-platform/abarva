/**
 * Compact builders for authoring contract-valid fixtures. Keeping construction
 * here means the pack files stay readable and every fixture object is forced
 * through a typed builder that matches the 3C-2D contract.
 *
 * FIXTURE-ONLY: nothing here is tenant truth. All values are synthetic.
 */

import type {
  AuthorityState,
  AvailabilityState,
  BenchmarkV1,
  DomainReadinessV1,
  EntityFieldValue,
  EntitySummaryV1,
  EvidenceDescriptor,
  EvidenceGapSeverityLevel,
  EvidenceGapV1,
  GovernedMetricValue,
  KnowledgeSearchHitV1,
  LeadershipPerspectiveV1,
  PerspectiveEvidenceStance,
  RelationshipEdgeV1,
  RelationshipNodeV1,
  SuggestedQuestionV1,
  TargetV1,
} from "../consumption-contracts";

export function metric(
  metricKey: string,
  label: string,
  value: number | null,
  unit: string | null,
  opts: Partial<GovernedMetricValue> = {},
): GovernedMetricValue {
  const availabilityState: AvailabilityState =
    opts.availabilityState ?? (value === null ? "not_measured" : "available");
  return {
    metricKey,
    label,
    value,
    unit,
    period: opts.period ?? "FY2026",
    availabilityState,
    semanticModelVersion: opts.semanticModelVersion ?? null,
    metricQueryHash: opts.metricQueryHash ?? null,
    evidenceRefs: opts.evidenceRefs ?? [],
    unavailableReason:
      value === null
        ? opts.unavailableReason ??
          "Underlying source has not yet been provided or confirmed."
        : opts.unavailableReason ?? null,
  };
}

export const stance = (
  supporting: string[] = [],
  challenging: string[] = [],
  uncertain: string[] = [],
): PerspectiveEvidenceStance => ({ supporting, challenging, uncertain });

export function perspective(
  id: string,
  quote: string,
  role: string | null,
  evidenceStance: PerspectiveEvidenceStance,
  opts: {
    availabilityState?: AvailabilityState;
    evidenceRefs?: string[];
    sourceBasis?: string | null;
    attribution?: string | null;
    absenceReason?: string | null;
  } = {},
): LeadershipPerspectiveV1 {
  return {
    id,
    contentClass: "leadership_perspective",
    availabilityState: opts.availabilityState ?? "accepted",
    evidenceRefs: opts.evidenceRefs ?? [],
    absenceReason: opts.absenceReason ?? null,
    quote,
    attribution: opts.attribution ?? null,
    role,
    sourceBasis: opts.sourceBasis ?? "Executive interview signal",
    evidenceStance,
  };
}

export function benchmark(
  id: string,
  label: string,
  value: GovernedMetricValue | null,
  peerContext: string | null,
  opts: {
    contentClass?: "industry_benchmark" | "industry_pattern";
    availabilityState?: AvailabilityState;
    evidenceRefs?: string[];
  } = {},
): BenchmarkV1 {
  return {
    id,
    contentClass: opts.contentClass ?? "industry_benchmark",
    availabilityState: opts.availabilityState ?? "available",
    evidenceRefs: opts.evidenceRefs ?? [],
    absenceReason: null,
    label,
    value,
    peerContext,
  };
}

export function target(
  id: string,
  label: string,
  targetMetric: GovernedMetricValue | null,
  currentMetric: GovernedMetricValue | null,
  horizon: string | null,
  opts: {
    contentClass?: "approved_target" | "proposed_target";
    availabilityState?: AvailabilityState;
    evidenceRefs?: string[];
  } = {},
): TargetV1 {
  return {
    id,
    contentClass: opts.contentClass ?? "proposed_target",
    availabilityState: opts.availabilityState ?? "candidate",
    evidenceRefs: opts.evidenceRefs ?? [],
    absenceReason: null,
    label,
    target: targetMetric,
    current: currentMetric,
    horizon,
  };
}

export function domain(
  domainKey: string,
  label: string,
  availabilityState: AvailabilityState,
  evidenceCoverage: number,
  entityCount: number | null,
  openGapCount: number,
  summary: string | null,
): DomainReadinessV1 {
  return {
    domainKey,
    label,
    availabilityState,
    evidenceCoverage,
    entityCount:
      entityCount === null
        ? metric(`${domainKey}.count`, "Entities", null, "count", {
            availabilityState: "not_loaded",
          })
        : metric(`${domainKey}.count`, "Entities", entityCount, "count"),
    openGapCount,
    summary,
  };
}

export const field = (
  key: string,
  label: string,
  value: string | number | null,
  availabilityState: AvailabilityState = value === null ? "not_loaded" : "available",
  evidenceRefs: string[] = [],
): EntityFieldValue => ({ key, label, value, availabilityState, evidenceRefs });

export function entity(
  entityRef: string,
  entityType: string,
  displayName: string,
  domainKey: string,
  fields: EntityFieldValue[],
  opts: { availabilityState?: AvailabilityState; evidenceRefs?: string[] } = {},
): EntitySummaryV1 {
  return {
    entityRef,
    entityType,
    displayName,
    domainKey,
    availabilityState: opts.availabilityState ?? "available",
    fields,
    evidenceRefs: opts.evidenceRefs ?? [],
  };
}

export function gap(
  gapId: string,
  severity: EvidenceGapSeverityLevel,
  domainKey: string | null,
  title: string,
  businessImpact: string,
  requestedSource: string | null,
  gapState: AvailabilityState,
): EvidenceGapV1 {
  return {
    id: gapId,
    contentClass: "evidence_gap",
    availabilityState: gapState,
    evidenceRefs: [],
    absenceReason: businessImpact,
    gapId,
    severity,
    domainKey,
    title,
    businessImpact,
    requestedSource,
    gapState,
  };
}

export function searchHit(
  searchDocId: string,
  title: string,
  snippet: string,
  domainKey: string | null,
  entityRef: string | null,
  evidenceRefs: string[] = [],
): KnowledgeSearchHitV1 {
  return {
    id: searchDocId,
    contentClass: "accepted_fact",
    availabilityState: "accepted",
    evidenceRefs,
    absenceReason: null,
    searchDocId,
    title,
    snippet,
    domainKey,
    entityRef,
  };
}

export const suggested = (
  id: string,
  question: string,
  mode: SuggestedQuestionV1["mode"],
  requiresModel: boolean,
): SuggestedQuestionV1 => ({ id, question, mode, requiresModel });

export function evidence(
  evidenceRef: string,
  sourceName: string | null,
  sourceType: string | null,
  opts: Partial<EvidenceDescriptor> = {},
): EvidenceDescriptor {
  return {
    evidenceRef,
    sourceName,
    sourceType,
    sourceDate: opts.sourceDate ?? "2026-05-01",
    citation: opts.citation ?? null,
    authorityState: opts.authorityState ?? "accepted",
    reviewState: opts.reviewState ?? "reviewed",
    confidence: opts.confidence ?? 0.8,
    effectivePeriod: opts.effectivePeriod ?? "FY2026",
    lineage:
      opts.lineage ?? ["source", "evidence", "assertion", "publication"],
    relatedConflicts: opts.relatedConflicts ?? [],
    accessRestriction: opts.accessRestriction ?? "none",
    availabilityState: opts.availabilityState ?? "available",
  };
}

export const node = (
  nodeId: string,
  nodeType: string,
  label: string,
  hop: 0 | 1 | 2,
  opts: {
    authorityState?: AuthorityState;
    availabilityState?: AvailabilityState;
    evidenceRefs?: string[];
  } = {},
): RelationshipNodeV1 => ({
  nodeId,
  nodeType,
  label,
  authorityState: opts.authorityState ?? "accepted",
  availabilityState: opts.availabilityState ?? "available",
  hop,
  evidenceRefs: opts.evidenceRefs ?? [],
});

export const edge = (
  edgeId: string,
  fromNodeId: string,
  toNodeId: string,
  relationshipType: string,
  opts: {
    authorityState?: AuthorityState;
    availabilityState?: AvailabilityState;
    scope?: "current" | "target";
    evidenceRefs?: string[];
  } = {},
): RelationshipEdgeV1 => ({
  edgeId,
  fromNodeId,
  toNodeId,
  relationshipType,
  authorityState: opts.authorityState ?? "accepted",
  availabilityState: opts.availabilityState ?? "available",
  scope: opts.scope ?? "current",
  evidenceRefs: opts.evidenceRefs ?? [],
});
