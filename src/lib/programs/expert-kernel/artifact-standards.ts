// Moves Expert Kernel - artifact quality standards.
//
// This catalog defines the board-grade contract for every downloadable Moves
// artifact. It is deliberately typed and deterministic so renderers, dossier
// view-models and export tests can all score against the same source of truth.

import {
  KERNEL_ARTIFACTS,
  type KernelArtifactId,
  type MovesPhase,
} from './exports/artifact-catalog';

export type ArtifactStandardId = KernelArtifactId | 'solution_architecture_pack';

export type ArtifactAudience =
  | 'board'
  | 'cfo'
  | 'cio'
  | 'cxo_sponsor'
  | 'delivery_lead'
  | 'domain_owner'
  | 'enterprise_architect'
  | 'pmo'
  | 'risk_compliance'
  | 'sourcing_vp'
  | 'tower_owner'
  | 'transformation_lead';

export type ArtifactSectionId =
  | 'problem_statement'
  | 'current_state_baseline'
  | 'seed_and_evidence_gaps'
  | 'opportunity_sizing'
  | 'go_no_go_read'
  | 'next_evidence_requests'
  | 'decision_recommendation'
  | 'quantified_value_hypothesis'
  | 'cost_effort_first_range'
  | 'top_assumptions'
  | 'sponsor_and_owner'
  | 'stop_kill_criteria'
  | 'before_funding_conditions'
  | 'one_page_board_summary'
  | 'baseline_and_pain'
  | 'value_case'
  | 'investment_case'
  | 'payback_and_sensitivity'
  | 'roadmap_and_dependencies'
  | 'risk_control_view'
  | 'assumption_ledger'
  | 'evidence_gap_appendix'
  | 'estimate_summary'
  | 'workstream_breakdown'
  | 'role_mix_by_phase'
  | 'rate_card_basis'
  | 'build_run_change_split'
  | 'scenario_ranges'
  | 'sensitivity_drivers'
  | 'what_breaks_estimate'
  | 'the_answer'
  | 'the_case'
  | 'five_assumptions'
  | 'what_makes_wrong'
  | 'what_not_to_fund_yet'
  | 'tower_measurement'
  | 'evidence_used_and_missing'
  | 'go_no_go_recommendation'
  | 'conditions_to_proceed'
  | 'thirty_sixty_ninety_plan'
  | 'workstream_owners'
  | 'adoption_change_approach'
  | 'hypercare_readiness'
  | 'tower_measurement_handoff'
  | 'open_risks_decision_log'
  | 'architecture_decision_summary'
  | 'architecture_option_set'
  | 'selected_architecture_option'
  | 'logical_architecture'
  | 'data_integration_flow'
  | 'security_privacy_control_view'
  | 'human_agent_accountability'
  | 'architecture_risks';

export type ArtifactVisualId =
  | 'adoption_readiness_table'
  | 'architecture_context_diagram'
  | 'assumption_sensitivity_stack'
  | 'baseline_coverage_meter'
  | 'base_conservative_upside_chart'
  | 'build_buy_boundary_view'
  | 'control_overlay'
  | 'data_flow_diagram'
  | 'decision_card'
  | 'dependency_map'
  | 'evidence_gap_matrix'
  | 'evidence_source_table'
  | 'executive_economics_card'
  | 'gap_closure_queue'
  | 'integration_map'
  | 'investment_vs_return_waterfall'
  | 'kill_criteria_checklist'
  | 'logical_architecture_diagram'
  | 'metric_source_table'
  | 'open_action_queue'
  | 'opportunity_range_bar'
  | 'payback_range_curve'
  | 'phased_roadmap'
  | 'raci_matrix'
  | 'rate_card_source_table'
  | 'risk_control_heatmap'
  | 'roadmap_swimlane'
  | 'role_mix_by_phase'
  | 'sensitivity_driver_chart'
  | 'sensitivity_tornado'
  | 'signoff_matrix'
  | 'thirty_sixty_ninety_swimlane'
  | 'tower_measurement_table'
  | 'value_vs_effort_summary'
  | 'value_vs_investment_chart'
  | 'workstream_cost_bar'
  | 'workstream_cost_stack';

