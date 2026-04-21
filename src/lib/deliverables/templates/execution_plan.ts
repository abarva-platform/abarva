export interface ExecutionPlanTemplateSection {
  key: string;
  title: string;
  required: boolean;
  description: string;
  example_completed: string;
}

export interface ExecutionPlanRubricCriterion {
  criterion: string;
  rationale: string;
  severity: 'blocker' | 'major' | 'minor';
}

export const executionPlanTemplateStructure = {
  sections: [
    {
      key: 'outcome_target_recap',
      title: 'Outcome Target Recap',
      required: true,
      description: 'Restate the business objective and the baseline this execution plan is trying to change.',
      example_completed:
        'Target: reduce associate task-search time by 20% within the pilot cohort while improving same-store sales conversion and preserving labor compliance.',
    },
    {
      key: 'thirty_day_target',
      title: '30-Day Target',
      required: true,
      description: 'Name the concrete 30-day target that proves Execute has actually started well.',
      example_completed:
        'Within 30 days, the pilot stores should have workflow routing live, manager exception review active, and telemetry arriving daily for baseline comparison.',
    },
    {
      key: 'workstreams_and_owners',
      title: 'Workstreams + Owners',
      required: true,
      description: 'List the workstreams, accountable owners, and intended output for each.',
      example_completed:
        'Workstreams: pilot configuration, store enablement, KPI instrumentation, policy approvals, and vendor delivery governance; each has a single named owner.',
    },
    {
      key: 'milestones_and_dates',
      title: 'Milestones + Dates',
      required: true,
      description: 'Show the major milestones, dates, and what success looks like at each point.',
      example_completed:
        'Milestones: design lock, pilot launch, first KPI review, wave-two scale decision, and verification checkpoint with explicit dates.',
    },
    {
      key: 'dependencies_and_critical_path',
      title: 'Dependencies + Critical Path',
      required: true,
      description: 'Make the critical path visible, including external dependencies.',
      example_completed:
        'Critical path runs through device readiness, API access, manager enablement, and vendor configuration; labor-policy sign-off is the gating external dependency.',
    },
    {
      key: 'risk_register',
      title: 'Risk Register',
      required: true,
      description: 'Capture execution risks with mitigation owners and watchpoints.',
      example_completed:
        'Top risks: field-manager resistance, incomplete telemetry, and pilot-store staffing volatility. Each has a mitigation owner and escalation trigger.',
    },
    {
      key: 'governance_cadence',
      title: 'Governance Cadence',
      required: true,
      description: 'Describe how progress, decisions, and escalations will be governed during Execute.',
      example_completed:
        'Weekly workstream stand-up, biweekly sponsor review, and same-day escalation for timeline, cost, or labor-policy drift.',
    },
    {
      key: 'readiness_to_start',
      title: 'Readiness to Start',
      required: true,
      description: 'State whether Execute is truly ready to start and what would still block go-live.',
      example_completed:
        'Execute is ready pending one remaining manager-enablement sign-off and two outstanding API credentials; all other start conditions are met.',
    },
  ],
  format: 'markdown',
  rendering_notes:
    'This is an execution document, not a strategy memo. Prioritize owners, dates, dependencies, and actionability over exposition.',
} satisfies {
  sections: ExecutionPlanTemplateSection[];
  format: 'markdown';
  rendering_notes: string;
};

export const executionPlanQualityRubric: ExecutionPlanRubricCriterion[] = [
  {
    criterion: 'owners_and_dates_are_named',
    rationale: 'An execution plan fails if milestones, workstreams, or mitigations do not have clear owners and dates.',
    severity: 'blocker',
  },
  {
    criterion: 'critical_path_is_real',
    rationale: 'The plan should surface the true pacing items, not a cosmetic checklist that ignores the actual delivery bottlenecks.',
    severity: 'blocker',
  },
  {
    criterion: 'claims_and_commitments_are_cited',
    rationale: 'Key execution assumptions, sponsor commitments, and target dates must trace back to turns or explicit plan context.',
    severity: 'blocker',
  },
  {
    criterion: 'thirty_day_target_is_concrete',
    rationale: 'The first 30 days should have a visible proving point or the plan is not operationally credible.',
    severity: 'major',
  },
  {
    criterion: 'risks_have_mitigation_owners',
    rationale: 'A risk register without mitigation owners and watchpoints does not help delivery teams govern execution.',
    severity: 'major',
  },
  {
    criterion: 'tone_is_operational_not_generic',
    rationale: 'The document should read like a working program plan rather than an abstract strategy summary.',
    severity: 'minor',
  },
];

export const executionPlanGenerationPromptTemplate = `You are drafting an Execution Plan in Markdown.

ENGAGEMENT
\${engagement.id}

CLIENT
\${client.name}

STRUCTURE
\${structure_as_outline}

CURRENT STATE
\${current_state_baseline_from_phase_1}

TOPIC PLAYBOOK
\${topic.phase_playbook}

TOPIC FAILURE MODES
\${topic.failure_modes}

QUALITY RUBRIC
\${quality_rubric.criteria}

RULES
- Use the section order and section names from STRUCTURE exactly.
- Every date, owner, commitment, and dependency claim must cite one or more bracketed turn references like [turn 06].
- Make the 30-day target concrete enough that a sponsor could inspect whether it happened.
- Name the critical path explicitly, including external dependencies where relevant.
- If an owner, date, or dependency is unknown, write [DATA GAP: what is missing] instead of inventing it.
- Keep the tone operational, direct, and useful to a delivery lead.

Write the full execution plan now.`;

export const executionPlanDeliverableType = {
  type_key: 'execution_plan',
  title: 'Execution Plan',
  description: 'Phase 3 execution plan with owners, dates, milestones, dependencies, risk controls, and explicit go-live readiness',
  applicable_phases: [3, 4],
  applicable_topics: [
    'analytics_modernization',
    'ai_governance_implementation',
    'prior_auth_automation',
    'vendor_consolidation_ai',
  ],
  template_structure: executionPlanTemplateStructure,
  required_data_inputs: {
    engagement: [
      'phase_2.design_decisions',
      'phase_3.execution_inputs',
      'sponsor.name',
    ],
    client: ['name', 'industry'],
    topic: ['topic_key', 'phase_playbook', 'failure_modes'],
  },
  quality_rubric: executionPlanQualityRubric,
  generation_prompt_template: executionPlanGenerationPromptTemplate,
  output_format: 'markdown',
  maturity: 'production',
} as const;
