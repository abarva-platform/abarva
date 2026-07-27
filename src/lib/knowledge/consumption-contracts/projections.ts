/**
 * Projection payload types (the `data` inside a ConsumptionEnvelope<T>) for the
 * Brief, Explore and Evidence & Gaps modes. Relationships live in
 * relationships.ts; aVa in ava.ts; module handoff in handoff.ts.
 *
 * Every displayable statement carries a ContentClass so the renderer can keep
 * a leadership quote visually distinct from an accepted fact, a candidate from
 * a published fact, and a target from a current value.
 */

import type { AvailabilityState, ContentClass } from "./states";
import type { GovernedMetricValue } from "./metrics";
import type { PerspectiveEvidenceStance } from "./core";

/** Base for any governed statement the UI renders. */
export interface KnowledgeStatement {
  id: string;
  contentClass: ContentClass;
  availabilityState: AvailabilityState;
  /** Displayable evidence refs (never hidden truth). */
  evidenceRefs: string[];
  /** Present when withheld/not_loaded/etc. — explains the absence in plain language. */
  absenceReason?: string | null;
}

// ---------------------------------------------------------------------------
// Enterprise identity (consumption.enterprise_identity_v1)
// ---------------------------------------------------------------------------

export interface EnterpriseIdentityV1 {
  organizationId: string | null;
  displayName: string | null;
  industry: string | null;
  /** Footprint / revenue / employees each carry their own availability state. */
  revenue: GovernedMetricValue | null;
  employees: GovernedMetricValue | null;
  footprint: string | null;
  footprintState: AvailabilityState;
}

// ---------------------------------------------------------------------------
// Leadership perspective (consumption.executive_perspective_v1)
// ---------------------------------------------------------------------------

export interface LeadershipPerspectiveV1 extends KnowledgeStatement {
  contentClass: "leadership_perspective";
  quote: string;
  attribution: string | null;
  /** Role/title of the speaker; never a name that could identify a real person. */
  role: string | null;
  /** Interview/source basis for the signal. */
  sourceBasis: string | null;
  /** A quote is tested against supporting/challenging/uncertain evidence. */
  evidenceStance: PerspectiveEvidenceStance;
}

// ---------------------------------------------------------------------------
// AbarVa interpretation (consumption.strategic_interpretation_v1)
// ---------------------------------------------------------------------------

export interface AbarVaInterpretationV1 extends KnowledgeStatement {
  contentClass: "abarva_interpretation";
  headline: string;
  body: string;
  /** The renderer may style but must not rewrite Claude-authored interpretation. */
  pinnedBaselineRef: string;
}

// ---------------------------------------------------------------------------
// Benchmark / pattern (industry_benchmark | industry_pattern)
// ---------------------------------------------------------------------------

export interface BenchmarkV1 extends KnowledgeStatement {
  contentClass: "industry_benchmark" | "industry_pattern";
  label: string;
  value: GovernedMetricValue | null;
  peerContext: string | null;
}

// ---------------------------------------------------------------------------
// Target (approved_target | proposed_target) — never a current value
// ---------------------------------------------------------------------------

export interface TargetV1 extends KnowledgeStatement {
  contentClass: "approved_target" | "proposed_target";
  label: string;
  target: GovernedMetricValue | null;
  current: GovernedMetricValue | null;
  horizon: string | null;
}

// ---------------------------------------------------------------------------
// Domain readiness (consumption.domain_summary_v1)
// ---------------------------------------------------------------------------

export interface DomainReadinessV1 {
  domainKey: string;
  label: string;
  availabilityState: AvailabilityState;
  /** 0..1 coverage. */
  evidenceCoverage: number;
  entityCount: GovernedMetricValue | null;
  openGapCount: number;
  summary: string | null;
}

// ---------------------------------------------------------------------------
// BRIEF payload (consumption.enterprise_brief_v1 composed)
// ---------------------------------------------------------------------------

export interface EnterpriseBriefV1 {
  identity: EnterpriseIdentityV1;
  /** Headline governed metrics; each may be null-valued with a state. */
  headlineMetrics: GovernedMetricValue[];
  /** The interpretive spine of the brief (Claude-authored, pinned). */
  interpretation: AbarVaInterpretationV1 | null;
  perspectives: LeadershipPerspectiveV1[];
  benchmarks: BenchmarkV1[];
  targets: TargetV1[];
  domains: DomainReadinessV1[];
  /** Highest-signal gaps to surface directly on the brief. */
  topGapRefs: string[];
}

// ---------------------------------------------------------------------------
// EXPLORE payloads (application_inventory_v1 / vendor_contract_inventory_v1 / domain_summary_v1)
// ---------------------------------------------------------------------------

export interface EntityFieldValue {
  key: string;
  label: string;
  /** Renderable value; null when withheld/not_loaded/not_measured (never 0). */
  value: string | number | null;
  availabilityState: AvailabilityState;
  evidenceRefs: string[];
}

export interface EntitySummaryV1 {
  entityRef: string;
  entityType: string;
  displayName: string;
  domainKey: string;
  availabilityState: AvailabilityState;
  /** A few summary fields for the row; full set in EntityDetailV1. */
  fields: EntityFieldValue[];
  evidenceRefs: string[];
}

export interface EntityExploreResultV1 {
  domainKey: string | null;
  domains: DomainReadinessV1[];
  entities: EntitySummaryV1[];
  /** Total matching count for pagination; UI virtualizes/paginates. */
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface EntityDetailV1 {
  entity: EntitySummaryV1;
  /** Full field set. */
  fields: EntityFieldValue[];
  perspectives: LeadershipPerspectiveV1[];
  benchmarks: BenchmarkV1[];
  relatedEntityRefs: string[];
  gapRefs: string[];
}

// ---------------------------------------------------------------------------
// EVIDENCE & GAPS payload (consumption.evidence_gap_v1)
// ---------------------------------------------------------------------------

export type EvidenceGapSeverityLevel = "low" | "medium" | "high" | "critical";

export interface EvidenceGapV1 extends KnowledgeStatement {
  contentClass: "evidence_gap";
  gapId: string;
  severity: EvidenceGapSeverityLevel;
  domainKey: string | null;
  title: string;
  /** Why the missing evidence matters in business language (required by contract). */
  businessImpact: string;
  /** What source/action would close the gap. */
  requestedSource: string | null;
  /** Availability state that produced the gap (withheld/not_loaded/conflicting/...). */
  gapState: AvailabilityState;
}

export interface EvidenceGapResultV1 {
  domainKey: string | null;
  gaps: EvidenceGapV1[];
  /** Overall coverage rollup, 0..1. */
  overallEvidenceCoverage: number;
  /** Count by severity for the header. */
  severityCounts: Record<EvidenceGapSeverityLevel, number>;
}

// ---------------------------------------------------------------------------
// SEARCH payload (consumption.search_document_v1) — accepted publications only
// ---------------------------------------------------------------------------

export interface KnowledgeSearchHitV1 extends KnowledgeStatement {
  searchDocId: string;
  title: string;
  snippet: string;
  domainKey: string | null;
  entityRef: string | null;
}

export interface KnowledgeSearchResultV1 {
  query: string;
  hits: KnowledgeSearchHitV1[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Suggested questions
// ---------------------------------------------------------------------------

export interface SuggestedQuestionV1 {
  id: string;
  question: string;
  /** Which mode the question is most useful in. */
  mode: "brief" | "explore" | "relationships" | "evidence";
  /** Whether answering needs the aVa reasoning path (vs deterministic navigation). */
  requiresModel: boolean;
}
