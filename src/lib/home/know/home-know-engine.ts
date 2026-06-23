import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type {
  HomeKnowAnswerStatus,
  HomeKnowAskRequest,
  HomeKnowChart,
  HomeKnowCitation,
  HomeKnowConflict,
  HomeKnowFact,
  HomeKnowGap,
  HomeKnowIntent,
  HomeKnowResponse,
  HomeKnowTable,
} from "@/lib/home/know/home-know-contract";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { CHART } from "@/lib/programs/expert-kernel/exports/board-grade/svg-charts";

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

export interface HomeKnowPacket {
  coverage: HomeDimensionCoverageRow[];
  org: HomeItOrgViewRow[];
  applications: HomeApplicationOwnershipViewRow[];
  vendors: HomeVendorLandscapeViewRow[];
  budgets: HomeBudgetPortfolioViewRow[];
  gaps: HomeGapRegisterViewRow[];
  conflicts: HomeConflictRegisterViewRow[];
}

const BLOCKED_PUBLIC_TEXT =
  /\b(experts?_consulted|DORA|Wave-0|kill criteria|90-day pilot|local env|org_topology unavailable|productivity frame|clinical process expert)\b/i;
const BLOCKED_PUBLIC_TEXT_REPLACE =
  /\b(experts?_consulted|DORA|Wave-0|kill criteria|90-day pilot|local env|org_topology unavailable|productivity frame|clinical process expert)\b/gi;
const INTERNAL_CODE_RE =
  /\b[A-Z]{2,8}-[A-Z0-9]{2,16}-\d{2,8}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const INTERNAL_CODE_REPLACE =
  /\b[A-Z]{2,8}-[A-Z0-9]{2,16}-\d{2,8}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const DECISION_RE =
  /\b(should|recommend|prioriti[sz]e|approve|kill|scale|invest|decision|what do we do|next move|where should)\b/i;

export function classifyHomeKnowIntent(question: string): HomeKnowIntent {
  const normalized = question.trim().toLowerCase();
  if (!normalized) return "browse";
  if (DECISION_RE.test(normalized)) return "decision_handoff";
  if (/\b(gap|missing|not loaded|absent|unknown|field)\b/.test(normalized)) return "gap";
  if (/\b(chart|graph|visual|plot)\b/.test(normalized)) return "chart";
  if (/\b(table|list|show|which|breakdown)\b/.test(normalized)) return "table";
  if (/\b(browse|overview|loaded|coverage|dimensions)\b/.test(normalized)) return "browse";
  return "lookup";
}

export async function fetchHomeKnowPacket(tenantKey: string): Promise<HomeKnowPacket> {
  const [
    coverage,
    org,
    applications,
    vendors,
    budgets,
    gaps,
    conflicts,
  ] = await Promise.all([
    fetchRows<HomeDimensionCoverageRow>("mv_home_dimension_coverage_view", tenantKey),
    fetchRows<HomeItOrgViewRow>("mv_home_it_org_view", tenantKey),
    fetchRows<HomeApplicationOwnershipViewRow>("mv_home_application_ownership_view", tenantKey),
    fetchRows<HomeVendorLandscapeViewRow>("mv_home_vendor_landscape_view", tenantKey),
    fetchRows<HomeBudgetPortfolioViewRow>("mv_home_budget_by_portfolio_view", tenantKey),
    fetchRows<HomeGapRegisterViewRow>("mv_home_gap_register_view", tenantKey),
    fetchRows<HomeConflictRegisterViewRow>("mv_home_conflict_register_view", tenantKey),
  ]);
  return { coverage, org, applications, vendors, budgets, gaps, conflicts };
}

