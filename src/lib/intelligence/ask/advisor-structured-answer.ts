import type {
  AnswerChart,
  AnswerTable,
  AvaAnswerPacket,
  AvaArtifact,
  AvaCaveat,
  AvaExpertRef,
  AvaNextStep,
} from "@/lib/ava-answer/contract";
import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type { RoutingDecision } from "@/lib/intelligence/answer/router";
import {
  answerCitationsFromAskSources,
  buildStructuredExhibits,
} from "@/lib/intelligence/answer/structured-exhibits";
import type { AskSource } from "@/lib/intelligence/ask/types";
import {
  routeIntelligenceAdvisorQuestion,
} from "@/lib/intelligence/ask/advisor-composer";

export interface StructuredAdvisorAnswerInput {
  query: string;
  tenantKey: string;
  assistantText: string;
  routing: RoutingDecision;
  sources: AskSource[];
  expertsUsed: AvaExpertRef[];
}

export interface StructuredAdvisorAnswer {
  answer: AvaAnswerPacket;
  followUpQuestion: string | null;
}

export function shouldUseStructuredAdvisorAnswer(query: string): boolean {
  return routeIntelligenceAdvisorQuestion(query) !== null;
}

export function buildStructuredAdvisorAnswer(
  input: StructuredAdvisorAnswerInput,
): StructuredAdvisorAnswer | null {
  const route = routeIntelligenceAdvisorQuestion(input.query);
  if (!route) return null;
  if (route === "airline_irops_ai_roi") {
    return buildAirlineIropsAdvisorAnswer(input);
  }
  return buildEnterpriseFunctionAdvisorAnswer(input);
}

function buildAirlineIropsAdvisorAnswer(
  input: StructuredAdvisorAnswerInput,
): StructuredAdvisorAnswer {
  const citations = answerCitationsFromAskSources(input.sources);
  const citationIds = citations.map((citation) => citation.id);
  const tenantName = tenantLabelForAdvisor(input);
  const wantsChart = /\b(chart|charts|visual|visuali[sz]e|plot)\b/i.test(
    input.query,
  );
  const table = airlineIropsEvidenceTable(citationIds, tenantName);
  const artifacts: AvaArtifact[] = [{ ...table, artifact: "table" }];
  if (wantsChart) {
    artifacts.push({
      ...airlineIropsReadinessChart(citationIds, tenantName),
      artifact: "chart",
    });
  }
  const caveats: AvaCaveat[] = [
    {
      id: "corpus-pattern-boundary",
      label: "Pattern boundary",
      detail:
        "The quantified ranges are corpus and expert-pack planning ranges, not verified public disclosures or tenant-realized ROI.",
    },
    {
      id: "tenant-roi-gap",
      label: "Tenant ROI gap",
      detail: `${tenantName} needs baseline IROPS cost per event, recovery-cycle time, customer impact, adoption, and realized-value evidence before claiming tenant-specific ROI.`,
    },
  ];
  const directAnswer = [
    "Airlines are moving IROPS AI from alerting toward recovery orchestration: the value is not just predicting disruption, but recomputing aircraft, crew, gates, passenger reaccommodation, contact-center load, maintenance constraints, and operations-control tradeoffs fast enough to change the operating plan.",
    `For ${tenantName}, the investable question is whether the operational data loop is certified enough to trust the recommendation. Real-time aircraft, crew, passenger, gate, maintenance, weather, and network events need lineage, freshness controls, crew-legality rules, recovery workflow data, and auditable write-back before scale funding is credible.`,
    `The ROI case should stay as a planning range until tenant realized-value evidence is loaded. Corpus patterns point to lower disruption cost, faster recovery cycles, and reduced service load; they do not prove a ${tenantName}-specific return without the baseline and post-change telemetry.`,
  ].join("\n\n");
  const followUpQuestion =
    "Want me to pressure-test the IROPS data-readiness gate, or sequence IROPS against the other AI bets?";
  const answer = composeAvaAnswer({
    surface: "intelligence",
    mode: "ANALYZE",
    tenantKey: input.tenantKey,
    question: input.query,
    intent: "advisor_airline_irops_ai_roi",
    status: "answered",
    directAnswer,
    artifacts,
    citations,
    caveats,
    nextSteps: [followUpNextStep(followUpQuestion)],
    expertsUsed: input.expertsUsed,
    corpusUsed: [
      {
        id: "corpus-support",
        label: "Airline IROPS AI corpus patterns",
        corpusType: "planning-range",
        confidence: "medium",
      },
    ],
    retrievalSummary: {
      substrate: "module_read_model",
      sourceCount: citations.length,
      hasTenantFacts: citations.some(
        (citation) => citation.sourceClass === "tenant-fact",
      ),
      hasCorpus: citations.some(
        (citation) => citation.sourceClass !== "tenant-fact",
      ),
      hasExperts: input.expertsUsed.length > 0,
    },
  });
  return { answer, followUpQuestion };
}

