import type { IndustrySourceAuthority } from './contract';

export type BenchmarkComparabilityField =
  | 'geography'
  | 'industry'
  | 'serviceScope'
  | 'scaleBand'
  | 'deliveryModel';

export interface ArchetypeBenchmarkMetricSpec {
  key: string;
  label: string;
  unit: string;
  stages: string[];
  sourceAuthorities: IndustrySourceAuthority[];
  requiredComparability: BenchmarkComparabilityField[];
}

export interface ArchetypeIndustryIntelligenceSpec {
  archetypeId: string;
  benchmarkMetrics: ArchetypeBenchmarkMetricSpec[];
}

const OFFICIAL_AND_LICENSED: IndustrySourceAuthority[] = [
  'official_public',
  'licensed_research',
  'client_provided_benchmark',
  'curated_anonymized_cohort',
];

const COHORT_AND_LICENSED: IndustrySourceAuthority[] = [
  'licensed_research',
  'client_provided_benchmark',
  'curated_anonymized_cohort',
];

const metric = (
  key: string,
  label: string,
  unit: string,
  stages: string[],
  requiredComparability: BenchmarkComparabilityField[],
  sourceAuthorities: IndustrySourceAuthority[] = COHORT_AND_LICENSED,
): ArchetypeBenchmarkMetricSpec => ({
  key,
  label,
  unit,
  stages,
  requiredComparability,
  sourceAuthorities,
});

export const SOURCE_ARCHETYPE_INDUSTRY_INTELLIGENCE: Record<
  string,
  ArchetypeIndustryIntelligenceSpec