export async function buildHomeKnowResponse(input: HomeKnowAskRequest): Promise<HomeKnowResponse> {
  const tenantKey = canonicalTenantKey((input.tenantKey ?? input.client ?? "").trim());
  if (!tenantKey) {
    return blockedHomeKnowResponse({
      tenantKey: "unknown",
      question: input.question,
      prose: "I do not see an active tenant for this Home request.",
    });
  }
  const packet = await fetchHomeKnowPacket(tenantKey);
  return buildHomeKnowResponseFromPacket({
    tenantKey,
    question: input.question,
    packet,
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
  const gaps = buildGaps(input.packet.gaps, citations);
  const conflicts = buildConflicts(input.packet.conflicts, citations);

  if (intent === "decision_handoff") {
    return validateHomeKnowResponse({
      mode: "KNOW",
      tenantKey: input.tenantKey,
      question,
      intent,
      answerStatus: "handoff",
      prose:
        "Home can show what is loaded, but this question asks for a decision. Use Intelligence for analysis or Moves/Tower for action and proof.",
      dimensionsUsed,
      facts: buildFacts(input.packet, dimensionsUsed, citations),
      tables: [coverageTable(input.packet.coverage, citations)],
      charts: [],
      gaps,
      conflicts,
      citations,
      handoff: {
        target: "intelligence",
        label: "Analyze this in Intelligence",
        reason: "The question asks for judgment or prioritization beyond Home's KNOW mode.",
      },
      safety: defaultSafety(),
    });
  }

  const tables = buildTablesForIntent(intent, question, input.packet, citations);
  const charts = buildChartsForIntent(intent, question, input.packet, citations);
  const facts = buildFacts(input.packet, dimensionsUsed, citations);
  const hasData =
    facts.length > 0 ||
    tables.some((table) => table.rows.length > 0) ||
    charts.some((chart) => chart.data.length > 0);
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
    prose: homeKnowProse({ tenantKey: input.tenantKey, intent, packet: input.packet, hasData, hasGaps }),
    dimensionsUsed,
    facts,
    tables,
    charts,
    gaps,
    conflicts,
    citations,
    handoff: null,
    safety: defaultSafety(),
  });
}

async function fetchRows<T extends { tenant_key: string }>(
  table: string,
  tenantKey: string,
): Promise<T[]> {
  const db = getAzureReadFluentClient();
  const { data, error } = await db
    .from<T[]>(table)
    .select("*")
    .eq("tenant_key", tenantKey)
    .limit(500);
  if (error) {
    throw new Error(`${table} fetch failed: ${error.message}`);
  }
  return (data ?? []) as unknown as T[];
}

function defaultSafety() {
  return {
    serverValidated: true,
    blockedExperts: true,
    blockedDecisionFrames: true,
    blockedInternalCodes: true,
    unsupportedClaimsRemoved: 0,
    frontendTripwireShouldFire: false,
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
    return packet.coverage.map((row) => row.dimension_id);
  }
  const normalized = question.toLowerCase();
  const dims = new Set<string>();
  if (/\b(vendor|vendors|contract|contracts|license|licenses|supplier|suppliers|renewal|renewals)\b/.test(normalized)) {
    return ["vendors_contracts"];
  }
  if (/\b(budget|budgets|spend|cost|costs|financial|financials)\b/.test(normalized)) {
    return ["it_budget_financials"];
  }
  if (/\b(org|team|portfolio|lead|owner|ownership|who leads)\b/.test(normalized)) dims.add("it_org_ownership");
  if (/\b(app|application|system|platform|cmdb)\b/.test(normalized)) dims.add("applications_core_systems");
  if (intent === "gap") dims.add("gap_register");
  if (dims.size === 0 && intent === "chart") {
    dims.add("it_budget_financials");
    dims.add("vendors_contracts");
  }
  return [...dims];
}

function citationIdForDimension(dimensionId: string, citations: HomeKnowCitation[]): string[] {
  const matches = citations
    .filter((citation) =>
      citation.label.toLowerCase().includes(dimensionId.replace(/_/g, "-")) ||
      citation.sourceFile?.toLowerCase().includes(dimensionId.split("_")[0] ?? ""),
    )
    .map((citation) => citation.id);
  return matches.length > 0 ? matches : citations.slice(0, 3).map((citation) => citation.id);
}

