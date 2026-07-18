import {
  STRATEGY_TO_ABARVA_SOLUTION_CONTRACT,
  STRATEGY_TO_MOVES_EXECUTION_CONTRACT,
  type AbarvaAnswerMode,
} from "./response-policy";

export type CxoAnswerModeKey =
  | AbarvaAnswerMode
  | "strategy_to_source_execution"
  | "strategy_to_tower_value_case"
  | "industry_trend_to_ai_bets"
  | "board_ai_governance_plan"
  | "operating_model_redesign"
  | "sourcing_savings_case"
  | "portfolio_prioritization"
  | "risk_control_plan";

export type CxoTypedArtifact =
  | "phase_table"
  | "tower_outcomes"
  | "surface_plan"
  | "trend_table"
  | "priority_matrix"
  | "value_case"
  | "governance_plan"
  | "operating_model"
  | "savings_case"
  | "portfolio_scorecard"
  | "risk_control_plan";

export interface CxoAnswerModeContract {
  mode: CxoAnswerModeKey;
  active: boolean;
  requiredSections: readonly string[];
  requiredArtifacts: readonly CxoTypedArtifact[];
  bannedPhrases: readonly string[];
  exportRequired: boolean;
  liveProofPrompt: string;
  systemContract?: string;
  promptDirective?: string;
  deterministicFallback?: (text: string) => string;
}

export const MOVES_EXECUTION_PHASE_LABELS = [
  "P0 Originate",
  "P1 Charter",
  "P2 Understand Current State",
  "P3 Choose the Approach",
  "P4 Build the Plan",
  "P5 Prepare to Execute",
  "Tower Track Outcomes",
] as const;