function buildEnterpriseFunctionAdvisorAnswer(
  input: StructuredAdvisorAnswerInput,
): StructuredAdvisorAnswer {
  const exhibits = buildStructuredExhibits({
    prose: input.assistantText,
    routing: input.routing,
    sources: input.sources,
  });
  const citations = exhibits.citations;
  const hasTenantFacts = citations.some(
    (citation) => citation.sourceClass === "tenant-fact",
  );
  const cleanedProse = cleanAdvisorProse(exhibits.prose || input.assistantText);
  const tableArtifacts =
    exhibits.tables.length > 0 && !isGenericEvidenceRequired(exhibits.tables[0])
      ? exhibits.tables
      : [sourceEvidenceTable(input.sources, citations.map((citation) => citation.id))];
  const artifacts: AvaArtifact[] = [
    ...tableArtifacts.map((table) => ({ ...table, artifact: "table" as const })),
    ...exhibits.charts.map((chart) => ({ ...chart, artifact: "chart" as const })),
    ...exhibits.graphs.map((graph) => ({ ...graph, artifact: "graph" as const })),
  ];
  const followUpQuestion = followUpForEnterpriseFunction(input.query);
  const answer = composeAvaAnswer({
    surface: "intelligence",
    mode: "ANALYZE",
    tenantKey: input.tenantKey,
    question: input.query,
    intent: `advisor_${input.routing.outputShape}`,
    status: hasTenantFacts ? "answered" : "partial",
    directAnswer:
      cleanedProse ||
      (hasTenantFacts
        ? "The available tenant context supports an advisory view, but the precise fields needed for a stronger answer are still thin. I am showing the evidence table instead of filling the gap with assumptions."
        : "I do not see tenant evidence for this advisory question. I am showing the relevant pattern support and the evidence gap instead of generating a tenant-specific recommendation."),
    artifacts,
    citations,
    caveats: [
      {
        id: "advisor-evidence-boundary",
        label: "Evidence boundary",
        detail:
          "Tenant-specific claims require tenant citations; pattern-only guidance is directional until tenant evidence is loaded.",
      },
    ],
    nextSteps: [followUpNextStep(followUpQuestion)],
    expertsUsed: input.expertsUsed,
    corpusUsed: citations.some((citation) => citation.sourceClass !== "tenant-fact")
      ? [{ id: "corpus-support", label: "Corpus or pattern support" }]
      : [],
    retrievalSummary: {
      substrate: "module_read_model",
      sourceCount: citations.length,
      hasTenantFacts,
      hasCorpus: citations.some(
        (citation) => citation.sourceClass !== "tenant-fact",
      ),
      hasExperts: input.expertsUsed.length > 0,
    },
  });
  return { answer, followUpQuestion };
}

function tenantLabelForAdvisor(input: StructuredAdvisorAnswerInput): string {
  void input;
  return "the tenant";
}

function airlineIropsEvidenceTable(
  citationIds: string[],
  tenantName: string,
): AnswerTable {
  return {
    id: "airline-irops-value-evidence",
    title: "IROPS AI Value Evidence",
    columns: [
      { key: "carrier_pattern", label: "Carrier (pattern)" },
      { key: "use_case", label: "Use case" },
      { key: "mechanism", label: "Mechanism" },
      { key: "value_range", label: "Value range" },
      { key: "basis", label: "Basis" },
      { key: "confidence", label: "Confidence" },
    ],
    rows: [
      {
        carrier_pattern: "Network carrier corpus pattern",
        use_case: "Integrated OCC recovery optimizer",
        mechanism: "Aircraft, crew, passenger, gates, and maintenance in one recovery loop",
        value_range: "10-20% IROPS cost/event reduction",
        basis: "Corpus pattern - not public live research",
        confidence: "medium",
      },
      {
        carrier_pattern: "Hub airline corpus pattern",
        use_case: "Disruption recovery assistant",
        mechanism: "Passenger reaccommodation plus contact-center deflection",
        value_range: "30-40 min recovery-cycle reduction",
        basis: "Expert-pack planning range - directional",
        confidence: "medium",
      },
      {
        carrier_pattern: `${tenantName} tenant evidence`,
        use_case: "Operational data-readiness gate",
        mechanism: "Lineage, freshness, legality rules, workflow telemetry, and write-back controls",
        value_range: "No tenant ROI claim until baseline and realized-value data are loaded",
        basis: "Tenant evidence boundary",
        confidence: "high",
      },
    ],
    note:
      "Rows separate tenant evidence from corpus pattern support. Planning ranges are directional until tenant baseline and realized-value evidence are loaded.",
    citationIds,
  };
}