function buildCitations(packet: HomeKnowPacket, dimensionsUsed: string[]): HomeKnowCitation[] {
  const raw: Array<{
    dimensionId: string;
    sourceFile: string | null;
    sourceRowNumber: number | string | null;
    labelPrefix: string;
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
      label: `${item.labelPrefix}${item.sourceFile ? ` · ${item.sourceFile.split("/").pop()}` : ""}${item.sourceRowNumber ? ` row ${item.sourceRowNumber}` : ""}`,
      sourceClass: "tenant-source-file",
      sourceFile: item.sourceFile,
      sourceRowNumber: numberOrNull(item.sourceRowNumber),
      excerpt: item.excerpt,
      confidence: confidence(item.confidence),
    });
    if (citations.length >= 8) break;
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
        citationIds: citationIdForDimension("applications_core_systems", citations),
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
    const runBudget = packet.budgets.reduce((sum, row) => sum + number(row.run_budget_usd), 0);
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
  if (intent === "browse") return [coverageTable(packet.coverage, citations)];
  if (/\b(org|team|portfolio|lead|owner|ownership|who leads)\b/.test(normalized)) {
    return [orgTable(packet.org, citations)];
  }
  if (/\b(app|application|system|platform|cmdb)\b/.test(normalized)) {
    return [applicationTable(packet.applications, citations)];
  }
  if (/\b(vendor|vendors|contract|contracts|license|licenses|supplier|suppliers|renewal|renewals)\b/.test(normalized)) {
    return [vendorTable(packet.vendors, citations)];
  }
  if (/\b(budget|budgets|spend|cost|costs|financial|financials|chart|visual|graph)\b/.test(normalized)) {
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
  if (/\b(vendor|vendors|contract|contracts|license|licenses|supplier|suppliers|renewal|renewals)\b/.test(normalized)) {
    return [vendorChart(packet.vendors, citations)].filter((chart) => chart.data.length > 0);
  }
  return [budgetChart(packet.budgets, citations)].filter((chart) => chart.data.length > 0);
}

