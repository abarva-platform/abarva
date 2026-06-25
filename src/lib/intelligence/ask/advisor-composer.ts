import type { AskSource } from "./types";
import { getExpertById } from "@/lib/intelligence/expert-pack/registry";
import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";
import type { ExpertRef } from "@/lib/ava-answer/contract";

export type IntelligenceAdvisorRoute =
  | "airline_irops_ai_roi"
  | "enterprise_function_artifact";

const AIRLINE_IROPS_RE =
  /\b(irops|irregular\s+operations?|disruption\s+recovery|reaccommodat(?:e|ion)|re-accommodat(?:e|ion)|ops\s+recovery|operations\s+control|occ)\b/i;
const AIRLINE_CONTEXT_RE =
  /\b(airline|airlines|airport|flight|flights|crew|aircraft|gate|passenger|network|schedule|skyharbor)\b/i;
const VALUE_OR_VISUAL_RE =
  /\b(roi|return|value|benefit|benefits|trend|trends|investment|investments|chart|charts|table|tables|visual|visualize|graph)\b/i;
const FUNCTION_ARTIFACT_RE =
  /\b(table|tables|chart|charts|visuali[sz]e|visual|graph|map|compare|list|show|break\s?down|which|where should|how should|consider|opportunit(?:y|ies)|prioriti[sz]e|recommend)\b/i;

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

interface EnterpriseFunctionRoute {
  key: string;
  label: string;
  requiredArtifact: "table" | "chart" | "graph";
  columns: string;
  supportSource: AskSource;
}

