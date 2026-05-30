export interface StrategicDecisionPaperTemplateSection {
  key: string;
  title: string;
  required: boolean;
  description: string;
  example_completed: string;
}

export interface StrategicDecisionPaperRubricCriterion {
  criterion: string;
  rationale: string;
  severity: "blocker" | "major" | "minor";
}

export const strategicDecisionPaperTemplateStructure = {
  sections: [
    {
      key: "decision_to_make",
      title: "Decision to Make",
      required: true,
      description: "Name the decision, decision owner, and decision date.",
      example_completed:
        "Decision: whether Apex should fund the first contact-center AI wave by June 15. Owner: CIO with CFO concurrence.",
    },
    {
      key: "why_now",
      title: "Why Now",
      required: true,
      description:
        "Explain the forcing event, timing pressure, or opportunity window.",
      example_completed:
        "Peak-season planning closes in six weeks; waiting pushes the first measurable reduction in avoidable contacts into the next fiscal year.",
    },
    {
      key: "context_and_constraints",
      title: "Context + Constraints",
      required: true,
      description:
        "Summarize the business, technical, governance, and change constraints.",
      example_completed:
        "Constraints: CRM API access, field change fatigue, finance value-gate discipline, and customer trust controls for automation.",
    },
    {
      key: "options_considered",
      title: "Options Considered",
      required: true,
      description:
        "Compare options with explicit tradeoffs and rejection logic.",
      example_completed:
        "Options: delay, narrow returns triage, broad omnichannel triage. Broad triage has higher upside but excessive delivery risk before peak.",
    },
    {
      key: "recommendation",
      title: "Recommendation",
      required: true,
      description:
        "State the recommended option and the conditions attached to it.",
      example_completed:
        "Approve the narrow returns triage wave with a finance-held go/no-go gate after baseline validation.",
    },
    {
      key: "economic_case",
      title: "Economic Case",
      required: true,
      description:
        "Show value range, investment range, confidence, and sensitivity.",
      example_completed:
        "Expected annualized value range is $8M-$14M, contingent on 10%-16% avoidable-contact reduction and verified CRM containment telemetry.",
    },
    {
      key: "risks_and_reversibility",
      title: "Risks + Reversibility",
      required: true,
      description:
        "Name delivery and governance risks, plus what is reversible or locked in.",
      example_completed:
        "Reversible: prompt policies and escalation thresholds. Harder to reverse: vendor integration pattern and field training commitments.",
    },
    {
      key: "approval_path",
      title: "Approval Path",
      required: true,
      description:
        "List the approvals, owners, and evidence required to proceed.",
      example_completed:
        "Approval path: CIO sponsor sign-off, CFO range review, Customer Care QA owner, and Legal/privacy review of customer-data handling.",
    },
  ],
  format: "markdown",
  rendering_notes:
    "Optimize for a single strategic decision. Keep the decision, options, economics, risks, and approval path impossible to miss.",
} satisfies {
  sections: StrategicDecisionPaperTemplateSection[];
  format: "markdown";
  rendering_notes: string;
};

export const strategicDecisionPaperQualityRubric: StrategicDecisionPaperRubricCriterion[] =
  [
    {
      criterion: "decision_is_singular_and_owned",
      rationale:
        "The paper must support one owned decision, not a portfolio of vague choices.",
      severity: "blocker",
    },
    {
      criterion: "options_have_rejection_logic",
      rationale:
        "Rejected options need explicit tradeoffs so the recommendation is defensible.",
      severity: "blocker",
    },
    {
      criterion: "economic_case_is_ranged_and_cited",
      rationale:
        "Financial claims must be ranges with cited assumptions, not point estimates.",
      severity: "blocker",
    },
    {
      criterion: "reversibility_is_named",
      rationale:
        "Executives need to know what can be unwound and what creates lock-in.",
      severity: "major",
    },
    {
      criterion: "approval_path_is_operational",
      rationale:
        "The paper should translate the recommendation into actual approvals and evidence asks.",
      severity: "major",
    },
    {
      criterion: "tone_is_decisive_not_consultant_wallpaper",
      rationale:
        "The document must be useful in a real executive committee conversation.",
      severity: "minor",
    },
  ];

export const strategicDecisionPaperGenerationPromptTemplate = `You are drafting a Strategic Decision Paper in Markdown.

CLIENT
\${client.name}

STRUCTURE
\${structure_as_outline}

CURRENT STATE
\${current_state_baseline_from_phase_1}

RECENT SENTINEL THREAD
\${recent_turn_summary}

RETRIEVED CORPUS PATTERNS
\${topicIntelligenceBlock}

QUALITY RUBRIC
\${quality_rubric.criteria}

RULES
- Use the section order and section names from STRUCTURE exactly.
- Frame one decision only. Name the decision owner and decision date if available.
- Include at least three options: do nothing or defer, narrow move, broader move.
- Financial claims must be ranges with cited assumptions.
- Name what is reversible and what creates lock-in.
- If the evidence is incomplete, write [DATA GAP: what is missing] rather than inventing.
- Output only sponsor-ready Markdown.

Write the full strategic decision paper now.`;

export const strategicDecisionPaperDeliverableType = {
  type_key: "strategic_decision_paper",
  title: "Strategic Decision Paper",
  description:
    "Executive decision paper comparing options, economics, risks, reversibility, and approval path for one consequential choice",
  applicable_phases: [2, 3, 4],
  applicable_topics: [
    "analytics_modernization",
    "ai_governance_implementation",
    "prior_auth_automation",
    "vendor_consolidation_ai",
  ],
  template_structure: strategicDecisionPaperTemplateStructure,
  required_data_inputs: {
    engagement: [
      "phase_1.findings",
      "phase_2.design_decisions",
      "recent_turn_summary",
    ],
    client: ["name", "industry"],
    topic: ["topic_key", "vendor_landscape", "phase_playbook", "failure_modes"],
  },
  quality_rubric: strategicDecisionPaperQualityRubric,
  generation_prompt_template: strategicDecisionPaperGenerationPromptTemplate,
  output_format: "markdown",
  maturity: "production",
} as const;
