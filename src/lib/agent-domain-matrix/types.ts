// Domain/Subdomain Expert Consultant Question Matrix · contract (PR-6).
//
// Proves Nexus/Sentinel can behave like an expert consultant across loaded
// client context + industry corpus — not just answer a few generic questions.
// Tenants are code-derived (CANONICAL_TENANT_KEYS). Questions are generated per
// (tenant, domain, subdomain) across ten archetypes. Expected answers are NOT
// fabricated; the PR-5 Azure run derives ground truth and populates results.

// WS-D: answerability is DERIVED from measured pipeline state (deriveAnswerability),
// not a hardcoded constant. The matrix carries only the honest pre-run hypothesis
// (NOT_TESTED, or NOT_LOADED for designed negative tests).
import type { AnswerabilityStatus } from '@/lib/agent-data-coverage';

export type Answerability = AnswerabilityStatus;

export type RequiredSourceType =
  | 'tenant_context'
  | 'structured_fact'
  | 'context_record'
  | 'artifact'
  | 'corpus_pattern'
  | 'industry_benchmark'
  | 'source_event'
  | 'kpi_baseline';

/** The ten question archetypes the brief requires per subdomain. */
export const QUESTION_ARCHETYPES = [
  'simple_factual',
  'current_state_architecture',
  'org_ownership',
  'systems_platforms',
  'kpi_metric',
  'vendor_contract',
  'risk_control',
  'improvement_opportunity',
  'benchmark_pattern',
  'missing_evidence',
] as const;

export type QuestionArchetype = (typeof QUESTION_ARCHETYPES)[number];

export interface MatrixQuestion {
  id: string;
  tenantKey: string;
  domain: string;
  subdomain: string;
  archetype: QuestionArchetype;
  question: string;
  expectedAnswerability: Answerability;
  requiredSourceTypes: RequiredSourceType[];
  expectedCitationTypes: RequiredSourceType[];
  negativeTest: boolean;
  tenantIsolationTest: boolean;
}

/** Consultant-quality scoring dimensions (1–5 each), scored by the PR-5
 *  harness via the PR-3 rubric + an injected Anthropic judge. */
export const CONSULTANT_DIMENSIONS = [
  'directness',
  'executive_usefulness',
  'domain_expertise',
  'specificity_to_tenant',
  'evidence_grounding',
  'corpus_pattern_use',
  'risk_failure_mode_awareness',
  'actionability',
  'caveat_discipline',
  'no_hallucination',
] as const;

export type ConsultantDimension = (typeof CONSULTANT_DIMENSIONS)[number];

export interface DomainSpec {
  domain: string;
  subdomains: string[];
  /** Industries this domain is most relevant to; empty = all. */
  industries?: string[];
}