export function ensureMovesExecutionPhaseTable(text: string): string {
  const presentPhaseLabels = MOVES_EXECUTION_PHASE_LABELS.filter((label) =>
    text.includes(label),
  );
  const hasEveryPhase =
    presentPhaseLabels.length === MOVES_EXECUTION_PHASE_LABELS.length;
  const hasPhaseTable =
    /\|\s*Phase\s*\|/i.test(text) || /\|\s*P0 Originate\s*\|/.test(text);
  const hasPlainPhaseTable =
    /\bMoves\s+Phase\b[\s\S]{0,800}\bP0\s+Originate\b/i.test(text) ||
    /^\s*Phase\s+(?:Objective|Checkpoint|Focus|What\s+AbarVa\s+does)\b/im.test(
      text,
    );
  if (hasEveryPhase && (hasPhaseTable || hasPlainPhaseTable)) return text;

  if (hasPhaseTable && presentPhaseLabels.length >= 4) {
    const missingRows = MOVES_EXECUTION_PHASE_LABELS.filter(
      (label) => !presentPhaseLabels.includes(label),
    ).map((label) => {
      switch (label) {
        case "P0 Originate":
          return "- P0 Originate: frame the bet, sponsor, decision owner, and why-now logic.";
        case "P1 Charter":
          return "- P1 Charter: define scope, sponsor, success metric, and decision cadence.";
        case "P2 Understand Current State":
          return "- P2 Understand Current State: ground systems, data, owners, contracts, gaps, and evidence boundaries.";
        case "P3 Choose the Approach":
          return "- P3 Choose the Approach: compare options by value, readiness, risk, and dependency.";
        case "P4 Build the Plan":
          return "- P4 Build the Plan: turn the chosen approach into workstreams, milestones, risks, and funding asks.";
        case "P5 Prepare to Execute":
          return "- P5 Prepare to Execute: confirm owners, controls, vendors, adoption plan, and launch readiness.";
        case "Tower Track Outcomes":
          return "- Tower Track Outcomes: track adoption, KPI movement, benefits, risks, and funding gates.";
      }
    });

    return [
      text.trim(),
      "**Moves phase contract completion**",
      ...missingRows,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  const fallbackPlan = [
    "**Moves phase plan**",
    "",
    "- P0 Originate: Intelligence frames the candidate bets, decision owner, and why-now logic. Output: bet slate and executive question.",
    "- P1 Charter: Moves defines scope, sponsor, success metric, and decision cadence. Output: sprint charter and governance path.",
    "- P2 Understand Current State: Home grounds systems, data, owners, contracts, gaps, and evidence boundaries. Output: current-state evidence pack.",
    "- P3 Choose the Approach: Moves compares options by value, readiness, risk, and dependency. Output: recommended approach and stop/go gate.",
    "- P4 Build the Plan: Moves turns the chosen approach into workstreams, milestones, risks, and funding asks. Output: roadmap and business case.",
    "- P5 Prepare to Execute: Moves confirms owners, controls, vendors, adoption plan, and launch readiness. Output: execution-ready plan.",
    "- Tower Track Outcomes: Tower tracks adoption, KPI movement, benefits, risks, and funding gates for accountable owner review. Output: value-realization scorecard.",
  ].join("\n");

  const firstTabIndex = text.search(/\n\s*<<<TAB:/);
  if (firstTabIndex === -1) {
    return [text.trim(), fallbackPlan].filter(Boolean).join("\n\n");
  }
  return [
    text.slice(0, firstTabIndex).trim(),
    fallbackPlan,
    text.slice(firstTabIndex).trimStart(),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function ensureAbarvaSurfacePlan(text: string): string {
  const requiredSurfaceNames = [
    "Intelligence",
    "Home",
    "Moves",
    "Source",
    "Tower",
  ];
  const mentioned = requiredSurfaceNames.filter((name) =>
    new RegExp(`\\b${name}\\b`, "i").test(text),
  );
  if (mentioned.length >= 4 || /How AbarVa would solve this/i.test(text)) {
    return text;
  }

  const firstTabIndex = text.search(/\n\s*<<<TAB:/);
  const surfacePlan =
    "**How AbarVa would run it:** Intelligence frames the executive bet; Home validates current-state systems, data, owners, and gaps; Moves turns the bet into governed phase work; Source checks vendor and commercial dependencies when relevant; Tower tracks adoption, value, risk, and funding evidence.";

  if (firstTabIndex === -1) {
    return [text.trim(), surfacePlan].filter(Boolean).join("\n\n");
  }
  return [
    text.slice(0, firstTabIndex).trim(),
    surfacePlan,
    text.slice(firstTabIndex).trimStart(),
  ]
    .filter(Boolean)
    .join("\n\n");
}

const COMMON_BANNED_PHRASES = [
  "ask Claude",
  "ask ChatGPT",
  "raw packet",
  "schema name",
  "model-visible",
  "debug",
] as const;

export const CXO_ANSWER_MODE_REGISTRY = {
  general: {
    mode: "general",
    active: true,
    requiredSections: [],
    requiredArtifacts: [],
    bannedPhrases: COMMON_BANNED_PHRASES,
    exportRequired: false,
    liveProofPrompt: "What is the executive read on the current state?",
  },
  strategy_to_abarva_solution: {
    mode: "strategy_to_abarva_solution",
    active: true,
    requiredSections: [
      "Executive read",
      "Strategic recommendation or top bets",
      "Tenant-specific reasoning",
      "How AbarVa would solve this",
      "Surface-by-surface plan",
      "Artifacts produced as proposed outputs",
      "Gaps and assumptions",
      "Next action",
    ],
    requiredArtifacts: ["surface_plan"],
    bannedPhrases: COMMON_BANNED_PHRASES,
    exportRequired: true,
    liveProofPrompt:
      "How would AbarVa solve this for supply-chain AI top bets? Include Intelligence, Home, Moves, Source, and Tower.",
    systemContract: STRATEGY_TO_ABARVA_SOLUTION_CONTRACT,
    promptDirective:
      'ACTIVE ANSWER MODE: strategy_to_abarva_solution. Build the answer as AbarVa product guidance, not generic advice. Include "How AbarVa would solve this" when execution is relevant. Use Intelligence for framing, Home for current-state evidence, Moves for governed execution, Source for vendor/commercial levers, and Tower for value/adoption tracking.',
    deterministicFallback: ensureAbarvaSurfacePlan,
  },
  strategy_to_moves_execution: {
    mode: "strategy_to_moves_execution",
    active: true,
    requiredSections: [
      "Direct executive read",
      "Candidate Moves or bets",
      "How AbarVa would run it",
      "Moves phase plan",
      "Tower Track Outcomes",
      "Evidence and caveats",
      "Clear next steps",
    ],
    requiredArtifacts: ["phase_table", "tower_outcomes", "surface_plan"],
    bannedPhrases: COMMON_BANNED_PHRASES,
    exportRequired: true,
    liveProofPrompt:
      "If I run the supply-chain AI top bets through Moves for 8 weeks, what would the plan look like by phases?",
    systemContract: `${STRATEGY_TO_ABARVA_SOLUTION_CONTRACT}\n\n${STRATEGY_TO_MOVES_EXECUTION_CONTRACT}`,
    promptDirective:
      'ACTIVE ANSWER MODE: strategy_to_moves_execution. Build the answer as AbarVa product guidance, not generic advice. Include "How AbarVa would solve this" when execution is relevant. Use Intelligence for framing, Home for current-state evidence, Moves for governed execution, Source for vendor/commercial levers, and Tower for value/adoption tracking. Include a compact Moves phase plan with one clear item for each label: P0 Originate, P1 Charter, P2 Understand Current State, P3 Choose the Approach, P4 Build the Plan, P5 Prepare to Execute, and Tower Track Outcomes. Do not say Tower certifies by itself; Tower tracks value evidence for Finance or the accountable outcome owner to certify.',
    deterministicFallback: ensureMovesExecutionPhaseTable,
  },
  strategy_to_source_execution: {
    mode: "strategy_to_source_execution",
    active: false,
    requiredSections: [
      "Executive read",
      "Commercial decision",
      "Source workplan",
      "Vendor and contract evidence",
      "Risks and next action",
    ],
    requiredArtifacts: ["savings_case", "surface_plan"],
    bannedPhrases: COMMON_BANNED_PHRASES,
    exportRequired: true,
    liveProofPrompt:
      "How should Source turn this AI opportunity into a vendor and sourcing plan?",
  },
  strategy_to_tower_value_case: {
    mode: "strategy_to_tower_value_case",
    active: false,
    requiredSections: [
      "Executive value read",
      "Outcome metrics",
      "Funding gate",
      "Evidence and caveats",
      "Tower tracking plan",
    ],
    requiredArtifacts: ["value_case", "tower_outcomes"],
    bannedPhrases: COMMON_BANNED_PHRASES,
    exportRequired: true,
    liveProofPrompt:
      "What should Tower measure to prove this AI strategy is creating value?",
  },
  industry_trend_to_ai_bets: {
    mode: "industry_trend_to_ai_bets",
    active: false,
    requiredSections: [
      "Executive read",
      "Industry pattern",
      "Top AI bets",
      "Value versus complexity",
      "Case examples",
      "Next moves",
    ],
    requiredArtifacts: ["trend_table", "priority_matrix"],
    bannedPhrases: COMMON_BANNED_PHRASES,
    exportRequired: true,
    liveProofPrompt:
      "Give me the top 5 AI use cases for supply chain and rank them in a 2x2 matrix across value and complexity.",
  },
  board_ai_governance_plan: {
    mode: "board_ai_governance_plan",
    active: false,
    requiredSections: [
      "Board read",
      "Governance model",
      "Risk controls",
      "Decision rights",
      "Evidence required",
    ],
    requiredArtifacts: ["governance_plan", "risk_control_plan"],
    bannedPhrases: COMMON_BANNED_PHRASES,
    exportRequired: true,
    liveProofPrompt:
      "What AI governance plan should the board approve for this portfolio?",
  },
  operating_model_redesign: {
    mode: "operating_model_redesign",
    active: false,
    requiredSections: [
      "Executive read",
      "Current operating model",
      "Future model",
      "Role and decision-right changes",
      "Transition plan",
    ],
    requiredArtifacts: ["operating_model"],
    bannedPhrases: COMMON_BANNED_PHRASES,
    exportRequired: true,
    liveProofPrompt:
      "How should we redesign the operating model to industrialize AI across the company?",
  },
  sourcing_savings_case: {
    mode: "sourcing_savings_case",
    active: false,
    requiredSections: [
      "Savings read",
      "Addressable spend",
      "Commercial levers",
      "Risk and dependency",
      "Execution plan",
    ],
    requiredArtifacts: ["savings_case"],
    bannedPhrases: COMMON_BANNED_PHRASES,
    exportRequired: true,
    liveProofPrompt:
      "Build the sourcing savings case and the vendor negotiation plan for this opportunity.",
  },
  portfolio_prioritization: {
    mode: "portfolio_prioritization",
    active: false,
    requiredSections: [
      "Portfolio read",
      "Ranking logic",
      "Value and readiness comparison",
      "Recommended sequence",
      "Stop/go gates",
    ],
    requiredArtifacts: ["portfolio_scorecard", "priority_matrix"],
    bannedPhrases: COMMON_BANNED_PHRASES,
    exportRequired: true,
    liveProofPrompt:
      "Prioritize these AI bets by value, readiness, complexity, and dependency.",
  },
  risk_control_plan: {
    mode: "risk_control_plan",
    active: false,
    requiredSections: [
      "Risk read",
      "Control objectives",
      "Evidence needed",
      "Owner and cadence",
      "Escalation path",
    ],
    requiredArtifacts: ["risk_control_plan"],
    bannedPhrases: COMMON_BANNED_PHRASES,
    exportRequired: true,
    liveProofPrompt:
      "What risk-control plan should we use before approving this AI move?",
  },
} satisfies Record<CxoAnswerModeKey, CxoAnswerModeContract>;

export function getCxoAnswerModeContract(
  mode: AbarvaAnswerMode,
): CxoAnswerModeContract {
  return CXO_ANSWER_MODE_REGISTRY[mode];
}

export function buildCxoAnswerModeSystemAddendum(
  mode: AbarvaAnswerMode,
): string {
  const contract = getCxoAnswerModeContract(mode);
  if (!contract.systemContract) return "";

  return `\n\n${contract.systemContract}

FORMAT OVERRIDE FOR THIS MODE
- The earlier generic handoff guidance is superseded for this answer. Do not merely say "hand off to Moves." Explain how AbarVa would actually run the work through Moves.
- If rich-text canvas tabs are active, put required executive artifacts in the Decision or Table tabs, put vendor/commercial implications in the Evidence or Table tabs when relevant, and put Tower value metrics in the Chart or Table tabs.
- If answer-only streaming is active, use compact bold section headers and required tables.`;
}

export function buildCxoAnswerModePromptDirective(
  mode: AbarvaAnswerMode,
): string {
  const directive = getCxoAnswerModeContract(mode).promptDirective;
  return directive ? `\n\n${directive}` : "";
}

export function applyCxoAnswerModeFallbacks(
  text: string,
  mode: AbarvaAnswerMode,
): string {
  const fallback = getCxoAnswerModeContract(mode).deterministicFallback;
  return fallback ? fallback(text) : text;
}
