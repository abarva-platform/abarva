import type {
  EstimatePercentile,
  EffortUnit,
  PercentileBand,
} from '@/types/estimation';

export interface TrackerEstimateVsActualLine {
  label: string;
  unit: EffortUnit;
  estimated_to_date: number;
  actual_to_date: number;
  delta_pct: number;
  drift_direction: 'under' | 'slightly_over' | 'over' | 'on_track';
  note: string;
}

export interface TrackerWorkUnit {
  work_unit_id: string;
  estimated: {
    wall_clock: string;
    effort_value: string;
    effort_unit: EffortUnit;
    p50: number;
    p80: number;
    p95: number;
  };
  actual: {
    wall_clock_actual: string | null;
    effort_value_actual: string | null;
    effort_value_actual_to_date?: string | null;
  };
  delta?: {
    wall_clock_delta_pct: number;
    effort_delta_pct: number;
    percentile_at_which_landed: string;
  };
  status: 'complete' | 'in_progress' | 'pending';
  completion_date: string | null;
  learning_note: string | null;
}

export interface TrackerGateDecision {
  gate_name: string;
  gate_date_target: string;
  gate_date_actual: string | null;
  delta_days?: number;
  cxo_hours_budgeted: number;
  cxo_hours_actual?: number;
  dissent_captured_at_gate?: boolean;
  decision_outcome?: string;
  status?: 'pending' | 'complete';
}

export interface PoliticalDecisionMomentTracking {
  decision_moment_name: string;
  calendar_target: string;
  calendar_actual: string | null;
  stall_materialized: boolean;
  escalation_invoked: boolean;
  resolution_summary: string;
  cxo_hours_spent: string;
}

export interface StallScenarioTracking {
  scenario_id: string;
  p50_probability_at_estimate: number;
  materialized: boolean;
  current_probability: number;
}

export interface ReestimationEvent {
  event_date: string;
  triggering_event: string;
  reestimation_summary: string;
  new_p50: string;
  new_p80: string;
  new_p95: string;
  variance_from_original_lock_pct: string;
  sponsor_re_approval_required: boolean;
  sponsor_re_approval_status: string;
}

export interface GenomeFeedbackCandidate {
  observation: string;
  type: 'timing_refinement' | 'effort_refinement' | 'new_stall_pattern' | 'flex_mode_learning';
  anonymizable: boolean;
  genome_pattern_relevance: string[];
}

export interface ExecutionRoadmapTrackerSummary {
  program_id: string;
  timeline_resource_estimate_id: string;
  current_phase: string;
  calendar_estimate_vs_actual: {
    weeks_elapsed: number;
    weeks_remaining_p50_current: number;
    weeks_remaining_p80_current: number;
    delta_vs_phase_2_estimate_pct: number;
    drift_direction: 'under' | 'slightly_over' | 'over' | 'on_track';
  };
  effort_estimate_vs_actual: TrackerEstimateVsActualLine[];
  total_cost_delta_pct: number;
  stall_scenarios_materialized: string[];
  unexpected_stall_scenarios: Array<{
    scenario_name: string;
    detected_date: string;
    current_status: string;
  }>;
  narrative_summary: string;
}

export interface ExecutionRoadmapTracker {
  tracker_summary: ExecutionRoadmapTrackerSummary;
  work_unit_tracking: TrackerWorkUnit[];
  gate_decision_tracking: TrackerGateDecision[];
  political_decision_moment_tracking: PoliticalDecisionMomentTracking[];
  stall_scenario_tracking: StallScenarioTracking[];
  reestimation_events: ReestimationEvent[];
  genome_feedback_candidates: GenomeFeedbackCandidate[];
}

export interface EstimateBandSnapshot {
  label: string;
  commitment_percentile: EstimatePercentile;
  band: PercentileBand;
}
