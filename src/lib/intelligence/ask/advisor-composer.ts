import type { AskSource } from "./types";
import { getExpertById } from "@/lib/intelligence/expert-pack/registry";
import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";
import type { ExpertRef } from "@/lib/ava-answer/contract";

export type IntelligenceAdvisorRoute = "airline_irops_ai_roi";

const AIRLINE_IROPS_RE =
  /\b(irops|irregular\s+operations?|disruption\s+recovery|reaccommodat(?:e|ion)|re-accommodat(?:e|ion)|ops\s+recovery|operations\s+control|occ)\b/i;
const AIRLINE_CONTEXT_RE =
  /\b(airline|airlines|airport|flight|flights|crew|aircraft|gate|passenger|network|schedule|skyharbor)\b/i;
const VALUE_OR_VISUAL_RE =
  /\b(roi|return|value|benefit|benefits|trend|trends|investment|investments|chart|charts|table|tables|visual|visualize|graph)\b/i;

const AIRLINE_IROPS_EXPERT_IDS = [
  "xp.airline.operations-revenue-management",
  "xp.airline.ground-airport-operations",
  "xp.airline.network-schedule-planning",
  "xp.x.enterprise-architecture",
  "xp.x.ai-governance",
  "xp.x.value-office-ai-enablement",
] as const;

export interface AdvisorComposerInput {
  query: string;
  tenantClientKey?: string | null;
  sources: AskSource[];
  richText?: boolean;
}

export interface AdvisorComposerResult {
  route: IntelligenceAdvisorRoute;
  promptBlock: string;
  expertNames: string[];
  expertRefs: ExpertRef[];
  selectedSourceSummary: {
    tenantEvidenceCount: number;
    corpusEvidenceCount: number;
    publicEvidenceCount: number;
    graphEvidenceCount: number;
  };
}

const AIRLINE_IROPS_ADVISOR_SUPPORT_SOURCES: AskSource[] = [
  {
    type: "PATTERN",
    id: "airline-irops-recovery-orchestration-pattern",
    name: "Airline IROPS recovery orchestration pattern",
    detail:
      "Industry pattern support for disruption prediction moving into recovery orchestration across reaccommodation, crew, aircraft, gates, contact center, maintenance, and operations-control workflows.",
    confidence: 0.78,
  },
  {
    type: "WORLDVIEW",
    id: "airline-irops-ai-roi-planning-ranges",
    name: "Airline IROPS AI ROI planning ranges",
    detail:
      "Expert-pack planning support for IROPS value pools. Treat as directional pattern support unless tenant realized-value evidence is cited separately.",
    confidence: 0.7,
  },
];

export function routeIntelligenceAdvisorQuestion(
  query: string,
): IntelligenceAdvisorRoute | null {
  const normalized = query.trim();
  if (!normalized) return null;
  if (!AIRLINE_IROPS_RE.test(normalized)) return null;
  if (!AIRLINE_CONTEXT_RE.test(normalized)) return null;
  if (!VALUE_OR_VISUAL_RE.test(normalized)) return null;
  return "airline_irops_ai_roi";
}

export function isAirlineIropsAiRoiQuestion(query: string): boolean {
  return routeIntelligenceAdvisorQuestion(query) === "airline_irops_ai_roi";
}

export function advisorSupportSourcesForRoute(query: string): AskSource[] {
  const route = routeIntelligenceAdvisorQuestion(query);
  if (route !== "airline_irops_ai_roi") return [];
  return AIRLINE_IROPS_ADVISOR_SUPPORT_SOURCES;
}

export function withAdvisorSupportSources(
  query: string,
  sources: AskSource[],
): AskSource[] {
  const support = advisorSupportSourcesForRoute(query);
  if (support.length === 0) return sources;
  const seen = new Set(
    sources
      .map((source) => source.id ?? `${source.type}:${source.name}`)
      .filter(Boolean),
  );
  return [
    ...sources,
    ...support.filter(
      (source) => !seen.has(source.id ?? `${source.type}:${source.name}`),
    ),
  ];
}

