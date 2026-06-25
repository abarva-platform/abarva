import type {
  DossierArtifactType,
  DossierDimensionFamily,
  DossierSurface,
} from "@/lib/semantic-dossiers";

export type HomeAnswerRelevanceIssue =
  | "wrong_dimension_binder"
  | "missing_decision_handoff"
  | "missing_requested_table"
  | "missing_requested_chart"
  | "missing_requested_graph"
  | "internal_dossier_language"
  | "count_instead_of_insight"
  | "does_not_directly_answer_question"
  | "misleading_no_blocking_gap";

export interface HomeAnswerRelevanceInput {
  question: string;
  answerText: string;
  primaryDimension: DossierDimensionFamily;
  relatedDimensions: DossierDimensionFamily[];
  targetSurface?: DossierSurface | null;
  handoffTarget?: DossierSurface | null;
  artifactPlan?: DossierArtifactType[];
  tablesCount?: number;
  chartsCount?: number;
  graphsCount?: number;
}

export interface HomeAnswerRelevanceResult {
  passed: boolean;
  expectedPrimaryDimension: DossierDimensionFamily;
  expectedAdjacentDimensions: DossierDimensionFamily[];
  expectedTargetSurface: DossierSurface;
  requestedArtifacts: DossierArtifactType[];
  issues: HomeAnswerRelevanceIssue[];
}

const DIMENSION_KEYWORDS: Record<DossierDimensionFamily, RegExp[]> = {
  organization_leadership: [
    /\b(organi[sz]ation|organi[sz]ed|leader|leadership|cio|cto|ciso|cdao|cdto|owner|ownership|accountab|portfolio|team|function|workforce)\b/i,
  ],
  application_systems: [
    /\b(apps?|applications?|systems?|platforms?|technology|cmdb|integrations?|interfaces?|dependencies?|dependency|lifecycle|end of life|unsupported|system of record|connected)\b/i,
  ],
  vendor_contracts: [
    /\b(vendors?|contracts?|licenses?|renewals?|suppliers?|commercial|pricing|sourcing)\b/i,
  ],
  data_analytics: [
    /\b(data|analytics|warehouse|lakehouse|bi|tableau|power bi|databricks|lineage|data product|data products)\b/i,
  ],
  operations_process: [
    /\b(service now|servicenow|jira|ticket|incident|change|problem|bottleneck|handoff|process|operational friction|repetitive|operations|service)\b/i,
  ],
  ai_value_governance: [
    /\b(ai|agent|automation|automate|llm|ai model|machine learning model|value|benefit|roi|initiative|initiatives|adoption)\b/i,
  ],
  budget_financials: [
    /\b(cost|budget|spend|finance|financial|run|change|funding|dollars?|investment)\b/i,
  ],
  risk_compliance: [
    /\b(risk|control|compliance|governance|security|audit|cyber)\b/i,
  ],
  source_moves_tower: [
    /\b(source|rfp|bafo|move|deliverable|phase|architecture|roadmap|tower|realized|prove|value leakage)\b/i,
  ],
};

const ADJACENT_DIMENSIONS: Record<DossierDimensionFamily, DossierDimensionFamily[]> = {
  organization_leadership: [
    "application_systems",
    "budget_financials",
    "operations_process",
    "risk_compliance",
  ],
  application_systems: [
    "organization_leadership",
    "vendor_contracts",
    "data_analytics",
    "operations_process",
    "budget_financials",
    "risk_compliance",
  ],
  vendor_contracts: ["application_systems", "budget_financials", "risk_compliance"],
  data_analytics: [
    "application_systems",
    "organization_leadership",
    "ai_value_governance",
    "operations_process",
  ],
  operations_process: [
    "application_systems",
    "organization_leadership",
    "ai_value_governance",
  ],
  ai_value_governance: [
    "data_analytics",
    "operations_process",
    "risk_compliance",
    "budget_financials",
  ],
  budget_financials: [
    "vendor_contracts",
    "application_systems",
    "organization_leadership",
    "ai_value_governance",
  ],
  risk_compliance: [
    "application_systems",
    "ai_value_governance",
    "vendor_contracts",
  ],
  source_moves_tower: [
    "vendor_contracts",
    "ai_value_governance",
    "risk_compliance",
  ],
};

const DECISION_RE =
  /\b(should|recommend|prioriti[sz]e|decide|invest|investment|option|roadmap|sequence|sequencing|kill|scale|stop|bet|bets|next \$?\d|where should|what would you tell|single biggest constraint|most defensible|behind peers|close the gap)\b/i;
const TABLE_RE = /\b(table|tabulate|list)\b/i;
const CHART_RE = /\b(chart|bar chart|visuali[sz]e|waterfall|curve|plot)\b/i;
const GRAPH_RE = /\b(graph|map|topology|lineage|dependency|dependencies|relationship|relationships|blast radius)\b/i;
const INTERNAL_LANGUAGE_RE =
  /\b(dossier|binder|dimension family|primary dimension|related dimension|source families|sections attached|composer packet|semantic packet|artifact plan|answer boundary|quality gate|gate passed|gate failed)\b/i;