const ENTERPRISE_FUNCTION_ROUTES: EnterpriseFunctionRoute[] = [
  {
    key: "finance",
    label: "IT finance, budget, and run-cost",
    requiredArtifact: "table",
    columns:
      "Portfolio / category | Loaded amount | Run/change posture | Evidence | Gap / caveat",
    supportSource: {
      type: "WORLDVIEW",
      id: "enterprise-it-finance-run-cost-analysis-pattern",
      name: "Enterprise IT finance and run-cost analysis pattern",
      detail:
        "Advisor pattern for turning loaded budget, run-cost, initiative, and contract evidence into finance tables while separating loaded tenant figures from missing run/change line-item splits.",
      confidence: 0.68,
    },
  },
  {
    key: "vendors",
    label: "vendor spend and concentration",
    requiredArtifact: "chart",
    columns:
      "Vendor / contract | Loaded spend | Concentration or risk signal | Evidence | Caveat",
    supportSource: {
      type: "WORLDVIEW",
      id: "enterprise-vendor-concentration-risk-pattern",
      name: "Enterprise vendor concentration and contract-risk pattern",
      detail:
        "Advisor pattern for vendor concentration, renewal exposure, utilization, and contract-risk reads. Treat as pattern support unless tenant contract rows cite exact figures.",
      confidence: 0.7,
    },
  },
  {
    key: "applications",
    label: "application portfolio and modernization",
    requiredArtifact: "table",
    columns:
      "Application / system | Capability or owner | Modernization posture | Loaded risk | Caveat",
    supportSource: {
      type: "PATTERN",
      id: "enterprise-application-modernization-portfolio-pattern",
      name: "Enterprise application modernization portfolio pattern",
      detail:
        "Advisor pattern for application posture, lifecycle, criticality, integration, and modernization sequencing. Tenant-specific system claims require loaded application evidence.",
      confidence: 0.72,
    },
  },
  {
    key: "integrations",
    label: "integration topology and dependency graph",
    requiredArtifact: "graph",
    columns:
      "From | Relationship | To | Evidence | Confidence",
    supportSource: {
      type: "PATTERN",
      id: "enterprise-integration-topology-pattern",
      name: "Enterprise integration topology and dependency pattern",
      detail:
        "Advisor pattern for representing systems, vendors, data products, and capabilities as cited dependency edges. Graphs require source-to-target edge evidence or an explicit edge-data gap.",
      confidence: 0.74,
    },
  },
  {
    key: "data_products",
    label: "data products and analytics readiness",
    requiredArtifact: "table",
    columns:
      "Data product / domain | Maturity | Owner / team | AI readiness | Gap / caveat",
    supportSource: {
      type: "PATTERN",
      id: "enterprise-data-product-ai-readiness-pattern",
      name: "Enterprise data-product AI-readiness pattern",
      detail:
        "Advisor pattern for data-product maturity, ownership, freshness, lineage, and AI readiness. Missing registry fields should be named as gaps instead of broad not-loaded language.",
      confidence: 0.72,
    },
  },
  {
    key: "workforce",
    label: "workforce AI and productivity",
    requiredArtifact: "table",
    columns:
      "Function | AI opportunity | Readiness | Benefit range / signal | Evidence quality",
    supportSource: {
      type: "WORLDVIEW",
      id: "enterprise-workforce-ai-productivity-pattern",
      name: "Enterprise workforce AI productivity pattern",
      detail:
        "Advisor pattern for workforce AI opportunity scans across operations, contact center, corporate functions, and field/service work. Planning ranges are pattern-only unless tenant value evidence exists.",
      confidence: 0.66,
    },
  },
  {
    key: "risk_controls",
    label: "risk, governance, and controls",
    requiredArtifact: "table",
    columns:
      "Risk | Control / mitigation | Owner | Severity | Evidence / gap",
    supportSource: {
      type: "PATTERN",
      id: "enterprise-ai-risk-control-pattern",
      name: "Enterprise AI risk and control pattern",
      detail:
        "Advisor pattern for model risk, data lineage, access control, auditability, regulatory, and operational-resilience controls. Control claims require loaded control or risk evidence.",
      confidence: 0.7,
    },
  },
  {
    key: "initiatives",
    label: "initiative portfolio and prioritization",
    requiredArtifact: "table",
    columns:
      "Initiative | Impact / value | Owner | Dependency / risk | Scale-hold-stop posture",
    supportSource: {
      type: "PATTERN",
      id: "enterprise-initiative-portfolio-sequencing-pattern",
      name: "Enterprise initiative portfolio sequencing pattern",
      detail:
        "Advisor pattern for comparing initiatives by value, risk, dependency, owner, and stage-gate posture. Recommendations must cite tenant initiative evidence or be labeled pattern-only.",
      confidence: 0.72,
    },
  },
  {
    key: "benefits",
    label: "benefits realization and value leakage",
    requiredArtifact: "chart",
    columns:
      "Value lever | Loaded realized value | At-risk value | Evidence | Gap / caveat",
    supportSource: {
      type: "WORLDVIEW",
      id: "enterprise-benefits-realization-value-leakage-pattern",
      name: "Enterprise benefits realization and value-leakage pattern",
      detail:
        "Advisor pattern for separating realized value, committed value, at-risk value, benefit leakage, and missing value-ledger evidence.",
      confidence: 0.68,
    },
  },
  {
    key: "operations",
    label: "operations and process bottlenecks",
    requiredArtifact: "table",
    columns:
      "Process | Bottleneck | Business impact | Root cause | Next decision",
    supportSource: {
      type: "PATTERN",
      id: "enterprise-operational-bottleneck-pattern",
      name: "Enterprise operational bottleneck analysis pattern",
      detail:
        "Advisor pattern for process bottlenecks, operating constraints, root causes, and decision handoffs. Tenant-specific bottlenecks require cited process, KPI, incident, or initiative evidence.",
      confidence: 0.69,
    },
  },
  {
    key: "architecture",
    label: "enterprise architecture constraints",
    requiredArtifact: "table",
    columns:
      "Constraint | Business impact | Dependency | Status / posture | Evidence",
    supportSource: {
      type: "PATTERN",
      id: "enterprise-architecture-constraint-pattern",
      name: "Enterprise architecture constraint pattern",
      detail:
        "Advisor pattern for architecture constraints across legacy platforms, identity, data, APIs, integration, and resilience. Tenant facts must anchor specific system or platform claims.",
      confidence: 0.73,
    },
  },
  {
    key: "customer",
    label: "customer operations and front-office AI",
    requiredArtifact: "table",
    columns:
      "Journey / operation | AI opportunity | Value hypothesis | Readiness | Caveat",
    supportSource: {
      type: "WORLDVIEW",
      id: "enterprise-customer-operations-front-office-ai-pattern",
      name: "Enterprise customer operations and front-office AI pattern",
      detail:
        "Advisor pattern for customer operations, contact-center AI, agent assist, personalization, service recovery, and governance caveats. Industry value ranges are pattern-only unless tenant evidence is loaded.",
      confidence: 0.68,
    },
  },
];