export type ArtifactEvidenceRequirementId =
  | 'assumption_owner_confidence_sensitivity'
  | 'baseline_source_asof_confidence'
  | 'critic_findings'
  | 'delivery_rate_card_source'
  | 'downside_case'
  | 'forecast_haircut_basis'
  | 'go_decision_conditions'
  | 'kill_criteria'
  | 'payback_honesty'
  | 'rate_card_override_basis'
  | 'review_signoff_state'
  | 'seed_gap_disclosure'
  | 'tower_metric_baseline_link'
  | 'version_and_generated_on';

export type ArtifactHardFailRuleId =
  | 'fabricated_metric'
  | 'go_ignores_kill_triggers'
  | 'missing_architecture_diagram'
  | 'missing_assumption_owners'
  | 'missing_baseline_source_confidence'
  | 'missing_do_not_fund_yet'
  | 'missing_downside_case'
  | 'missing_formatting_readability'
  | 'missing_go_decision'
  | 'missing_recommendation'
  | 'missing_rate_card_basis'
  | 'missing_seed_gap_disclosure'
  | 'missing_sensitivity'
  | 'missing_tower_handoff'
  | 'missing_visuals'
  | 'payback_claimed_when_monetization_blocked'
  | 'uncited_financial_number';

export interface ArtifactStandard {
  artifactId: ArtifactStandardId;
  label: string;
  phase: MovesPhase | 'solution_architecture';
  audiences: readonly ArtifactAudience[];
  decisionJob: string;
  requiredSections: readonly ArtifactSectionId[];
  requiredVisuals: readonly ArtifactVisualId[];
  requiredEvidence: readonly ArtifactEvidenceRequirementId[];
  hardFailRules: readonly ArtifactHardFailRuleId[];
  minimumAcceptableScore: number;
  boardReadyScore: number;
}

