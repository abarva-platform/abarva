export interface ExecutionRoadmapTrackerTemplateSection {
  key: string;
  title: string;
  required: boolean;
  description: string;
  example_completed: string;
}

export interface ExecutionRoadmapTrackerRubricCriterion {
  criterion: string;
  rationale: string;
  severity: 'blocker' | 'major' | 'minor';
}

export const executionRoadmapTrackerTemplateStructure = {
  sections: [
    {
      key: 'linked_estimate_and_status',
      title: 'Linked Estimate + Status',
      required: true,
      description: 'Identify the locked estimate this tracker is governing and summarize whether the commitment is still holding.',
      example_completed:
        'Tracker is linked to tre_morrison_locked_2026-07-28 and remains inside the original P80 envelope, though specialist-agent usage is above plan.',
    },
    {
      key: 'calendar_estimate_vs_actual',
      title: 'Calendar Estimate vs Actual',
      required: true,
      description: 'Compare elapsed time, remaining time, and drift against the locked estimate.',
      example_completed:
        '31 weeks elapsed, 9 weeks remaining at current P80, +6% versus original Phase 2 estimate, drift direction slightly_over.',
    },
    {
      key: 'effort_and_cost_deltas',
      title: 'Effort + Cost Deltas',
      required: true,
      description: 'Show which ledgers are over, under, or on track and explain why.',
      example_completed:
        'Specialist-agent turns are +18%, analyst-days are on track, CXO decision-hours are slightly under, and total cost delta is +7% driven by additional scenario modeling.',
    },
    {
      key: 'work_unit_tracking',
      title: 'Work Unit Tracking',
      required: true,
      description: 'Track the high-signal work units and how they landed relative to their bands.',
      example_completed:
        'Pilot governance work unit landed at P80 after sponsor dissent surfaced; data cutover work unit remains in progress but still tracks inside band.',
    },
    {
      key: 'gate_and_decision_tracking',
      title: 'Gate + Decision Tracking',
      required: true,
      description: 'Track actual versus target gate timing and the decision attention consumed.',
      example_completed:
        'Pilot lock gate slipped 5 days, consumed 4.5 CXO hours versus 3.5 budgeted, and required an escalation to break merchandising deadlock.',
    },
    {
      key: 'stall_scenarios_and_materializations',
      title: 'Stall Scenarios + Materializations',
      required: true,
      description: 'Track whether named stall scenarios materialized and whether new ones emerged.',
      example_completed:
        'Store-ops contention materialized; vendor API delay did not. A new executive-review stall scenario emerged after finance challenged benefit attribution.',
    },
    {
      key: 'reestimation_events',
      title: 'Reestimation Events',
      required: true,
      description: 'Capture any formal reestimation, its trigger, and whether sponsor re-approval was required.',
      example_completed:
        'Week-31 refresh widened the P95 band after a new compliance dependency surfaced; sponsor re-approval was not required because the P80 commitment remained intact.',
    },
    {
      key: 'genome_feedback_candidates',
      title: 'Genome Feedback Candidates',
      required: true,
      description: 'Name the learnings this tracker should send back into Genome calibration.',
      example_completed:
        'Political-heavy retail margin programs consistently burn more specialist-agent turns during verify than the original analog set predicted.',
    },
  ],
  format: 'markdown',
  rendering_notes:
    'This is an operating dashboard artifact. Keep estimate-vs-actual drift, materialized stall risk, and reestimation logic visible immediately for sponsors and operators.',
} satisfies {
  sections: ExecutionRoadmapTrackerTemplateSection[];
  format: 'markdown';
  rendering_notes: string;
};

export const executionRoadmapTrackerQualityRubric: ExecutionRoadmapTrackerRubricCriterion[] = [
  {
    criterion: 'linked_estimate_is_explicit',
    rationale:
      'The tracker is only meaningful if it clearly points back to the locked estimate it is measuring against.',
    severity: 'blocker',
  },
  {
    criterion: 'drift_is_quantified_honestly',
    rationale:
      'Calendar, effort, and cost drift need explicit numbers and direction; hand-wavy status language hides the operating truth.',
    severity: 'blocker',
  },
  {
    criterion: 'stall_materializations_are_reported',
    rationale:
      'If named stall scenarios materialize or new ones emerge, the tracker must say so plainly or it cannot support governance.',
    severity: 'blocker',
  },
  {
    criterion: 'reestimations_have_chain_of_reasoning',
    rationale:
      'A tracker should show when the estimate changed, why, and whether sponsor re-approval was triggered.',
    severity: 'major',
  },
  {
    criterion: 'genome_feedback_is_actionable',
    rationale:
      'The tracker should produce reusable learning for future programs instead of stopping at one-program reporting.',
    severity: 'major',
  },
  {
    criterion: 'tone_is_operational_and_unsentimental',
    rationale:
      'This is a monitoring artifact, so it should read like disciplined program control rather than a celebratory update.',
    severity: 'minor',
  },
];

export const executionRoadmapTrackerGenerationPromptTemplate = `You are drafting an Execution Roadmap Tracker in Markdown.

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

QUALITY RUBRIC
\${quality_rubric.criteria}

RULES
- Use the section order and section names from STRUCTURE exactly.
- Identify the locked estimate this tracker is linked to before summarizing drift.
- Quantify calendar, effort, and cost movement; do not substitute generic traffic-light language for actual deltas.
- Name stall scenario materializations, unexpected stalls, and reestimation events directly.
- Every delta, status statement, or causal explanation must cite one or more bracketed turn references like [turn 12] or be marked [DATA GAP: what is missing].
- Keep the tone operational, exact, and useful for sponsors, operators, and auditors.

Write the full Execution Roadmap Tracker now.`;

export const executionRoadmapTrackerDeliverableType = {
  type_key: 'execution_roadmap_tracker',
  title: 'Execution Roadmap Tracker',
  description:
    'Cross-phase living tracker for estimate-vs-actual drift across calendar, effort, cost, gates, stall scenarios, and Genome feedback',
  applicable_phases: [3, 4, 5],
  applicable_topics: [
    'analytics_modernization',
    'ai_governance_implementation',
    'prior_auth_automation',
    'vendor_consolidation_ai',
  ],
  template_structure: executionRoadmapTrackerTemplateStructure,
  required_data_inputs: {
    engagement: [
      'phase_2.timeline_resource_estimate',
      'phase_3.execution_progress',
      'phase_4.verification_inputs',
      'sponsor.name',
    ],
    client: ['name', 'industry'],
    topic: ['topic_key', 'phase_playbook', 'failure_modes'],
    peer_decisions: ['phase_cohort'],
  },
  quality_rubric: executionRoadmapTrackerQualityRubric,
  generation_prompt_template: executionRoadmapTrackerGenerationPromptTemplate,
  output_format: 'markdown',
  maturity: 'production',
} as const;
