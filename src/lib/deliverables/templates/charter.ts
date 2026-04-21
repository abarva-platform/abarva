export interface CharterTemplateSection {
  key: string;
  title: string;
  required: boolean;
  description: string;
  example_completed: string;
}

export interface CharterRubricCriterion {
  criterion: string;
  rationale: string;
  severity: 'blocker' | 'major' | 'minor';
}

export const charterTemplateStructure = {
  sections: [
    {
      key: 'program_name',
      title: 'Program Name',
      required: true,
      description: 'State the formal name of the program or initiative.',
      example_completed: 'Apex Retail Contact Center AI Program',
    },
    {
      key: 'sponsor_and_co_sponsor',
      title: 'Sponsor + Co-Sponsor',
      required: true,
      description: 'Name the executive sponsor and the co-sponsor who will provide air cover and approval support.',
      example_completed: 'Sponsor: Priya Patel, VP Store Operations. Co-sponsor: Jake Chen, Chief Digital Officer.',
    },
    {
      key: 'business_context',
      title: 'Business Context',
      required: true,
      description: 'Explain why the program matters now, what changed, and what pressure it responds to.',
      example_completed:
        'Returns costs have climbed to $41M annually, contact center wait times are rising, and leadership wants a single program that reduces avoidable volume before peak season.',
    },
    {
      key: 'objectives_and_success_criteria',
      title: 'Objectives + Success Criteria',
      required: true,
      description: 'Define the intended outcomes and the measurable proof that the program succeeded.',
      example_completed:
        'Reduce avoidable contacts by 25%, cut average handle time by 15%, and show sponsor sign-off that service quality did not regress.',
    },
    {
      key: 'scope_and_out_of_scope',
      title: 'Scope + Out-of-Scope',
      required: true,
      description: 'List what is explicitly in scope and what the team will not attempt in this program.',
      example_completed:
        'In scope: tier-1 chat, voice triage, and reporting. Out of scope: full CRM replacement, enterprise data platform redesign, and back-office process re-engineering.',
    },
    {
      key: 'phase_milestones',
      title: 'Phase Milestones',
      required: true,
      description: 'Set target dates for Diagnose, Design, Execute, and Verify so the charter can be operationalized.',
      example_completed: 'Diagnose by 2026-05-08; Design by 2026-05-22; Execute by 2026-07-17; Verify by 2026-08-14.',
    },
    {
      key: 'governance_cadence',
      title: 'Governance Cadence',
      required: true,
      description: 'Describe how decisions, reviews, and escalations will be handled through the program.',
      example_completed:
        'Weekly working review, biweekly sponsor check-in, monthly steering review, and same-day escalation for scope, budget, or risk changes.',
    },
    {
      key: 'key_risks',
      title: 'Key Risks',
      required: true,
      description: 'Call out the main delivery and adoption risks, plus the mitigation or watchpoint for each.',
      example_completed:
        'Risks include sponsor drift, data access lag, change fatigue, and vendor dependency. Mitigations include named owners, milestone guards, and escalation thresholds.',
    },
  ],
  format: 'markdown',
  rendering_notes:
    'Preserve the section order exactly. Each section should render as markdown with a short explanation and a concrete completed example.',
} satisfies {
  sections: CharterTemplateSection[];
  format: 'markdown';
  rendering_notes: string;
};

export const charterQualityRubric: CharterRubricCriterion[] = [
  {
    criterion: 'required_sections_present',
    rationale: 'A charter is unusable if any required section is missing or reordered; the template must be structurally complete before sign-off.',
    severity: 'blocker',
  },
  {
    criterion: 'claims_cited_to_intake_conversation',
    rationale:
      'Every factual claim, date, number, stakeholder name, and scope statement must be traceable to the intake conversation or clearly marked as a gap.',
    severity: 'blocker',
  },
  {
    criterion: 'sponsor_and_scope_specificity',
    rationale:
      'The charter should name the sponsor and co-sponsor, describe the business context, and distinguish in-scope from out-of-scope work without generic filler.',
    severity: 'major',
  },
  {
    criterion: 'success_criteria_are_measurable',
    rationale:
      'Success criteria need to be concrete enough that Verify can prove them later; vague aspirations do not support an accountable program.',
    severity: 'major',
  },
  {
    criterion: 'milestones_have_real_dates',
    rationale:
      'Diagnose, Design, Execute, and Verify milestones must include explicit dates and sequence logically so the charter can be operationalized.',
    severity: 'major',
  },
  {
    criterion: 'risks_are_actionable',
    rationale:
      'Risks should be specific to the program and paired with a mitigation, owner, or watchpoint instead of repeating generic project-management language.',
    severity: 'minor',
  },
];

export const charterGenerationPromptTemplate = `You are drafting a Program Charter in Markdown.

ENGAGEMENT
\${engagement.id}

CLIENT
\${client.name}

STRUCTURE
\${structure_as_outline}

INTAKE CONVERSATION
\${current_state_baseline_from_phase_1}

QUALITY RUBRIC
\${quality_rubric.criteria}

RULES
- Use the section order and section names from STRUCTURE exactly.
- Every required section must be present in Markdown.
- Every factual claim, number, date, stakeholder name, and scope statement must include one or more citations back to the intake conversation using bracketed turn references like [turn 03].
- If a claim depends on multiple turns, cite all relevant turns.
- If the conversation does not support a section, write [DATA GAP: what is missing] instead of inventing details.
- Keep the tone formal, concise, and sponsor-ready.
- Output only Markdown that matches the template_structure.

Write the full charter now.`;

export const charterDeliverableType = {
  type_key: 'charter',
  title: 'Program Charter',
  description: 'Sponsor-ready program charter with scope, governance, milestones, and risk framing',
  applicable_phases: [1, 2],
  applicable_topics: [
    'analytics_modernization',
    'ai_governance_implementation',
    'prior_auth_automation',
    'vendor_consolidation_ai',
  ],
  template_structure: charterTemplateStructure,
  required_data_inputs: {
    engagement: [
      'phase_1.intake_conversation',
      'sponsor.name',
      'sponsor.role',
      'sponsor.decision_authority',
      'co_sponsor.name',
      'co_sponsor.role',
    ],
    client: ['name', 'industry'],
    topic: ['topic_key', 'phase_playbook', 'typical_deliverables'],
  },
  quality_rubric: charterQualityRubric,
  generation_prompt_template: charterGenerationPromptTemplate,
  output_format: 'markdown',
  maturity: 'production',
} as const;
