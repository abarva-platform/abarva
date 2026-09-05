import {
  GENERAL_ADVISORY_CONTRACT,
  INDUSTRY_TREND_TO_AI_BETS_CONTRACT,
  PORTFOLIO_PRIORITIZATION_CONTRACT,
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
  /**
   * The surface-handoff FORMAT OVERRIDE tells the model to explain how AbarVa
   * would run the work through Moves. That is right for the strategy and
   * bet-framing modes, but wrong for `general`, which also answers simple
   * factual lookups where a Moves handoff is noise.
   */
  suppressSurfaceHandoffOverride?: boolean;
}

const ABARVA_SURFACE_PLAN_SENTENCE =
  "Have Intelligence frame the executive bet, Home verify current-state systems, data, owners, and gaps, Moves turn it into governed phase work, Source test vendor/commercial levers when relevant, and Tower track value, adoption, risk, and funding evidence.";

export const MOVES_EXECUTION_PHASE_LABELS = [
  "P0 Originate",
  "P1 Charter",
  "P2 Discover & Diagnose",
  "P3 Design Future State",
  "P4 Roadmap & Business Case",
  "P5 Approval & Mobilization",
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
        case "P2 Discover & Diagnose":
          return "- P2 Discover & Diagnose: ground systems, data, owners, contracts, gaps, and evidence boundaries.";
        case "P3 Design Future State":
          return "- P3 Design Future State: compare options by value, readiness, risk, and dependency.";
        case "P4 Roadmap & Business Case":
          return "- P4 Roadmap & Business Case: turn the chosen approach into workstreams, milestones, risks, and funding asks.";
        case "P5 Approval & Mobilization":
          return "- P5 Approval & Mobilization: confirm owners, controls, vendors, adoption plan, and launch readiness.";
        case "Tower Track Outcomes":
          return "- Tower Track Outcomes: track adoption, KPI movement, benefits, risks, and funding gates.";
      }
    });

    return [text.trim(), "**Moves phase contract completion**", ...missingRows]
      .filter(Boolean)
      .join("\n\n");
  }

  const fallbackPlan = [
    "**Moves phase plan**",
    "",
    "- P0 Originate: Intelligence frames the candidate bets, decision owner, and why-now logic. Output: bet slate and executive question.",
    "- P1 Charter: Moves defines scope, sponsor, success metric, and decision cadence. Output: sprint charter and governance path.",
    "- P2 Discover & Diagnose: Home grounds systems, data, owners, contracts, gaps, and evidence boundaries. Output: current-state evidence pack.",
    "- P3 Design Future State: Moves compares options by value, readiness, risk, and dependency. Output: recommended approach and stop/go gate.",
    "- P4 Roadmap & Business Case: Moves turns the chosen approach into workstreams, milestones, risks, and funding asks. Output: roadmap and business case.",
    "- P5 Approval & Mobilization: Moves confirms owners, controls, vendors, adoption plan, and launch readiness. Output: execution-ready plan.",
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

function splitAnswerTabs(text: string): { body: string; tabs: string } {
  const firstTabIndex = text.search(/\n\s*<<<TAB:/);
  if (firstTabIndex === -1) return { body: text.trim(), tabs: "" };
  return {
    body: text.slice(0, firstTabIndex).trim(),
    tabs: text.slice(firstTabIndex).trimStart(),
  };
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function stripMarkdownHeading(line: string): string {
  return line
    .replace(/^\s{0,3}#{1,6}\s+/, "")
    .replace(/^\s{0,3}[-*]\s+/, "")
    .trim();
}

function splitReadableSentences(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z0-9"“])/)
    .map(stripMarkdownHeading)
    .map((sentence) =>
      sentence
        .replace(
          /^\*\*(?:Answer|Proof|Move|Read|Evidence|Next move):?\*\*\s*/i,
          "",
        )
        .replace(/^(?:Answer|Proof|Move|Read|Evidence|Next move):\s*/i, "")
        .replace(/^(?:Answer|Proof|Move|Read|Evidence|Next move)\.?\s+/i, "")
        .trim(),
    )
    .filter((sentence) => {
      if (sentence.length < 18) return false;
      if (/^\|/.test(sentence)) return false;
      if (/^<<<TAB:/i.test(sentence)) return false;
      if (/^suggested questions?:/i.test(sentence)) return false;
      return true;
    });
}

function compactSentence(sentence: string, maxWords: number): string {
  const words = sentence.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return sentence.trim();
  const capped = words
    .slice(0, maxWords)
    .join(" ")
    .replace(/[,:;]+$/, "");
  return `${capped}.`;
}

function firstMatchingSentence(
  sentences: string[],
  pattern: RegExp,
  exclude = new Set<string>(),
): string | undefined {
  return sentences.find(
    (sentence) => !exclude.has(sentence) && pattern.test(sentence),
  );
}

function withTerminalPunctuation(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function ensureNoDuplicateSurfaceSentence(sentence: string): string {
  const hasSurfacePath =
    /\bIntelligence\b/i.test(sentence) &&
    /\bHome\b/i.test(sentence) &&
    /\bMoves\b/i.test(sentence) &&
    /\bTower\b/i.test(sentence);
  return hasSurfacePath
    ? withTerminalPunctuation(sentence)
    : `${withTerminalPunctuation(sentence)} ${ABARVA_SURFACE_PLAN_SENTENCE}`;
}

function stripNestedBriefLabels(text: string): string {
  return text.replace(
    /((?:\*\*)?(?:Answer|Proof|Move):?(?:\*\*)?:?\s+)(?:Answer|Proof|Move)\.?\s+/gi,
    "$1",
  );
}

export function ensureAbarvaSolutionBrief(text: string): string {
  const { body, tabs } = splitAnswerTabs(text);
  const surfaceAligned = stripNestedBriefLabels(ensureAbarvaSurfacePlan(body));
  const paragraphCount = surfaceAligned
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean).length;
  if (
    wordCount(surfaceAligned) <= 190 &&
    paragraphCount <= 3 &&
    /\b(Move|How AbarVa|Intelligence)\b/i.test(surfaceAligned)
  ) {
    return [surfaceAligned.trim(), tabs].filter(Boolean).join("\n\n");
  }

  const sentences = splitReadableSentences(body);
  if (sentences.length === 0) {
    return [`**Answer:** ${ABARVA_SURFACE_PLAN_SENTENCE}`, tabs]
      .filter(Boolean)
      .join("\n\n");
  }

  const used = new Set<string>();
  const answer =
    firstMatchingSentence(
      sentences,
      /\b(should|must|recommend|priority|best|focus|fund|scale|hold|defer|run|start|pursue|proceed|advance|stop|pause)\b/i,
      used,
    ) ?? sentences[0]!;
  used.add(answer);

  const proofOne =
    firstMatchingSentence(
      sentences,
      /\b(current-state|current state|system|application|stack|data|evidence|gap|owner|business|priority|loaded|source|context|vendor|budget|run cost|risk|constraint)\b/i,
      used,
    ) ?? sentences.find((sentence) => !used.has(sentence));
  if (proofOne) used.add(proofOne);
  const proofTwo = firstMatchingSentence(
    sentences,
    /\b(benchmark|industry|pattern|value|complexity|readiness|adoption|customer|member|agent|workflow|process|control)\b/i,
    used,
  );
  if (proofTwo) used.add(proofTwo);

  const move =
    firstMatchingSentence(
      sentences,
      /\b(next|validate|prove|pilot|sprint|Moves|Source|Tower|Home|AbarVa|owner|decision|gate|execute)\b/i,
      used,
    ) ?? ABARVA_SURFACE_PLAN_SENTENCE;

  const proofSentences = [proofOne, proofTwo]
    .filter((sentence): sentence is string => Boolean(sentence))
    .slice(0, 2)
    .map((sentence) => compactSentence(sentence, 34));
  const proof =
    proofSentences.length > 0
      ? proofSentences.join(" ")
      : "The loaded context should decide the shape of the recommendation; unsupported claims stay caveated until the evidence is reviewable.";

  const compactBody = [
    `**Answer:** ${compactSentence(answer, 38)}`,
    `**Proof:** ${proof}`,
    `**Move:** ${compactSentence(ensureNoDuplicateSurfaceSentence(move), 72)}`,
  ].join("\n\n");

  return [stripNestedBriefLabels(compactBody), tabs]
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
    systemContract: GENERAL_ADVISORY_CONTRACT,
    promptDirective:
      "ACTIVE ANSWER MODE: general advisory. Classify the depth of the question before writing. If it is a simple factual lookup, answer it directly in one short paragraph and stop -- no executive framework, no unrequested recommendation, no evidence-boundary lecture, no table. If it is an executive or analytical question, lead with the judgment, support it with the two or three strongest tenant signals, and close on the decision implication. Separate tenant-loaded fact from industry pattern from recommendation. Name missing evidence as missing instead of assuming it.",
    suppressSurfaceHandoffOverride: true,
  },
  strategy_to_abarva_solution: {
    mode: "strategy_to_abarva_solution",
    active: true,
    requiredSections: ["Answer", "Proof", "Move"],
    requiredArtifacts: ["surface_plan"],
    bannedPhrases: COMMON_BANNED_PHRASES,
    exportRequired: true,
    liveProofPrompt:
      "How would AbarVa solve this for supply-chain AI top bets? Include Intelligence, Home, Moves, Source, and Tower.",
    systemContract: STRATEGY_TO_ABARVA_SOLUTION_CONTRACT,
    promptDirective:
      "ACTIVE ANSWER MODE: strategy_to_abarva_solution. Build the answer as a compact AbarVa Pyramid Brief, not a mini deck. Use exactly 3 short paragraphs by default: Answer, Proof, Move. The Move paragraph must explain the AbarVa path naturally: Intelligence frames the bet, Home validates current-state evidence, Moves turns it into governed execution, Source checks vendor/commercial levers when relevant, and Tower tracks value/adoption/risk evidence. Do not create a long surface-by-surface section unless the user explicitly asks for a deep implementation plan.",
    deterministicFallback: ensureAbarvaSolutionBrief,
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
      'ACTIVE ANSWER MODE: strategy_to_moves_execution. Build the answer as AbarVa product guidance, not generic advice. Include "How AbarVa would solve this" when execution is relevant. Use Intelligence for framing, Home for current-state evidence, Moves for governed execution, Source for vendor/commercial levers, and Tower for value/adoption tracking. Include a compact Moves phase plan with one clear item for each label: P0 Originate, P1 Charter, P2 Discover & Diagnose, P3 Design Future State, P4 Roadmap & Business Case, P5 Approval & Mobilization, and Tower Track Outcomes. Do not say Tower certifies by itself; Tower tracks value evidence for Finance or the accountable outcome owner to certify.',
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
    active: true,
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
    systemContract: INDUSTRY_TREND_TO_AI_BETS_CONTRACT,
    promptDirective:
      "ACTIVE ANSWER MODE: industry_trend_to_ai_bets. Do not answer as a generic market scan. Use the Client Grounding Packet first: current systems, data readiness, executive interview signals, AI tool/program usage, process bottlenecks, owners, vendors, and evidence gaps. Then layer industry trends, peer examples, and benchmarks as clearly labeled industry context. For explicit top-N, chart, matrix, value/complexity, or ranking asks, include the required chart payload table so the renderer can produce a 2x2 matrix and bar/trend chart. Keep the CXO storyline concise: what matters, why it matters for this tenant, and what to validate or fund next.",
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
    active: true,
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
    systemContract: PORTFOLIO_PRIORITIZATION_CONTRACT,
    promptDirective:
      "ACTIVE ANSWER MODE: portfolio_prioritization. The user is ordering a set the enterprise already holds, not discovering industry options. Open with the portfolio read, state the ranking logic before the ranking, and keep value separate from readiness. Name the dependencies that force sequence -- a shared data foundation, a single owner, or one vendor negotiation decides order more than any score. Recommend invest now, validate next, sequence, or hold for each item, and say why. Do not manufacture ROI, savings percentages, or composite scores; where readiness or value is unevidenced, make that the validation gate. Emit the scorecard and value/readiness matrix payload only for an explicit ranking, matrix, or top-N ask.",
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
  if (contract.suppressSurfaceHandoffOverride) {
    return `\n\n${contract.systemContract}`;
  }

  return `\n\n${contract.systemContract}

FORMAT OVERRIDE FOR THIS MODE
- The earlier generic handoff guidance is superseded for this answer. Do not merely say "hand off to Moves." Explain how AbarVa would actually run the work through Moves.
- If rich-text canvas tabs are active, put required executive artifacts in the Decision or Table tabs, put vendor/commercial implications in the Evidence or Table tabs when relevant, and put Tower value metrics in the Chart or Table tabs.
- If answer-only streaming is active, use compact bold section headers (naming the actual topic, e.g. "Call Center Optimization") and required tables — never literal narrative-stage labels such as "Answer", "Proof", "Move", "Tension", "Evidence", or "Implication".`;
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