export function buildIntelligenceAdvisorComposerBlock(
  input: AdvisorComposerInput,
): AdvisorComposerResult | null {
  const route = routeIntelligenceAdvisorQuestion(input.query);
  if (!route) return null;

  const experts = AIRLINE_IROPS_EXPERT_IDS.map((id) => getExpertById(id)).filter(
    (expert): expert is ExpertPack => Boolean(expert),
  );
  const sourceSummary = summarizeSources(input.sources);

  return {
    route,
    expertNames: experts.map((expert) => expert.identity.expertName),
    expertRefs: advisorExpertRefs(experts),
    selectedSourceSummary: sourceSummary,
    promptBlock: [
      "INTELLIGENCE ADVISOR COMPOSER ROUTE",
      `Route: ${route}`,
      "",
      "This is not a generic synthesis. Treat the user question as an airline IROPS AI/ROI advisory brief. Build the answer like a senior airline operations and enterprise-AI consultant briefing a CIO/COO/CFO.",
      "",
      "Evidence order is binding:",
      "1. Use SkyHarbor / tenant read-model facts first for tenant-specific claims.",
      "2. Use airline corpus / genome patterns for industry pattern claims.",
      "3. Use expert-pack benchmarks and operating metrics as planning ranges only.",
      "4. Use public/current research only if it appears in the supplied sources. If it is not supplied, say public live research is not available in this answer and do not invent named public facts.",
      "",
      "Required expert lenses:",
      ...experts.map((expert) => `- ${formatExpertLens(expert)}`),
      "",
      "Required answer agenda:",
      "1. Open with a direct 2-4 sentence executive answer: what airlines are doing with IROPS AI, why ROI exists, and what SkyHarbor should understand before investing.",
      "2. Explain the market trend: prediction is moving toward recovery orchestration across passenger reaccommodation, crew, aircraft, gates, maintenance, contact center, and operations-control workflows.",
      "3. Include a named examples table with columns: Airline / organization, AI/IROPS use case, operational focus, reported outcome / claim, source type, confidence. If no public examples are supplied, label rows as corpus pattern / not public live research instead of pretending.",
      "4. Include an ROI / value pool table with columns: Value lever, typical quantified range or directional value, evidence source, applicability to SkyHarbor, caveat.",
      "5. Add a SkyHarbor relevance panel using tenant facts: flight operations systems, operations technology ownership, applications/integrations, data/analytics estate, AI initiatives, vendors/contracts, risks/gaps, and data-product maturity.",
      "6. Name exact missing evidence when thin: crew legality data, real-time aircraft/crew/passenger event streams, IROPS recovery workflow data, platform/tool lineage, realized-value evidence, or named owner evidence.",
      "7. Explain data and architecture prerequisites: real-time crew, aircraft, passenger, gate, maintenance, weather, and network data; recovery rules and crew legality; PSS/DCS/crew/ops integrations; event-driven architecture; decision audit trail; value baseline.",
      "8. End with an Intelligence decision frame: where to scale, where to hold, which Move/Tower controls to create, and the next analysis options.",
      "",
      "Artifact requirement:",
      "If the user asks for charts, tables, graphs, trends, ROI, or visuals, produce at least one valid GitHub-flavored Markdown table as a standalone block. Do not put table pipes inline inside a paragraph.",
      "",
      "Table formatting contract:",
      "- Put a blank line before every table.",
      "- Put the table title on its own line, then the header row immediately below it.",
      "- Every table must have a header row, a separator row, and at least two data rows.",
      "- Never write a table title like 'Named Examples Table' unless a complete table immediately follows.",
      "- Never emit orphan fragments such as 'S. S.', partial separator rows, or abbreviated row leftovers.",
      "- For chart-like output, include a compact numeric table with columns: Value lever, Low estimate, High estimate, Unit, Basis, Caveat.",
      "- For relationship output, include From | Relationship | To | Evidence rows only when connected evidence exists.",
      "",
      "Quality gates you must satisfy:",
      "- Do not start with row counts, retrieval mechanics, or 'I found X records'.",
      "- Do not expose raw internal IDs.",
      "- Do not treat corpus, expert benchmarks, vendor claims, or public examples as SkyHarbor facts.",
      "- Do not fabricate tenant ROI. If SkyHarbor lacks realized-value evidence, say the tenant-specific ROI case is not loaded and give planning ranges separately.",
      "- Do not sound like a database report. Sound like a senior consultant with source discipline.",
      "",
      "Source inventory seen by this composer:",
      `- Tenant/SkyHarbor evidence sources: ${sourceSummary.tenantEvidenceCount}`,
      `- Corpus/pattern/worldview evidence sources: ${sourceSummary.corpusEvidenceCount}`,
      `- Public/research/benchmark evidence sources: ${sourceSummary.publicEvidenceCount}`,
      `- Graph evidence sources: ${sourceSummary.graphEvidenceCount}`,
    ].join("\n"),
  };
}

export function expertRefsForAdvisorRoute(query: string): ExpertRef[] {
  const route = routeIntelligenceAdvisorQuestion(query);
  if (!route) return [];
  return advisorExpertRefs(
    AIRLINE_IROPS_EXPERT_IDS.map((id) => getExpertById(id)).filter(
      (expert): expert is ExpertPack => Boolean(expert),
    ),
  );
}

export function chooseAdvisorTokenBudget(query: string, fallback: number): number {
  return isAirlineIropsAiRoiQuestion(query) ? 1800 : fallback;
}

export function chooseAdvisorWordCap(query: string, fallback: number): number {
  return isAirlineIropsAiRoiQuestion(query) ? 950 : fallback;
}

function summarizeSources(sources: AskSource[]): AdvisorComposerResult["selectedSourceSummary"] {
  return sources.reduce(
    (summary, source) => {
      if (source.type === "TENANT" || source.type === "SURFACE") {
        summary.tenantEvidenceCount += 1;
      }
      if (source.type === "PATTERN" || source.type === "WORLDVIEW" || source.type === "TOPIC") {
        summary.corpusEvidenceCount += 1;
      }
      if (
        source.type === "RESEARCH" ||
        source.type === "BENCHMARK" ||
        source.type === "REGULATION"
      ) {
        summary.publicEvidenceCount += 1;
      }
      if (source.type === "GRAPH") {
        summary.graphEvidenceCount += 1;
      }
      return summary;
    },
    {
      tenantEvidenceCount: 0,
      corpusEvidenceCount: 0,
      publicEvidenceCount: 0,
      graphEvidenceCount: 0,
    },
  );
}

function formatExpertLens(expert: ExpertPack): string {
  const metrics = expert.domain.operatingMetrics
    .slice(0, 3)
    .map((metric) => metric.name)
    .join("; ");
  const useCases = expert.domain.aiUseCaseArchetypes
    .slice(0, 3)
    .map((useCase) => useCase.name)
    .join("; ");
  return `${expert.identity.expertName}: ${expert.identity.scopeNote} Focus metrics: ${metrics}. AI plays: ${useCases}.`;
}

function advisorExpertRefs(experts: ExpertPack[]): ExpertRef[] {
  return experts.slice(0, 3).map((expert) => ({
    id: expert.identity.id,
    name: expert.identity.expertName,
  }));
}
