export type EstimatePercentile = 'P50' | 'P80' | 'P95';
export type FlexMode = 'si_heavy' | 'capability_rising' | 'political_heavy';
export type EffortUnit =
  | 'calendar_weeks'
  | 'cxo_decision_hours'
  | 'analyst_days'
  | 'maestro_agent_turns'
  | 'specialist_agent_turns'
  | 'si_weeks'
  | 'compute_usd'
  | 'mixed';

export interface PercentileBand {
  p50: number;
  p80: number;
  p95: number;
}

export interface EstimateOwnerMix {
  agent_share_pct: number;
  human_share_pct: number;
  si_share_pct: number;
}

export interface EstimateGateDecision {
  gate_name: string;
  gate_date_target: string;
  gate_description: string;
  decision_authority: string;
  cxo_decision_hours_budgeted: number;
  dependencies: string[];
}

export interface EstimateEffortLine {
  label: string;
  unit: EffortUnit;
  band: PercentileBand;
  distribution?: Array<{ owner: string; value: number; unit_label?: string }>;
}

export interface EstimatePhaseBreakdown {
  phase: number;
  phase_name: string;
  calendar_weeks: PercentileBand;
  owner_mix: EstimateOwnerMix;
  named_gate_decisions: EstimateGateDecision[];
  effort_composition: EstimateEffortLine[];
}

export interface EstimateWorkUnit {
  id: string;
  name: string;
  parent_workstream: string;
  parent_intervention: string;
  type: 'analysis' | 'decision' | 'build' | 'rollout' | 'measurement';
  owner: string;
  wall_clock_estimate_days: PercentileBand;
  effort_estimate: {
    value: number;
    unit: EffortUnit;
    p50: number;
    p80: number;
    p95: number;
  };
  confidence_band: {
    percentile_50: string;
    percentile_80: string;
    percentile_95: string;
    basis: string;
  };
  dependencies: string[];
  political_risk_flag: boolean;
  ai_capability_trajectory_flag: boolean;
  si_assigned: string | null;
}

export interface EstimateFlexModeApplied {
  flex_mode: FlexMode;
  rationale: string;
  adjustments_made: string[];
  named_stakeholders_or_events: string[];
}

export interface PoliticalDecisionMoment {
  decision_moment_name: string;
  calendar_target: string;
  decision_authority: string[];
  cxo_hours_budgeted: number;
  stall_risk_description: string;
  stall_impact_if_materializes: string;
  escalation_path: string;
}

export interface StallScenarioEstimate {
  scenario_name: string;
  probability_p50: number;
  if_materializes_calendar_impact: string;
  if_materializes_cost_impact: string;
  mitigation: string;
  owner: string;
}

export interface SponsorApproval {
  approved: boolean;
  approval_date: string;
  approval_percentile_commitment: EstimatePercentile;
  approval_signature_method: string;
  dissent_captured: boolean;
}

export interface TimelineResourceEstimateSummary {
  program_id: string;
  recommended_intervention_ids: string[];
  total_calendar_weeks_p50: number;
  total_calendar_weeks_p80: number;
  total_calendar_weeks_p95: number;
  commitment_percentile: EstimatePercentile;
  effort_composition_rollup: EstimateEffortLine[];
}

export interface GenomeCalibrationSummary {
  signature: string;
  matched_patterns: string[];
  default_confidence: 'high' | 'medium' | 'low';
  calibrations_applied: string[];
  capability_trajectory_discount_applied: boolean;
}

export interface TimelineResourceEstimate {
  summary: TimelineResourceEstimateSummary;
  genome_calibration: GenomeCalibrationSummary;
  phase_breakdown: EstimatePhaseBreakdown[];
  work_units: EstimateWorkUnit[];
  flex_modes_applied: EstimateFlexModeApplied[];
  political_decision_moments: PoliticalDecisionMoment[];
  stall_scenarios: StallScenarioEstimate[];
  sponsor_approval: SponsorApproval;
}