const COUNT_LEAD_RE =
  /^\s*(?:[#*\-\s]*)(?:there\s+(?:are|were)|we\s+have|loaded|the loaded context (?:has|contains|includes)|\d[\d,]*)\b/i;
const NO_BLOCKING_GAP_RE = /\b(no blocking gap|no blocker|nothing blocking)\b/i;

export function assessHomeAnswerRelevance(
  input: HomeAnswerRelevanceInput,
): HomeAnswerRelevanceResult {
  const expectedPrimaryDimension = inferExpectedPrimaryDimension(input.question);
  const expectedAdjacentDimensions = ADJACENT_DIMENSIONS[expectedPrimaryDimension];
  const expectedTargetSurface = DECISION_RE.test(input.question)
    ? "intelligence"
    : "home";
  const requestedArtifacts = requestedArtifactsFor(input.question);
  const issues: HomeAnswerRelevanceIssue[] = [];
  const answer = input.answerText.trim();

  if (
    input.primaryDimension !== expectedPrimaryDimension &&
    !input.relatedDimensions.includes(expectedPrimaryDimension)
  ) {
    issues.push("wrong_dimension_binder");
  }
  if (
    expectedTargetSurface !== "home" &&
    input.handoffTarget !== expectedTargetSurface &&
    input.targetSurface !== expectedTargetSurface
  ) {
    issues.push("missing_decision_handoff");
  }
  if (requestedArtifacts.includes("table") && (input.tablesCount ?? 0) < 1) {
    issues.push("missing_requested_table");
  }
  if (requestedArtifacts.includes("chart") && (input.chartsCount ?? 0) < 1) {
    issues.push("missing_requested_chart");
  }
  if (requestedArtifacts.includes("graph") && (input.graphsCount ?? 0) < 1) {
    issues.push("missing_requested_graph");
  }
  if (INTERNAL_LANGUAGE_RE.test(answer)) {
    issues.push("internal_dossier_language");
  }
  if (COUNT_LEAD_RE.test(firstSentence(answer))) {
    issues.push("count_instead_of_insight");
  }
  if (!directlyAnswersQuestion(input.question, answer)) {
    issues.push("does_not_directly_answer_question");
  }
  if (
    NO_BLOCKING_GAP_RE.test(answer) &&
    (requestedArtifacts.length > 0 || expectedTargetSurface !== "home")
  ) {
    issues.push("misleading_no_blocking_gap");
  }

  return {
    passed: issues.length === 0,
    expectedPrimaryDimension,
    expectedAdjacentDimensions,
    expectedTargetSurface,
    requestedArtifacts,
    issues: [...new Set(issues)],
  };
}

export function inferExpectedPrimaryDimension(
  question: string,
): DossierDimensionFamily {
  const q = question.toLowerCase();
  if (/\b(risks?|controls?|compliance|governance|security|audit|cyber)\b/.test(q)) {
    return "risk_compliance";
  }
  const orderedDimensions: DossierDimensionFamily[] = [
    "organization_leadership",
    "vendor_contracts",
    "data_analytics",
    "operations_process",
    "ai_value_governance",
    "budget_financials",
    "risk_compliance",
    "application_systems",
    "source_moves_tower",
  ];
  for (const dimension of orderedDimensions) {
    if (DIMENSION_KEYWORDS[dimension].some((pattern) => pattern.test(q))) {
      return dimension;
    }
  }
  return "organization_leadership";
}

function requestedArtifactsFor(question: string): DossierArtifactType[] {
  const artifacts: DossierArtifactType[] = [];
  if (TABLE_RE.test(question)) artifacts.push("table");
  if (CHART_RE.test(question)) artifacts.push("chart");
  if (GRAPH_RE.test(question)) artifacts.push("graph");
  return artifacts;
}

function directlyAnswersQuestion(question: string, answer: string): boolean {
  if (!answer.trim()) return false;
  const importantTerms = question
    .toLowerCase()
    .replace(/[^a-z0-9\s$]/g, " ")
    .split(/\s+/)
    .filter(
      (term) =>
        term.length >= 4 &&
        ![
          "what",
          "which",
          "where",
          "when",
          "does",
          "about",
          "today",
          "tell",
          "from",
          "with",
          "show",
          "give",
          "table",
          "chart",
          "graph",
          "loaded",
          "context",
          "current",
          "most",
        ].includes(term),
    );
  if (importantTerms.length === 0) return true;
  const answerLower = answer.toLowerCase();
  const matches = importantTerms.filter((term) => {
    if (answerLower.includes(term)) return true;
    if (term.endsWith("s") && answerLower.includes(term.slice(0, -1))) return true;
    if (term.endsWith("ies") && answerLower.includes(`${term.slice(0, -3)}y`)) return true;
    if (term.endsWith("ed") && answerLower.includes(term.slice(0, -2))) return true;
    return false;
  });
  return matches.length >= Math.min(2, importantTerms.length);
}

function firstSentence(text: string): string {
  return text.split(/(?<=[.!?])\s/)[0] ?? text;
}