export function routeIntelligenceAdvisorQuestion(
  query: string,
): IntelligenceAdvisorRoute | null {
  const normalized = query.trim();
  if (!normalized) return null;
  if (
    AIRLINE_IROPS_RE.test(normalized) &&
    AIRLINE_CONTEXT_RE.test(normalized) &&
    VALUE_OR_VISUAL_RE.test(normalized)
  ) {
    return "airline_irops_ai_roi";
  }
  return enterpriseFunctionRouteForQuery(normalized)
    ? "enterprise_function_artifact"
    : null;
}

function enterpriseFunctionRouteForQuery(
  query: string,
): EnterpriseFunctionRoute | null {
  const normalized = query.trim().toLowerCase();
  if (!FUNCTION_ARTIFACT_RE.test(normalized)) return null;

  const routeByKey = (key: EnterpriseFunctionRoute["key"]) =>
    ENTERPRISE_FUNCTION_ROUTES.find((route) => route.key === key) ?? null;
  const has = (pattern: RegExp) => pattern.test(normalized);

  if (has(/\b(customer|front.?office|contact.?center|journey|loyalty|service recovery|agent assist)\b/)) {
    return routeByKey("customer");
  }
  if (has(/\b(initiative|initiatives|roadmap|scale|hold|stop|prioriti[sz]e|top bets?)\b/)) {
    return routeByKey("initiatives");
  }
  if (has(/\b(architecture|mainframe|platform|identity|api|apis|constraint|constraints|legacy|resilien(?:ce|cy))\b/)) {
    return routeByKey("architecture");
  }
  if (
    has(/\b(application|applications|app portfolio|core systems?|systems of record|modernization|lifecycle)\b/) &&
    !has(/\b(vendor|supplier|contract|concentration|renewal)\b/)
  ) {
    return routeByKey("applications");
  }
  if (has(/\b(data product|data products|analytics|maturity|ai readiness|lineage|registry)\b/)) {
    return routeByKey("data_products");
  }
  if (has(/\b(integration|dependency|dependencies|topolog|graph|edge|edges|relationship|relationships|feeds?|upstream|downstream)\b/)) {
    return routeByKey("integrations");
  }
  if (has(/\b(budget|run.?cost|finance|spend|cost|portfolio or category|capex|opex)\b/)) {
    return routeByKey("finance");
  }
  if (has(/\b(vendor|contract|supplier|concentration|renewal)\b/)) {
    return routeByKey("vendors");
  }
  if (has(/\b(workforce|persona|people|fte|labor|productivity|function|employee|shared services?)\b/)) {
    return routeByKey("workforce");
  }
  if (has(/\b(risk|risks|control|controls|governance|severity|compliance|audit)\b/)) {
    return routeByKey("risk_controls");
  }
  if (has(/\b(benefit|benefits|realization|realized|value lever|leakage|at-risk|impact|roi)\b/)) {
    return routeByKey("benefits");
  }
  if (has(/\b(operations|operational|process|bottleneck|root cause|itsm|incident|problem|change|cmdb|back office|back-office|bpr|reengineering)\b/)) {
    return routeByKey("operations");
  }
  return null;
}

export function isAirlineIropsAiRoiQuestion(query: string): boolean {
  return routeIntelligenceAdvisorQuestion(query) === "airline_irops_ai_roi";
}