export const ARTIFACT_STANDARDS: Record<KernelArtifactId, ArtifactStandard> = {
  discover_brief: {
    artifactId: 'discover_brief',
    label: 'Discover brief',
    phase: 'discover',
    audiences: ['cxo_sponsor', 'transformation_lead', 'domain_owner'],
    decisionJob: 'Decide whether the problem is real enough to shape, stop, or gather evidence.',
    requiredSections: [
      'problem_statement',
      'current_state_baseline',
      'seed_and_evidence_gaps',
      'opportunity_sizing',
      'go_no_go_read',
      'next_evidence_requests',
    ],
    requiredVisuals: [
      'baseline_coverage_meter',
      'metric_source_table',
      'opportunity_range_bar',
      'gap_closure_queue',
    ],
    requiredEvidence: [
      'baseline_source_asof_confidence',
      'seed_gap_disclosure',
      'kill_criteria',
      'version_and_generated_on',
    ],
    hardFailRules: [
      'missing_baseline_source_confidence',
      'missing_seed_gap_disclosure',
      'missing_recommendation',
      'fabricated_metric',
    ],
    minimumAcceptableScore: 8.5,
    boardReadyScore: 9,
  },
  charter_case: {
    artifactId: 'charter_case',
    label: 'Charter business-case skeleton',
    phase: 'charter',
    audiences: ['cio', 'cfo', 'cxo_sponsor'],
    decisionJob: 'Approve deeper shaping spend or stop before expensive design work begins.',
    requiredSections: [
      'decision_recommendation',
      'quantified_value_hypothesis',
      'cost_effort_first_range',
      'top_assumptions',
      'sponsor_and_owner',
      'stop_kill_criteria',
      'before_funding_conditions',
    ],
    requiredVisuals: [
      'decision_card',
      'value_vs_effort_summary',
      'assumption_sensitivity_stack',
      'kill_criteria_checklist',
    ],
    requiredEvidence: [
      'assumption_owner_confidence_sensitivity',
      'critic_findings',
      'seed_gap_disclosure',
      'version_and_generated_on',
    ],
    hardFailRules: [
      'missing_recommendation',
      'missing_assumption_owners',
      'missing_sensitivity',
      'go_ignores_kill_triggers',
      'fabricated_metric',
    ],
    minimumAcceptableScore: 8.5,
    boardReadyScore: 9,
  },
  business_case_pack: {
    artifactId: 'business_case_pack',
    label: 'Costed business-case pack',
    phase: 'design_plan',
    audiences: ['board', 'cfo', 'cxo_sponsor'],
    decisionJob: 'Decide fund, shape, or kill with investment, return, sensitivity, roadmap, controls and evidence visible.',
    requiredSections: [
      'one_page_board_summary',
      'decision_recommendation',
      'baseline_and_pain',
      'value_case',
      'investment_case',
      'payback_and_sensitivity',
      'roadmap_and_dependencies',
      'risk_control_view',
      'assumption_ledger',
      'evidence_gap_appendix',
    ],
    requiredVisuals: [
      'decision_card',
      'value_vs_investment_chart',
      'investment_vs_return_waterfall',
      'sensitivity_tornado',
      'payback_range_curve',
      'phased_roadmap',
      'risk_control_heatmap',
      'evidence_source_table',
      'architecture_context_diagram',
    ],
    requiredEvidence: [
      'baseline_source_asof_confidence',
      'assumption_owner_confidence_sensitivity',
      'critic_findings',
      'downside_case',
      'forecast_haircut_basis',
      'payback_honesty',
      'seed_gap_disclosure',
      'version_and_generated_on',
    ],
    hardFailRules: [
      'missing_recommendation',
      'missing_sensitivity',
      'missing_downside_case',
      'missing_architecture_diagram',
      'payback_claimed_when_monetization_blocked',
      'fabricated_metric',
      'uncited_financial_number',
    ],
    minimumAcceptableScore: 8.5,
    boardReadyScore: 9,
  },
  financial_model: {
    artifactId: 'financial_model',
    label: 'Financial model',
    phase: 'design_plan',
    audiences: ['cfo', 'sourcing_vp', 'delivery_lead', 'transformation_lead'],
    decisionJob: 'Decide whether the estimate is planning-grade credible and what assumptions drive the case.',
    requiredSections: [
      'estimate_summary',
      'workstream_breakdown',
      'role_mix_by_phase',
      'rate_card_basis',
      'build_run_change_split',
      'scenario_ranges',
      'sensitivity_drivers',
      'what_breaks_estimate',
    ],
    requiredVisuals: [
      'workstream_cost_stack',
      'role_mix_by_phase',
      'rate_card_source_table',
      'base_conservative_upside_chart',
      'sensitivity_tornado',
      'payback_range_curve',
    ],
    requiredEvidence: [
      'delivery_rate_card_source',
      'rate_card_override_basis',
      'assumption_owner_confidence_sensitivity',
      'downside_case',
      'version_and_generated_on',
    ],
    hardFailRules: [
      'missing_rate_card_basis',
      'missing_sensitivity',
      'missing_downside_case',
      'fabricated_metric',
      'uncited_financial_number',
    ],
    minimumAcceptableScore: 8.5,
    boardReadyScore: 9,
  },
  cfo_pack: {
    artifactId: 'cfo_pack',
    label: 'CFO business-case pack',
    phase: 'design_plan',
    audiences: ['cfo', 'board'],
    decisionJob: 'Approve capital, approve shaping spend, or reject after seeing the answer, economics and challenge logic.',
    requiredSections: [
      'the_answer',
      'the_case',
      'five_assumptions',
      'what_makes_wrong',
      'what_not_to_fund_yet',
      'tower_measurement',
      'evidence_used_and_missing',
    ],
    requiredVisuals: [
      'executive_economics_card',
      'investment_vs_return_waterfall',
      'base_conservative_upside_chart',
      'sensitivity_tornado',
      'payback_range_curve',
      'evidence_gap_matrix',
    ],
    requiredEvidence: [
      'assumption_owner_confidence_sensitivity',
      'critic_findings',
      'downside_case',
      'seed_gap_disclosure',
      'tower_metric_baseline_link',
      'version_and_generated_on',
    ],
    hardFailRules: [
      'missing_recommendation',
      'missing_do_not_fund_yet',
      'missing_sensitivity',
      'missing_downside_case',
      'missing_tower_handoff',
      'fabricated_metric',
      'uncited_financial_number',
    ],
    minimumAcceptableScore: 8.5,
    boardReadyScore: 9,
  },
  mobilize_pack: {
    artifactId: 'mobilize_pack',
    label: 'Mobilize and go-decision packet',
    phase: 'mobilize',
    audiences: ['cxo_sponsor', 'delivery_lead', 'pmo', 'tower_owner'],
    decisionJob: 'Decide whether to proceed to execution, reshape, or no-go and hand Tower the measurement model.',
    requiredSections: [
      'go_no_go_recommendation',
      'conditions_to_proceed',
      'thirty_sixty_ninety_plan',
      'workstream_owners',
      'adoption_change_approach',
      'hypercare_readiness',
      'tower_measurement_handoff',
      'open_risks_decision_log',
    ],
    requiredVisuals: [
      'thirty_sixty_ninety_swimlane',
      'raci_matrix',
      'adoption_readiness_table',
      'tower_measurement_table',
      'open_action_queue',
    ],
    requiredEvidence: [
      'go_decision_conditions',
      'kill_criteria',
      'review_signoff_state',
      'tower_metric_baseline_link',
      'version_and_generated_on',
    ],
    hardFailRules: [
      'missing_go_decision',
      'go_ignores_kill_triggers',
      'missing_tower_handoff',
      'missing_seed_gap_disclosure',
      'fabricated_metric',
    ],
    minimumAcceptableScore: 8.5,
    boardReadyScore: 9,
  },
};

