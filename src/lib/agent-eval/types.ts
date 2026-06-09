// Response Wisdom Evaluation Rubric · contract (PR-3).
//
// Scores a governed Nexus/Sentinel answer 1–5 across ten dimensions and
// produces a production-readiness verdict. The rubric is deliberately split:
//  - DETERMINISTIC dimensions are computed from the AgentContextTrace + answer
//    text (no model needed) so they are fully unit-testable in CI/lab mode.
//  - SUBJECTIVE dimensions (judgment / specificity / usefulness / hallucination)
//    accept an INJECTED judgment, so an Anthropic judge can be wired in at the
//    verification-harness level without baking a model dependency into this
//    library. When no judgment is injected, those dimensions are reported as
//    `not_assessed` and treated conservatively for the gate.

import type { AgentContextTrace } from '@/lib/agent-trace/types';

export const RUBRIC_DIMENSIONS = [
  'tenant_grounding',
  'pattern_grounding',
  'business_judgment',
  'specificity',
  'risk_failure_mode_awareness',
  'source_discipline',
  'actionability',
  'no_hallucination',
  'missing_context_honesty',
  'executive_usefulness',
] as const;

export type RubricDimension = (typeof RUBRIC_DIMENSIONS)[number];

/** Which dimensions can be computed without a model. */
export const DETERMINISTIC_DIMENSIONS: readonly RubricDimension[] = [
  'tenant_grounding',
  'pattern_grounding',
  'source_discipline',
  'risk_failure_mode_awareness',
  'missing_context_honesty',
] as const;

/** Dimensions that require an injected (model/human) judgment. */
export const SUBJECTIVE_DIMENSIONS: readonly RubricDimension[] = [
  'business_judgment',
  'specificity',
  'actionability',
  'no_hallucination',
  'executive_usefulness',
] as const;

/** A 1–5 score, or null when the dimension was not assessed. */
export type Score = 1 | 2 | 3 | 4 | 5 | null;

export interface DimensionScore {
  dimension: RubricDimension;
  score: Score;
  /** deterministic | injected | not_assessed */
  basis: 'deterministic' | 'injected' | 'not_assessed';
  /** Short, non-sensitive rationale. */
  rationale: string;
}

/** A claim the answer made that no backing evidence supports (from PR-4). */
export interface UnsupportedClaim {
  claimText: string;
  claimType: string;
  /** True when the claim is "critical" (value/KPI/vendor/architecture/etc). */
  critical: boolean;
  recommendedFixLane: RemediationLane;
}

/** A finding that the answer referenced another tenant's context. */
export interface TenantLeakageFinding {
  detail: string;
  offendingTenantKey?: string | null;
}

/** A finding that a cited pattern is outside the tenant's grounding namespace. */
export interface NamespaceFinding {
  patternId: string;
  citedNamespace: string | null;
  allowedNamespaces: string[];
  /** phantom = id does not exist anywhere; cross_namespace = exists elsewhere. */
  kind: 'phantom' | 'cross_namespace';
}

export type RemediationLane =
  | 'ingestion_data_load'
  | 'retrieval_indexing'
  | 'answer_prompt_synthesis'
  | 'binder_pattern_validation'
  | 'tenant_isolation'
  | 'provenance_source_state'
  | 'ui_module_binding';

/** Injected subjective judgments (from an LLM judge or a human reviewer). */
export type InjectedJudgments = Partial<
  Record<(typeof SUBJECTIVE_DIMENSIONS)[number], { score: Score; rationale: string }>
>;

export interface EvaluateInput {
  trace: AgentContextTrace;
  answerText: string;
  /** Output of PR-4 claim/citation validation, when available. */
  unsupportedClaims?: UnsupportedClaim[];
  /** Tenant-leakage findings (leakage tests / PR-4). */
  tenantLeakage?: TenantLeakageFinding[];
  /** Pattern namespace findings (PR-4). */
  namespaceFindings?: NamespaceFinding[];
  /** Subjective dimension judgments, if assessed. */
  judgments?: InjectedJudgments;
  /** Threshold below which the answer is not production-ready (default 3). */
  threshold?: number;
}

export interface AgentResponseEvaluation {
  questionId: string;
  agent: AgentContextTrace['agent'];
  surface: AgentContextTrace['surface'];
  tenantKey: string | null;
  overallScore: number | null;
  dimensionScores: DimensionScore[];
  failedDimensions: RubricDimension[];
  supportingTraceIds: string[];
  unsupportedClaims: UnsupportedClaim[];
  missingCitations: string[];
  tenantLeakageFindings: TenantLeakageFinding[];
  patternNamespaceFindings: NamespaceFinding[];
  /** The reasons an automatic fail was triggered, if any. */
  autoFailReasons: string[];
  recommendedFix: string | null;
  productionReady: boolean;
  threshold: number;
}

export const DEFAULT_THRESHOLD = 3;
