// Domain/subdomain matrix taxonomy + per-tenant question generator (PR-6).

import { CANONICAL_TENANTS } from '@/config/tenants/CANONICAL_TENANTS';
import {
  QUESTION_ARCHETYPES,
  type Answerability,
  type DomainSpec,
  type MatrixQuestion,
  type QuestionArchetype,
  type RequiredSourceType,
} from './types';

/** The domain × subdomain taxonomy. Five subdomains per domain. */
export const DOMAINS: DomainSpec[] = [
  { domain: 'enterprise_leadership_operating_model', subdomains: ['executive_team', 'operating_model', 'decision_rights', 'org_structure', 'strategic_priorities'] },
  { domain: 'finance', subdomains: ['close_process', 'management_reporting', 'forecasting', 'financial_controls', 'cost_baseline'] },
  { domain: 'fpna', subdomains: ['planning_cycle', 'driver_models', 'scenario_planning', 'value_pools', 'kpi_ownership'] },
  { domain: 'treasury', subdomains: ['cash_management', 'liquidity', 'fx_risk', 'banking_relationships', 'payments'] },
  { domain: 'procurement', subdomains: ['sourcing', 'supplier_management', 'contract_lifecycle', 'spend_analytics', 'p2p_process'] },
  { domain: 'supply_chain', subdomains: ['planning', 'logistics', 'inventory', 'supplier_risk', 'systems'], industries: ['retail', 'healthcare_medtech', 'airline', 'diversified'] },
  { domain: 'it_organization', subdomains: ['org_structure', 'application_landscape', 'integration_architecture', 'service_management', 'sourcing_model'] },
  { domain: 'infrastructure_cloud', subdomains: ['private_cloud', 'hybrid_cloud', 'compute_storage', 'network', 'resilience_dr'] },
  { domain: 'erp_enterprise_apps', subdomains: ['erp_core', 'crm', 'hcm', 'industry_apps', 'integration_layer'] },
  { domain: 'data_analytics', subdomains: ['warehouse_lakehouse', 'bi_tools', 'semantic_layer', 'data_quality_governance', 'kpi_catalog'] },
  { domain: 'ai_automation', subdomains: ['ai_use_cases', 'automation_platforms', 'mlops', 'ai_readiness', 'governance'] },
  { domain: 'security_risk_controls', subdomains: ['security_tooling', 'identity_access', 'controls_framework', 'threat_posture', 'compliance'] },
  { domain: 'vendor_contract_management', subdomains: ['vendor_portfolio', 'contract_terms', 'renewals', 'vendor_risk', 'spend_concentration'] },
  { domain: 'transformation_portfolio', subdomains: ['active_moves', 'roadmap', 'stage_gates', 'dependencies', 'change_readiness'] },
  { domain: 'value_realization', subdomains: ['kpi_management', 'value_baselines', 'benefit_tracking', 'roi_models', 'value_leakage'] },
  { domain: 'industry_operations', subdomains: ['core_operations', 'customer_experience', 'regulatory', 'industry_kpis', 'industry_systems'] },
];

interface ArchetypeSpec {
  q: (ctx: { name: string; domain: string; subdomain: string }) => string;
  requiredSourceTypes: RequiredSourceType[];
  expectedCitationTypes: RequiredSourceType[];
  answerability: Answerability;
  negativeTest: boolean;
}

const human = (s: string) => s.replace(/_/g, ' ');

