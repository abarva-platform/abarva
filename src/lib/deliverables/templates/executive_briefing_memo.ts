export interface ExecutiveBriefingMemoTemplateSection {
  key: string;
  title: string;
  required: boolean;
  description: string;
  example_completed: string;
}

export interface ExecutiveBriefingMemoRubricCriterion {
  criterion: string;
  rationale: string;
  severity: "blocker" | "major" | "minor";
}

export const executiveBriefingMemoTemplateStructure = {
  sections: [
    {
      key: "executive_answer",
      title: "Executive Answer",
      required: true,
      description:
        "Lead with the one answer the CXO needs before any supporting detail.",
      example_completed:
        "Apex should fund a limited contact-center AI wave now, but only after closing the SKU-level returns baseline and the agent assist adoption owner gap.",
    },
    {
      key: "decision_job",
      title: "Decision Job",
      required: true,
      description:
        "State the decision this memo supports and what is not being decided.",
      example_completed:
        "Decision: authorize a 90-day design-and-prove wave. Not decided: enterprise CRM replacement or full workforce redesign.",
    },
    {
      key: "evidence_grounded_findings",
      title: "Evidence-Grounded Findings",
      required: true,
      description:
        "Summarize the findings, each tied to cited conversation turns, tenant context, or corpus patterns.",
      example_completed:
        "Three findings drive the recommendation: avoidable contact volume is concentrated in returns, handoff friction is measurable, and sponsor appetite is bounded by peak-season risk.",
    },
    {
      key: "options",
      title: "Options Considered",
      required: true,
      description:
        "Compare the credible options rather than presenting the recommendation as inevitable.",
      example_completed:
        "Options: do nothing until peak passes, run a narrow returns bot, or build a broader triage layer across chat and voice.",
    },
    {
      key: "recommendation",
      title: "Recommendation",
      required: true,
      description:
        "Make the recommended action explicit, with owner, timing, and confidence.",
      example_completed:
        "Recommendation: run the narrow returns triage wave, owned by Store Ops and Digital, with a 90-day proof window and a finance-held value gate.",
    },
    {
      key: "sensitivity",
      title: "Sensitivity",
      required: true,
      description:
        "Show which assumptions can change the answer and where the recommendation breaks.",
      example_completed:
        "The answer changes if deflection lands below 8%, if QA review cannot cover peak-season exceptions, or if CRM integration takes longer than six weeks.",
    },
    {
      key: "risks_and_controls",
      title: "Risks + Controls",
      required: true,
      description:
        "Name the risks, the controls, and the executive owner for each.",
      example_completed:
        "Risk: low-quality automation damages customer trust. Control: human escalation threshold and weekly QA sample owned by Customer Care.",
    },
    {
      key: "next_30_days",
      title: "Next 30 Days",
      required: true,
      description:
        "List the near-term actions needed to make the decision executable.",
      example_completed:
        "Within 30 days: lock returns baseline, appoint QA owner, confirm CRM data access, and produce the first value bridge.",
    },
  ],
  format: "markdown",
  rendering_notes:
    "Write as a board-circulatable memo. Lead with the answer, preserve evidence traceability, and avoid exploratory transcript summary.",
} satisfies {
  sections: ExecutiveBriefingMemoTemplateSection[];
  format: "markdown";
  rendering_notes: string;
};

export const executiveBriefingMemoQualityRubric: ExecutiveBriefingMemoRubricCriterion[] =
  [
    {
      criterion: "answer_first",
      rationale:
        "The memo must lead with the decision answer, not a recap of the conversation.",
      severity: "blocker",
    },
    {
      criterion: "evidence_trace_is_visible",
      rationale:
        "Every factual claim must cite conversation turns, tenant context, or corpus patterns.",
      severity: "blocker",
    },
    {
      criterion: "options_are_real",
      rationale:
        "A CXO memo is not credible unless it compares credible alternatives and tradeoffs.",
      severity: "major",
    },
    {
      criterion: "sensitivity_is_explicit",
      rationale:
        "Financial or operational recommendations must say which assumptions could change the answer.",
      severity: "major",
    },
    {
      criterion: "owners_and_next_steps_are_named",
      rationale: "The memo must convert insight into accountable action.",
      severity: "major",
    },
    {
      criterion: "tone_is_executive_not_chat_summary",
      rationale:
        "The output should read like an executive memo, not a transcript digest.",
      severity: "minor",
    },
  ];

export const executiveBriefingMemoGenerationPromptTemplate = `You are drafting an Executive Briefing Memo in Markdown.

CLIENT
\${client.name}

STRUCTURE
\${structure_as_outline}

SENTINEL Q&A THREAD
\${recent_turn_summary}

TENANT CONTEXT
\${current_state_baseline_from_phase_1}

RETRIEVED CORPUS PATTERNS
\${topicIntelligenceBlock}

QUALITY RUBRIC
\${quality_rubric.criteria}

RULES
- Use the section order and section names from STRUCTURE exactly.
- Lead with the answer. Do not start with background.
- Cite every factual claim using bracketed turn references, tenant evidence ids, or corpus pattern ids.
- Include at least two credible options before recommending one.
- Include a sensitivity section that names the assumptions that can change the answer.
- If evidence is missing, write [DATA GAP: what is missing] instead of inventing.
- Keep the tone board-circulatable: crisp, adult, accountable.

Write the full executive briefing memo now.`;

export const executiveBriefingMemoDeliverableType = {
  type_key: "executive_briefing_memo",
  title: "Executive Briefing Memo",
  description:
    "Board-circulatable memo that converts a Sentinel Q&A thread into an executive answer and action posture",
  applicable_phases: [1, 2, 3, 4],
  applicable_topics: [
    "analytics_modernization",
    "ai_governance_implementation",
    "prior_auth_automation",
    "vendor_consolidation_ai",
  ],
  template_structure: executiveBriefingMemoTemplateStructure,
  required_data_inputs: {
    engagement: ["recent_turn_summary", "phase_1.findings"],
    client: ["name", "industry"],
    topic: ["topic_key", "phase_playbook", "success_signals", "failure_modes"],
  },
  quality_rubric: executiveBriefingMemoQualityRubric,
  generation_prompt_template: executiveBriefingMemoGenerationPromptTemplate,
  output_format: "markdown",
  maturity: "production",
} as const;
