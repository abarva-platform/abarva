import type {
  CanonicalConfidenceLevel,
  CanonicalEnterpriseArea,
  CanonicalIndustry,
  CanonicalLifecycleStatus,
  CanonicalMaturityLevel,
  CanonicalPatternProvenance,
  CanonicalPatternSourceSystem,
  CanonicalSourceBasis,
  CanonicalSourceCrosswalkEntry,
  CanonicalStrategicMovePhase,
  CanonicalValueLever,
  IndustryAIPattern,
} from './industry-ai-pattern';

export const CANONICAL_INDUSTRY_AI_PATTERNS_TABLE = 'canonical_industry_ai_patterns' as const;

export const CANONICAL_PATTERN_VISIBILITY_SCOPES = [
  'global',
  'tenant',
  'private',
] as const;

export type CanonicalPatternVisibilityScope = (typeof CANONICAL_PATTERN_VISIBILITY_SCOPES)[number];

export const CANONICAL_PATTERN_DUPLICATE_RISKS = [
  'low',
  'medium',
  'high',
] as const;

export type CanonicalPatternDuplicateRisk = (typeof CANONICAL_PATTERN_DUPLICATE_RISKS)[number];

export interface PersistedCanonicalIndustryAIPatternRow
  extends Omit<IndustryAIPattern, 'last_reviewed_at'> {
  schema_version: string;
  content_hash: string | null;
  last_reviewed_at: string | null;
  visibility_scope: CanonicalPatternVisibilityScope;
  tenant_key: string | null;
  client_id: string | null;
  full_pattern: Partial<IndustryAIPattern>;
  missing_required_fields: (keyof IndustryAIPattern)[];
  missing_provenance: boolean;
  duplicate_risk: CanonicalPatternDuplicateRisk | null;
  source_snapshot_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface CanonicalPatternReadFilters {
  tenant_key?: string;
  client_id?: string;
  industry?: CanonicalIndustry;
  enterprise_area?: CanonicalEnterpriseArea;
  function?: string;
  process_area?: string;
  use_case_category?: string;
  strategic_move_phase?: CanonicalStrategicMovePhase;
  confidence_level?: CanonicalConfidenceLevel;
  maturity_level?: CanonicalMaturityLevel;
  lifecycle_status?: CanonicalLifecycleStatus;
  source_system?: CanonicalPatternSourceSystem;
  value_lever?: CanonicalValueLever;
  query?: string;
  include_private?: boolean;
}

export interface CanonicalPatternReadResult {
  pattern: PersistedCanonicalIndustryAIPatternRow;
  match_reasons: string[];
  source_basis: CanonicalSourceBasis;
  confidence_level: CanonicalConfidenceLevel;
  provenance: CanonicalPatternProvenance;
  missing_required_fields: (keyof IndustryAIPattern)[];
  missing_provenance: boolean;
}

export const CANONICAL_PATTERN_PERSISTED_FILTER_COLUMNS = [
  'canonical_id',
  'visibility_scope',
  'tenant_key',
  'client_id',
  'industry',
  'enterprise_area',
  'function',
  'process_area',
  'use_case_category',
  'strategic_move_phases',
  'maturity_level',
  'confidence_level',
  'lifecycle_status',
  'source_systems',
  'source_ids',
  'value_levers',
] as const;

export const CANONICAL_PATTERN_PERSISTED_PROVENANCE_COLUMNS = [
  'source_crosswalk',
  'source_basis',
  'source_references',
  'confidence_rationale',
  'quantitative_claims',
  'unsupported_claim_flags',
  'content_hash',
  'source_snapshot_at',
  'duplicate_risk',
  'missing_required_fields',
  'missing_provenance',
] as const;

export const CANONICAL_PATTERN_PERSISTENCE_REQUIRED_FIELDS = [
  'canonical_id',
  'title',
  'summary',
  'source_crosswalk',
  'source_systems',
  'source_ids',
  'version',
  'lifecycle_status',
  'owner',
  'last_reviewed_at',
  'industry',
  'enterprise_area',
  'function',
  'process_area',
  'use_case_category',
  'strategic_move_phases',
  'maturity_level',
  'confidence_level',
  'executive_question_answered',
  'target_personas',
  'business_problem',
  'why_now',
  'value_hypothesis',
  'primary_kpis',
  'secondary_kpis',
  'baseline_needed',
  'measurement_method',
  'value_levers',
  'time_to_value_band',
  'implementation_complexity',
  'required_data_domains',
  'data_quality_dependencies',
  'source_system_dependencies',
  'integration_dependencies',
  'vector_graph_semantic_dependencies',
  'agentic_architecture_pattern',
  'human_agent_workflow_design',
  'autonomous_agent_action_boundaries',
  'escalation_points',
  'responsible_ai_guardrails',
  'operating_model_changes',
  'change_management_needs',
  'recommended_workshops',
  'recommended_artifacts',
  'entry_criteria',
  'exit_criteria',
  'gate_evidence_required',
  'common_failure_modes',
  'anti_patterns',
  'intervention_options',
  'failure_mode_mitigations',
  'source_basis',
  'source_references',
  'confidence_rationale',
  'quantitative_claims',
  'unsupported_claim_flags',
] as const satisfies readonly (keyof IndustryAIPattern)[];

export function sourceCrosswalkKeys(row: Pick<PersistedCanonicalIndustryAIPatternRow, 'source_crosswalk'>): string[] {
  return row.source_crosswalk.map((entry: CanonicalSourceCrosswalkEntry) => (
    `${entry.source_system}:${entry.source_id}`
  ));
}
