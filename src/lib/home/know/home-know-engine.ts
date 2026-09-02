import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type {
  HomeKnowAnswerStatus,
  HomeKnowAskRequest,
  HomeKnowChart,
  HomeKnowCitation,
  HomeKnowConflict,
  HomeKnowFact,
  HomeKnowGap,
  HomeKnowGraph,
  HomeKnowIntent,
  HomeKnowResponse,
  HomeKnowTable,
} from "@/lib/home/know/home-know-contract";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { CHART } from "@/lib/programs/expert-kernel/exports/board-grade/svg-charts";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { repairHomeAnswerQuality } from "@/lib/home/know/home-answer-quality-gate";
import { assessHomeAnswerRelevance } from "@/lib/home/know/home-answer-relevance-gate";
import { buildHomeKnowResponseFromDossier } from "@/lib/home/know/compose-dossier-answer";
import { hasUsableDossierEvidence } from "@/lib/home/know/has-usable-dossier-evidence";
import {
  homePublicAnswerLeakIssues,
  scrubHomePublicAnswerText,
} from "@/lib/home/know/home-public-answer-scrub";
import { shapeHomeKnowResponseForRender } from "@/lib/home/know/home-render-layer-shaper";
import {
  applyHomeConsultantTextSynthesis,
  applyHomeConsultantTextSynthesisFailureTrace,
  isHomeConsultantTextSynthesisResult,
  synthesizeHomeConsultantText,
} from "@/lib/home/know/home-consultant-text-synthesis";
import { synthesizeHomeKnowProse } from "@/lib/home/know/home-know-synthesis";
import {
  isCuratedDossierNonFallbackError,
  loadCuratedSemanticDossier,
} from "@/lib/semantic-dossiers";
import {
  loadSourceV4WorkspaceSnapshot,
  type SourceV4WorkspaceSnapshot,
} from "@/lib/source/data-model/source-v4-workspace-snapshot";

export interface HomeDimensionCoverageRow {
  tenant_key: string;
  dimension_id: string;
  dimension_label: string;
  record_count: number | string | null;
  fact_count: number | string | null;
  relationship_count: number | string | null;
  source_count: number | string | null;
  gap_count: number | string | null;
  conflict_count: number | string | null;
  last_loaded_at: string | null;
  trust_score: number | string | null;
}

export interface HomeItOrgViewRow {
  tenant_key: string;
  team_id: string | null;
  team_name: string | null;
  executive_owner_role: string | null;
  executive_owner_person_name?: string | null;
  domain: string | null;
  head_count_fte: number | string | null;
  annual_budget_usd: number | string | null;
  source_file: string | null;
  source_row_number: number | string | null;
  confidence: number | string | null;
}

export interface HomeApplicationOwnershipViewRow {
  tenant_key: string;
  application_name: string | null;
  domain: string | null;
  primary_business_owner: string | null;
  technical_owner_team: string | null;
  technical_owner_role: string | null;
  criticality: string | null;
  annual_run_cost_usd: number | string | null;
  source_file: string | null;
  source_row_number: number | string | null;
  confidence: number | string | null;
}

export interface HomeVendorLandscapeViewRow {
  tenant_key: string;
  vendor_name: string | null;
  category: string | null;
  annual_spend_usd: number | string | null;
  renewal_risk: string | null;
  business_owner: string | null;
  technology_owner: string | null;
  source_file: string | null;
  source_row_number: number | string | null;
  confidence: number | string | null;
}

export interface HomeBudgetPortfolioViewRow {
  tenant_key: string;
  function_or_platform: string | null;
  run_budget_usd: number | string | null;
  change_budget_usd: number | string | null;
  ai_budget_usd: number | string | null;
  owner_role: string | null;
  source_file: string | null;
  source_row_number: number | string | null;
  confidence: number | string | null;
}

export interface HomeGapRegisterViewRow {
  tenant_key: string;
  dimension_id: string;
  object_type: string;
  expected_field: string;
  display_label: string;
  severity: "low" | "medium" | "high" | "critical";
  missing_count: number | string | null;
  source_file: string | null;
}

export interface HomeConflictRegisterViewRow {
  tenant_key: string;
  dimension_id: string;
  label: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  source_file: string | null;
}

export interface HomeRelationshipRow {
  tenant_key: string;
  relationship_key: string | null;
  relationship_type: string | null;
  from_external_id: string | null;
  to_external_id: string | null;
  source_file: string | null;
  source_row_number: number | string | null;
  properties: Record<string, unknown> | null;
}

export interface HomeContextRecordRow {
  tenant_key: string;
  canonical_record_id: string | null;
  source_record_id: string | null;
  record_type: string | null;
  dimension: string | null;
  payload: Record<string, unknown> | null;
}

export interface HomeKnowPacket {
  coverage: HomeDimensionCoverageRow[];
  org: HomeItOrgViewRow[];
  applications: HomeApplicationOwnershipViewRow[];
  vendors: HomeVendorLandscapeViewRow[];
  budgets: HomeBudgetPortfolioViewRow[];
  sourceV4?: SourceV4WorkspaceSnapshot | null;
  relationships: HomeRelationshipRow[];
  records: HomeContextRecordRow[];
  gaps: HomeGapRegisterViewRow[];
  conflicts: HomeConflictRegisterViewRow[];
  readErrors?: string[];
}

const BLOCKED_PUBLIC_TEXT =
  /\b(experts?_consulted|DORA|Wave-?0|P11|kill criteria|TIME x AI-fit|90-day pilot|local env|org_topology unavailable|roles_inventory unavailable|productivity (frame|lift)|clinical process expert|decision frame|portfolio segmentation|AI Platform owner|Knowledge Engineer|Fluency Coach|current visible run-cost basis is \$0|the cited record|dossier|binder|fragment lookup|edge rows|source rows|no blocking gap|semantic packet|composer packet|quality gate|answer boundary)\b/i;
const BLOCKED_PUBLIC_TEXT_REPLACE =
  /\b(experts?_consulted|DORA|Wave-?0|P11|kill criteria|TIME x AI-fit|90-day pilot|local env|org_topology unavailable|roles_inventory unavailable|productivity (frame|lift)|clinical process expert|decision frame|portfolio segmentation|AI Platform owner|Knowledge Engineer|Fluency Coach|current visible run-cost basis is \$0|the cited record|dossier|binder|fragment lookup|edge rows|source rows|no blocking gap|semantic packet|composer packet|quality gate|answer boundary)\b/gi;
