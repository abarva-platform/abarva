import type {
  EffortUnit,
  TimelineResourceEstimate,
} from '@/types/estimation';
import type { ExecutionRoadmapTracker } from '@/types/tracker';

export interface EstimationProgramSeed {
  programId: string;
  programName: string;
  clientName: string;
  estimateId: string;
  signature: string;
  matchedPatterns: string[];
}

export const MORRISON_SEED: EstimationProgramSeed = {
  programId: 'owned-brand-margin-acceleration',
  programName: 'Owned Brand Margin Acceleration',
  clientName: 'Apex Retail Group',
  estimateId: 'tre_morrison_locked_2026-07-28',
  signature: 'retail_margin_program_long_horizon',
  matchedPatterns: ['F022_timing_refinement', 'F015_vendor_transition', 'F018_outcome_baseline'],
};

function effortLine(
  label: string,
  unit: EffortUnit,
  p50: number,
  p80: number,
  p95: number,
  distribution?: Array<{ owner: string; value: number; unit_label?: string }>,
) {
  return {
    label,
    unit,
    band: { p50, p80, p95 },
    distribution,
  };
}

export const MORRISON_TIMELINE_TEMPLATE: TimelineResourceEstimate = {
  summary: {
    program_id: MORRISON_SEED.programId,
    recommended_intervention_ids: ['int_001', 'int_002'],
    total_calendar_weeks_p50: 42,
    total_calendar_weeks_p80: 48,
    total_calendar_weeks_p95: 58,
    commitment_percentile: 'P80',
    effort_composition_rollup: [
      effortLine('CXO decision hours', 'cxo_decision_hours', 64, 78, 104, [
        { owner: 'Dana Mercer', value: 34, unit_label: 'hours P80' },
        { owner: 'Elena Cruz', value: 24, unit_label: 'hours P80' },
        { owner: 'Arjun Patel', value: 12, unit_label: 'hours P80' },
        { owner: 'Board finance committee', value: 8, unit_label: 'hours P80' },
      ]),
      effortLine('Analyst days', 'analyst_days', 340, 420, 560, [
        { owner: 'Tori Nguyen', value: 94, unit_label: 'days P80' },
        { owner: 'Sofia Ramirez', value: 88, unit_label: 'days P80' },
        { owner: 'Alex Kim', value: 64, unit_label: 'days P80' },
        { owner: 'Merch + planning team', value: 174, unit_label: 'days P80' },
      ]),
      effortLine('Maestro agent turns', 'maestro_agent_turns', 8400, 10200, 14500, [
        { owner: 'Nexus', value: 4800, unit_label: 'turns P80' },
        { owner: 'Sentinel', value: 2800, unit_label: 'turns P80' },
        { owner: 'Atlas', value: 1600, unit_label: 'turns P80' },
        { owner: 'Steward', value: 1000, unit_label: 'turns P80' },
      ]),
      effortLine('Specialist agent turns', 'specialist_agent_turns', 2200, 2800, 4100),
      effortLine('SI weeks', 'si_weeks', 0, 0, 0),
      effortLine('Compute USD', 'compute_usd', 182000, 224000, 308000),
    ],
  },
  genome_calibration: {
    signature: MORRISON_SEED.signature,
    matched_patterns: MORRISON_SEED.matchedPatterns,
    default_confidence: 'medium',
    calibrations_applied: [
      'Political-heavy flex lifted CXO-hour budget by 14% at P80.',
      'Capability-rising flex discounted Phase 3 agent-turn demand by 9%.',
      'Outcome-baseline timing adjusted to reflect auditor involvement in similar retail programs.',
    ],
    capability_trajectory_discount_applied: true,
  },
  phase_breakdown: [
    {
      phase: 0,
      phase_name: 'Origination + Charter',
      calendar_weeks: { p50: 4, p80: 5, p95: 6 },
      owner_mix: { agent_share_pct: 38, human_share_pct: 62, si_share_pct: 0 },
      named_gate_decisions: [
        {
          gate_name: 'Charter approval',
          gate_date_target: '2026-04-12',
          gate_description: 'Sponsor alignment on target margin corridors and intervention scope.',
          decision_authority: 'Dana Mercer',
          cxo_decision_hours_budgeted: 4,
          dependencies: ['WU_0104', 'WU_0110'],
        },
      ],
      effort_composition: [
        effortLine('Analyst days', 'analyst_days', 36, 44, 58),
        effortLine('CXO decision hours', 'cxo_decision_hours', 8, 10, 14),
      ],
    },
    {
      phase: 1,
      phase_name: 'Diagnose',
      calendar_weeks: { p50: 8, p80: 10, p95: 12 },
      owner_mix: { agent_share_pct: 52, human_share_pct: 48, si_share_pct: 0 },
      named_gate_decisions: [
        {
          gate_name: 'Findings v4 adoption',
          gate_date_target: '2026-06-14',
          gate_description: 'Executive agreement on contradiction set and owned-brand intervention logic.',
          decision_authority: 'Elena Cruz',
          cxo_decision_hours_budgeted: 6,
          dependencies: ['WU_0204', 'WU_0232'],
        },
      ],
      effort_composition: [
        effortLine('Analyst days', 'analyst_days', 88, 110, 146),
        effortLine('Maestro agent turns', 'maestro_agent_turns', 2200, 2800, 3900),
      ],
    },
    {
      phase: 2,
      phase_name: 'Design + Estimate lock',
      calendar_weeks: { p50: 7, p80: 8, p95: 10 },
      owner_mix: { agent_share_pct: 58, human_share_pct: 42, si_share_pct: 0 },
      named_gate_decisions: [
        {
          gate_name: 'Phase 2 recommendation approval',
          gate_date_target: '2026-07-28',
          gate_description: 'Lock preferred option, roadmap, and percentile commitment.',
          decision_authority: 'Dana Mercer + finance committee',
          cxo_decision_hours_budgeted: 12,
          dependencies: ['WU_0301', 'WU_0318'],
        },
      ],
      effort_composition: [
        effortLine('Analyst days', 'analyst_days', 104, 128, 166),
        effortLine('Maestro agent turns', 'maestro_agent_turns', 2800, 3200, 4600),
        effortLine('Specialist agent turns', 'specialist_agent_turns', 740, 980, 1480),
      ],
    },
    {
      phase: 3,
      phase_name: 'Execute',
      calendar_weeks: { p50: 16, p80: 19, p95: 24 },
      owner_mix: { agent_share_pct: 72, human_share_pct: 28, si_share_pct: 0 },
      named_gate_decisions: [
        {
          gate_name: 'Outcome baseline lock',
          gate_date_target: '2026-08-05',
          gate_description: 'Lock pilot baseline, SKU cohort, and attribution rules before field rollout.',
          decision_authority: 'Arjun Patel',
          cxo_decision_hours_budgeted: 3,
          dependencies: ['WU_0384', 'WU_0392'],
        },
      ],
      effort_composition: [
        effortLine('Analyst days', 'analyst_days', 82, 98, 128),
        effortLine('Maestro agent turns', 'maestro_agent_turns', 2600, 3200, 4700),
        effortLine('Specialist agent turns', 'specialist_agent_turns', 860, 1120, 1620),
      ],
    },
    {
      phase: 4,
      phase_name: 'Verify + Genome contribution',
      calendar_weeks: { p50: 7, p80: 8, p95: 10 },
      owner_mix: { agent_share_pct: 54, human_share_pct: 46, si_share_pct: 0 },
      named_gate_decisions: [
        {
          gate_name: 'Pilot decision gate',
          gate_date_target: '2026-11-30',
          gate_description: 'Decide whether to scale, reshape, or stop based on owned-brand margin proof.',
          decision_authority: 'Dana Mercer + Elena Cruz',
          cxo_decision_hours_budgeted: 7,
          dependencies: ['WU_0488'],
        },
      ],
      effort_composition: [
        effortLine('Analyst days', 'analyst_days', 30, 40, 52),
        effortLine('CXO decision hours', 'cxo_decision_hours', 10, 14, 18),
      ],
    },
  ],
  work_units: [
    {
      id: 'WU_0204',
      name: 'Option scoring synthesis',
      parent_workstream: 'Design',
      parent_intervention: 'OPT_003',
      type: 'analysis',
      owner: 'Tori Nguyen',
      wall_clock_estimate_days: { p50: 6, p80: 8, p95: 11 },
      effort_estimate: { value: 6, unit: 'analyst_days', p50: 6, p80: 8, p95: 11 },
      confidence_band: {
        percentile_50: 'Fast if pricing, vendor, and merchandising data align first pass.',
        percentile_80: 'Expected landing if one synthesis loop is needed with sponsor review.',
        percentile_95: 'Delayed if criteria weights reopen after finance challenge.',
        basis: 'Three analogous retail margin programs with 12-month history.',
      },
      dependencies: ['WU_0188'],
      political_risk_flag: false,
      ai_capability_trajectory_flag: true,
      si_assigned: null,
    },
    {
      id: 'WU_0232',
      name: 'Outcome baseline lock',
      parent_workstream: 'Design',
      parent_intervention: 'Measurement spine',
      type: 'decision',
      owner: 'Alex Kim',
      wall_clock_estimate_days: { p50: 10, p80: 13, p95: 18 },
      effort_estimate: { value: 14, unit: 'mixed', p50: 10, p80: 13, p95: 18 },
      confidence_band: {
        percentile_50: 'Auditor and finance align within the first review cycle.',
        percentile_80: 'Most likely landing once auditor comments are incorporated.',
        percentile_95: 'Long-tail case if SKU cohort or attribution logic reopens.',
        basis: 'Outcome-baseline timing refinement from the F018+F015 cluster.',
      },
      dependencies: ['WU_0204'],
      political_risk_flag: true,
      ai_capability_trajectory_flag: false,
      si_assigned: null,
    },
    {
      id: 'WU_0384',
      name: 'Pilot week-12 metrics pack',
      parent_workstream: 'Execute',
      parent_intervention: 'Pilot instrumentation',
      type: 'measurement',
      owner: 'Sofia Ramirez',
      wall_clock_estimate_days: { p50: 5, p80: 6, p95: 9 },
      effort_estimate: { value: 8, unit: 'mixed', p50: 5, p80: 6, p95: 9 },
      confidence_band: {
        percentile_50: 'Model if the instrumentation path stays stable.',
        percentile_80: 'Expected once week-12 evidence requires one stratified analysis pass.',
        percentile_95: 'Escalates if pilot cohort bias or attribution disputes appear.',
        basis: 'Execute-stage proof packs in retail pilot programs.',
      },
      dependencies: ['WU_0232'],
      political_risk_flag: false,
      ai_capability_trajectory_flag: true,
      si_assigned: null,
    },
  ],
  flex_modes_applied: [
    {
      flex_mode: 'political_heavy',
      rationale: 'Owned-brand margin work concentrates CFO, merch, and marketing decisions into a narrow quarterly cycle.',
      adjustments_made: [
        'Raised CXO-hour budget by 14% at P80.',
        'Inserted explicit contracting-cycle decision moments instead of hiding them inside task durations.',
      ],
      named_stakeholders_or_events: ['Dana Mercer', 'Elena Cruz', 'Q3 contracting cycle'],
    },
    {
      flex_mode: 'capability_rising',
      rationale: 'Agent productivity is expected to improve mid-flight as elasticity tooling hardens in Execute.',
      adjustments_made: [
        'Discounted Phase 3 specialist-agent turns by 9% against the static baseline.',
        'Held P95 wide to acknowledge structured-scoring iteration risk.',
      ],
      named_stakeholders_or_events: ['Nexus', 'Sentinel', 'Elasticity model v3'],
    },
  ],
  political_decision_moments: [
    {
      decision_moment_name: 'Q3 2026 contracting cycle commitment',
      calendar_target: '2026-10-01',
      decision_authority: ['Dana Mercer', 'Elena Cruz'],
      cxo_hours_budgeted: 6,
      stall_risk_description: 'Vendor and category commitments slip if executive alignment misses the contracting window.',
      stall_impact_if_materializes: '+2 to +4 weeks on partner sequencing and owned-brand rollout.',
      escalation_path: 'Escalate through Alex Kim to weekly sponsor steering with finance committee visibility.',
    },
  ],
  stall_scenarios: [
    {
      scenario_name: 'Third-degree alignment loop reopens option scoring',
      probability_p50: 0.19,
      if_materializes_calendar_impact: '+1 to +2 weeks',
      if_materializes_cost_impact: '+$90K specialist + analyst effort',
      mitigation: 'Pre-wire dissent capture before the recommendation lock meeting.',
      owner: 'Alex Kim',
    },
    {
      scenario_name: 'Planning-team capacity compression during pilot setup',
      probability_p50: 0.24,
      if_materializes_calendar_impact: '+1 week',
      if_materializes_cost_impact: '+$55K analyst coverage',
      mitigation: 'Reserve parallel coverage from the merchandising analytics pod.',
      owner: 'Tori Nguyen',
    },
  ],
  sponsor_approval: {
    approved: true,
    approval_date: '2026-07-28',
    approval_percentile_commitment: 'P80',
    approval_signature_method: 'Sponsor steering attestation',
    dissent_captured: true,
  },
};

