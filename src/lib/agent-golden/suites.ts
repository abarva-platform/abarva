// Golden suite builder — derives suites from CANONICAL_TENANTS (code, not a
// hand-typed list). Eleven questions per tenant (one per category), within the
// 8–12 range the brief requires.

import { CANONICAL_TENANTS } from '@/config/tenants/CANONICAL_TENANTS';
import {
  GOLDEN_CATEGORIES,
  type GoldenCategory,
  type GoldenQuestion,
  type GoldenSuite,
  type RequiredSourceType,
} from './types';

interface CategorySpec {
  /** Build the question text for a tenant. */
  q: (name: string, domain: string) => string;
  requiredSourceTypes: RequiredSourceType[];
  expectsTenantContext: boolean;
  expectsApprovedPattern: boolean;
  expectsMissingContextWarning: boolean;
  expectsCitations: boolean;
  negativeTest: boolean;
  /** Default answerability hypothesis (reconciled by the PR-5 Azure run). */
  answerability: GoldenQuestion['expectedAnswerability'];
}

/** Industry → a natural domain noun used in question templates. */
const DOMAIN_NOUN: Record<string, string> = {
  retail: 'retail operations',
  healthcare_provider: 'care delivery operations',
  healthcare_medtech: 'medical-device operations',
  financial_services_banking: 'banking operations',
  airline: 'airline operations',
  diversified: 'portfolio operations',
};

const CATEGORY_SPECS: Record<GoldenCategory, CategorySpec> = {
  leadership: {
    q: (n) => `Who are the named executives and leadership team at ${n}, and what are their remits?`,
    requiredSourceTypes: ['tenant_context', 'structured_fact'],
    expectsTenantContext: true,
    expectsApprovedPattern: false,
    expectsMissingContextWarning: false,
    expectsCitations: true,
    negativeTest: false,
    answerability: 'NOT_TESTED',
  },
  company_scale: {
    q: (n) => `What is ${n}'s scale — revenue, business units, geographies, and headcount?`,
    requiredSourceTypes: ['tenant_context', 'structured_fact'],
    expectsTenantContext: true,
    expectsApprovedPattern: false,
    expectsMissingContextWarning: false,
    expectsCitations: true,
    negativeTest: false,
    answerability: 'NOT_TESTED',
  },
  industry_corpus: {
    q: (n, d) => `What are the leading industry patterns and benchmarks relevant to ${n}'s ${d}?`,
    requiredSourceTypes: ['corpus_pattern', 'industry_benchmark'],
    expectsTenantContext: false,
    expectsApprovedPattern: true,
    expectsMissingContextWarning: false,
    expectsCitations: true,
    negativeTest: false,
    answerability: 'NOT_TESTED',
  },
  move_context: {
    q: (n) => `What transformation Moves or programs are in flight for ${n}, and what stage are they in?`,
    requiredSourceTypes: ['tenant_context', 'artifact'],
    expectsTenantContext: true,
    expectsApprovedPattern: false,
    expectsMissingContextWarning: false,
    expectsCitations: true,
    negativeTest: false,
    answerability: 'NOT_TESTED',
  },
  artifacts_evidence: {
    q: (n) => `What board-grade artifacts or evidence packages exist for ${n}, and what do they conclude?`,
    requiredSourceTypes: ['artifact', 'evidence'],
    expectsTenantContext: true,
    expectsApprovedPattern: false,
    expectsMissingContextWarning: false,
    expectsCitations: true,
    negativeTest: false,
    answerability: 'NOT_TESTED',
  },
  kpi_value: {
    q: (n) => `What are ${n}'s key KPIs and value baselines, and who owns them?`,
    requiredSourceTypes: ['kpi_baseline', 'structured_fact'],
    expectsTenantContext: true,
    expectsApprovedPattern: false,
    expectsMissingContextWarning: false,
    expectsCitations: true,
    negativeTest: false,
    answerability: 'NOT_TESTED',
  },
  vendor_source: {
    q: (n) => `Which vendors and sourcing relationships matter most to ${n}, and what is their status?`,
    requiredSourceTypes: ['context_record', 'source_event'],
    expectsTenantContext: true,
    expectsApprovedPattern: false,
    expectsMissingContextWarning: false,
    expectsCitations: true,
    negativeTest: false,
    answerability: 'NOT_TESTED',
  },
  systems_landscape: {
    q: (n) => `Describe ${n}'s application and systems landscape — core platforms and how they connect.`,
    requiredSourceTypes: ['tenant_context', 'context_record'],
    expectsTenantContext: true,
    expectsApprovedPattern: false,
    expectsMissingContextWarning: false,
    expectsCitations: true,
    negativeTest: false,
    answerability: 'NOT_TESTED',
  },
  it_data_cloud_erp: {
    q: (n) => `What is ${n}'s IT / data / cloud / ERP architecture, and where are the modernization gaps?`,
    requiredSourceTypes: ['tenant_context', 'context_record'],
    expectsTenantContext: true,
    expectsApprovedPattern: false,
    expectsMissingContextWarning: false,
    expectsCitations: true,
    negativeTest: false,
    answerability: 'NOT_TESTED',
  },
  risk_failure_mode: {
    q: (n, d) => `What are the top risks and failure modes for ${n}'s ${d} transformation, and how are they mitigated?`,
    requiredSourceTypes: ['corpus_pattern', 'tenant_context'],
    expectsTenantContext: true,
    expectsApprovedPattern: true,
    expectsMissingContextWarning: false,
    expectsCitations: true,
    negativeTest: false,
    answerability: 'NOT_TESTED',
  },
  missing_unsupported: {
    q: (n) => `What was ${n}'s exact net profit in the most recent fiscal quarter, to the dollar?`,
    requiredSourceTypes: [],
    expectsTenantContext: false,
    expectsApprovedPattern: false,
    expectsMissingContextWarning: true,
    expectsCitations: false,
    negativeTest: true,
    answerability: 'NOT_LOADED',
  },
};

export function buildGoldenSuite(tenant: {
  key: string;
  name: string;
  industry: string;
}): GoldenSuite {
  const domain = DOMAIN_NOUN[tenant.industry] ?? 'operations';
  const questions: GoldenQuestion[] = GOLDEN_CATEGORIES.map((category) => {
    const spec = CATEGORY_SPECS[category];
    return {
      id: `${tenant.key}:${category}`,
      tenantKey: tenant.key,
      category,
      question: spec.q(tenant.name, domain),
      expectedAnswerability: spec.answerability,
      requiredSourceTypes: spec.requiredSourceTypes,
      expectsTenantContext: spec.expectsTenantContext,
      expectsApprovedPattern: spec.expectsApprovedPattern,
      expectsMissingContextWarning: spec.expectsMissingContextWarning,
      expectsCitations: spec.expectsCitations,
      negativeTest: spec.negativeTest,
      tenantIsolationTest: true,
    };
  });
  return { tenantKey: tenant.key, tenantName: tenant.name, industry: tenant.industry, questions };
}

/** All golden suites — one per canonical tenant, derived from code. */
export function buildGoldenSuites(): GoldenSuite[] {
  return CANONICAL_TENANTS.map((t) =>
    buildGoldenSuite({ key: t.key, name: t.name, industry: t.industry }),
  );
}