> = {
  AMS_MANAGED_SERVICES: {
    archetypeId: 'AMS_MANAGED_SERVICES',
    benchmarkMetrics: [
      metric('ams_role_rate', 'Role rate by level and delivery location', 'usd_per_hour', ['evaluation', 'pricing', 'bafo'], ['geography', 'serviceScope', 'deliveryModel']),
      metric('ams_tickets_per_fte', 'Tickets per delivery FTE', 'tickets_per_fte_month', ['strategy', 'evaluation'], ['serviceScope', 'scaleBand', 'deliveryModel']),
      metric('ams_productivity_glidepath', 'Committed annual productivity glide path', 'pct_per_year', ['rfp', 'pricing', 'bafo'], ['serviceScope', 'scaleBand']),
      metric('ams_transition_duration', 'Transition duration for comparable estate', 'weeks', ['strategy', 'transition'], ['serviceScope', 'scaleBand', 'deliveryModel']),
    ],
  },
  ERP_SI_IMPLEMENTATION: {
    archetypeId: 'ERP_SI_IMPLEMENTATION',
    benchmarkMetrics: [
      metric('erp_si_role_rate', 'Implementation role rate', 'usd_per_hour', ['evaluation', 'pricing'], ['geography', 'deliveryModel']),
      metric('erp_si_effort', 'Implementation effort by work package', 'person_days', ['strategy', 'evaluation'], ['serviceScope', 'scaleBand']),
      metric('erp_si_change_rate', 'Change-request value as share of baseline', 'pct', ['rfp', 'bafo'], ['serviceScope', 'scaleBand']),
    ],
  },
  AI_DATA_PLATFORM: {
    archetypeId: 'AI_DATA_PLATFORM',
    benchmarkMetrics: [
      metric('data_platform_compute_rate', 'Compute unit rate', 'usd_per_compute_unit', ['evaluation', 'pricing'], ['geography', 'serviceScope'], OFFICIAL_AND_LICENSED),
      metric('data_platform_storage_rate', 'Storage unit rate', 'usd_per_gb_month', ['evaluation', 'pricing'], ['geography', 'serviceScope'], OFFICIAL_AND_LICENSED),
      metric('data_platform_support_ratio', 'Platform support cost ratio', 'pct_of_consumption', ['pricing', 'bafo'], ['serviceScope', 'scaleBand']),
    ],
  },
  CONTRACT_RENEWAL: {
    archetypeId: 'CONTRACT_RENEWAL',
    benchmarkMetrics: [
      metric('renewal_unit_price', 'Comparable unit price', 'usd_per_unit', ['strategy', 'pricing', 'bafo'], ['geography', 'serviceScope', 'scaleBand']),
      metric('renewal_uplift', 'Renewal price uplift', 'pct', ['strategy', 'pricing'], ['geography', 'serviceScope']),
      metric('renewal_discount', 'Term and volume discount', 'pct', ['evaluation', 'bafo'], ['serviceScope', 'scaleBand']),
    ],
  },
  CLOUD_FINOPS: {
    archetypeId: 'CLOUD_FINOPS',
    benchmarkMetrics: [
      metric('cloud_public_rate', 'Published on-demand service rate', 'usd_per_service_unit', ['strategy', 'evaluation', 'pricing'], ['geography', 'serviceScope'], ['official_public']),
      metric('cloud_commitment_discount', 'Commitment discount range', 'pct', ['pricing', 'bafo'], ['geography', 'serviceScope'], OFFICIAL_AND_LICENSED),
      metric('cloud_commitment_coverage', 'Commitment coverage', 'pct_of_eligible_usage', ['strategy', 'evaluation'], ['serviceScope', 'scaleBand']),
      metric('cloud_utilization', 'Resource utilization', 'pct', ['scope', 'value'], ['serviceScope', 'scaleBand']),
      metric('cloud_egress_rate', 'Data egress rate', 'usd_per_gb', ['evaluation', 'pricing'], ['geography', 'serviceScope'], ['official_public']),
    ],
  },
  BPO_SHARED_SERVICES: {
    archetypeId: 'BPO_SHARED_SERVICES',
    benchmarkMetrics: [
      metric('bpo_unit_cost', 'Cost per transaction', 'usd_per_transaction', ['strategy', 'evaluation', 'pricing'], ['geography', 'industry', 'serviceScope', 'scaleBand']),
      metric('bpo_productivity', 'Transactions per FTE', 'transactions_per_fte_month', ['evaluation', 'bafo'], ['industry', 'serviceScope', 'deliveryModel']),
      metric('bpo_error_rate', 'Transaction error rate', 'pct', ['rfp', 'evaluation', 'value'], ['industry', 'serviceScope']),
    ],
  },
  MSSP_CYBER: {
    archetypeId: 'MSSP_CYBER',
    benchmarkMetrics: [
      metric('mssp_asset_rate', 'Managed security cost per asset', 'usd_per_asset_month', ['evaluation', 'pricing'], ['geography', 'serviceScope', 'scaleBand']),
      metric('mssp_log_rate', 'Telemetry ingestion cost', 'usd_per_gb', ['evaluation', 'pricing'], ['geography', 'serviceScope']),
      metric('mssp_response_time', 'Incident response time', 'minutes', ['rfp', 'evaluation', 'value'], ['industry', 'serviceScope']),
    ],
  },
  STAFF_AUGMENTATION: {
    archetypeId: 'STAFF_AUGMENTATION',
    benchmarkMetrics: [
      metric('staff_aug_rate', 'Role rate by level and location', 'usd_per_hour', ['strategy', 'evaluation', 'pricing', 'bafo'], ['geography', 'serviceScope', 'deliveryModel']),
      metric('staff_aug_supplier_margin', 'Supplier margin', 'pct', ['pricing', 'bafo'], ['geography', 'deliveryModel']),
      metric('staff_aug_tenure', 'Contingent-worker tenure', 'months', ['scope', 'value'], ['serviceScope', 'scaleBand']),
    ],
  },
  AI_ENGINEERING_PARTNER: {
    archetypeId: 'AI_ENGINEERING_PARTNER',
    benchmarkMetrics: [
      metric('ai_partner_role_rate', 'AI engineering partner role rate by specialty', 'usd_per_hour', ['strategy', 'pricing'], ['geography', 'serviceScope', 'deliveryModel']),
      metric('ai_eval_acceptance_coverage', 'Comparable eval and safety acceptance coverage', 'pct_of_critical_scenarios', ['rfp', 'evaluation', 'bafo'], ['serviceScope', 'deliveryModel']),
      metric('ai_milestone_holdback', 'Eval-gated milestone holdback', 'pct_of_fees', ['rfp', 'pricing', 'bafo'], ['serviceScope', 'scaleBand']),
      metric('ai_modelops_support_ratio', 'Model-ops support runway as share of build fees', 'pct_of_build_fees', ['pricing', 'bafo'], ['serviceScope', 'deliveryModel']),
    ],
  },
  CONTACT_CENTER_CX: {
    archetypeId: 'CONTACT_CENTER_CX',
    benchmarkMetrics: [
      metric('contact_center_unit_cost', 'Cost per contact', 'usd_per_contact', ['strategy', 'evaluation', 'pricing'], ['geography', 'industry', 'serviceScope', 'scaleBand']),
      metric('contact_center_aht', 'Average handle time', 'seconds', ['scope', 'evaluation', 'value'], ['industry', 'serviceScope']),
      metric('contact_center_occupancy', 'Agent occupancy', 'pct', ['evaluation', 'value'], ['geography', 'serviceScope', 'deliveryModel']),
      metric('contact_center_fcr', 'First-contact resolution', 'pct', ['rfp', 'evaluation', 'value'], ['industry', 'serviceScope']),
    ],
  },
};

export function industryIntelligenceForArchetype(
  archetypeId: string,
): ArchetypeIndustryIntelligenceSpec | null {
  return SOURCE_ARCHETYPE_INDUSTRY_INTELLIGENCE[archetypeId] ?? null;
}
