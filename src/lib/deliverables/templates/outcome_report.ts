export interface OutcomeReportTemplateSection {
  key: string;
  title: string;
  required: boolean;
  description: string;
  example_completed: string;
}

export interface OutcomeReportRubricCriterion {
  criterion: string;
  rationale: string;
  severity: 'blocker' | 'major' | 'minor';
}

export const outcomeReportTemplateStructure = {
  sections: [
    {
      key: 'executive_outcome_summary',
      title: 'Executive Outcome Summary',
      required: true,
      description: 'Summarize the outcome in plain sponsor language, including whether the program succeeded.',
      example_completed:
        'The pilot met its core outcome target: associates recovered task time, conversion improved, and field leadership approved scaling to the next wave of stores.',
    },
    {
      key: 'objectives_vs_results',
      title: 'Objectives vs Results',
      required: true,
      description: 'Compare the promised objectives against what actually happened.',
      example_completed:
        'Objective: 20% task-time reduction. Result: 23% reduction in pilot stores, with the largest gains in replenishment and exception handling.',
    },
    {
      key: 'baseline_vs_actual_metrics',
      title: 'Baseline vs Actual Metrics',
      required: true,
      description: 'Show the metrics that changed, with baseline, actual, and variance.',
      example_completed:
        'Baseline vs actual: task-search time 23m → 17.7m, on-time replenishment 61% → 74%, same-store sales conversion +1.6 points in pilot cohort.',
    },
    {
      key: 'value_realized',
      title: 'Value Realized',
      required: true,
      description: 'State the financial or strategic value achieved, plus the confidence level behind it.',
      example_completed:
        'Realized value: $4.2M annualized labor and sales impact, medium confidence pending a full seasonal cycle.',
    },
    {
      key: 'what_worked',
      title: 'What Worked',
      required: true,
      description: 'Capture the implementation choices that clearly drove success.',
      example_completed:
        'What worked: bounded pilot scope, strong store-manager championing, exception telemetry from day one, and weekly sponsor review discipline.',
    },
    {
      key: 'gaps_and_variance',
      title: 'Gaps + Variance',
      required: true,
      description: 'Be explicit about what underperformed or remains unresolved.',
      example_completed:
        'Gap: exception handling improved less than expected in smaller-format stores because device readiness lagged the pilot baseline.',
    },
    {
      key: 'sustainability_and_next_actions',
      title: 'Sustainability + Next Actions',
      required: true,
      description: 'Explain what must happen next to sustain gains and scale safely.',
      example_completed:
        'Next actions: lock telemetry ownership, codify manager enablement, and stage a second-wave rollout to 180 stores only after device-readiness issues close.',
    },
    {
      key: 'verification_and_signoff',
      title: 'Verification + Sign-Off',
      required: true,
      description: 'Describe how the result was verified and what sponsor or finance sign-off is still required.',
      example_completed:
        'Verification used four weeks of pilot telemetry and finance-reviewed labor assumptions; final scale decision requires CFO and Store Ops sponsor sign-off.',
    },
  ],
  format: 'markdown',
  rendering_notes:
    'Favor evidence and outcome clarity over celebration. The report should stand up to sponsor, finance, and operations review.',
} satisfies {
  sections: OutcomeReportTemplateSection[];
  format: 'markdown';
  rendering_notes: string;
};

export const outcomeReportQualityRubric: OutcomeReportRubricCriterion[] = [
  {
    criterion: 'results_are_measured_against_baseline',
    rationale: 'An outcome report is not credible without direct baseline-to-actual comparison on the metrics the program promised to move.',
    severity: 'blocker',
  },
  {
    criterion: 'value_claims_are_traceable',
    rationale: 'Every financial or quantified value claim must be clearly traceable to source evidence or an explicit assumption set.',
    severity: 'blocker',
  },
  {
    criterion: 'variance_is_reported_honestly',
    rationale: 'The report should name where outcomes missed, lagged, or remain uncertain instead of presenting only a success narrative.',
    severity: 'blocker',
  },
  {
    criterion: 'next_actions_protect_the_gain',
    rationale: 'A strong outcome report does more than celebrate results; it makes the sustainability and scale decision clear.',
    severity: 'major',
  },
  {
    criterion: 'verification_path_is_clear',
    rationale: 'The reader should understand how the outcome was verified and what sign-off remains before the result is treated as final.',
    severity: 'major',
  },
  {
    criterion: 'tone_is_confident_and_adult',
    rationale: 'The writing should feel rigorous, balanced, and executive-ready rather than promotional.',
    severity: 'minor',
  },
];

export const outcomeReportGenerationPromptTemplate = `You are drafting an Outcome Report in Markdown.

ENGAGEMENT
\${engagement.id}

CLIENT
\${client.name}

STRUCTURE
\${structure_as_outline}

DELIVERY HISTORY
\${current_state_baseline_from_phase_1}

QUALITY RUBRIC
\${quality_rubric.criteria}

RULES
- Use the section order and section names from STRUCTURE exactly.
- Every metric, financial claim, verification statement, and next-action recommendation must cite one or more bracketed turn references like [turn 08].
- Compare promised objectives against actual results explicitly; do not imply success without saying what changed.
- Name any variance, underperformance, or remaining uncertainty directly.
- If baseline, actual, or sign-off evidence is missing, write [DATA GAP: what is missing] instead of inventing it.
- Keep the tone executive-ready, rigorous, and balanced.

Write the full outcome report now.`;

export const outcomeReportDeliverableType = {
  type_key: 'outcome_report',
  title: 'Outcome Report',
  description: 'Phase 4 outcome report comparing baseline to results, quantified value, variance, and the actions required to sustain gains',
  applicable_phases: [4, 5],
  applicable_topics: [
    'analytics_modernization',
    'ai_governance_implementation',
    'prior_auth_automation',
    'vendor_consolidation_ai',
  ],
  template_structure: outcomeReportTemplateStructure,
  required_data_inputs: {
    engagement: [
      'baseline_metrics',
      'actual_metrics',
      'phase_4.outcomes',
      'sponsor.name',
    ],
    client: ['name', 'industry'],
    topic: ['topic_key', 'success_signals'],
  },
  quality_rubric: outcomeReportQualityRubric,
  generation_prompt_template: outcomeReportGenerationPromptTemplate,
  output_format: 'markdown',
  maturity: 'production',
} as const;
