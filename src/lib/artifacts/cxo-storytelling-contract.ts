export type CxoBusinessImpactCategory =
  | "revenue"
  | "cost"
  | "risk"
  | "speed"
  | "customer"
  | "compliance";

export type CxoExhibitKind =
  | "decision_card"
  | "value_tree"
  | "exposure_bridge"
  | "trend_chart"
  | "root_cause_map"
  | "timeline"
  | "options_matrix"
  | "opportunity_map"
  | "scenario_comparison"
  | "business_impact_scorecard"
  | "evidence_gap_matrix"
  | "architecture_diagram"
  | "roadmap_swimlane";

export type CxoStoryElement =
  | "executive_message"
  | "so_what"
  | "where_value_is_moving"
  | "why_it_happened"
  | "what_should_happen"
  | "options_and_tradeoffs"
  | "commercial_opportunity_map"
  | "if_we_do_nothing"
  | "business_impact"
  | "evidence_and_caveats";

export type CxoArtifactSurface =
  | "source"
  | "moves"
  | "intelligence"
  | "tower"
  | "home";

export type CxoStoryPageContract = {
  page: number;
  name: string;
  requiredStoryElement: CxoStoryElement;
  requiredExhibits: CxoExhibitKind[];
  mustAnswer: string;
};

export type CxoArtifactStorytellingContract = {
  id: string;
  surface: CxoArtifactSurface;
  artifactKind: string;
  decisionJob: string;
  requiredStoryElements: CxoStoryElement[];
  requiredBusinessImpacts: CxoBusinessImpactCategory[];
  requiredExhibits: CxoExhibitKind[];
  firstFivePages: CxoStoryPageContract[];
  promptPacketKeys: string[];
  hardFails: string[];
};

export type CxoStoryContractValidation = {
  ok: boolean;
  missingStoryElements: CxoStoryElement[];
  missingBusinessImpacts: CxoBusinessImpactCategory[];
  missingExhibits: CxoExhibitKind[];
  missingPromptPacketKeys: string[];
  pageFailures: string[];
};

export const CXO_BUSINESS_IMPACT_CATEGORIES: CxoBusinessImpactCategory[] = [
  "revenue",
  "cost",
  "risk",
  "speed",
  "customer",
  "compliance",
];

export const CXO_BASE_PROMPT_PACKET_KEYS = [
  "executiveMessage",
  "decisionAsk",
  "storySpine",
  "visualExhibits",
  "businessImpact",
  "evidenceBasis",
  "knownGaps",
  "forbiddenClaims",
] as const;

export const SOURCE_CONTRACT_OPTIMIZATION_STORY_CONTRACT: CxoArtifactStorytellingContract =
  {
    id: "source_contract_optimization_advisory_story_v1",
    surface: "source",
    artifactKind: "source_contract_optimization_brief",
    decisionJob:
      "Decide whether to renew, renegotiate with cure conditions, or prepare a competitive event for an existing managed-services contract.",
    requiredStoryElements: [
      "executive_message",
      "so_what",
      "where_value_is_moving",
      "why_it_happened",
      "what_should_happen",
      "options_and_tradeoffs",
      "commercial_opportunity_map",
      "if_we_do_nothing",
      "business_impact",
      "evidence_and_caveats",
    ],
    requiredBusinessImpacts: ["cost", "risk", "speed", "compliance"],
    requiredExhibits: [
      "decision_card",
      "value_tree",
      "exposure_bridge",
      "trend_chart",
      "root_cause_map",
      "timeline",
      "opportunity_map",
      "scenario_comparison",
      "business_impact_scorecard",
      "evidence_gap_matrix",
    ],
    firstFivePages: [
      {
        page: 1,
        name: "Executive Message",
        requiredStoryElement: "executive_message",
        requiredExhibits: ["decision_card"],
        mustAnswer:
          "What should the executive do, what value/risk supports it, and who owns the next action?",
      },
      {
        page: 2,
        name: "Where Money Is Leaking",
        requiredStoryElement: "where_value_is_moving",
        requiredExhibits: ["value_tree", "exposure_bridge", "trend_chart"],
        mustAnswer:
          "Which leakage drivers explain the commercial opportunity, and how material are they?",
      },
      {
        page: 3,
        name: "Why It Happened",
        requiredStoryElement: "why_it_happened",
        requiredExhibits: ["root_cause_map"],
        mustAnswer:
          "What operating or commercial mechanism created the finding, beyond the metric itself?",
      },
      {
        page: 4,
        name: "What Should Happen",
        requiredStoryElement: "what_should_happen",
        requiredExhibits: ["timeline"],
        mustAnswer:
          "What sequence of cure, reconciliation, vendor response and executive decision should happen next?",
      },
      {
        page: 5,
        name: "Commercial Negotiation Strategy",
        requiredStoryElement: "commercial_opportunity_map",
        requiredExhibits: ["opportunity_map", "business_impact_scorecard"],
        mustAnswer:
          "How do findings translate into negotiation themes and business impact?",
      },
    ],
    promptPacketKeys: [...CXO_BASE_PROMPT_PACKET_KEYS],
    hardFails: [
      "No three-sentence executive message.",
      "No explanation of why the commercial model created the exposure.",
      "No action timeline before renewal/notice deadline.",
      "No do-nothing scenario.",
      "Findings are not mapped to business impact.",
      "Tables or charts are decorative rather than decision-useful.",
      "Missing evidence is hidden instead of caveated.",
    ],
  };