const INTERNAL_CODE_RE =
  /\b[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const INTERNAL_CODE_REPLACE =
  /\b[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const DECISION_RE =
  /\b(should\s+(we|i|the\s+(company|client|team|board)|skyharbor|lakeshore)|recommend|prioriti[sz]e|approve|kill|scale\s+(up|down|this|it)|invest|what do we do|next move|where should)\b/i;
const GRAPH_RE =
  /\b(graph|map|topolog|dependency|dependencies|relationship|relationships|lineage|blast radius|depends on|integration|interfaces?)\b/i;
const EXACT_UNKNOWABLE_RE =
  /\b(exact|precise|to the dollar|specific date|exact date|exactly what|precise headcount|precise nps|roi percentage|will .* deliver|will .* be in \d{4}|next quarter)\b/i;
const COMMERCIAL_EXPOSURE_RE =
  /\b(cfo|finance|financial|commercial|commercially|exposed|exposure|vendor concentration|contract exposure|renewal exposure|spend concentration|revenue)\b/i;
const EXECUTIVE_ATTENTION_RE =
  /\b(board|ceo|cxo|leadership|leader|friday|walkthrough|address first|what should .* address|mislead|caveat|attention)\b/i;
const BUSINESS_CONTEXT_RE =
  /\b(business|revenue|books? of business|operating model|business model|member population|customer segment)\b/i;

export function classifyHomeKnowIntent(question: string): HomeKnowIntent {
  const normalized = question.trim().toLowerCase();
  if (!normalized) return "browse";
  if (EXACT_UNKNOWABLE_RE.test(normalized)) return "gap";
  if (
    /\b(chart|visuali[sz]e|visual|plot|waterfall)\b/.test(normalized) ||
    GRAPH_RE.test(normalized)
  )
    return "chart";
  if (DECISION_RE.test(normalized)) return "decision_handoff";
  if (
    /\b(missing|not available|not loaded|absent|unknown|field|gap register|evidence gap)\b/.test(
      normalized,
    )
  )
    return "gap";
  if (
    /\b(which|what|show|list)\b.*\b(vendor|vendors|contract|contracts|app|apps|application|applications|system|systems|owner|owners|portfolio|portfolios)\b/.test(
      normalized,
    )
  )
    return "table";
  if (/\b(table|list|show|breakdown)\b/.test(normalized)) return "table";
  if (/\b(browse|overview|loaded|coverage|dimensions)\b/.test(normalized))
    return "browse";
  return "lookup";
}

export async function fetchHomeKnowPacket(
  tenantKey: string,
): Promise<HomeKnowPacket> {
  // Home KNOW is a hot signed-in path. The views are small, but the reality
  // crawl runs multiple asks concurrently; parallelizing every view fetch per
  // ask can spike the ACA/Postgres connection pool and produce blank answers.
  // Keep the packet deterministic and low-pressure until this is replaced by a
  // single materialized Home packet query.
  const readErrors: string[] = [];
  const coverage = await fetchRowsOrEmpty<HomeDimensionCoverageRow>(
    "mv_home_dimension_coverage_view",
    tenantKey,
    readErrors,
  );
  const org = await fetchRowsOrEmpty<HomeItOrgViewRow>(
    "mv_home_it_org_view",
    tenantKey,
    readErrors,
  );
  const applications = await fetchRowsOrEmpty<HomeApplicationOwnershipViewRow>(
    "mv_home_application_ownership_view",
    tenantKey,
    readErrors,
  );
  const vendors = await fetchRowsOrEmpty<HomeVendorLandscapeViewRow>(
    "mv_home_vendor_landscape_view",
    tenantKey,
    readErrors,
  );
  const budgets = await fetchRowsOrEmpty<HomeBudgetPortfolioViewRow>(
    "mv_home_budget_by_portfolio_view",
    tenantKey,
    readErrors,
  );
  const sourceV4 = await fetchSourceV4OrNull(tenantKey, readErrors);
  const relationships = await fetchRowsOrEmpty<HomeRelationshipRow>(
    "enterprise_context_relationships",
    tenantKey,
    readErrors,
    5000,
  );
  const records = await fetchRowsOrEmpty<HomeContextRecordRow>(
    "enterprise_context_records",
    tenantKey,
    readErrors,
    5000,
  );
  const gaps = await fetchRowsOrEmpty<HomeGapRegisterViewRow>(
    "mv_home_gap_register_view",
    tenantKey,
    readErrors,
  );
  const conflicts = await fetchRowsOrEmpty<HomeConflictRegisterViewRow>(
    "mv_home_conflict_register_view",
    tenantKey,
    readErrors,
  );
  return {
    coverage,
    org,
    applications,
    vendors,
    budgets,
    sourceV4,
    relationships,
    records,
    gaps,
    conflicts,
    readErrors,
  };
}

async function fetchSourceV4OrNull(
  tenantKey: string,
  readErrors: string[],
): Promise<SourceV4WorkspaceSnapshot | null> {
  try {
    const snapshot = await loadSourceV4WorkspaceSnapshot(tenantKey);
    return sourceV4HasData(snapshot) ? snapshot : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[home-know.source-v4] Source V4 context unavailable for ${tenantKey}: ${message}`,
    );
    readErrors.push(
      "Source V4 cube-backed context did not return for this Home request",
    );
    return null;
  }
}

export async function buildHomeKnowResponse(
  input: HomeKnowAskRequest,
): Promise<HomeKnowResponse> {
  const tenantKey = canonicalTenantKey(
    (input.tenantKey ?? input.client ?? "").trim(),
  );
  if (!tenantKey) {
    return blockedHomeKnowResponse({
      tenantKey: "unknown",
      question: input.question,
      prose: "I do not see an active tenant for this Home request.",
    });
  }
  const dossierTenantKey = resolveHomeKnowDossierTenantKey({
    tenantKey,
    client: input.client,
  });
  let currentDossierUnavailableReason: string | null = null;
  try {
    const curated = await loadCuratedSemanticDossier({
      tenantKey: dossierTenantKey,
      question: input.question,
    });
    const dossier = curated.dossier;
    const exactGap = exactUnknowableGap(input.question);
    if (exactGap) {
      dossier.gaps.unshift({
        gapKey: "exact_value_source_field_missing",
        label: `Missing exact source field: ${exactGap.displayLabel}.`,
        impact: `Home can describe nearby available material, but the exact answer requires ${exactGap.needed}.`,
        neededEvidence: [exactGap.needed],
      });
      dossier.answerBoundary.cannotAnswer.unshift(
        `Exact value for ${exactGap.displayLabel}`,
      );
      dossier.composerPacket.gaps = dossier.gaps;
      dossier.composerPacket.answerBoundary = dossier.answerBoundary;
    }
    if (
      dossier.sourceCoverage.some((source) => source.loaded && source.count > 0)
    ) {
      const response = buildHomeKnowResponseFromDossier({
        tenantKey,
        question: input.question.trim(),
        dossier,
      });
      const validated = validateHomeKnowResponse({
        ...response,
        safety: {
          ...response.safety,
          composerTrace: response.safety.composerTrace
            ? {
                ...response.safety.composerTrace,
                reason: `curated Semantic2 dossier attached; promptVersion=${curated.promptVersion}; dossierVersion=${curated.dossierVersion}; builtAt=${curated.builtAt}`,
              }
            : response.safety.composerTrace,
        },
      });
      if (
        isFeatureEnabled(
          { clientKey: input.client ?? tenantKey, clientId: tenantKey },
          "home_know_claude_synthesis",
        )
      ) {
        const synthesis = await synthesizeHomeConsultantText({
          dossier,
          deterministicResponse: validated,
          operatorTrace: input.operatorTrace === true,
        });
        if (isHomeConsultantTextSynthesisResult(synthesis)) {
          return validateHomeKnowResponse(
            applyHomeConsultantTextSynthesis(validated, synthesis),
          );
        }
        if (synthesis?.attempted) {
          return applyHomeConsultantTextSynthesisFailureTrace(
            validated,
            synthesis,
          );
        }
      }
      return validated;
    }
  } catch (error) {
    if (isCuratedDossierNonFallbackError(error)) {
      currentDossierUnavailableReason =
        error instanceof Error ? error.message : String(error);
      console.warn(
        `[home-know.semantic2-dossier] Curated dossier unavailable for ${tenantKey}; using current Home read-model packet: ${currentDossierUnavailableReason}`,
      );
    } else {
      console.warn(
        `[home-know.semantic2-dossier] Using current read-model packet for ${tenantKey}; retired local dossier fallback disabled: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
  const packet = await fetchHomeKnowPacket(tenantKey);
  if (currentDossierUnavailableReason) {
    packet.readErrors = [
      ...(packet.readErrors ?? []),
      "The curated advisor dossier is unavailable; this answer uses the current Home read model instead.",
    ];
  }
  const response = buildHomeKnowResponseFromPacket({
    tenantKey,
    question: input.question,
    packet,
  });
  const evidence = hasUsableDossierEvidence(response);
  const traceBase = {
    route: "/api/home/know/ask" as const,
    dimensionsUsed: response.dimensionsUsed,
    factsBound: response.facts.length,
    tablesBound: response.tables.length,
    chartsBound: response.charts.length,
    graphsBound: response.graphs.length,
    citationsBound: response.citations.length,
    sourceCoverageBound: response.citations.filter(
      (citation) => citation.sourceClass === "tenant-source-file",
    ).length,
    sectionsBound: 0,
    rollupsBound: 0,
    relationshipPathsBound: response.graphs.reduce(
      (sum, graph) => sum + graph.edges.length,
      0,
    ),
    metricsBound: response.charts.reduce(
      (sum, chart) => sum + chart.data.length,
      0,
    ),
    gapsBound: response.gaps.length,
    usableEvidence: evidence.usable,
    evidenceChannels: evidence.evidenceChannels,
    answerStatus: response.answerStatus,
  };
  if (response.intent === "decision_handoff") {
    return withComposerTrace(response, {
      ...traceBase,
      composer: "home_know_decision_handoff",
      goldenComposerAttempted: false,
      goldenComposerUsed: false,
      fallbackUsed: false,
      reason: "Home KNOW handed a decision question to Intelligence.",
    });
  }
  const synthesisEnabled = isFeatureEnabled(
    { clientKey: input.client ?? tenantKey, clientId: tenantKey },
    "home_know_llm_synthesis",
  );
  if (!synthesisEnabled) {
    return withComposerTrace(response, {
      ...traceBase,
      composer: "home_know_template_fallback",
      goldenComposerAttempted: false,
      goldenComposerUsed: false,
      fallbackUsed: true,
      reason: "home_know_llm_synthesis feature flag is disabled.",
    });
  }
  const synthesized = await synthesizeHomeKnowProse({
    tenantKey,
    question: response.question,
    intent: response.intent,
    facts: response.facts,
    tables: response.tables,
    gaps: response.gaps,
  });
  if (!synthesized) {
    return withComposerTrace(response, {
      ...traceBase,
      composer: "home_know_template_fallback",
      goldenComposerAttempted: true,
      goldenComposerUsed: false,
      fallbackUsed: true,
      reason:
        "Golden composer returned no valid prose; deterministic Home KNOW prose was used.",
    });
  }
  return withComposerTrace(
    {
      ...response,
      prose: synthesized,
    },
    {
      ...traceBase,
      composer: "golden_home_know_semantic_synthesis",
      goldenComposerAttempted: true,
      goldenComposerUsed: true,
      fallbackUsed: false,
    },
  );
}

export function resolveHomeKnowDossierTenantKey(input: {
  tenantKey: string;
  client?: string | null;
}): string {
  const requested = (input.client ?? input.tenantKey).trim();
  const canonical = canonicalTenantKey(requested);
  return canonical.trim() || input.tenantKey;
}

function withComposerTrace(
  response: HomeKnowResponse,
  trace: NonNullable<HomeKnowResponse["safety"]["composerTrace"]>,
): HomeKnowResponse {
  return validateHomeKnowResponse({
    ...response,
    safety: {
      ...response.safety,
      composerTrace: trace,
    },
  });
}

export function buildHomeKnowResponseFromPacket(input: {
  tenantKey: string;
  question: string;
  packet: HomeKnowPacket;
}): HomeKnowResponse {
  const question = input.question.trim();
  const intent = classifyHomeKnowIntent(question);
  const dimensionsUsed = dimensionsForIntent(intent, question, input.packet);
  const citations = buildCitations(input.packet, dimensionsUsed);
  const gaps = buildGaps(input.packet.gaps, citations, input.packet.readErrors);
  const conflicts = buildConflicts(input.packet.conflicts, citations);
  const exactGap = exactUnknowableGap(question);

  if (exactGap) {
    const dimensions =
      exactGap.dimensionIds.length > 0 ? exactGap.dimensionIds : dimensionsUsed;
    const exactCitations = buildCitations(input.packet, dimensions);
    const exactGaps = [
      exactGap.gap(exactCitations),
      ...buildGaps(
        input.packet.gaps,
        exactCitations,
        input.packet.readErrors,
      ).slice(0, 3),
    ];
    return validateHomeKnowResponse({
      mode: "KNOW",
      tenantKey: input.tenantKey,
      question,
      intent: "gap",
      answerStatus: exactCitations.length > 0 ? "partial" : "no_data",
      prose: exactGap.prose,
      dimensionsUsed: dimensions,
      facts: buildFacts(input.packet, dimensions, exactCitations),
      tables: [],
      charts: [],
      graphs: [],
      gaps: exactGaps,
      conflicts,
      citations: exactCitations,
      handoff: null,
      safety: defaultSafety(),
    });
  }

  if (intent === "decision_handoff") {
    return validateHomeKnowResponse({
      mode: "KNOW",
      tenantKey: input.tenantKey,
      question,
      intent,
      answerStatus: "handoff",
      prose:
        "That question needs analysis, prioritization, and an accountable recommendation. This view can show the supporting facts first, or pass the question to Intelligence for decision work and to Moves or Tower for execution proof.",
      dimensionsUsed,
      facts: buildFacts(input.packet, dimensionsUsed, citations),
      tables: [],
      charts: [],
      graphs: [],
      gaps,
      conflicts,
      citations,
      handoff: {
        target: "intelligence",
        label: "Analyze this in Intelligence",
        reason:
          "The question needs judgment, prioritization, and trade-off analysis.",
      },
      safety: defaultSafety(),
    });
  }

  const tables = buildTablesForIntent(
    intent,
    question,
    input.packet,
    citations,
  );
  const charts = buildChartsForIntent(
    intent,
    question,
    input.packet,
    citations,
  );
  const graphs = buildGraphsForIntent(
    intent,
    question,
    input.packet,
    citations,
  );
  const facts = buildFacts(input.packet, dimensionsUsed, citations);
  const hasData =
    facts.length > 0 ||
    tables.some((table) => table.rows.length > 0) ||
    charts.some((chart) => chart.data.length > 0) ||
    graphs.some((graph) => graph.nodes.length > 0 && graph.edges.length > 0);
  const hasGaps = gaps.length > 0;
  const answerStatus: HomeKnowAnswerStatus = hasData
    ? hasGaps
      ? "partial"
      : "answered"
    : "no_data";

  return validateHomeKnowResponse({
    mode: "KNOW",
    tenantKey: input.tenantKey,
    question,
    intent,
    answerStatus,
    prose: homeKnowProse({
      tenantKey: input.tenantKey,
      question,
      intent,
      packet: input.packet,
      hasData,
      hasGaps,
      hasGraph: graphs.length > 0,
      hasChart: charts.length > 0,
    }),
    dimensionsUsed,
    facts,
    tables,
    charts,
    graphs,
    gaps,
    conflicts,
    citations,
    handoff: null,
    safety: defaultSafety(),
  });
}

function exactUnknowableGap(question: string): null | {
  dimensionIds: string[];
  displayLabel: string;
  needed: string;
  prose: string;
  gap: (gapCitations: HomeKnowCitation[]) => HomeKnowGap;
} {
  if (!EXACT_UNKNOWABLE_RE.test(question)) return null;
  const normalized = question.toLowerCase();
  let dimensionIds = ["gap_register"];
  let displayLabel = "Exact source field";
  let expectedField = "exact_answer_source_field";
  let objectType = "source support";
  let needed =
    "the specific source field that answers the exact value requested, with an effective date and source row";

  if (/\bcloud bill|cloud\b/.test(normalized)) {
    dimensionIds = ["infrastructure_cloud", "it_budget_financials"];
    displayLabel = "2027 cloud bill by account/provider";
    expectedField = "forecast_cloud_bill_2027_usd";
    objectType = "cloud cost forecast";
    needed =
      "a dated 2027 cloud-cost forecast or committed budget line by provider/account";
  } else if (/\bheadcount|data engineering\b/.test(normalized)) {
    dimensionIds = ["it_org_ownership", "workforce_personas"];
    displayLabel = "Next-quarter data engineering headcount";
    expectedField = "next_quarter_data_engineering_headcount";
    objectType = "workforce forecast";
    needed = "a dated workforce forecast for the data-engineering team";
  } else if (/\bsourcing renewal|save|savings\b/.test(normalized)) {
    dimensionIds = ["vendors_contracts", "it_budget_financials"];
    displayLabel = "Sourcing renewal savings value";
    expectedField = "sourcing_renewal_savings_usd";
    objectType = "contract renewal";
    needed = "a signed renewal/sourcing record with the savings amount";
  } else if (/\broi|year two\b/.test(normalized)) {
    dimensionIds = ["initiatives_roadmap", "benefits_realization"];
    displayLabel = "Year-two realized ROI percentage";
    expectedField = "year_two_roi_percent";
    objectType = "initiative benefit";
    needed =
      "a benefit-realization record with year-two ROI methodology and actual/forecast value";
  } else if (
    /\bmigration completes|exact date|completion date\b/.test(normalized)
  ) {
    dimensionIds = ["initiatives_roadmap", "applications_core_systems"];
    displayLabel = "Migration completion date";
    expectedField = "migration_completion_date";
    objectType = "initiative milestone";
    needed =
      "a milestone row containing the committed migration completion date";
  } else if (/\bnps\b/.test(normalized)) {
    dimensionIds = ["business_metrics", "initiatives_roadmap"];
    displayLabel = "Post-launch NPS target";
    expectedField = "post_launch_nps_target";
    objectType = "business metric";
    needed = "a signed metric target or forecast for post-launch NPS";
  }

  return {
    dimensionIds,
    displayLabel,
    needed,
    prose: `I can't give that exact value from the loaded Home data. The related context may show nearby records, but the exact answer requires ${needed}. Without that source field, Home treats this as a gap rather than a precise number.`,
    gap: (gapCitations) => ({
      id: "gap-exact-request",
      dimensionId: dimensionIds[0] ?? "gap_register",
      objectType,
      expectedField,
      displayLabel,
      severity: "high",
      message: `${displayLabel} is missing; provide ${needed}.`,
      citationIds: gapCitations.map((citation) => citation.id).slice(0, 4),
    }),
  };
}

async function fetchRows<T extends { tenant_key: string }>(
  table: string,
  tenantKey: string,
  limit = 500,
): Promise<T[]> {
  const db = getAzureReadFluentClient();
  const { data, error } = await db
    .from<T[]>(table)
    .select("*")
    .eq("tenant_key", tenantKey)
    .limit(limit);
  if (error) {
    throw new Error(`${table} fetch failed: ${error.message}`);
  }
  return (data ?? []) as unknown as T[];
}

async function fetchRowsOrEmpty<T extends { tenant_key: string }>(
  table: string,
  tenantKey: string,
  readErrors: string[],
  limit = 500,
): Promise<T[]> {
  try {
    return await fetchRows<T>(table, tenantKey, limit);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[home-know.read-model] ${table} returned no usable rows for ${tenantKey}: ${message}`,
    );
    readErrors.push(readModelGapMessage(table));
    return [];
  }
}

function readModelGapMessage(table: string): string {
  if (table.includes("relationship")) {
    return "source-to-target integration edge pairs did not return from the Home relationship view for this request";
  }
  if (table.includes("application")) {
    return "application ownership rows did not return from the Home application view for this request";
  }
  if (table.includes("vendor")) {
    return "vendor-to-system support rows did not return from the Home vendor view for this request";
  }
  if (table.includes("budget")) {
    return "run/change line-item split rows did not return from the Home budget view for this request";
  }
  if (table.includes("record")) {
    return "source record rows did not return from the Home context record view for this request";
  }
  return "Home context rows did not return for this request";
}

function defaultSafety() {
  const evidence = hasUsableDossierEvidence({});
  return {
    serverValidated: true,
    blockedExperts: true,
    blockedDecisionFrames: true,
    blockedInternalCodes: true,
    unsupportedClaimsRemoved: 0,
    frontendTripwireShouldFire: false,
    usableEvidence: evidence.usable,
    evidenceStatus: "empty_dossier" as const,
    evidenceReason: evidence.reason,
    evidenceChannels: evidence.evidenceChannels,
  };
}

function blockedHomeKnowResponse(input: {
  tenantKey: string;
  question: string;
  prose: string;
}): HomeKnowResponse {
  return {
    mode: "KNOW",
    tenantKey: input.tenantKey,
    question: input.question,
    intent: classifyHomeKnowIntent(input.question),
    answerStatus: "blocked",
    prose: input.prose,
    dimensionsUsed: [],
    facts: [],
    tables: [],
    charts: [],
    graphs: [],
    gaps: [],
    conflicts: [],
    citations: [],
    handoff: null,
    safety: defaultSafety(),
  };
}

function dimensionsForIntent(
  intent: HomeKnowIntent,
  question: string,
  packet: HomeKnowPacket,
): string[] {
  if (intent === "decision_handoff" || intent === "browse") {
    return [
      ...packet.coverage.map((row) => row.dimension_id),
      ...(packet.sourceV4 ? ["source_v4_cube"] : []),
    ];
  }
  const normalized = question.toLowerCase();
  const dims = new Set<string>();
  if (COMMERCIAL_EXPOSURE_RE.test(normalized)) {
    dims.add("vendors_contracts");
    dims.add("it_budget_financials");
    dims.add("gap_register");
    if (packet.sourceV4) dims.add("source_v4_cube");
  }
  if (EXECUTIVE_ATTENTION_RE.test(normalized)) {
    dims.add("gap_register");
    dims.add("security_compliance");
    dims.add("initiatives_roadmap");
    dims.add("vendors_contracts");
    dims.add("it_budget_financials");
    if (packet.sourceV4) dims.add("source_v4_cube");
  }
  if (BUSINESS_CONTEXT_RE.test(normalized)) {
    dims.add("business_org_functions");
    dims.add("business_operating_model");
    dims.add("it_org_ownership");
    dims.add("applications_core_systems");
  }
  if (GRAPH_RE.test(normalized)) {
    dims.add("relationship_graph");
    dims.add("applications_core_systems");
  }
  if (
    /\b(data product|analytics|lineage|feed|feeds|source system)\b/.test(
      normalized,
    )
  ) {
    dims.add("data_analytics_estate");
  }
  if (/\b(cloud|infrastructure|platforms?|volumetrics)\b/.test(normalized)) {
    dims.add("infrastructure_cloud");
  }
  if (/\b(security|compliance|control|controls|posture)\b/.test(normalized)) {
    dims.add("security_compliance");
  }
  if (
    /\b(vendor|vendors|contract|contracts|license|licenses|supplier|suppliers|renewal|renewals)\b/.test(
      normalized,
    )
  ) {
    dims.add("vendors_contracts");
    if (packet.sourceV4) dims.add("source_v4_cube");
  }
  if (
    /\b(budget|budgets|spend|cost|costs|financial|financials|cfo|finance)\b/.test(
      normalized,
    )
  ) {
    dims.add("it_budget_financials");
    if (packet.sourceV4) dims.add("source_v4_cube");
  }
  if (
    /\b(source v4|cube|invoice|invoices|off-contract|off contract|credit|credits|sla|saas|seat|seats|copilot|claude code|ai tool|cloud|azure|rate card|fieldglass|sourcing event|bafo|ariba)\b/.test(
      normalized,
    )
  ) {
    dims.add("source_v4_cube");
  }
  if (
    /\b(business function|business functions|business org|operating model)\b|\bbusiness\b.*\b(organized|organization|org|function|functions|model)\b/.test(
      normalized,
    )
  ) {
    dims.add("business_org_functions");
    dims.add("business_operating_model");
  }
  if (
    /\b(org|team|portfolio|lead|leader|leaders|owner|ownership|who leads|cio)\b/.test(
      normalized,
    )
  )
    dims.add("it_org_ownership");
  if (/\b(app|application|system|platform|cmdb)\b/.test(normalized))
    dims.add("applications_core_systems");
  if (
    /\b(ai|automation|initiative|initiatives|portfolio|value|impact|effort)\b/.test(
      normalized,
    )
  ) {
    dims.add("initiatives_roadmap");
    dims.add("ai_automation_footprint");
    if (packet.sourceV4) dims.add("source_v4_cube");
  }
  if (intent === "gap") dims.add("gap_register");
  if (dims.size === 0 && intent === "chart") {
    dims.add("it_budget_financials");
    dims.add("vendors_contracts");
    dims.add("applications_core_systems");
  }
  if (dims.size === 0 && EXECUTIVE_ATTENTION_RE.test(normalized)) {
    for (const row of packet.coverage) dims.add(row.dimension_id);
    if (packet.sourceV4) dims.add("source_v4_cube");
  }
  return [...dims];
}

function citationIdForDimension(
  dimensionId: string,
  citations: HomeKnowCitation[],
): string[] {
  const matches = citations
    .filter(
      (citation) =>
        citation.label.toLowerCase().includes(dimensionId.replace(/_/g, "-")) ||
        citation.sourceFile
          ?.toLowerCase()
          .includes(dimensionId.split("_")[0] ?? ""),
    )
    .map((citation) => citation.id);
  return matches.length > 0
    ? matches
    : citations.slice(0, 3).map((citation) => citation.id);
}

function buildCitations(
  packet: HomeKnowPacket,
  dimensionsUsed: string[],
): HomeKnowCitation[] {
  const raw: Array<{
    dimensionId: string;
    sourceFile: string | null;
    sourceRowNumber: number | string | null;
    labelPrefix: string;
    sourceClass?: HomeKnowCitation["sourceClass"];
    confidence?: number | string | null;
    excerpt?: string | null;
  }> = [
    ...packet.org.map((row) => ({
      dimensionId: "it_org_ownership",
      sourceFile: row.source_file,
      sourceRowNumber: row.source_row_number,
      labelPrefix: "IT org ownership",
      confidence: row.confidence,
      excerpt: row.team_name,
    })),
    ...packet.applications.map((row) => ({
      dimensionId: "applications_core_systems",
      sourceFile: row.source_file,
      sourceRowNumber: row.source_row_number,
      labelPrefix: "Applications and systems",
      confidence: row.confidence,
      excerpt: row.application_name,
    })),
    ...packet.vendors.map((row) => ({
      dimensionId: "vendors_contracts",
      sourceFile: row.source_file,
      sourceRowNumber: row.source_row_number,
      labelPrefix: "Vendors and contracts",
      confidence: row.confidence,
      excerpt: row.vendor_name,
    })),
    ...packet.budgets.map((row) => ({
      dimensionId: "it_budget_financials",
      sourceFile: row.source_file,
      sourceRowNumber: row.source_row_number,
      labelPrefix: "IT budget and financials",
      confidence: row.confidence,
      excerpt: row.function_or_platform,
    })),
    ...packet.relationships.map((row) => ({
      dimensionId: "relationship_graph",
      sourceFile: row.source_file,
      sourceRowNumber: row.source_row_number,
      labelPrefix: "Relationship graph",
      sourceClass: "tenant-relationship" as const,
      confidence: 0.85,
      excerpt: row.relationship_type,
    })),
    ...packet.coverage.map((row) => ({
      dimensionId: row.dimension_id,
      sourceFile: null,
      sourceRowNumber: null,
      labelPrefix: `Home coverage · ${row.dimension_label}`,
      sourceClass: "tenant-fact" as const,
      confidence: row.trust_score,
      excerpt: `${row.dimension_label}: ${number(row.record_count)} records, ${number(row.fact_count)} source details, ${number(row.relationship_count)} relationships`,
    })),
    ...(packet.sourceV4
      ? [
          {
            dimensionId: "source_v4_cube",
            sourceFile: null,
            sourceRowNumber: null,
            labelPrefix: "Source V4 cube snapshot",
            sourceClass: "tenant-fact" as const,
            confidence: 0.95,
            excerpt: `${packet.sourceV4.datasetId}: ${packet.sourceV4.contextCoverage.contracts} contracts, ${packet.sourceV4.contextCoverage.vendors} vendors, ${packet.sourceV4.contextCoverage.invoiceLines} invoice lines`,
          },
        ]
      : []),
  ];
  const wanted = new Set(dimensionsUsed);
  const seen = new Set<string>();
  const citations: HomeKnowCitation[] = [];
  for (const item of raw) {
    if (wanted.size > 0 && !wanted.has(item.dimensionId)) continue;
    const key = `${item.sourceFile ?? item.labelPrefix}:${item.sourceRowNumber ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({
      id: `c${citations.length + 1}`,
      label: `${item.labelPrefix}${item.sourceFile ? ` · ${item.sourceFile.split("/").pop()}` : ""}${item.sourceRowNumber ? ` line ${item.sourceRowNumber}` : ""}`,
      sourceClass: item.sourceClass ?? "tenant-source-file",
      sourceFile: item.sourceFile,
      sourceRowNumber: numberOrNull(item.sourceRowNumber),
      excerpt: item.excerpt,
      confidence: confidence(item.confidence),
    });
    if (citations.length >= 8) break;
  }
  if (citations.length === 0 && raw.length > 0) {
    const fallback = raw.slice(0, 8);
    for (const item of fallback) {
      citations.push({
        id: `c${citations.length + 1}`,
        label: `${item.labelPrefix}${item.sourceFile ? ` · ${item.sourceFile.split("/").pop()}` : ""}${item.sourceRowNumber ? ` line ${item.sourceRowNumber}` : ""}`,
        sourceClass: item.sourceClass ?? "tenant-source-file",
        sourceFile: item.sourceFile,
        sourceRowNumber: numberOrNull(item.sourceRowNumber),
        excerpt: item.excerpt,
        confidence: confidence(item.confidence),
      });
    }
  }
  return citations;
}

function buildFacts(
  packet: HomeKnowPacket,
  dimensionsUsed: string[],
  citations: HomeKnowCitation[],
): HomeKnowFact[] {
  const facts: HomeKnowFact[] = [];
  if (dimensionsUsed.includes("it_org_ownership")) {
    if (packet.org.length > 0) {
      facts.push({
        id: "it-org-count",
        dimensionId: "it_org_ownership",
        label: "Loaded IT portfolios",
        value: packet.org.length,
        citationIds: citationIdForDimension("it_org_ownership", citations),
      });
    }
  }
  if (dimensionsUsed.includes("applications_core_systems")) {
    if (packet.applications.length > 0) {
      facts.push({
        id: "application-count",
        dimensionId: "applications_core_systems",
        label: "Loaded applications",
        value: packet.applications.length,
        citationIds: citationIdForDimension(
          "applications_core_systems",
          citations,
        ),
      });
    }
  }
  if (dimensionsUsed.includes("vendors_contracts")) {
    if (packet.vendors.length > 0) {
      facts.push({
        id: "vendor-count",
        dimensionId: "vendors_contracts",
        label: "Loaded vendors/contracts",
        value: packet.vendors.length,
        citationIds: citationIdForDimension("vendors_contracts", citations),
      });
    }
  }
  if (dimensionsUsed.includes("it_budget_financials")) {
    const runBudget = packet.budgets.reduce(
      (sum, row) => sum + number(row.run_budget_usd),
      0,
    );
    if (runBudget > 0) {
      facts.push({
        id: "budget-total",
        dimensionId: "it_budget_financials",
        label: "Loaded run budget",
        value: runBudget,
        citationIds: citationIdForDimension("it_budget_financials", citations),
      });
    }
  }
  if (dimensionsUsed.includes("source_v4_cube") && packet.sourceV4) {
    const sourceCitationIds = citationIdForDimension(
      "source_v4_cube",
      citations,
    );
    facts.push(
      {
        id: "source-v4-contract-count",
        dimensionId: "source_v4_cube",
        label: "Source V4 contracts",
        value: packet.sourceV4.executivePortfolio.contractCount,
        citationIds: sourceCitationIds,
      },
      {
        id: "source-v4-annual-value",
        dimensionId: "source_v4_cube",
        label: "Source V4 annual contract value",
        value: packet.sourceV4.executivePortfolio.annualValue,
        citationIds: sourceCitationIds,
      },
      {
        id: "source-v4-invoice-lines",
        dimensionId: "source_v4_cube",
        label: "Source V4 invoice lines",
        value: packet.sourceV4.spendConsumption.invoiceLines,
        citationIds: sourceCitationIds,
      },
      {
        id: "source-v4-off-contract-spend",
        dimensionId: "source_v4_cube",
        label: "Source V4 off-contract spend",
        value: packet.sourceV4.spendConsumption.offContractSpend,
        citationIds: sourceCitationIds,
      },
      {
        id: "source-v4-unclaimed-credits",
        dimensionId: "source_v4_cube",
        label: "Source V4 unclaimed credits",
        value: packet.sourceV4.performanceCredits.unclaimedCredit,
        citationIds: sourceCitationIds,
      },
      {
        id: "source-v4-ai-claimable-rows",
        dimensionId: "source_v4_cube",
        label: "Source V4 AI claimable rows",
        value: packet.sourceV4.aiUsageValueProof.claimableRows,
        citationIds: sourceCitationIds,
      },
    );
  }
  return facts;
}

function buildTablesForIntent(
  intent: HomeKnowIntent,
  question: string,
  packet: HomeKnowPacket,
  citations: HomeKnowCitation[],
): HomeKnowTable[] {
  const normalized = question.toLowerCase();
  if (intent === "gap") return [gapTable(packet.gaps, citations)];
  if (intent === "browse") {
    return packet.sourceV4
      ? [
          coverageTable(packet.coverage, citations),
          sourceV4PortfolioTable(packet.sourceV4, citations),
        ]
      : [coverageTable(packet.coverage, citations)];
  }
  const sourceV4Tables = sourceV4TablesForQuestion(
    normalized,
    packet.sourceV4 ?? null,
    citations,
  );
  if (sourceV4Tables.length > 0) return sourceV4Tables;
  if (COMMERCIAL_EXPOSURE_RE.test(normalized)) {
    const tables: HomeKnowTable[] = [];
    if (packet.sourceV4) tables.push(sourceV4PortfolioTable(packet.sourceV4, citations));
    if (packet.vendors.length > 0) tables.push(vendorTable(packet.vendors, citations));
    if (packet.budgets.length > 0) tables.push(budgetTable(packet.budgets, citations));
    return tables.length > 0 ? tables.slice(0, 2) : [coverageTable(packet.coverage, citations)];
  }
  if (EXECUTIVE_ATTENTION_RE.test(normalized)) {
    const relevantGaps = packet.gaps.filter((row) =>
      ["high", "critical"].includes(row.severity.toLowerCase()),
    );
    return [
      gapTable(relevantGaps.length > 0 ? relevantGaps : packet.gaps, citations),
      coverageTable(packet.coverage, citations),
    ];
  }
  if (
    /\b(data product|analytics|data & analytics|data and analytics)\b/.test(
      normalized,
    )
  ) {
    return [
      recordTable({
        id: "home-data-products",
        title: "Data Products and Ownership",
        dimensionId: "data_analytics_estate",
        rows: recordsForDimensions(packet.records, ["data_analytics_estate"]),
        citations,
        note: "Shows available data-product records where present; missing domain or owning-team fields are explicit field gaps.",
      }),
    ];
  }
  if (/\b(cloud|infrastructure|volumetrics)\b/.test(normalized)) {
    return [
      recordTable({
        id: "home-cloud-platforms",
        title: "Cloud Platforms and Volumetrics",
        dimensionId: "infrastructure_cloud",
        rows: recordsForDimensions(packet.records, ["infrastructure_cloud"]),
        citations,
        note: "Shows available cloud/infrastructure records where present; missing provider, volume, or cost fields remain gaps.",
      }),
    ];
  }
  if (/\b(security|compliance|control|controls|posture)\b/.test(normalized)) {
    const securityGaps = packet.gaps.filter(
      (row) => row.dimension_id === "security_compliance",
    );
    return [
      gapTable(securityGaps.length > 0 ? securityGaps : packet.gaps, citations),
    ];
  }
  if (
    /\b(ai|initiative|initiatives|portfolio|value|impact|effort)\b/.test(
      normalized,
    )
  ) {
    return [
      recordTable({
        id: "home-initiatives",
        title: "Initiatives by Impact, Risk, and Owner",
        dimensionId: "initiatives_roadmap",
        rows: recordsForDimensions(packet.records, [
          "initiatives_roadmap",
          "ai_automation_footprint",
        ]).slice(0, 3),
        citations,
        note: "Shows available initiative records; missing impact, effort, realized value, or owner fields remain gaps.",
      }),
    ];
  }
  if (
    BUSINESS_CONTEXT_RE.test(normalized) ||
    /\b(business function|business functions|business org|operating model)\b|\bbusiness\b.*\b(organized|organization|org|function|functions|model)\b/.test(
      normalized,
    )
  ) {
    const businessRows = recordsForDimensions(packet.records, [
      "business_org_functions",
      "business_operating_model",
    ]);
    const tables: HomeKnowTable[] = [];
    if (businessRows.length > 0) {
      tables.push(
        recordTable({
          id: "home-business-functions",
          title: "Business Functions and Operating Model",
          dimensionId: "business_org_functions",
          rows: businessRows,
          citations,
          note: "Shows available business-function and operating-model records; named leader fields remain explicit gaps where the source did not provide them.",
        }),
      );
    }
    if (
      /\b(it|cio|technology|tech|team|portfolio|lead|leader|owner|ownership|who leads)\b/.test(
        normalized,
      )
    ) {
      tables.push(orgTable(packet.org, citations));
    }
    if (tables.length > 0) return tables;
    if (packet.applications.length > 0) {
      return [
        applicationTable(packet.applications, citations),
        coverageTable(packet.coverage, citations),
      ];
    }
    return [coverageTable(packet.coverage, citations)];
  }
  if (
    /\b(org|team|portfolio|lead|leader|leaders|owner|ownership|who leads|cio)\b/.test(
      normalized,
    )
  ) {
    return [orgTable(packet.org, citations)];
  }
  if (/\b(app|application|system|platform|cmdb)\b/.test(normalized)) {
    return [applicationTable(packet.applications, citations)];
  }
  if (
    /\b(vendor|vendors|contract|contracts|license|licenses|supplier|suppliers|renewal|renewals)\b/.test(
      normalized,
    )
  ) {
    return [vendorTable(packet.vendors, citations)];
  }
  if (
    /\b(budget|budgets|spend|cost|costs|financial|financials|chart|visual|graph)\b/.test(
      normalized,
    )
  ) {
    return [budgetTable(packet.budgets, citations)];
  }
  return [coverageTable(packet.coverage, citations)];
}

function buildChartsForIntent(
  intent: HomeKnowIntent,
  question: string,
  packet: HomeKnowPacket,
  citations: HomeKnowCitation[],
): HomeKnowChart[] {
  if (intent !== "chart") return [];
  const normalized = question.toLowerCase();
  if (GRAPH_RE.test(normalized)) return [];
  if (
    /\b(vendor|vendors|contract|contracts|license|licenses|supplier|suppliers|renewal|renewals)\b/.test(
      normalized,
    )
  ) {
    const chart = vendorChart(packet.vendors, citations);
    return [
      chart.data.length > 0
        ? chart
        : recordDistributionChart(
            packet,
            citations,
            "Vendor and Contract Records",
          ),
    ];
  }
  if (/\b(app|application|system|platform|domain|cmdb)\b/.test(normalized)) {
    const chart = applicationDomainChart(packet.applications, citations);
    return [
      chart.data.length > 0
        ? chart
        : recordDistributionChart(
            packet,
            citations,
            "Application and Platform Records",
          ),
    ];
  }
  if (
    /\b(ai|initiative|initiatives|value|impact|effort|portfolio|waterfall|commitment|realized)\b/.test(
      normalized,
    )
  ) {
    const chart = initiativePlanningChart(packet, citations);
    return [
      chart.data.length > 0
        ? chart
        : recordDistributionChart(
            packet,
            citations,
            "Initiative and AI Records",
          ),
    ];
  }
  const chart = budgetChart(packet.budgets, citations);
  return [
    chart.data.length > 0
      ? chart
      : recordDistributionChart(
          packet,
          citations,
          "Loaded Record Distribution",
        ),
  ];
}

function buildGraphsForIntent(
  intent: HomeKnowIntent,
  question: string,
  packet: HomeKnowPacket,
  citations: HomeKnowCitation[],
): HomeKnowGraph[] {
  if (intent !== "chart" || !GRAPH_RE.test(question)) return [];
  const graph = relationshipGraph(question, packet, citations);
  return [graph];
}

function coverageTable(
  rows: HomeDimensionCoverageRow[],
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return {
    id: "home-dimension-coverage",
    title: "Available Context Coverage",
    dimensionId: "dimension_coverage",
    columns: [
      { key: "dimension_label", label: "Dimension" },
      {
        key: "record_count",
        label: "Records",
        align: "right",
        format: "number",
      },
      {
        key: "fact_count",
        label: "Source support",
        align: "right",
        format: "number",
      },
      {
        key: "relationship_count",
        label: "Relationships",
        align: "right",
        format: "number",
      },
      { key: "gap_count", label: "Gaps", align: "right", format: "number" },
      { key: "trust_score", label: "Trust", align: "right", format: "number" },
    ],
    rows: rows.map((row) => ({
      dimension_label: row.dimension_label,
      record_count: number(row.record_count),
      fact_count: number(row.fact_count),
      relationship_count: number(row.relationship_count),
      gap_count: number(row.gap_count),
      trust_score: number(row.trust_score),
    })),
    citationIds: citations.map((citation) => citation.id),
  };
}

function orgTable(
  rows: HomeItOrgViewRow[],
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return {
    id: "home-it-org",
    title: "IT Portfolio Ownership",
    dimensionId: "it_org_ownership",
    columns: [
      { key: "team_name", label: "Portfolio / Team" },
      { key: "executive_owner_role", label: "Owner Role" },
      { key: "domain", label: "Domain" },
      { key: "head_count_fte", label: "FTE", align: "right", format: "number" },
      {
        key: "annual_budget_usd",
        label: "Annual Budget",
        align: "right",
        format: "currency",
      },
    ],
    rows: rows.map((row) => ({
      team_name: row.team_name ?? "Not yet available",
      executive_owner_role: row.executive_owner_role ?? "Not yet available",
      domain: row.domain ?? "Not yet available",
      head_count_fte: numberOrNull(row.head_count_fte),
      annual_budget_usd: numberOrNull(row.annual_budget_usd),
    })),
    citationIds: citationIdForDimension("it_org_ownership", citations),
  };
}

function applicationTable(
  rows: HomeApplicationOwnershipViewRow[],
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return {
    id: "home-application-ownership",
    title: "Application Ownership",
    dimensionId: "applications_core_systems",
    columns: [
      { key: "application_name", label: "Application" },
      { key: "domain", label: "Domain" },
      { key: "primary_business_owner", label: "Business Owner" },
      { key: "technical_owner_team", label: "Technical Owner Team" },
      { key: "technical_owner_role", label: "Technical Owner Role" },
      { key: "criticality", label: "Criticality" },
      {
        key: "annual_run_cost_usd",
        label: "Annual Run Cost",
        align: "right",
        format: "currency",
      },
    ],
    rows: rows.map((row) => ({
      application_name: row.application_name ?? "Not yet available",
      domain: row.domain ?? "Not yet available",
      primary_business_owner: row.primary_business_owner ?? "Not yet available",
      technical_owner_team: row.technical_owner_team ?? "Not yet available",
      technical_owner_role: row.technical_owner_role ?? "Not yet available",
      criticality: row.criticality ?? "Not yet available",
      annual_run_cost_usd: numberOrNull(row.annual_run_cost_usd),
    })),
    citationIds: citationIdForDimension("applications_core_systems", citations),
  };
}

function vendorTable(
  rows: HomeVendorLandscapeViewRow[],
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return {
    id: "home-vendor-landscape",
    title: "Vendor Landscape",
    dimensionId: "vendors_contracts",
    columns: [
      { key: "vendor_name", label: "Vendor" },
      { key: "category", label: "Category" },
      {
        key: "annual_spend_usd",
        label: "Annual Spend",
        align: "right",
        format: "currency",
      },
      { key: "renewal_risk", label: "Renewal Risk" },
      { key: "business_owner", label: "Business Owner" },
      { key: "technology_owner", label: "Technology Owner" },
    ],
    rows: rows.map((row) => ({
      vendor_name: row.vendor_name ?? "Not yet available",
      category: row.category ?? "Not yet available",
      annual_spend_usd: numberOrNull(row.annual_spend_usd),
      renewal_risk: row.renewal_risk ?? "Not yet available",
      business_owner: row.business_owner ?? "Not yet available",
      technology_owner: row.technology_owner ?? "Not yet available",
    })),
    citationIds: citationIdForDimension("vendors_contracts", citations),
  };
}

function budgetTable(
  rows: HomeBudgetPortfolioViewRow[],
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return {
    id: "home-budget-by-portfolio",
    title: "Budget by Portfolio",
    dimensionId: "it_budget_financials",
    columns: [
      { key: "function_or_platform", label: "Function / Platform" },
      {
        key: "run_budget_usd",
        label: "Run Budget",
        align: "right",
        format: "currency",
      },
      {
        key: "change_budget_usd",
        label: "Change Budget",
        align: "right",
        format: "currency",
      },
      {
        key: "ai_budget_usd",
        label: "AI Budget",
        align: "right",
        format: "currency",
      },
      { key: "owner_role", label: "Owner Role" },
    ],
    rows: rows.map((row) => ({
      function_or_platform: row.function_or_platform ?? "Not yet available",
      run_budget_usd: numberOrNull(row.run_budget_usd),
      change_budget_usd: numberOrNull(row.change_budget_usd),
      ai_budget_usd: numberOrNull(row.ai_budget_usd),
      owner_role: row.owner_role ?? "Not yet available",
    })),
    citationIds: citationIdForDimension("it_budget_financials", citations),
  };
}

function sourceV4TablesForQuestion(
  normalizedQuestion: string,
  snapshot: SourceV4WorkspaceSnapshot | null,
  citations: HomeKnowCitation[],
): HomeKnowTable[] {
  if (!sourceV4HasData(snapshot)) return [];
  if (
    /\b(ai|saas|seat|seats|copilot|claude code|ai tool|productivity|value proof|claimable)\b/.test(
      normalizedQuestion,
    )
  ) {
    return [sourceV4AiUsageTable(snapshot, citations)];
  }
  if (/\b(cloud|azure|overage|amortized|commitment)\b/.test(normalizedQuestion)) {
    return [sourceV4CloudTable(snapshot, citations)];
  }
  if (/\b(rate card|rate-card|fieldglass|labor|workforce|bill rate)\b/.test(normalizedQuestion)) {
    return [sourceV4RateCardTable(snapshot, citations)];
  }
  if (/\b(sourcing event|bafo|ariba|supplier response|rfp)\b/.test(normalizedQuestion)) {
    return [sourceV4SourcingEventTable(snapshot, citations)];
  }
  if (/\b(credit|credits|sla|service level|service credit)\b/.test(normalizedQuestion)) {
    return [sourceV4PerformanceCreditTable(snapshot, citations)];
  }
  if (/\b(invoice|invoices|off-contract|off contract|spend|actual spend|consumption)\b/.test(normalizedQuestion)) {
    return [sourceV4SpendTable(snapshot, citations)];
  }
  if (/\b(scope|dependency|dependencies|application|applications|platform|platforms)\b/.test(normalizedQuestion)) {
    return [sourceV4ScopeTable(snapshot, citations)];
  }
  if (
    COMMERCIAL_EXPOSURE_RE.test(normalizedQuestion) ||
    /\b(source v4|cube|vendor|vendors|contract|contracts|supplier|suppliers|renewal|renewals|portfolio)\b/.test(
      normalizedQuestion,
    )
  ) {
    return [
      sourceV4PortfolioTable(snapshot, citations),
      sourceV4TopVendorsTable(snapshot, citations),
    ];
  }
  return [];
}

function sourceV4HasData(
  snapshot: SourceV4WorkspaceSnapshot | null,
): snapshot is SourceV4WorkspaceSnapshot {
  return Boolean(
    snapshot &&
      (snapshot.contextCoverage.contracts > 0 ||
        snapshot.contextCoverage.vendors > 0 ||
        snapshot.contextCoverage.invoiceLines > 0 ||
        snapshot.aiUsageValueProof.rowCount > 0 ||
        snapshot.cloudOptimization.rowCount > 0),
  );
}

function sourceV4CitationIds(citations: HomeKnowCitation[]): string[] {
  return citationIdForDimension("source_v4_cube", citations);
}

function sourceV4PortfolioTable(
  snapshot: SourceV4WorkspaceSnapshot,
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return {
    id: "home-source-v4-executive-portfolio",
    title: "Source V4 Contract Portfolio",
    dimensionId: "source_v4_cube",
    columns: [
      { key: "metric", label: "Metric" },
      { key: "value", label: "Value", align: "right", format: "number" },
    ],
    rows: [
      { metric: "Contracts", value: snapshot.executivePortfolio.contractCount },
      { metric: "Vendors", value: snapshot.contextCoverage.vendors },
      {
        metric: "Annual contract value",
        value: snapshot.executivePortfolio.annualValue,
      },
      {
        metric: "Total committed value",
        value: snapshot.executivePortfolio.totalCommittedValue,
      },
      { metric: "Auto-renewals", value: snapshot.executivePortfolio.autoRenewCount },
      {
        metric: "Notice-window contracts",
        value: snapshot.executivePortfolio.notice90DayCount,
      },
    ],
    citationIds: sourceV4CitationIds(citations),
    note: "Source V4 is a cube-backed semantic snapshot. It can support portfolio scale and exposure; it does not by itself prove savings or realized value.",
  };
}

function sourceV4TopVendorsTable(
  snapshot: SourceV4WorkspaceSnapshot,
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return {
    id: "home-source-v4-top-vendors",
    title: "Source V4 Top Vendors",
    dimensionId: "source_v4_cube",
    columns: [
      { key: "legal_name", label: "Vendor" },
      { key: "supplier_category", label: "Category" },
      { key: "risk_tier", label: "Risk Tier" },
      {
        key: "annual_value",
        label: "Annual Value",
        align: "right",
        format: "currency",
      },
      {
        key: "contract_count",
        label: "Contracts",
        align: "right",
        format: "number",
      },
    ],
    rows: snapshot.topVendors.map((vendor) => ({
      legal_name: vendor.legalName,
      supplier_category: vendor.supplierCategory ?? "Not yet available",
      risk_tier: vendor.riskTier ?? "Not yet available",
      annual_value: vendor.annualValue,
      contract_count: vendor.contractCount,
    })),
    citationIds: sourceV4CitationIds(citations),
  };
}

function sourceV4SpendTable(
  snapshot: SourceV4WorkspaceSnapshot,
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return metricRowsTable({
    id: "home-source-v4-spend-consumption",
    title: "Source V4 Spend and Invoice Consumption",
    rows: [
      ["Rows", snapshot.spendConsumption.rowCount],
      ["Invoice lines", snapshot.spendConsumption.invoiceLines],
      ["Actual spend", snapshot.spendConsumption.actualSpend],
      ["Committed amount", snapshot.spendConsumption.committedAmount],
      ["Off-contract spend", snapshot.spendConsumption.offContractSpend],
    ],
    citations,
    note: "Off-contract spend is source-supported matching-state evidence, not automatically recoverable savings.",
  });
}

function sourceV4PerformanceCreditTable(
  snapshot: SourceV4WorkspaceSnapshot,
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return metricRowsTable({
    id: "home-source-v4-performance-credits",
    title: "Source V4 SLA and Service Credit Evidence",
    rows: [
      ["Rows", snapshot.performanceCredits.rowCount],
      ["Breaches", snapshot.performanceCredits.breachCount],
      ["Credits calculated", snapshot.performanceCredits.creditCalculated],
      ["Credits claimed", snapshot.performanceCredits.creditClaimed],
      ["Credits recovered", snapshot.performanceCredits.creditRecovered],
      ["Unclaimed credits", snapshot.performanceCredits.unclaimedCredit],
    ],
    citations,
    note: "Calculated, claimed, recovered and unclaimed credits are kept separate so aVa does not overstate recoverability.",
  });
}

function sourceV4AiUsageTable(
  snapshot: SourceV4WorkspaceSnapshot,
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return {
    id: "home-source-v4-ai-usage-value-proof",
    title: "Source V4 AI Usage and Value Proof",
    dimensionId: "source_v4_cube",
    columns: [
      { key: "metric", label: "Metric" },
      { key: "value", label: "Value", align: "right", format: "number" },
    ],
    rows: [
      { metric: "Usage rows", value: snapshot.aiUsageValueProof.rowCount },
      { metric: "Assigned seats", value: snapshot.aiUsageValueProof.assignedSeats },
      { metric: "Active users", value: snapshot.aiUsageValueProof.activeUsers },
      { metric: "Actual cost", value: snapshot.aiUsageValueProof.actualCost },
      { metric: "Claimable rows", value: snapshot.aiUsageValueProof.claimableRows },
      ...snapshot.aiUsageValueProof.topProducts.slice(0, 5).map((product) => ({
        metric: product.name,
        value: product.amount,
      })),
    ],
    citationIds: sourceV4CitationIds(citations),
    note: "Usage, seats and tool cost are evidence for adoption. Developer productivity requires before/after engineering telemetry such as deployment frequency, lead time, quality escape rate and recovery time.",
  };
}

function sourceV4CloudTable(
  snapshot: SourceV4WorkspaceSnapshot,
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return {
    id: "home-source-v4-cloud-optimization",
    title: "Source V4 Cloud Cost and Overage",
    dimensionId: "source_v4_cube",
    columns: [
      { key: "metric", label: "Metric" },
      { key: "value", label: "Value", align: "right", format: "number" },
    ],
    rows: [
      { metric: "Rows", value: snapshot.cloudOptimization.rowCount },
      { metric: "Actual cost", value: snapshot.cloudOptimization.actualCost },
      { metric: "Amortized cost", value: snapshot.cloudOptimization.amortizedCost },
      { metric: "Overage", value: snapshot.cloudOptimization.overageAmount },
      ...snapshot.cloudOptimization.topServices.slice(0, 5).map((service) => ({
        metric: service.name,
        value: service.amount,
      })),
    ],
    citationIds: sourceV4CitationIds(citations),
  };
}

function sourceV4RateCardTable(
  snapshot: SourceV4WorkspaceSnapshot,
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return metricRowsTable({
    id: "home-source-v4-workforce-rate-cards",
    title: "Source V4 Workforce Rate Cards",
    rows: [
      ["Rows", snapshot.workforceRateCards.rowCount],
      ["Hours", snapshot.workforceRateCards.hours],
      ["Average bill rate", snapshot.workforceRateCards.averageBillRate],
      ["Unapproved variances", snapshot.workforceRateCards.unapprovedVarianceCount],
    ],
    citations,
    note: "Rate-card variance is an approval signal. It is not a legal finding unless mapped to reviewed contract terms.",
  });
}

function sourceV4SourcingEventTable(
  snapshot: SourceV4WorkspaceSnapshot,
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return metricRowsTable({
    id: "home-source-v4-sourcing-events",
    title: "Source V4 Sourcing Events",
    rows: [
      ["Rows", snapshot.sourcingEvents.rowCount],
      ["Normalized cost", snapshot.sourcingEvents.normalizedCost],
      ["Line-item cost", snapshot.sourcingEvents.lineItemCost],
      ["Average weighted score", snapshot.sourcingEvents.averageWeightedScore],
    ],
    citations,
    note: "Sourcing-event data supports BAFO and supplier-response analysis when the event stages and response comparability fields are present.",
  });
}

function sourceV4ScopeTable(
  snapshot: SourceV4WorkspaceSnapshot,
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return metricRowsTable({
    id: "home-source-v4-scope-confidence",
    title: "Source V4 Application and Platform Scope",
    rows: [
      ["Scope rows", snapshot.contextCoverage.scopeRows],
      ["Contracts", snapshot.contextCoverage.contracts],
      ["Vendors", snapshot.contextCoverage.vendors],
    ],
    citations,
    note: "Scope rows support dependency exploration. Confirmed and inferred relationships must remain visibly distinct in Source and Intelligence.",
  });
}

function metricRowsTable(input: {
  id: string;
  title: string;
  rows: Array<[string, number | null]>;
  citations: HomeKnowCitation[];
  note?: string;
}): HomeKnowTable {
  return {
    id: input.id,
    title: input.title,
    dimensionId: "source_v4_cube",
    columns: [
      { key: "metric", label: "Metric" },
      { key: "value", label: "Value", align: "right", format: "number" },
    ],
    rows: input.rows.map(([metric, value]) => ({ metric, value })),
    citationIds: sourceV4CitationIds(input.citations),
    note: input.note,
  };
}

function gapTable(
  rows: HomeGapRegisterViewRow[],
  citations: HomeKnowCitation[],
): HomeKnowTable {
  return {
    id: "home-gap-register",
    title: "Home Source Gaps",
    dimensionId: "gap_register",
    columns: [
      { key: "dimension_id", label: "Dimension" },
      { key: "display_label", label: "Missing Field" },
      { key: "severity", label: "Severity" },
      {
        key: "missing_count",
        label: "Missing Rows",
        align: "right",
        format: "number",
      },
    ],
    rows: rows.map((row) => ({
      dimension_id: row.dimension_id,
      display_label: row.display_label,
      severity: row.severity,
      missing_count: number(row.missing_count),
    })),
    citationIds: citations.map((citation) => citation.id),
  };
}

function recordTable(input: {
  id: string;
  title: string;
  dimensionId: string;
  rows: HomeContextRecordRow[];
  citations: HomeKnowCitation[];
  note?: string;
}): HomeKnowTable {
  return {
    id: input.id,
    title: input.title,
    dimensionId: input.dimensionId,
    columns: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "domain", label: "Domain / Capability" },
      { key: "owner", label: "Owner / Team" },
      { key: "status", label: "Status / Maturity" },
      { key: "measure", label: "Loaded Measure" },
    ],
    rows: input.rows.slice(0, 25).map((row) => {
      const payload = row.payload ?? {};
      return {
        name:
          cleanLabel(
            firstPayloadValue(payload, [
              "name",
              "label",
              "title",
              "function_name",
              "business_function",
              "data_product_name",
              "product_name",
              "application_name",
              "system_name",
              "platform_name",
              "initiative_name",
              "capability_name",
            ]),
          ) ?? "Name field missing",
        type: cleanLabel(row.record_type) ?? "Type field missing",
        domain:
          cleanLabel(
            firstPayloadValue(payload, [
              "domain",
              "business_domain",
              "capability",
              "capability_name",
              "business_capability",
              "category",
            ]),
          ) ?? "Domain field missing",
        owner:
          cleanLabel(
            firstPayloadValue(payload, [
              "owning_team",
              "owner_team",
              "team_name",
              "owner",
              "business_owner",
              "technology_owner",
              "executive_owner_role",
              "primary_business_owner",
            ]),
          ) ?? "Owner field missing",
        status:
          cleanLabel(
            firstPayloadValue(payload, [
              "status",
              "lifecycle_status",
              "maturity",
              "stage",
              "risk",
              "risk_level",
              "posture",
            ]),
          ) ?? "Status field missing",
        measure:
          cleanLabel(
            firstPayloadValue(payload, [
              "impact",
              "business_impact",
              "annual_spend_usd",
              "run_budget_usd",
              "change_budget_usd",
              "volumetric",
              "volume",
              "record_count",
            ]),
          ) ?? "Measure field missing",
      };
    }),
    citationIds: citationIdForDimension(input.dimensionId, input.citations),
    note: input.note,
  };
}

function recordsForDimensions(
  rows: HomeContextRecordRow[],
  dimensions: string[],
): HomeContextRecordRow[] {
  const wanted = new Set(dimensions);
  return rows.filter((row) => row.dimension && wanted.has(row.dimension));
}

function vendorChart(
  rows: HomeVendorLandscapeViewRow[],
  citations: HomeKnowCitation[],
): HomeKnowChart {
  return {
    id: "home-vendor-spend-chart",
    title: "Annual Vendor Spend",
    kind: "cost-stack",
    type: "cost_stack",
    dimensionId: "vendors_contracts",
    data: rows
      .map((row, index) => ({
        label: row.vendor_name ?? "Unknown vendor",
        value: number(row.annual_spend_usd),
        color: chartColor(index),
      }))
      .filter((row) => row.value > 0)
      .slice(0, 8),
    sourceIds: rows
      .map((row) => sourceId(row.source_file, row.source_row_number))
      .filter(isString),
    citationIds: citationIdForDimension("vendors_contracts", citations),
    caveats: [],
    status: "tenant-fact",
  };
}

function budgetChart(
  rows: HomeBudgetPortfolioViewRow[],
  citations: HomeKnowCitation[],
): HomeKnowChart {
  const run = rows.reduce((sum, row) => sum + number(row.run_budget_usd), 0);
  const change = rows.reduce(
    (sum, row) => sum + number(row.change_budget_usd),
    0,
  );
  const ai = rows.reduce((sum, row) => sum + number(row.ai_budget_usd), 0);
  return {
    id: "home-budget-mix-chart",
    title: "Budget Mix",
    kind: "cost-stack",
    type: "cost_stack",
    dimensionId: "it_budget_financials",
    data: [
      { label: "Run", value: run, color: CHART.accent },
      { label: "Change", value: change, color: CHART.good },
      { label: "AI", value: ai, color: CHART.warn },
    ].filter((row) => row.value > 0),
    sourceIds: rows
      .map((row) => sourceId(row.source_file, row.source_row_number))
      .filter(isString),
    citationIds: citationIdForDimension("it_budget_financials", citations),
    caveats:
      run > 0 && change === 0
        ? [
            "Run budget exists, but change budget line-item split is missing in the available records.",
          ]
        : [],
    status: "tenant-fact",
  };
}

function applicationDomainChart(
  rows: HomeApplicationOwnershipViewRow[],
  citations: HomeKnowCitation[],
): HomeKnowChart {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = cleanLabel(row.domain) ?? "Domain missing";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return {
    id: "home-application-domain-chart",
    title: "Application Count by Domain",
    kind: "bar",
    type: "bar",
    dimensionId: "applications_core_systems",
    data: [...counts.entries()]
      .map(([label, value], index) => ({
        label,
        value,
        color: chartColor(index),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12),
    sourceIds: rows
      .map((row) => sourceId(row.source_file, row.source_row_number))
      .filter(isString),
    citationIds: citationIdForDimension("applications_core_systems", citations),
    caveats: rows.some((row) => !cleanLabel(row.domain))
      ? ["Some application rows are missing a domain value."]
      : [],
    status: "tenant-fact",
  };
}

function initiativePlanningChart(
  packet: HomeKnowPacket,
  citations: HomeKnowCitation[],
): HomeKnowChart {
  const budget = budgetChart(packet.budgets, citations);
  return {
    ...budget,
    id: "home-portfolio-investment-chart",
    title: "Available Budget Mix for Portfolio Planning",
    caveats: [
      ...budget.caveats,
      "Home KNOW can chart available budget records, but initiative impact and effort require initiative-level fields before a board-grade AI bet chart is available.",
    ],
    status: "tenant-fact",
  };
}

function recordDistributionChart(
  packet: HomeKnowPacket,
  citations: HomeKnowCitation[],
  title: string,
): HomeKnowChart {
  const counts = new Map<string, number>();
  for (const row of packet.records) {
    const label =
      cleanLabel(row.dimension) ?? cleanLabel(row.record_type) ?? "Record";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  if (counts.size === 0) {
    for (const row of packet.coverage) {
      const label =
        cleanLabel(row.dimension_label) ??
        cleanLabel(row.dimension_id) ??
        "Available material";
      const value = number(row.record_count);
      if (value > 0) counts.set(label, value);
    }
  }
  return {
    id: "home-record-distribution-chart",
    title,
    kind: "bar",
    type: "bar",
    dimensionId: "dimension_coverage",
    data: [...counts.entries()]
      .map(([label, value], index) => ({
        label,
        value,
        color: chartColor(index),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12),
    sourceIds: [],
    citationIds: citations.map((citation) => citation.id).slice(0, 8),
    caveats: [
      counts.size > 0
        ? "Specific initiative spend, realized value, or effort fields were not all present, so this visual uses loaded record distribution rather than invented financial figures."
        : "The requested numeric series is missing; Home returns this chart shell with a gap instead of inventing values.",
    ],
    status: "tenant-fact",
  };
}

function relationshipGraph(
  question: string,
  packet: HomeKnowPacket,
  citations: HomeKnowCitation[],
): HomeKnowGraph {
  const normalized = question.toLowerCase();
  const labelIndex = buildRecordLabelIndex(packet.records);
  const matchedEdges = packet.relationships
    .filter((row) => row.from_external_id && row.to_external_id)
    .filter((row) => relationshipMatchesQuestion(row, normalized, labelIndex))
    .slice(0, 60);
  const edges =
    matchedEdges.length > 0
      ? matchedEdges
      : packet.relationships
          .filter((row) => row.from_external_id && row.to_external_id)
          .slice(0, 60);
  const nodeMap = new Map<
    string,
    { id: string; label: string; type: string }
  >();
  const graphEdges = [];
  for (const row of edges) {
    const from = String(row.from_external_id);
    const to = String(row.to_external_id);
    const fromLabel = labelForRecordId(from, labelIndex);
    const toLabel = labelForRecordId(to, labelIndex);
    nodeMap.set(from, {
      id: from,
      label: fromLabel,
      type: typeForRecordId(from, labelIndex),
    });
    nodeMap.set(to, {
      id: to,
      label: toLabel,
      type: typeForRecordId(to, labelIndex),
    });
    graphEdges.push({
      from,
      to,
      label: cleanLabel(row.relationship_type) ?? "related to",
      type: cleanLabel(row.relationship_type) ?? "relationship",
      confidence: "high" as const,
    });
  }
  const sourceIds = edges
    .map(
      (row) =>
        row.relationship_key ??
        sourceId(row.source_file, row.source_row_number),
    )
    .filter(isString);
  const gaps =
    packet.relationships.length > 0 && matchedEdges.length === 0
      ? [specificGraphGap(normalized)]
      : packet.relationships.length === 0
        ? [
            "source-to-target integration edges missing in the loaded relationship rows",
          ]
        : [];
  const nodeTypes = [
    ...new Set([...nodeMap.values()].map((node) => node.type)),
  ].sort();
  const edgeTypes = [...new Set(graphEdges.map((edge) => edge.type))].sort();
  return {
    id: "home-relationship-graph",
    title: graphTitle(normalized),
    nodes: [...nodeMap.values()].slice(0, 80),
    edges: graphEdges,
    nodeTypes,
    edgeTypes,
    sourceIds,
    citationIds: citationIdForDimension("relationship_graph", citations),
    confidence:
      matchedEdges.length > 0
        ? "high"
        : graphEdges.length > 0
          ? "medium"
          : "low",
    gaps,
    inferredEdges: false,
    warning: gaps[0],
  };
}

interface RecordLabelIndexEntry {
  label: string;
  type: string;
}

function buildRecordLabelIndex(
  rows: HomeContextRecordRow[],
): Map<string, RecordLabelIndexEntry> {
  const index = new Map<string, RecordLabelIndexEntry>();
  for (const row of rows) {
    const payload = row.payload ?? {};
    const label = cleanLabel(
      firstPayloadValue(payload, [
        "name",
        "label",
        "title",
        "display_name",
        "application_name",
        "app_name",
        "system_name",
        "platform_name",
        "vendor_name",
        "contract_name",
        "initiative_name",
        "capability_name",
        "data_product_name",
        "team_name",
        "function_or_platform",
        "workflow_name",
      ]),
    );
    const type =
      cleanLabel(row.record_type) ??
      cleanLabel(
        firstPayloadValue(payload, ["object_type", "type", "category"]),
      ) ??
      "record";
    const entry = {
      label:
        label ?? readableId(row.source_record_id ?? row.canonical_record_id),
      type,
    };
    for (const key of recordIndexKeys(row)) {
      index.set(key, entry);
    }
  }
  return index;
}

function recordIndexKeys(row: HomeContextRecordRow): string[] {
  const keys = new Set<string>();
  for (const value of [row.canonical_record_id, row.source_record_id]) {
    if (value) {
      keys.add(value);
      keys.add(value.toLowerCase());
      keys.add(value.split("/").pop() ?? value);
    }
  }
  const payload = row.payload ?? {};
  for (const field of [
    "id",
    "record_id",
    "source_id",
    "app_id",
    "application_id",
    "system_id",
    "platform_id",
    "vendor_id",
    "contract_id",
    "initiative_id",
    "capability_id",
    "data_product_id",
    "team_id",
    "workflow_id",
    "integration_id",
    "edge_id",
    "risk_id",
  ]) {
    const value = payload[field];
    if (typeof value === "string" && value.trim()) {
      keys.add(value.trim());
      keys.add(value.trim().toLowerCase());
    }
  }
  return [...keys];
}

function firstPayloadValue(
  payload: Record<string, unknown>,
  fields: string[],
): string | null {
  for (const field of fields) {
    const value = payload[field];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function labelForRecordId(
  id: string,
  index: Map<string, RecordLabelIndexEntry>,
): string {
  return (
    index.get(id)?.label ?? index.get(id.toLowerCase())?.label ?? readableId(id)
  );
}

function typeForRecordId(
  id: string,
  index: Map<string, RecordLabelIndexEntry>,
): string {
  return (
    index.get(id)?.type ??
    index.get(id.toLowerCase())?.type ??
    inferTypeFromId(id)
  );
}

function relationshipMatchesQuestion(
  row: HomeRelationshipRow,
  normalizedQuestion: string,
  index: Map<string, RecordLabelIndexEntry>,
): boolean {
  const haystack = [
    row.relationship_type,
    row.from_external_id,
    row.to_external_id,
    row.from_external_id ? labelForRecordId(row.from_external_id, index) : null,
    row.to_external_id ? labelForRecordId(row.to_external_id, index) : null,
    row.properties ? JSON.stringify(row.properties) : null,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/\b(vendor|vendors|supplier|contract)\b/.test(normalizedQuestion)) {
    return /\b(vendor|supplier|contract|supports?|owned_by|provided_by)\b/.test(
      haystack,
    );
  }
  if (
    /\b(data product|lineage|analytics|feed|feeds|source system)\b/.test(
      normalizedQuestion,
    )
  ) {
    return /\b(data|lineage|feed|feeds|source|target|analytics|product)\b/.test(
      haystack,
    );
  }
  if (/\b(capabilit|business capability)\b/.test(normalizedQuestion)) {
    return /\b(capability|supports?|app|application|system)\b/.test(haystack);
  }
  if (/\b(platform|initiative|initiatives)\b/.test(normalizedQuestion)) {
    return /\b(platform|initiative|depends|dependency|requires|enables)\b/.test(
      haystack,
    );
  }
  return true;
}

function graphTitle(normalizedQuestion: string): string {
  if (/\b(vendor|supplier|contract)\b/.test(normalizedQuestion)) {
    return "Vendor-to-System Relationship Graph";
  }
  if (
    /\b(data product|lineage|analytics|feed|feeds)\b/.test(normalizedQuestion)
  ) {
    return "Data Lineage Relationship Graph";
  }
  if (/\b(capabilit)\b/.test(normalizedQuestion)) {
    return "Capability-to-Application Relationship Graph";
  }
  return "Loaded System Relationship Graph";
}

function specificGraphGap(normalizedQuestion: string): string {
  if (/\b(data product|lineage|feed|feeds)\b/.test(normalizedQuestion)) {
    return "source-to-target data lineage edge pairs missing for this graph request";
  }
  if (/\b(vendor|supplier|contract)\b/.test(normalizedQuestion)) {
    return "vendor-to-system support edge pairs missing for this graph request";
  }
  if (/\b(capabilit)\b/.test(normalizedQuestion)) {
    return "capability-to-application dependency edge pairs missing for this graph request";
  }
  return "source-to-target integration edges missing for this graph request";
}

function buildGaps(
  rows: HomeGapRegisterViewRow[],
  citations: HomeKnowCitation[],
  readErrors: string[] = [],
): HomeKnowGap[] {
  const gaps = rows.map((row, index) => ({
    id: `gap-${index + 1}`,
    dimensionId: row.dimension_id,
    objectType: row.object_type,
    expectedField: row.expected_field,
    displayLabel: row.display_label,
    severity: row.severity,
    message: `${row.display_label} is not yet available for ${number(row.missing_count)} ${row.object_type} record(s).`,
    citationIds: citations.map((citation) => citation.id),
  }));
  for (const [index, message] of readErrors.entries()) {
    gaps.push({
      id: `gap-read-model-${index + 1}`,
      dimensionId: "home_read_model",
      objectType: "home context model",
      expectedField: "query_result_rows",
      displayLabel: "Home context rows",
      severity: "medium",
      message,
      citationIds: citations.map((citation) => citation.id).slice(0, 4),
    });
  }
  return gaps;
}

function buildConflicts(
  rows: HomeConflictRegisterViewRow[],
  citations: HomeKnowCitation[],
): HomeKnowConflict[] {
  return rows.map((row, index) => ({
    id: `conflict-${index + 1}`,
    dimensionId: row.dimension_id,
    label: row.label,
    severity: row.severity,
    description: row.description,
    citationIds: citations.map((citation) => citation.id),
  }));
}

function homeKnowProse(input: {
  tenantKey: string;
  question: string;
  intent: HomeKnowIntent;
  packet: HomeKnowPacket;
  hasData: boolean;
  hasGaps: boolean;
  hasGraph: boolean;
  hasChart: boolean;
}): string {
  if (!input.hasData) {
    if (input.packet.coverage.length > 0 || input.hasGaps) {
      return "The available enterprise context is adjacent to the question, but the specific source fields needed for a clean answer are not complete yet. The answer stays grounded by showing the missing evidence path instead of filling the gap with assumptions.";
    }
    return "That specific item is not visible in the available tenant material.";
  }
  const orgCount = input.packet.org.length;
  const appCount = input.packet.applications.length;
  const vendorCount = input.packet.vendors.length;
  const budgetCount = input.packet.budgets.length;
  if (input.intent === "gap") {
    return input.packet.gaps.length
      ? `${input.packet.gaps.length} Home source gap(s) are visible. The gap register lists the missing fields, affected object type, severity, and record count.`
      : "Home does not show source gaps for this tenant in the available records.";
  }
  if (input.intent === "chart") {
    if (GRAPH_RE.test(input.question)) {
      return input.hasGraph
        ? "The relationship graph is built from available relationship and source records. If the requested relationship family is absent, Home reports that as a gap instead of inferring a dependency."
        : "The available relationship records do not contain the source-to-target edge pairs needed for that graph. Related material is available, but the specific edge family for this visual is missing.";
    }
    return "Here is the visual cut from Home. The chart data is assembled from tenant records and cited source files, so missing numeric fields stay visible as gaps instead of becoming invented figures.";
  }
  if (
    /\b(security|compliance|control|controls|posture)\b/i.test(input.question)
  ) {
    return "The security and compliance readout is limited to available coverage and source-supported fields. Control strength is not inferred; missing control fields are shown as gaps.";
  }
  if (COMMERCIAL_EXPOSURE_RE.test(input.question)) {
    const totalRun = input.packet.budgets.reduce(
      (sum, row) => sum + number(row.run_budget_usd),
      0,
    );
    const topVendors = readableList(
      input.packet.vendors
        .map((row) => row.vendor_name)
        .filter(isString)
        .slice(0, 3),
    );
    const sourceV4 = input.packet.sourceV4;
    if (sourceV4) {
      return `Short answer: Home can frame commercial exposure from cited contract, vendor, spend, and gap evidence, but it should not turn that into an approval recommendation without Source drill-down. Key signals: ${sourceV4.executivePortfolio.contractCount} contracts, ${sourceV4.contextCoverage.vendors} vendors, ${formatUsd(sourceV4.executivePortfolio.annualValue)} annual contract value, and ${formatUsd(sourceV4.performanceCredits.unclaimedCredit)} in unclaimed service-credit evidence. Caveat: exposure evidence is directional until contract terms, owners, and remediation status are confirmed.`;
    }
    return topVendors || totalRun > 0
      ? `Short answer: Home can frame commercial exposure directionally from the loaded vendor and budget records. Key signals: ${topVendors ? `vendors include ${topVendors}` : "vendor rows are present"}${totalRun > 0 ? `, with ${formatUsd(totalRun)} in loaded run budget` : ""}. Caveat: use Source for contract-term drill-down before approval.`
      : "Home has commercial-adjacent coverage, but not enough vendor, contract, or budget rows to state exposure cleanly.";
  }
  if (EXECUTIVE_ATTENTION_RE.test(input.question)) {
    const highGapCount = input.packet.gaps.filter((row) =>
      ["high", "critical"].includes(row.severity.toLowerCase()),
    ).length;
    const coverageCount = input.packet.coverage.length;
    return `Short answer: use Home as a CXO walkthrough map, not as the final decision record. Lead with the evidence boundary, then the highest-severity gaps, then the cited domains that are ready to drill into. Evidence: ${coverageCount} coverage area(s) are visible${highGapCount > 0 ? ` and ${highGapCount} high/critical gap(s) need explicit handling` : ""}. Caveat: unresolved gaps should be named before recommendations so the page does not imply more certainty than the sources support.`;
  }
  if (input.packet.sourceV4 && /\b(source v4|cube|invoice|invoices|off-contract|off contract|credit|credits|sla|saas|seat|seats|copilot|claude code|ai tool|cloud|azure|rate card|fieldglass|sourcing event|bafo|ariba)\b/i.test(input.question)) {
    const v4 = input.packet.sourceV4;
    if (/\b(ai|saas|seat|seats|copilot|claude code|ai tool|productivity|value proof|claimable)\b/i.test(input.question)) {
      return `The Source V4 evidence can show AI-tool adoption and cost: ${v4.aiUsageValueProof.rowCount} usage rows, ${v4.aiUsageValueProof.assignedSeats.toLocaleString("en-US")} assigned seats, ${v4.aiUsageValueProof.activeUsers.toLocaleString("en-US")} active users, and ${formatUsd(v4.aiUsageValueProof.actualCost)} of tool cost. It does not prove developer productivity or realized value without before/after engineering and finance validation metrics.`;
    }
    if (/\b(credit|credits|sla|service level|service credit)\b/i.test(input.question)) {
      return `The Source V4 service evidence separates calculated, claimed, recovered and unclaimed credits. It shows ${formatUsd(v4.performanceCredits.unclaimedCredit)} of unclaimed credits, but Home does not treat that as recoverable value without reviewed contract and legal evidence.`;
    }
    if (/\b(invoice|invoices|off-contract|off contract|spend|actual spend|consumption)\b/i.test(input.question)) {
      return `The Source V4 spend layer connects invoice activity to contract matching state: ${v4.spendConsumption.invoiceLines.toLocaleString("en-US")} invoice lines, ${formatUsd(v4.spendConsumption.actualSpend)} actual spend, and ${formatUsd(v4.spendConsumption.offContractSpend)} marked off-contract. That is exposure evidence, not an automatic savings claim.`;
    }
    return `The Source V4 context adds the governed contract and vendor evidence Home was missing: ${v4.executivePortfolio.contractCount} contracts, ${v4.contextCoverage.vendors} vendors, ${formatUsd(v4.executivePortfolio.annualValue)} annual contract value, and ${v4.contextCoverage.scopeRows.toLocaleString("en-US")} scope rows. Use Source for drill-down and Intelligence for cross-domain judgment.`;
  }
  if (
    /\b(data product|analytics|data & analytics|data and analytics)\b/i.test(
      input.question,
    )
  ) {
    const records = recordsForDimensions(input.packet.records, [
      "data_analytics_estate",
    ]);
    const sample = readableList(
      records
        .map((row) =>
          cleanLabel(
            firstPayloadValue(row.payload ?? {}, [
              "name",
              "label",
              "title",
              "data_product_name",
              "product_name",
              "platform_name",
            ]),
          ),
        )
        .filter(isString)
        .slice(0, 4),
    );
    return sample
      ? `The loaded data and analytics estate includes ${sample}. Ownership and maturity fields are shown where they exist, with product-registry gaps called out separately.`
      : "The loaded data and analytics estate is available at the context-model level. Ownership fields are shown where present; product-registry detail remains a gap when it is missing.";
  }
  if (
    /\b(vendor|vendors|contract|contracts|renewal|renewals)\b/i.test(
      input.question,
    )
  ) {
    const topVendors = readableList(
      input.packet.vendors
        .map((row) => row.vendor_name)
        .filter(isString)
        .slice(0, 4),
    );
    return topVendors
      ? `The loaded vendor landscape includes ${topVendors}. Spend, renewal risk, and ownership are shown where those fields exist; missing contract-owner fields remain gaps.`
      : "The loaded vendor and contract landscape is available where spend, renewal, or owner fields were supplied.";
  }
  if (
    /\b(budget|budgets|spend|cost|costs|financial|financials|run vs change)\b/i.test(
      input.question,
    )
  ) {
    const totalRun = input.packet.budgets.reduce(
      (sum, row) => sum + number(row.run_budget_usd),
      0,
    );
    const totalChange = input.packet.budgets.reduce(
      (sum, row) => sum + number(row.change_budget_usd),
      0,
    );
    const runText =
      totalRun > 0 ? ` I see ${formatUsd(totalRun)} in loaded run budget` : "";
    const changeText =
      totalChange > 0
        ? ` and ${formatUsd(totalChange)} in available change budget`
        : "";
    return `The available IT budget records show run/change fields where they exist.${runText}${changeText}. Missing line-item splits are shown as gaps rather than inferred.`;
  }
  if (
    /\b(app|application|system|platform|cmdb|systems of record)\b/i.test(
      input.question,
    )
  ) {
    const systems = readableList(
      input.packet.applications
        .map((row) => row.application_name)
        .filter(isString)
        .slice(0, 4),
    );
    return systems
      ? `The loaded application and systems inventory includes ${systems}. Ownership, criticality, and run-cost fields are shown where present; missing named technical owners remain explicit gaps.`
      : "The loaded application and system inventory includes ownership and lifecycle fields where those fields were supplied.";
  }
  if (
    BUSINESS_CONTEXT_RE.test(input.question) ||
    /\b(business function|business functions|business org|operating model)\b|\bbusiness\b.*\b(organized|organization|org|function|functions|model)\b/i.test(
      input.question,
    )
  ) {
    const businessRows = recordsForDimensions(input.packet.records, [
      "business_org_functions",
      "business_operating_model",
    ]);
    const functions = readableList(
      businessRows
        .map((row) =>
          cleanLabel(
            firstPayloadValue(row.payload ?? {}, [
              "name",
              "function_name",
              "business_function",
              "capability_name",
              "title",
            ]),
          ),
        )
        .filter(isString)
        .slice(0, 5),
    );
    const portfolios = readableList(
      input.packet.org
        .map((row) => row.team_name)
        .filter(isString)
        .slice(0, 4),
    );
    if (functions && portfolios) {
      return `The available material describes the business through ${functions}, and the technology organization through portfolios such as ${portfolios}. It can show owner roles where supplied; named leaders under the CIO remain limited to the fields the tenant provided.`;
    }
    if (functions) {
      return `The available material describes the business through ${functions}. Named technology leaders are only shown where the tenant supplied IT ownership fields.`;
    }
    if (input.packet.applications.length > 0) {
      const systems = readableList(
        input.packet.applications
          .map((row) => row.application_name)
          .filter(isString)
          .slice(0, 4),
      );
      return `Short answer: Home can describe the business indirectly through the systems and ownership evidence now loaded${systems ? `, including ${systems}` : ""}. Caveat: named business-model records are not complete in this read-model slice, so do not treat the technology inventory as the whole business story.`;
    }
  }
  if (
    /\b(org|team|portfolio|lead|owner|ownership|who leads)\b/i.test(
      input.question,
    )
  ) {
    const portfolios = readableList(
      input.packet.org
        .map((row) => row.team_name)
        .filter(isString)
        .slice(0, 5),
    );
    return portfolios
      ? `IT is loaded by portfolio/team: ${portfolios}. The data provides owner roles where available; named individuals are only shown when the tenant supplied that field, otherwise Home reports the named-owner gap.`
      : "Loaded IT portfolios and owner roles are available where present. Named individuals are only shown when the tenant supplied that field.";
  }
  const suffix = input.hasGaps
    ? " Some source fields are still incomplete, so the answer stays directional and calls out what needs confirmation."
    : "";
  const support = readableList([
    orgCount > 0 ? "IT organization" : "",
    appCount > 0 ? "application landscape" : "",
    vendorCount > 0 ? "vendor landscape" : "",
    budgetCount > 0 ? "budget context" : "",
  ]);
  return support
    ? `The enterprise context has enough ${support} detail to frame this answer.${suffix}`
    : `The enterprise context has partial support for this question.${suffix}`;
}

function readableList(values: string[]): string | null {
  const cleaned = values.map(cleanLabel).filter(isString);
  if (cleaned.length === 0) return null;
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(", ")}, and ${cleaned[cleaned.length - 1]}`;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    notation: Math.abs(value) >= 1_000_000 ? "compact" : "standard",
    style: "currency",
  }).format(value);
}

export function validateHomeKnowResponse(
  response: HomeKnowResponse,
): HomeKnowResponse {
  let prose = response.prose;
  let unsupportedClaimsRemoved = response.safety.unsupportedClaimsRemoved;
  const evidence = hasUsableDossierEvidence(response);
  const evidenceChannels = mergeEvidenceChannels(
    evidence.evidenceChannels,
    response.safety.evidenceChannels,
    response.safety.composerTrace?.evidenceChannels,
  );
  const usableEvidence =
    evidence.usable ||
    Object.values(evidenceChannels).some((count) => count > 0);
  const templatePrefix = /\b(Read|Evidence|Implication|Next move):\s*/gi;
  if (templatePrefix.test(prose)) {
    prose = prose
      .replace(templatePrefix, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    unsupportedClaimsRemoved += 1;
  }
  if (BLOCKED_PUBLIC_TEXT.test(prose) || INTERNAL_CODE_RE.test(prose)) {
    prose = sanitizePublicHomeText(prose);
    unsupportedClaimsRemoved += 1;
  }
  const scrubbedProse = sanitizePublicHomeText(prose);
  if (scrubbedProse !== prose || homePublicAnswerLeakIssues(prose).length > 0) {
    prose = scrubbedProse;
    unsupportedClaimsRemoved += 1;
  }
  const relevance = assessHomeAnswerRelevance({
    question: response.question,
    answerText: prose,
    primaryDimension: String(
      response.dimensionsUsed[0] ?? "organization_leadership",
    ) as never,
    relatedDimensions: response.dimensionsUsed.slice(1) as never,
    targetSurface:
      response.intent === "decision_handoff" ? "intelligence" : "home",
    handoffTarget: response.handoff?.target ?? null,
    tablesCount: response.tables.length,
    chartsCount: response.charts.length,
    graphsCount: response.graphs.length,
  });
  const userFacingLanguageIssue = relevance.issues.some((issue) =>
    [
      "internal_dossier_language",
      "count_instead_of_insight",
      "misleading_no_blocking_gap",
    ].includes(issue),
  );
  if (userFacingLanguageIssue) {
    prose = sanitizePublicHomeText(prose);
    unsupportedClaimsRemoved += relevance.issues.length;
  }
  const lookupHasDecisionLanguage =
    response.intent !== "decision_handoff" && DECISION_RE.test(prose);
  if (lookupHasDecisionLanguage && !evidence.usable) {
    prose = "Here is what is loaded in Home context.";
    unsupportedClaimsRemoved += 1;
  } else if (lookupHasDecisionLanguage) {
    unsupportedClaimsRemoved += 1;
  }
  const repaired = repairHomeAnswerQuality({
    ...response,
    prose,
    safety: {
      ...response.safety,
      serverValidated: true,
      blockedExperts: true,
      blockedDecisionFrames: true,
      blockedInternalCodes: true,
      unsupportedClaimsRemoved,
      usableEvidence,
      evidenceStatus: usableEvidence ? "usable_dossier" : "empty_dossier",
      evidenceReason: evidence.reason,
      evidenceChannels,
      frontendTripwireShouldFire:
        !usableEvidence &&
        (BLOCKED_PUBLIC_TEXT.test(prose) ||
          INTERNAL_CODE_RE.test(prose) ||
          lookupHasDecisionLanguage ||
          relevance.issues.includes("wrong_dimension_binder") ||
          relevance.issues.includes("missing_requested_table") ||
          relevance.issues.includes("missing_requested_chart") ||
          relevance.issues.includes("missing_requested_graph")),
    },
  });
  const finalProse = sanitizePublicHomeText(repaired.prose);
  if (finalProse === repaired.prose) {
    return shapeHomeKnowResponseForRender(repaired);
  }
  return shapeHomeKnowResponseForRender({
    ...repaired,
    prose: finalProse,
    safety: {
      ...repaired.safety,
      unsupportedClaimsRemoved: repaired.safety.unsupportedClaimsRemoved + 1,
    },
  });
}

function mergeEvidenceChannels(
  ...items: Array<HomeKnowResponse["safety"]["evidenceChannels"] | undefined>
): NonNullable<HomeKnowResponse["safety"]["evidenceChannels"]> {
  const merged: NonNullable<HomeKnowResponse["safety"]["evidenceChannels"]> = {
    facts: 0,
    tables: 0,
    charts: 0,
    graphs: 0,
    citations: 0,
    sourceCoverage: 0,
    sections: 0,
    rollups: 0,
    relationshipPaths: 0,
    metrics: 0,
    gaps: 0,
  };
  for (const item of items) {
    if (!item) continue;
    for (const key of Object.keys(merged) as Array<keyof typeof merged>) {
      merged[key] = Math.max(merged[key], item[key] ?? 0);
    }
  }
  return merged;
}

function sanitizePublicHomeText(value: string): string {
  return scrubHomePublicAnswerText(
    value
      .replace(BLOCKED_PUBLIC_TEXT_REPLACE, "available business material")
      .replace(INTERNAL_CODE_REPLACE, "the source reference")
      .replace(/\bthe cited record\b/gi, "the source reference")
      .replace(
        /\bas a current-state loaded context\b/gi,
        "from the current picture",
      )
      .replace(/\bcurrent-state loaded context\b/gi, "current picture")
      .replace(/\bprimary loaded context\b/gi, "primary source support")
      .replace(/\s{2,}/g, " "),
  );
}

function cleanLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (INTERNAL_CODE_RE.test(trimmed)) return readableId(trimmed);
  return trimmed
    .replace(/[_-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function readableId(value: string | null | undefined): string {
  if (!value) return "Source reference";
  const tail = value.split("/").pop() ?? value;
  return tail
    .replace(/^[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}$/i, "Source reference")
    .replace(/[_-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function inferTypeFromId(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes("vendor") || normalized.includes("contract"))
    return "vendor";
  if (normalized.includes("app") || normalized.includes("system"))
    return "application";
  if (normalized.includes("platform")) return "platform";
  if (normalized.includes("capability")) return "capability";
  if (normalized.includes("data")) return "data-product";
  if (normalized.includes("initiative")) return "initiative";
  return "record";
}

function sourceId(
  sourceFile: string | null | undefined,
  sourceRowNumber: number | string | null | undefined,
): string | null {
  if (!sourceFile) return null;
  return sourceRowNumber ? `${sourceFile}#${sourceRowNumber}` : sourceFile;
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function number(value: number | string | null | undefined): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function numberOrNull(
  value: number | string | null | undefined,
): number | null {
  const parsed = number(value);
  return parsed > 0 ? parsed : null;
}

function confidence(
  value: number | string | null | undefined,
): "low" | "medium" | "high" | undefined {
  const parsed = number(value);
  if (parsed <= 0) return undefined;
  if (parsed >= 0.82) return "high";
  if (parsed >= 0.55) return "medium";
  return "low";
}

function chartColor(index: number): string {
  return (
    [
      CHART.accent,
      CHART.good,
      CHART.warn,
      CHART.bad,
      CHART.inkSoft,
      CHART.accentSoft,
    ][index % 6] ?? CHART.accent
  );
}