function airlineIropsReadinessChart(
  citationIds: string[],
  tenantName: string,
): AnswerChart {
  return {
    id: "airline-irops-opportunity-readiness",
    kind: "range-bar",
    title: "IROPS AI Opportunity Readiness",
    data: {
      low: 0.25,
      base: 0.55,
      high: 0.8,
      lowLabel: "Data gate open",
      baseLabel: "Bounded orchestration",
      highLabel: "Full recovery loop",
      directionalOnly: true,
      caveat: `Directional corpus range only; tenant-specific ROI requires ${tenantName} baseline and realized-value evidence.`,
    },
    builder: "opportunityRangeBar",
    citationIds,
  };
}

function cleanAdvisorProse(prose: string): string {
  const withoutTables = prose
    .split(/\r?\n/)
    .filter((line) => (line.match(/\|/g) ?? []).length < 2)
    .join("\n");
  return withoutTables
    .replace(/\bThe supporting evidence is that\s+For\b/g, "For")
    .replace(/\bThat means\s+The\b/g, "The")
    .replace(/\b(Read|Evidence|Implication):\s*\1:\s*/gi, "$1: ")
    .replace(/\bS\.\s*$/g, "")
    .replace(
      /\b(?:have|ask)\s+the accountable owner review the listed sources and decide whether this belongs in Source, Tower, or Moves\.?/gi,
      "",
    )
    .replace(
      /\bThis is an advisory synthesis: use the cited tenant context for client-specific claims and treat corpus\/expert context as pattern support\.?/gi,
      "",
    )
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isGenericEvidenceRequired(table: AnswerTable | undefined): boolean {
  if (!table) return false;
  return (
    table.id === "answer-evidence-required" ||
    /Evidence Required/i.test(table.title ?? "")
  );
}

function sourceEvidenceTable(
  sources: AskSource[],
  citationIds: string[],
): AnswerTable {
  const rows = sources.slice(0, 5).map((source) => ({
    source: source.name || source.id || "Retrieved evidence",
    class: source.type.toLowerCase(),
    signal: source.detail || "Related evidence retrieved.",
    caveat:
      source.type === "TENANT" || source.type === "SURFACE"
        ? "tenant cited"
        : "pattern support",
  }));
  return {
    id: "advisor-source-evidence",
    title: "Evidence Used",
    columns: [
      { key: "source", label: "Source" },
      { key: "class", label: "Class" },
      { key: "signal", label: "Signal" },
      { key: "caveat", label: "Boundary" },
    ],
    rows:
      rows.length > 0
        ? rows
        : [
            {
              source: "No cited source returned",
              class: "none",
              signal: "The route did not retrieve source evidence.",
              caveat: "answer should remain partial",
            },
          ],
    note:
      "Fallback evidence table used because no clean row/column artifact was emitted by the model.",
    citationIds,
  };
}

function followUpForEnterpriseFunction(query: string): string {
  if (/\b(sequence|prioriti[sz]e|scale|hold|kill|stop|invest)\b/i.test(query)) {
    return "Want me to turn this into a scale/hold/stop decision view with evidence gates?";
  }
  if (/\b(risk|control|governance|gap)\b/i.test(query)) {
    return "Want me to separate loaded risks from missing controls and owner gaps?";
  }
  if (/\b(chart|visual|table|graph|map)\b/i.test(query)) {
    return "Want me to switch this view into a chart, table, or relationship graph?";
  }
  return "Want me to compare this against the most relevant corpus patterns and expert lenses?";
}

function followUpNextStep(question: string): AvaNextStep {
  return {
    id: "advisor-follow-up",
    label: question,
    rationale: "Continue the Intelligence advisory analysis from the current evidence boundary.",
    targetSurface: "intelligence",
  };
}
