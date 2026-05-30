export interface QuarterlyExecutiveMemoTemplateSection {
  key: string;
  title: string;
  required: boolean;
  description: string;
  example_completed: string;
}

export interface QuarterlyExecutiveMemoRubricCriterion {
  criterion: string;
  rationale: string;
  severity: "blocker" | "major" | "minor";
}

export const quarterlyExecutiveMemoTemplateStructure = {
  sections: [
    {
      key: "quarterly_answer",
      title: "Quarterly Answer",
      required: true,
      description: "Open with the portfolio answer for the quarter.",
      example_completed:
        "The portfolio is value-positive but delivery-fragile: accelerate Contact Center AI, intervene on CDP adoption, and hold new automation starts until data-quality owners are named.",
    },
    {
      key: "portfolio_movement",
      title: "Portfolio Movement",
      required: true,
      description:
        "Summarize what moved, stalled, improved, or deteriorated since the prior review.",
      example_completed:
        "Three Moves advanced one phase, one sourcing event reached BAFO, and two risks moved from watchlist to active intervention.",
    },
    {
      key: "value_realization",
      title: "Value Realization",
      required: true,
      description:
        "Show value against plan, including ranges and evidence confidence.",
      example_completed:
        "Tracked annualized value is $11M-$16M versus a $14M-$22M plan; confidence is medium because two benefits still depend on unverified adoption telemetry.",
    },
    {
      key: "risks_and_decisions",
      title: "Risks + Decisions",
      required: true,
      description:
        "Name the risk controls and decisions required from the steering group.",
      example_completed:
        "Decision required: approve a CDP adoption reset or reduce the FY value target. Risk owner: CMO with CIO data-platform support.",
    },
    {
      key: "exceptions",
      title: "Exceptions",
      required: true,
      description:
        "Call out any moves, vendors, controls, or measures outside tolerance.",
      example_completed:
        "Exception: CDP activation remains below the governed adoption floor for two consecutive months; mitigation owner not yet accepted.",
    },
    {
      key: "next_quarter_commitments",
      title: "Next-Quarter Commitments",
      required: true,
      description:
        "List commitments for the next quarter with measurable outcomes.",
      example_completed:
        "By next quarter: close two evidence gaps, move Contact Center AI to P3, and produce the first post-launch containment scorecard.",
    },
    {
      key: "owner_actions",
      title: "Owner Actions",
      required: true,
      description: "Assign the actions to named roles with due dates.",
      example_completed:
        "CIO: confirm data-platform dependency date by June 7. CFO: approve value-attribution method by June 14. Tower owner: publish weekly risk digest.",
    },
  ],
  format: "markdown",
  rendering_notes:
    "Write for a quarterly steering review. Be concise, comparative, and explicit about continue/accelerate/intervene/stop decisions.",
} satisfies {
  sections: QuarterlyExecutiveMemoTemplateSection[];
  format: "markdown";
  rendering_notes: string;
};

export const quarterlyExecutiveMemoQualityRubric: QuarterlyExecutiveMemoRubricCriterion[] =
  [
    {
      criterion: "portfolio_answer_first",
      rationale:
        "The memo must make the quarter-level answer clear before details.",
      severity: "blocker",
    },
    {
      criterion: "value_against_plan_is_ranged",
      rationale:
        "Portfolio value must be shown as ranges with confidence, not unsupported point totals.",
      severity: "blocker",
    },
    {
      criterion: "exceptions_are_not_softened",
      rationale:
        "The memo must name out-of-tolerance work directly so the steering group can act.",
      severity: "major",
    },
    {
      criterion: "decisions_are_assigned",
      rationale: "Every needed decision must have a role owner and due date.",
      severity: "major",
    },
    {
      criterion: "evidence_gaps_are_visible",
      rationale:
        "Missing or stale evidence should be visible rather than hidden under confident prose.",
      severity: "major",
    },
    {
      criterion: "tone_is_steering_committee_ready",
      rationale:
        "The memo should read like an operating review artifact, not a status newsletter.",
      severity: "minor",
    },
  ];

export const quarterlyExecutiveMemoGenerationPromptTemplate = `You are drafting a Quarterly Executive Memo in Markdown.

CLIENT
\${client.name}

STRUCTURE
\${structure_as_outline}

PORTFOLIO / TOWER SIGNALS
\${current_state_baseline_from_phase_1}

RECENT DECISIONS AND RISKS
\${recent_turn_summary}

RETRIEVED CORPUS PATTERNS
\${topicIntelligenceBlock}

QUALITY RUBRIC
\${quality_rubric.criteria}

RULES
- Use the section order and section names from STRUCTURE exactly.
- Lead with the quarter-level answer: continue, accelerate, intervene, stop, or defer.
- Show value against plan as a range with confidence and evidence gaps.
- Name exceptions directly and assign owner actions with dates.
- If evidence is incomplete, write [DATA GAP: what is missing] rather than inventing.
- Output only executive-review Markdown.

Write the full quarterly executive memo now.`;

export const quarterlyExecutiveMemoDeliverableType = {
  type_key: "quarterly_executive_memo",
  title: "Quarterly Executive Memo",
  description:
    "Steering-review memo that summarizes portfolio movement, value realization, exceptions, decisions, and next-quarter owner actions",
  applicable_phases: [3, 4],
  applicable_topics: [
    "analytics_modernization",
    "ai_governance_implementation",
    "prior_auth_automation",
    "vendor_consolidation_ai",
  ],
  template_structure: quarterlyExecutiveMemoTemplateStructure,
  required_data_inputs: {
    engagement: ["phase_3.status", "phase_4.outcomes", "recent_turn_summary"],
    client: ["name", "industry"],
    topic: ["topic_key", "success_signals", "failure_modes"],
  },
  quality_rubric: quarterlyExecutiveMemoQualityRubric,
  generation_prompt_template: quarterlyExecutiveMemoGenerationPromptTemplate,
  output_format: "markdown",
  maturity: "production",
} as const;