export const SOLUTION_ARCHITECTURE_STANDARD: ArtifactStandard = {
  artifactId: 'solution_architecture_pack',
  label: 'Solution architecture pack',
  phase: 'solution_architecture',
  audiences: [
    'cio',
    'enterprise_architect',
    'delivery_lead',
    'risk_compliance',
  ],
  decisionJob: 'Select the architecture option and delivery boundary with data, integration, security and control implications visible.',
  requiredSections: [
    'architecture_decision_summary',
    'architecture_option_set',
    'selected_architecture_option',
    'logical_architecture',
    'data_integration_flow',
    'security_privacy_control_view',
    'human_agent_accountability',
    'architecture_risks',
  ],
  requiredVisuals: [
    'architecture_context_diagram',
    'logical_architecture_diagram',
    'data_flow_diagram',
    'integration_map',
    'control_overlay',
    'build_buy_boundary_view',
  ],
  requiredEvidence: [
    'critic_findings',
    'seed_gap_disclosure',
    'version_and_generated_on',
  ],
  hardFailRules: [
    'missing_architecture_diagram',
    'missing_visuals',
    'fabricated_metric',
  ],
  minimumAcceptableScore: 8.5,
  boardReadyScore: 9,
};

export function getArtifactStandard(
  artifactId: KernelArtifactId,
): ArtifactStandard {
  return ARTIFACT_STANDARDS[artifactId];
}

export function listArtifactStandards(): readonly ArtifactStandard[] {
  return KERNEL_ARTIFACTS.map((artifact) => getArtifactStandard(artifact.id));
}

export function assertArtifactStandardsComplete(): void {
  const artifactIds = KERNEL_ARTIFACTS.map((artifact) => artifact.id).sort();
  const standardIds = Object.keys(ARTIFACT_STANDARDS).sort();
  if (artifactIds.join('|') !== standardIds.join('|')) {
    throw new Error(
      `Artifact standards mismatch: artifacts=${artifactIds.join(',')} standards=${standardIds.join(',')}`,
    );
  }
}