export const MOVES_SOLUTION_BUSINESS_CASE_STORY_CONTRACT: CxoArtifactStorytellingContract =
  {
    id: "moves_solution_business_case_advisory_story_v1",
    surface: "moves",
    artifactKind: "moves_solution_business_case_pack",
    decisionJob:
      "Decide whether to fund, reshape, defer or stop a transformation move.",
    requiredStoryElements: [
      "executive_message",
      "so_what",
      "where_value_is_moving",
      "why_it_happened",
      "what_should_happen",
      "options_and_tradeoffs",
      "if_we_do_nothing",
      "business_impact",
      "evidence_and_caveats",
    ],
    requiredBusinessImpacts: ["revenue", "cost", "risk", "speed", "customer", "compliance"],
    requiredExhibits: [
      "decision_card",
      "options_matrix",
      "architecture_diagram",
      "roadmap_swimlane",
      "scenario_comparison",
      "business_impact_scorecard",
      "evidence_gap_matrix",
    ],
    firstFivePages: [
      {
        page: 1,
        name: "Executive Message",
        requiredStoryElement: "executive_message",
        requiredExhibits: ["decision_card"],
        mustAnswer:
          "Should the sponsor fund, reshape, defer or stop this Move?",
      },
      {
        page: 2,
        name: "What Value Is At Stake",
        requiredStoryElement: "where_value_is_moving",
        requiredExhibits: ["scenario_comparison", "business_impact_scorecard"],
        mustAnswer:
          "Which value, risk, speed, customer and compliance outcomes justify action?",
      },
      {
        page: 3,
        name: "Why This Is The Right Approach",
        requiredStoryElement: "why_it_happened",
        requiredExhibits: ["options_matrix"],
        mustAnswer:
          "Why does the chosen solution option beat the serious alternatives?",
      },
      {
        page: 4,
        name: "How It Becomes Real",
        requiredStoryElement: "what_should_happen",
        requiredExhibits: ["architecture_diagram", "roadmap_swimlane"],
        mustAnswer:
          "What architecture, workstreams, dependencies and gates make the solution executable?",
      },
      {
        page: 5,
        name: "What Happens If We Do Nothing",
        requiredStoryElement: "if_we_do_nothing",
        requiredExhibits: ["scenario_comparison"],
        mustAnswer:
          "What cost, risk, delay or opportunity loss does inaction create?",
      },
    ],
    promptPacketKeys: [...CXO_BASE_PROMPT_PACKET_KEYS],
    hardFails: [
      "No fund/shape/defer/stop recommendation.",
      "No selected solution option or option rationale.",
      "No architecture or roadmap visual.",
      "No sensitivity or scenario view.",
      "No Tower measurement handoff.",
    ],
  };

export const CXO_ARTIFACT_STORYTELLING_CONTRACTS = [
  SOURCE_CONTRACT_OPTIMIZATION_STORY_CONTRACT,
  MOVES_SOLUTION_BUSINESS_CASE_STORY_CONTRACT,
] as const;

export function validateCxoStoryContract(args: {
  contract: CxoArtifactStorytellingContract;
  storyElements: CxoStoryElement[];
  businessImpacts: CxoBusinessImpactCategory[];
  exhibits: CxoExhibitKind[];
  promptPacketKeys: string[];
}): CxoStoryContractValidation {
  const storyElements = new Set(args.storyElements);
  const businessImpacts = new Set(args.businessImpacts);
  const exhibits = new Set(args.exhibits);
  const promptPacketKeys = new Set(args.promptPacketKeys);

  const missingStoryElements = args.contract.requiredStoryElements.filter(
    (item) => !storyElements.has(item),
  );
  const missingBusinessImpacts = args.contract.requiredBusinessImpacts.filter(
    (item) => !businessImpacts.has(item),
  );
  const missingExhibits = args.contract.requiredExhibits.filter(
    (item) => !exhibits.has(item),
  );
  const missingPromptPacketKeys = args.contract.promptPacketKeys.filter(
    (item) => !promptPacketKeys.has(item),
  );
  const pageFailures = args.contract.firstFivePages.flatMap((page) => {
    const failures: string[] = [];
    if (!storyElements.has(page.requiredStoryElement)) {
      failures.push(`Page ${page.page} missing story element ${page.requiredStoryElement}`);
    }
    for (const exhibit of page.requiredExhibits) {
      if (!exhibits.has(exhibit)) {
        failures.push(`Page ${page.page} missing exhibit ${exhibit}`);
      }
    }
    return failures;
  });

  return {
    ok:
      missingStoryElements.length === 0 &&
      missingBusinessImpacts.length === 0 &&
      missingExhibits.length === 0 &&
      missingPromptPacketKeys.length === 0 &&
      pageFailures.length === 0,
    missingStoryElements,
    missingBusinessImpacts,
    missingExhibits,
    missingPromptPacketKeys,
    pageFailures,
  };
}
