/**
 * Canonical Industry AI Pattern contract.
 *
 * Foundation-only type layer for mapping existing corpus sources into a
 * consultant-grade pattern intelligence model. This file intentionally does
 * not load, persist, or mutate runtime data.
 */

export const CANONICAL_INDUSTRIES = [
  'retail',
  'healthcare',
  'healthcare_provider',
  'healthcare_medtech',
  'financial_services',
  'financial_services_banking',
  'airline',
  'cross_industry',
  'energy',
  'public_sector',
  'logistics_transportation',
  'automotive',
  'hospitality',
  'higher_education',
  'other',
] as const;

export type CanonicalIndustry = (typeof CANONICAL_INDUSTRIES)[number];

export const CANONICAL_ENTERPRISE_AREAS = [
  'front_office',
  'middle_office',
  'back_office',
  'enterprise_platform',
] as const;

export type CanonicalEnterpriseArea = (typeof CANONICAL_ENTERPRISE_AREAS)[number];

export const CANONICAL_STRATEGIC_MOVE_PHASES = [
  'originate',
  'charter',
  'diagnose_discover',
  'design',
  'roadmap_business_case_change_value_plan',
  'mobilize_handoff',
] as const;

export type CanonicalStrategicMovePhase = (typeof CANONICAL_STRATEGIC_MOVE_PHASES)[number];

export const CANONICAL_CONFIDENCE_LEVELS = [
  'low',
  'medium',
  'high',
  'validated',
] as const;

export type CanonicalConfidenceLevel = (typeof CANONICAL_CONFIDENCE_LEVELS)[number];

export const CANONICAL_MATURITY_LEVELS = [
  'emerging',
  'proven',
  'scaled',
  'experimental',
] as const;

export type CanonicalMaturityLevel = (typeof CANONICAL_MATURITY_LEVELS)[number];

export const CANONICAL_VALUE_LEVERS = [
  'revenue_growth',
  'cost_takeout',
  'productivity',
  'risk_reduction',
  'experience',
  'speed_to_market',
  'working_capital',
  'quality',
  'compliance',
] as const;

export type CanonicalValueLever = (typeof CANONICAL_VALUE_LEVERS)[number];

export const CANONICAL_LIFECYCLE_STATUSES = [
  'draft',
  'reviewed',
  'validated',
  'deprecated',
] as const;

export type CanonicalLifecycleStatus = (typeof CANONICAL_LIFECYCLE_STATUSES)[number];

export const CANONICAL_SOURCE_SYSTEMS = [
  'pattern_seed',
  'generated_pattern_manifest',
  'pattern_packs',
  'genome_patterns',
  'phase_packs',
  'deliverable_registry',
  'knowledge_corpus_schema',
  'knowledge_source_doc',
  'other',
] as const;

export type CanonicalPatternSourceSystem = (typeof CANONICAL_SOURCE_SYSTEMS)[number];

export const CANONICAL_SOURCE_BASIS_VALUES = [
  'internal_pattern',
  'public_research',
  'inferred_from_patterns',
  'user_seeded',
  'tenant_evidence',
  'synthetic_seed',
  'unknown',
] as const;

export type CanonicalSourceBasis = (typeof CANONICAL_SOURCE_BASIS_VALUES)[number];

export interface CanonicalSourceCrosswalkEntry {
  source_system: CanonicalPatternSourceSystem;
  source_id: string;
  source_path?: string;
  source_label?: string;
  relationship: 'primary' | 'derived_from' | 'related' | 'duplicate_candidate' | 'supersedes';
}

export interface CanonicalSourceReference {
  label: string;
  url?: string;
  source_id?: string;
  source_path?: string;
  as_of_date?: string;
  last_verified_at?: string;
  note?: string;
}

export interface CanonicalQuantitativeClaim {
  claim: string;
  metric?: string;
  value?: string;
  source_reference_ids?: string[];
  confidence_level: CanonicalConfidenceLevel;
  caveat?: string;
}

export interface CanonicalUnsupportedClaimFlag {
  claim: string;
  reason: string;
  recommended_action: 'remove' | 'qualify' | 'source_required' | 'mark_low_confidence';
}

export interface CanonicalPatternProvenance {
  source_basis: CanonicalSourceBasis;
  source_references: CanonicalSourceReference[];
  confidence_rationale: string;
  quantitative_claims: CanonicalQuantitativeClaim[];
  unsupported_claim_flags: CanonicalUnsupportedClaimFlag[];
}

export interface CanonicalPatternIdentity {
  canonical_id: string;
  title: string;
  summary: string;
  source_crosswalk: CanonicalSourceCrosswalkEntry[];
  source_systems: CanonicalPatternSourceSystem[];
  source_ids: string[];
  version: string;
  lifecycle_status: CanonicalLifecycleStatus;
  owner: string;
  last_reviewed_at: string | null;
}

export interface CanonicalPatternClassification {
  industry: CanonicalIndustry[];
  enterprise_area: CanonicalEnterpriseArea;
  function: string;
  process_area: string;
  use_case_category: string;
  strategic_move_phases: CanonicalStrategicMovePhase[];
  maturity_level: CanonicalMaturityLevel;
  confidence_level: CanonicalConfidenceLevel;
}

export interface CanonicalPatternBusinessContext {
  executive_question_answered: string;
  target_personas: string[];
  business_problem: string;
  why_now: string;
  value_hypothesis: string;
  primary_kpis: string[];
  secondary_kpis: string[];
  baseline_needed: string[];
  measurement_method: string;
  value_levers: CanonicalValueLever[];
  time_to_value_band: string;
  implementation_complexity: 'low' | 'medium' | 'high' | 'unknown';
}

export interface CanonicalPatternDataArchitecture {
  required_data_domains: string[];
  data_quality_dependencies: string[];
  source_system_dependencies: string[];
  integration_dependencies: string[];
  vector_graph_semantic_dependencies: string[];
  agentic_architecture_pattern: string;
  human_agent_workflow_design: string;
  autonomous_agent_action_boundaries: string[];
  escalation_points: string[];
  responsible_ai_guardrails: string[];
}

export interface CanonicalPatternOperatingModel {
  operating_model_changes: string[];
  change_management_needs: string[];
  recommended_workshops: string[];
  recommended_artifacts: string[];
  entry_criteria: string[];
  exit_criteria: string[];
  gate_evidence_required: string[];
}

export interface CanonicalPatternRiskFailure {
  common_failure_modes: string[];
  anti_patterns: string[];
  intervention_options: string[];
  failure_mode_mitigations: string[];
}

export interface IndustryAIPattern
  extends CanonicalPatternIdentity,
    CanonicalPatternClassification,
    CanonicalPatternBusinessContext,
    CanonicalPatternDataArchitecture,
    CanonicalPatternOperatingModel,
    CanonicalPatternRiskFailure,
    CanonicalPatternProvenance {}

export interface IndustryAIPatternDraft extends Partial<IndustryAIPattern> {
  canonical_id: string;
  title: string;
  source_crosswalk: CanonicalSourceCrosswalkEntry[];
  source_systems: CanonicalPatternSourceSystem[];
  source_ids: string[];
  missing_required_fields: (keyof IndustryAIPattern)[];
  missing_provenance: boolean;
}

export const CANONICAL_INDUSTRY_AI_PATTERN_REQUIRED_FIELDS = [
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