export const MORRISON_TRACKER_TEMPLATE: ExecutionRoadmapTracker = {
  tracker_summary: {
    program_id: MORRISON_SEED.programId,
    timeline_resource_estimate_id: MORRISON_SEED.estimateId,
    current_phase: '3_execute',
    calendar_estimate_vs_actual: {
      weeks_elapsed: 31,
      weeks_remaining_p50_current: 19,
      weeks_remaining_p80_current: 23,
      delta_vs_phase_2_estimate_pct: 2,
      drift_direction: 'on_track',
    },
    effort_estimate_vs_actual: [
      {
        label: 'CXO decision hours',
        unit: 'cxo_decision_hours',
        estimated_to_date: 50,
        actual_to_date: 54,
        delta_pct: 8,
        drift_direction: 'slightly_over',
        note: 'Delta driven by alignment overhead that was anticipated by the political-heavy flex.',
      },
      {
        label: 'Analyst days',
        unit: 'analyst_days',
        estimated_to_date: 246,
        actual_to_date: 234,
        delta_pct: -5,
        drift_direction: 'under',
        note: 'Planning and analytics throughput is stronger than the baseline model.',
      },
      {
        label: 'Maestro agent turns',
        unit: 'maestro_agent_turns',
        estimated_to_date: 6800,
        actual_to_date: 7120,
        delta_pct: 5,
        drift_direction: 'slightly_over',
        note: 'Monitoring and contradiction-resolution loops are slightly above plan.',
      },
      {
        label: 'Specialist agent turns',
        unit: 'specialist_agent_turns',
        estimated_to_date: 1840,
        actual_to_date: 2010,
        delta_pct: 9,
        drift_direction: 'over',
        note: 'Elasticity model v3 required more structured-scoring iteration than v2 expected.',
      },
      {
        label: 'Compute USD',
        unit: 'compute_usd',
        estimated_to_date: 148000,
        actual_to_date: 152000,
        delta_pct: 3,
        drift_direction: 'on_track',
        note: 'Compute is still within the P80 envelope.',
      },
    ],
    total_cost_delta_pct: 3,
    stall_scenarios_materialized: [],
    unexpected_stall_scenarios: [
      {
        scenario_name: 'Pilot SKU selection bias',
        detected_date: '2026-10-04',
        current_status: 'mitigation_in_progress',
      },
    ],
    narrative_summary: 'Program is tracking within the P80 commitment at week 31 of 48. Executive hours are slightly over plan, specialist-agent turns are elevated by scoring iteration, and one unexpected stall scenario is in mitigation without threatening the commitment envelope.',
  },
  work_unit_tracking: [
    {
      work_unit_id: 'WU_0204',
      estimated: {
        wall_clock: '8 days',
        effort_value: '6 analyst-days',
        effort_unit: 'analyst_days',
        p50: 6,
        p80: 8,
        p95: 11,
      },
      actual: {
        wall_clock_actual: '7 days',
        effort_value_actual: '5.5 analyst-days',
      },
      delta: {
        wall_clock_delta_pct: -12,
        effort_delta_pct: -8,
        percentile_at_which_landed: 'P50_minus',
      },
      status: 'complete',
      completion_date: '2026-07-21',
      learning_note: 'Structured scoring work landed faster than modeled; specialist-agent baseline can likely tighten for similar tasks.',
    },
    {
      work_unit_id: 'WU_0232',
      estimated: {
        wall_clock: '10 days',
        effort_value: '14 analyst-days + 4 CXO decision-hours + auditor',
        effort_unit: 'mixed',
        p50: 10,
        p80: 13,
        p95: 18,
      },
      actual: {
        wall_clock_actual: '12 days',
        effort_value_actual: '13 analyst-days + 5 CXO decision-hours + auditor',
      },
      delta: {
        wall_clock_delta_pct: 20,
        effort_delta_pct: 7,
        percentile_at_which_landed: 'P80',
      },
      status: 'complete',
      completion_date: '2026-08-07',
      learning_note: 'Auditor review added two days; the baseline default likely needs to shift upward in future programs.',
    },
    {
      work_unit_id: 'WU_0384',
      estimated: {
        wall_clock: '5 days',
        effort_value: '8 analyst-days + 180 maestro-turns',
        effort_unit: 'mixed',
        p50: 5,
        p80: 6,
        p95: 9,
      },
      actual: {
        wall_clock_actual: null,
        effort_value_actual: null,
        effort_value_actual_to_date: '4 analyst-days + 95 maestro-turns',
      },
      status: 'in_progress',
      completion_date: null,
      learning_note: null,
    },
  ],
  gate_decision_tracking: [
    {
      gate_name: 'Charter approval',
      gate_date_target: '2026-04-12',
      gate_date_actual: '2026-04-12',
      delta_days: 0,
      cxo_hours_budgeted: 4,
      cxo_hours_actual: 3,
      dissent_captured_at_gate: false,
      decision_outcome: 'approved',
      status: 'complete',
    },
    {
      gate_name: 'Findings v4 adoption',
      gate_date_target: '2026-06-14',
      gate_date_actual: '2026-06-18',
      delta_days: 4,
      cxo_hours_budgeted: 6,
      cxo_hours_actual: 7,
      dissent_captured_at_gate: true,
      decision_outcome: 'approved_with_sequencing_dissent',
      status: 'complete',
    },
    {
      gate_name: 'Phase 2 recommendation approval',
      gate_date_target: '2026-07-28',
      gate_date_actual: '2026-07-28',
      delta_days: 0,
      cxo_hours_budgeted: 12,
      cxo_hours_actual: 14,
      dissent_captured_at_gate: true,
      decision_outcome: 'approved_with_finance_dissent',
      status: 'complete',
    },
    {
      gate_name: 'Pilot decision gate',
      gate_date_target: '2026-11-30',
      gate_date_actual: null,
      cxo_hours_budgeted: 7,
      status: 'pending',
    },
  ],
  political_decision_moment_tracking: [
    {
      decision_moment_name: 'Q3 2026 contracting cycle commitment',
      calendar_target: '2026-10-01',
      calendar_actual: '2026-09-28',
      stall_materialized: false,
      escalation_invoked: false,
      resolution_summary: 'Contract renegotiation commitments started four days ahead of target and kept partner sequencing intact.',
      cxo_hours_spent: '7 (budgeted 6, +17% over)',
    },
  ],
  stall_scenario_tracking: [
    {
      scenario_id: 'stall_f022_third_degree',
      p50_probability_at_estimate: 0.19,
      materialized: false,
      current_probability: 0.14,
    },
    {
      scenario_id: 'stall_planning_capacity',
      p50_probability_at_estimate: 0.24,
      materialized: false,
      current_probability: 0.16,
    },
  ],
  reestimation_events: [
    {
      event_date: '2026-08-05',
      triggering_event: 'phase_boundary (Phase 2 → Phase 3)',
      reestimation_summary: 'Phase 3 estimate updated using actual Phase 0-2 landings and early elasticity observations.',
      new_p50: '48 weeks total',
      new_p80: '54 weeks total',
      new_p95: '64 weeks total',
      variance_from_original_lock_pct: '+12',
      sponsor_re_approval_required: false,
      sponsor_re_approval_status: 'n/a',
    },
    {
      event_date: '2026-10-04',
      triggering_event: 'stall_materialization (pilot SKU selection bias)',
      reestimation_summary: 'Added stratified analysis scope and minor compute expansion with no material calendar impact.',
      new_p50: '48 weeks total',
      new_p80: '54 weeks total',
      new_p95: '66 weeks total',
      variance_from_original_lock_pct: '+14 (within P95)',
      sponsor_re_approval_required: false,
      sponsor_re_approval_status: 'informed_no_approval_needed',
    },
  ],
  genome_feedback_candidates: [
    {
      observation: 'Structured-scoring specialist-agent work continues to land 10-15% under baseline in retail margin programs.',
      type: 'effort_refinement',
      anonymizable: true,
      genome_pattern_relevance: ['F022_timing_refinement'],
    },
    {
      observation: 'Outcome baseline wall-clock default should likely shift from 10 to 12 days P50 when auditor involvement is explicit.',
      type: 'timing_refinement',
      anonymizable: true,
      genome_pattern_relevance: ['outcome_baseline_timing'],
    },
    {
      observation: 'Pilot SKU selection bias is emerging as a novel stall pattern and needs one more observation before promotion.',
      type: 'new_stall_pattern',
      anonymizable: true,
      genome_pattern_relevance: [],
    },
  ],
};
