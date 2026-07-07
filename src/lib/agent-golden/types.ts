// Golden Tenant Question Suites · contract (PR-2).
//
// Executable golden suites for every active canonical tenant. Questions are
// derived from code (CANONICAL_TENANT_KEYS) — never a hand-typed tenant list —
// and tagged with the assertions a live run must satisfy. Expected answers are
// NOT fabricated: each question carries an answerability HYPOTHESIS plus the
// source types it should be grounded in; the PR-5 Azure run reconciles the
// hypothesis against the tenant's actual loaded data.

export const GOLDEN_CATEGORIES = [
  'leadership',
  'company_scale',
  'industry_corpus',
  'move_context',
  'artifacts_evidence',
  'kpi_value',
  'vendor_source',
  'systems_landscape',
  'it_data_cloud_erp',
  'risk_failure_mode',
  'missing_unsupported',
] as const;

export type GoldenCategory = (typeof GOLDEN_CATEGORIES)[number];

// WS-D: answerability is DERIVED from measured pipeline state, not a hardcoded
// constant. The question bank only carries the honest pre-run hypothesis
// (NOT_TESTED, or NOT_LOADED for designed negative tests); the live run computes
// the real status via deriveAnswerability().
import type { AnswerabilityStatus } from '@/lib/agent-data-coverage';

export type Answerability = AnswerabilityStatus;

export type RequiredSourceType =
  | 'tenant_context'
  | 'structured_fact'
  | 'context_record'
  | 'artifact'
  | 'evidence'
  | 'corpus_pattern'
  | 'industry_benchmark'
  | 'source_event'
  | 'kpi_baseline';

export interface GoldenQuestion {
  id: string;
  tenantKey: string;
  category: GoldenCategory;
  question: string;
  /** Hypothesis; reconciled against real Azure data by the PR-5 run. */
  expectedAnswerability: Answerability;
  requiredSourceTypes: RequiredSourceType[];
  /** A relevant tenant context object should be retrieved. */
  expectsTenantContext: boolean;
  /** An approved corpus/industry pattern should be retrieved. */
  expectsApprovedPattern: boolean;
  /** The answer should warn about missing/insufficient context. */
  expectsMissingContextWarning: boolean;
  /** Citation/evidence objects should be emitted. */
  expectsCitations: boolean;
  /** A question with no loadable answer (negative test). */
  negativeTest: boolean;
  /** Every answer must avoid cross-tenant leakage. */
  tenantIsolationTest: boolean;
}

export interface GoldenSuite {
  tenantKey: string;
  tenantName: string;
  industry: string;
  questions: GoldenQuestion[];
}