const ARCHETYPES: Record<QuestionArchetype, ArchetypeSpec> = {
  simple_factual: {
    q: ({ name, subdomain }) => `For ${name}, what is the current state of ${human(subdomain)}?`,
    requiredSourceTypes: ['tenant_context', 'structured_fact'],
    expectedCitationTypes: ['tenant_context', 'structured_fact'],
    answerability: 'NOT_TESTED',
    negativeTest: false,
  },
  current_state_architecture: {
    q: ({ name, subdomain }) => `Describe ${name}'s current ${human(subdomain)} architecture and how its components connect.`,
    requiredSourceTypes: ['tenant_context', 'context_record'],
    expectedCitationTypes: ['tenant_context', 'context_record'],
    answerability: 'NOT_TESTED',
    negativeTest: false,
  },
  org_ownership: {
    q: ({ name, subdomain }) => `Who owns ${human(subdomain)} at ${name}, and how is the team organized?`,
    requiredSourceTypes: ['tenant_context', 'structured_fact'],
    expectedCitationTypes: ['tenant_context'],
    answerability: 'NOT_TESTED',
    negativeTest: false,
  },
  systems_platforms: {
    q: ({ name, subdomain }) => `What platforms and systems support ${human(subdomain)} at ${name}?`,
    requiredSourceTypes: ['tenant_context', 'context_record'],
    expectedCitationTypes: ['tenant_context', 'context_record'],
    answerability: 'NOT_TESTED',
    negativeTest: false,
  },
  kpi_metric: {
    q: ({ name, subdomain }) => `What KPIs and metrics does ${name} track for ${human(subdomain)}, and what are the baselines?`,
    requiredSourceTypes: ['kpi_baseline', 'structured_fact'],
    expectedCitationTypes: ['kpi_baseline', 'structured_fact'],
    answerability: 'NOT_TESTED',
    negativeTest: false,
  },
  vendor_contract: {
    q: ({ name, subdomain }) => `Which vendors or contracts underpin ${human(subdomain)} at ${name}, and what is their status?`,
    requiredSourceTypes: ['context_record', 'source_event'],
    expectedCitationTypes: ['context_record'],
    answerability: 'NOT_TESTED',
    negativeTest: false,
  },
  risk_control: {
    q: ({ name, subdomain }) => `What are the key risks and controls for ${human(subdomain)} at ${name}?`,
    requiredSourceTypes: ['corpus_pattern', 'tenant_context'],
    expectedCitationTypes: ['corpus_pattern', 'tenant_context'],
    answerability: 'NOT_TESTED',
    negativeTest: false,
  },
  improvement_opportunity: {
    q: ({ name, subdomain }) => `Where are the biggest improvement opportunities in ${human(subdomain)} for ${name}?`,
    requiredSourceTypes: ['tenant_context', 'corpus_pattern'],
    expectedCitationTypes: ['tenant_context', 'corpus_pattern'],
    answerability: 'NOT_TESTED',
    negativeTest: false,
  },
  benchmark_pattern: {
    q: ({ domain, subdomain }) => `What does best-practice ${human(subdomain)} look like in ${human(domain)}, with supporting patterns or benchmarks?`,
    requiredSourceTypes: ['corpus_pattern', 'industry_benchmark'],
    expectedCitationTypes: ['corpus_pattern', 'industry_benchmark'],
    answerability: 'NOT_TESTED',
    negativeTest: false,
  },
  missing_evidence: {
    q: ({ name, subdomain }) => `Give the exact, current ${human(subdomain)} figures for ${name} to the unit — precise numbers only.`,
    requiredSourceTypes: [],
    expectedCitationTypes: [],
    answerability: 'NOT_LOADED',
    negativeTest: true,
  },
};

function domainAppliesToIndustry(spec: DomainSpec, industry: string): boolean {
  return !spec.industries || spec.industries.includes(industry);
}

export function buildMatrixForTenant(tenant: {
  key: string;
  name: string;
  industry: string;
}): MatrixQuestion[] {
  const questions: MatrixQuestion[] = [];
  for (const domainSpec of DOMAINS) {
    if (!domainAppliesToIndustry(domainSpec, tenant.industry)) continue;
    for (const subdomain of domainSpec.subdomains) {
      for (const archetype of QUESTION_ARCHETYPES) {
        const spec = ARCHETYPES[archetype];
        questions.push({
          id: `${tenant.key}:${domainSpec.domain}:${subdomain}:${archetype}`,
          tenantKey: tenant.key,
          domain: domainSpec.domain,
          subdomain,
          archetype,
          question: spec.q({ name: tenant.name, domain: domainSpec.domain, subdomain }),
          expectedAnswerability: spec.answerability,
          requiredSourceTypes: spec.requiredSourceTypes,
          expectedCitationTypes: spec.expectedCitationTypes,
          negativeTest: spec.negativeTest,
          tenantIsolationTest: true,
        });
      }
    }
  }
  return questions;
}

/** Full matrix across all canonical tenants (code-derived). */
export function buildExpertMatrix(): MatrixQuestion[] {
  return CANONICAL_TENANTS.flatMap((t) =>
    buildMatrixForTenant({ key: t.key, name: t.name, industry: t.industry }),
  );
}
