export interface TimelineResourceEstimateTemplateSection {
  key: string;
  title: string;
  required: boolean;
  description: string;
  example_completed: string;
}

export interface TimelineResourceEstimateRubricCriterion {
  criterion: string;
  rationale: string;
  severity: 'blocker' | 'major' | 'minor';
}

export const timelineResourceEstimateTemplateStructure = {
  sections: [
    {
      key: 'commitment_summary',
      title: 'Commitment Summary',
      required: true,
      description: 'State the locked percentile commitment, approval date, and the headline timeline the sponsor is actually signing.',
      example_completed:
        'Commitment locked at P80 on 2026-07-28 with a 31-week envelope, explicit decision-hour budgeting, and named reestimation triggers.',
    },
    {
      key: 'calendar_timeline',
      title: 'Calendar Timeline',
      required: true,
      description: 'Lay out the phase-by-phase wall-clock timeline with P50, P80, and P95 bands.',
      example_completed:
        'Phase 2 design: 6 / 8 / 10 weeks, Phase 3 execute: 10 / 14 / 18 weeks, Phase 4 verify: 4 / 5 / 7 weeks with gate callouts called out separately.',
    },
    {
      key: 'effort_composition_rollup',
      title: 'Effort Composition Rollup',
      required: true,
      description: 'Roll up the six owner classes without collapsing them into a fake single unit.',
      example_completed:
        '47 CFO decision-hours, 680 analyst-days, 12,400 maestro turns, 2,900 specialist turns, 84 SI-weeks, and $340K compute budget.',
    },
    {
      key: 'phase_breakdown',
      title: 'Phase Breakdown',
      required: true,
      description: 'Describe the work, owner mix, and gate decisions for each phase.',
      example_completed:
        'Phase 3 assumes a software-native execute profile with 70% agent share, 30% human share, and two named gate decisions around pilot lock and scale release.',
    },
    {
      key: 'political_decision_moments',
      title: 'Political Decision Moments',
      required: true,
      description: 'Surface the sponsor and CXO decision moments that could stall the program.',
      example_completed:
        'Pilot greenlight needs CFO plus CCO approval, budgets 3.5 CXO hours, and carries a two-week stall risk if dissent is not resolved before steering review.',
    },
    {
      key: 'stall_scenarios',
      title: 'Stall Scenarios',
      required: true,
      description: 'Name the scenarios that could materially shift the plan, plus their probability and impact.',
      example_completed:
        'Political disagreement on merchandising accountability has a 35% P50 probability and adds 4-6 weeks if unresolved at Phase 3 start.',
    },
    {
      key: 'flex_modes_applied',
      title: 'Flex Modes Applied',
      required: true,
      description: 'Explain which flex modes were applied and what changed because of them.',
      example_completed:
        'Political-heavy and capability-rising flexes both applied; downside band widened for sponsor latency while agent-turn demand was discounted on year-two work units.',
    },
    {
      key: 'genome_calibration',
      title: 'Genome Calibration',
      required: true,
      description: 'Show the analogous-program signature, confidence basis, and any capability-trajectory discounts.',
      example_completed:
        'Genome signature F018 + F015, n=14 analogs, medium confidence, capability-trajectory discount applied to later-phase specialist-agent work.',
    },
  ],
  format: 'markdown',
  rendering_notes:
    'This is a board-ready approval artifact. Preserve the section order and make the percentile commitment, dual-ledger model, and named stall risk visible immediately.',
} satisfies {
  sections: TimelineResourceEstimateTemplateSection[];
  format: 'markdown';
  rendering_notes: string;
};

export const timelineResourceEstimateQualityRubric: TimelineResourceEstimateRubricCriterion[] = [
  {
    criterion: 'commitment_percentile_is_explicit',
    rationale:
      'The sponsor must be able to see exactly which percentile is being approved; without that, the estimate is commercially ambiguous.',
    severity: 'blocker',
  },
  {
    criterion: 'dual_ledger_is_preserved',
    rationale:
      'Calendar time and effort composition must both remain visible; collapsing effort into a single synthetic number defeats the point of the model.',
    severity: 'blocker',
  },
  {
    criterion: 'decision_latency_is_modeled',
    rationale:
      'Executive decision time is a real constraint and needs to appear as budgeted moments with stall implications, not as hidden contingency.',
    severity: 'blocker',
  },
  {
    criterion: 'bands_and_assumptions_are_traceable',
    rationale:
      'Percentile bands, flex-mode adjustments, and cost lines must be traceable to analogous-program evidence or explicit assumption statements.',
    severity: 'major',
  },
  {
    criterion: 'stall_scenarios_are_realistic',
    rationale:
      'The estimate should name the few scenarios most likely to move the plan rather than padding it with generic project-management caveats.',
    severity: 'major',
  },
  {
    criterion: 'tone_reads_like_an_approval_artifact',
    rationale:
      'This document carries contractual and sponsor-signoff weight, so the writing must feel rigorous, adult, and board-safe.',
    severity: 'minor',
  },
];

export const timelineResourceEstimateGenerationPromptTemplate = `You are drafting a Timeline + Resource Estimate in Markdown.

ENGAGEMENT
\${engagement.id}

CLIENT
\${client.name}

STRUCTURE
\${structure_as_outline}

CURRENT STATE
\${current_state_baseline_from_phase_1}

DELIVERABLES ALREADY LOCKED
\${deliverable_summaries}

TOPIC PLAYBOOK
\${topic.phase_playbook}

PEER DECISIONS
\${peer_cohort_summary}

QUALITY RUBRIC
\${quality_rubric.criteria}

RULES
- Use the section order and section names from STRUCTURE exactly.
- State the sponsor commitment percentile explicitly and keep P50 / P80 / P95 visible wherever timeline or effort is summarized.
- Keep calendar timeline and effort composition separate; do not flatten the dual-ledger model into one synthetic estimate.
- Name political decision moments, stall scenarios, and flex-mode adjustments directly.
- Every quantitative claim, confidence statement, or assumption must cite one or more bracketed turn references like [turn 09] or be marked [DATA GAP: what is missing].
- Keep the tone sponsor-ready, rigorous, and commercially credible.

Write the full Timeline + Resource Estimate now.`;

export const timelineResourceEstimateDeliverableType = {
  type_key: 'timeline_resource_estimate',
  title: 'Timeline + Resource Estimate',
  description:
    'Phase 2 approval artifact capturing the locked percentile commitment, dual-ledger effort model, flex modes, and Genome-calibrated confidence bands',
  applicable_phases: [2, 3],
  applicable_topics: [
    'analytics_modernization',
    'ai_governance_implementation',
    'prior_auth_automation',
    'vendor_consolidation_ai',
  ],
  template_structure: timelineResourceEstimateTemplateStructure,
  required_data_inputs: {
    engagement: [
      'phase_1.findings',
      'phase_2.design_decisions',
      'phase_2.intervention_charter',
      'sponsor.name',
      'sponsor.decision_authority',
    ],
    client: ['name', 'industry'],
    topic: ['topic_key', 'phase_playbook', 'failure_modes'],
    peer_decisions: ['phase_cohort'],
  },
  quality_rubric: timelineResourceEstimateQualityRubric,
  generation_prompt_template: timelineResourceEstimateGenerationPromptTemplate,
  output_format: 'markdown',
  maturity: 'production',
} as const;