export function advisorSupportSourcesForRoute(query: string): AskSource[] {
  const route = routeIntelligenceAdvisorQuestion(query);
  if (route === "airline_irops_ai_roi") {
    return AIRLINE_IROPS_ADVISOR_SUPPORT_SOURCES;
  }
  const functionRoute = enterpriseFunctionRouteForQuery(query);
  return functionRoute ? [functionRoute.supportSource] : [];
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
  if (route === "enterprise_function_artifact") {
    return buildEnterpriseFunctionComposerBlock(input);
  }

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
  if (route !== "airline_irops_ai_roi") return [];
  return advisorExpertRefs(
    AIRLINE_IROPS_EXPERT_IDS.map((id) => getExpertById(id)).filter(
      (expert): expert is ExpertPack => Boolean(expert),
    ),
  );
}

export function chooseAdvisorTokenBudget(query: string, fallback: number): number {
  const route = routeIntelligenceAdvisorQuestion(query);
  if (route === "airline_irops_ai_roi") return 1800;
  if (route === "enterprise_function_artifact") return Math.max(fallback, 1300);
  return fallback;
}

export function chooseAdvisorWordCap(query: string, fallback: number): number {
  const route = routeIntelligenceAdvisorQuestion(query);
  if (route === "airline_irops_ai_roi") return 950;
  if (route === "enterprise_function_artifact") return Math.max(fallback, 620);
  return fallback;
}

function buildEnterpriseFunctionComposerBlock(
  input: AdvisorComposerInput,
): AdvisorComposerResult | null {
  const functionRoute = enterpriseFunctionRouteForQuery(input.query);
  if (!functionRoute) return null;
  const sourceSummary = summarizeSources(input.sources);
  return {
    route: "enterprise_function_artifact",
    expertNames: [],
    expertRefs: [],
    selectedSourceSummary: sourceSummary,
    promptBlock: [
      "INTELLIGENCE ADVISOR FUNCTION ROUTE",
      `Function: ${functionRoute.label}`,
      `Required artifact: ${functionRoute.requiredArtifact}`,
      "",
      "Treat this as a cross-enterprise function analysis, not a generic chat answer. Build the response like a senior enterprise AI / technology advisor briefing a CIO, CFO, COO, or CDAO.",
      "",
      "Evidence order is binding:",
      "1. Tenant read-model facts first for any client-specific claim.",
      "2. Corpus / pattern / expert support second for industry or operating-model claims.",
      "3. Planning ranges are allowed only when labeled pattern-only.",
      "4. If a tenant-specific field is missing, name the exact field gap instead of saying the whole context is not loaded.",
      "",
      "Answer shape:",
      "- Open with a crisp 2-4 sentence executive read.",
      "- Then provide the requested artifact as a standalone Markdown table.",
      "- Do not bury the artifact as inline pipe text inside a paragraph.",
      "- End with one useful next decision or investigation, not a generic handoff sentence.",
      "",
      `Required columns: ${functionRoute.columns}`,
      "",
      "Table / chart / graph contract:",
      "- Put a blank line before the table.",
      "- Put the table title on its own line, then the header row, separator row, and rows on separate lines.",
      "- Include at least two rows when evidence supports it.",
      "- If exact tenant row data is missing, emit a table of known related evidence plus a specific gap row. Do not emit the generic 'Evidence Required' fallback in prose.",
      "- For chart requests, include numeric table columns that the renderer can chart: label plus exact numeric value where loaded, or Low estimate / High estimate / Unit for pattern-only planning ranges.",
      "- For graph requests, include From | Relationship | To | Evidence | Confidence rows only when source-to-target edge evidence exists; otherwise say which edge family is missing.",
      "",
      "Quality gates:",
      "- No raw internal IDs in prose.",
      "- No orphan table fragments.",
      "- No repeated labels like 'Read: Read:' or 'Evidence: Implication:'.",
      "- No generic sentence: 'have the accountable owner review the listed sources and decide whether this belongs in Source, Tower, or Moves.'",
      "- Sound like a practical senior consultant, not a database report.",
      "",
      "Source inventory seen by this composer:",
      `- Tenant evidence sources: ${sourceSummary.tenantEvidenceCount}`,
      `- Corpus/pattern/worldview evidence sources: ${sourceSummary.corpusEvidenceCount}`,
      `- Public/research/benchmark evidence sources: ${sourceSummary.publicEvidenceCount}`,
      `- Graph evidence sources: ${sourceSummary.graphEvidenceCount}`,
    ].join("\n"),
  };
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