function coverageTable(rows: HomeDimensionCoverageRow[], citations: HomeKnowCitation[]): HomeKnowTable {
  return {
    id: "home-dimension-coverage",
    title: "Loaded Context Coverage",
    dimensionId: "dimension_coverage",
    columns: [
      { key: "dimension_label", label: "Dimension" },
      { key: "record_count", label: "Records", align: "right", format: "number" },
      { key: "fact_count", label: "Facts", align: "right", format: "number" },
      { key: "relationship_count", label: "Relationships", align: "right", format: "number" },
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

function orgTable(rows: HomeItOrgViewRow[], citations: HomeKnowCitation[]): HomeKnowTable {
  return {
    id: "home-it-org",
    title: "IT Portfolio Ownership",
    dimensionId: "it_org_ownership",
    columns: [
      { key: "team_name", label: "Portfolio / Team" },
      { key: "executive_owner_role", label: "Owner Role" },
      { key: "domain", label: "Domain" },
      { key: "head_count_fte", label: "FTE", align: "right", format: "number" },
      { key: "annual_budget_usd", label: "Annual Budget", align: "right", format: "currency" },
    ],
    rows: rows.map((row) => ({
      team_name: row.team_name ?? "Not loaded",
      executive_owner_role: row.executive_owner_role ?? "Not loaded",
      domain: row.domain ?? "Not loaded",
      head_count_fte: numberOrNull(row.head_count_fte),
      annual_budget_usd: numberOrNull(row.annual_budget_usd),
    })),
    citationIds: citationIdForDimension("it_org_ownership", citations),
  };
}

function applicationTable(rows: HomeApplicationOwnershipViewRow[], citations: HomeKnowCitation[]): HomeKnowTable {
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
      { key: "annual_run_cost_usd", label: "Annual Run Cost", align: "right", format: "currency" },
    ],
    rows: rows.map((row) => ({
      application_name: row.application_name ?? "Not loaded",
      domain: row.domain ?? "Not loaded",
      primary_business_owner: row.primary_business_owner ?? "Not loaded",
      technical_owner_team: row.technical_owner_team ?? "Not loaded",
      technical_owner_role: row.technical_owner_role ?? "Not loaded",
      criticality: row.criticality ?? "Not loaded",
      annual_run_cost_usd: numberOrNull(row.annual_run_cost_usd),
    })),
    citationIds: citationIdForDimension("applications_core_systems", citations),
  };
}

function vendorTable(rows: HomeVendorLandscapeViewRow[], citations: HomeKnowCitation[]): HomeKnowTable {
  return {
    id: "home-vendor-landscape",
    title: "Vendor Landscape",
    dimensionId: "vendors_contracts",
    columns: [
      { key: "vendor_name", label: "Vendor" },
      { key: "category", label: "Category" },
      { key: "annual_spend_usd", label: "Annual Spend", align: "right", format: "currency" },
      { key: "renewal_risk", label: "Renewal Risk" },
      { key: "business_owner", label: "Business Owner" },
      { key: "technology_owner", label: "Technology Owner" },
    ],
    rows: rows.map((row) => ({
      vendor_name: row.vendor_name ?? "Not loaded",
      category: row.category ?? "Not loaded",
      annual_spend_usd: numberOrNull(row.annual_spend_usd),
      renewal_risk: row.renewal_risk ?? "Not loaded",
      business_owner: row.business_owner ?? "Not loaded",
      technology_owner: row.technology_owner ?? "Not loaded",
    })),
    citationIds: citationIdForDimension("vendors_contracts", citations),
  };
}

function budgetTable(rows: HomeBudgetPortfolioViewRow[], citations: HomeKnowCitation[]): HomeKnowTable {
  return {
    id: "home-budget-by-portfolio",
    title: "Budget by Portfolio",
    dimensionId: "it_budget_financials",
    columns: [
      { key: "function_or_platform", label: "Function / Platform" },
      { key: "run_budget_usd", label: "Run Budget", align: "right", format: "currency" },
      { key: "change_budget_usd", label: "Change Budget", align: "right", format: "currency" },
      { key: "ai_budget_usd", label: "AI Budget", align: "right", format: "currency" },
      { key: "owner_role", label: "Owner Role" },
    ],
    rows: rows.map((row) => ({
      function_or_platform: row.function_or_platform ?? "Not loaded",
      run_budget_usd: numberOrNull(row.run_budget_usd),
      change_budget_usd: numberOrNull(row.change_budget_usd),
      ai_budget_usd: numberOrNull(row.ai_budget_usd),
      owner_role: row.owner_role ?? "Not loaded",
    })),
    citationIds: citationIdForDimension("it_budget_financials", citations),
  };
}

function gapTable(rows: HomeGapRegisterViewRow[], citations: HomeKnowCitation[]): HomeKnowTable {
  return {
    id: "home-gap-register",
    title: "Home Evidence Gaps",
    dimensionId: "gap_register",
    columns: [
      { key: "dimension_id", label: "Dimension" },
      { key: "display_label", label: "Missing Field" },
      { key: "severity", label: "Severity" },
      { key: "missing_count", label: "Missing Rows", align: "right", format: "number" },
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

function vendorChart(rows: HomeVendorLandscapeViewRow[], citations: HomeKnowCitation[]): HomeKnowChart {
  return {
    id: "home-vendor-spend-chart",
    title: "Annual Vendor Spend",
    kind: "cost-stack",
    dimensionId: "vendors_contracts",
    data: rows
      .map((row, index) => ({
        label: row.vendor_name ?? "Unknown vendor",
        value: number(row.annual_spend_usd),
        color: chartColor(index),
      }))
      .filter((row) => row.value > 0)
      .slice(0, 8),
    citationIds: citationIdForDimension("vendors_contracts", citations),
  };
}

function budgetChart(rows: HomeBudgetPortfolioViewRow[], citations: HomeKnowCitation[]): HomeKnowChart {
  const run = rows.reduce((sum, row) => sum + number(row.run_budget_usd), 0);
  const change = rows.reduce((sum, row) => sum + number(row.change_budget_usd), 0);
  const ai = rows.reduce((sum, row) => sum + number(row.ai_budget_usd), 0);
  return {
    id: "home-budget-mix-chart",
    title: "Budget Mix",
    kind: "cost-stack",
    dimensionId: "it_budget_financials",
    data: [
      { label: "Run", value: run, color: CHART.accent },
      { label: "Change", value: change, color: CHART.good },
      { label: "AI", value: ai, color: CHART.warn },
    ].filter((row) => row.value > 0),
    citationIds: citationIdForDimension("it_budget_financials", citations),
  };
}

function buildGaps(rows: HomeGapRegisterViewRow[], citations: HomeKnowCitation[]): HomeKnowGap[] {
  return rows.map((row, index) => ({
    id: `gap-${index + 1}`,
    dimensionId: row.dimension_id,
    objectType: row.object_type,
    expectedField: row.expected_field,
    displayLabel: row.display_label,
    severity: row.severity,
    message: `${row.display_label} is not loaded for ${number(row.missing_count)} ${row.object_type} row(s).`,
    citationIds: citations.map((citation) => citation.id),
  }));
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
  intent: HomeKnowIntent;
  packet: HomeKnowPacket;
  hasData: boolean;
  hasGaps: boolean;
}): string {
  if (!input.hasData) {
    return "I do not see that in the loaded data.";
  }
  const orgCount = input.packet.org.length;
  const appCount = input.packet.applications.length;
  const vendorCount = input.packet.vendors.length;
  const budgetCount = input.packet.budgets.length;
  if (input.intent === "gap") {
    return input.packet.gaps.length
      ? `I found ${input.packet.gaps.length} Home evidence gap(s) in the loaded data.`
      : "I do not see Home evidence gaps in the loaded data.";
  }
  if (input.intent === "chart") {
    return "Here is the visual cut from loaded Home context. The chart data is assembled from tenant rows, not prose.";
  }
  const suffix = input.hasGaps
    ? " The loaded data also has field gaps called out below."
    : "";
  return `Home read for ${input.tenantKey}: loaded context includes ${orgCount} IT org row(s), ${appCount} application row(s), ${vendorCount} vendor row(s), and ${budgetCount} budget row(s).${suffix}`;
}

export function validateHomeKnowResponse(response: HomeKnowResponse): HomeKnowResponse {
  let prose = response.prose;
  let unsupportedClaimsRemoved = response.safety.unsupportedClaimsRemoved;
  if (BLOCKED_PUBLIC_TEXT.test(prose) || INTERNAL_CODE_RE.test(prose)) {
    prose = sanitizePublicHomeText(prose);
    unsupportedClaimsRemoved += 1;
  }
  const lookupHasDecisionLanguage =
    response.intent !== "decision_handoff" && DECISION_RE.test(prose);
  if (lookupHasDecisionLanguage) {
    prose = "Here is what is loaded in Home context.";
    unsupportedClaimsRemoved += 1;
  }
  return {
    ...response,
    prose,
    safety: {
      serverValidated: true,
      blockedExperts: true,
      blockedDecisionFrames: true,
      blockedInternalCodes: true,
      unsupportedClaimsRemoved,
      frontendTripwireShouldFire:
        BLOCKED_PUBLIC_TEXT.test(prose) ||
        INTERNAL_CODE_RE.test(prose) ||
        lookupHasDecisionLanguage,
    },
  };
}

function sanitizePublicHomeText(value: string): string {
  return value
    .replace(BLOCKED_PUBLIC_TEXT_REPLACE, "loaded context")
    .replace(INTERNAL_CODE_REPLACE, "the cited row")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function number(value: number | string | null | undefined): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function numberOrNull(value: number | string | null | undefined): number | null {
  const parsed = number(value);
  return parsed > 0 ? parsed : null;
}

function confidence(value: number | string | null | undefined): "low" | "medium" | "high" | undefined {
  const parsed = number(value);
  if (parsed <= 0) return undefined;
  if (parsed >= 0.82) return "high";
  if (parsed >= 0.55) return "medium";
  return "low";
}

function chartColor(index: number): string {
  return [
    CHART.accent,
    CHART.good,
    CHART.warn,
    CHART.bad,
    CHART.inkSoft,
    CHART.accentSoft,
  ][index % 6] ?? CHART.accent;
}
