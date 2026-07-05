import "server-only";

import {
  getTenantDataAdapter,
  type ContextChunk,
  type GraphNode,
  type SegmentId,
} from "@/lib/knowledge/tenant-data";
import {
  createDefaultSession,
  type SqlRunner,
} from "@/lib/data-plane/read-adapters/azureSession";
import { canonicalTenantKey, tenantAliasesFor } from "@/lib/tenant/aliases";
import type { CanonicalTenant } from "@/lib/tenant/CanonicalTenant";
import type { AskStructuredTable } from "@/lib/intelligence/ask/types";

export interface TenantEnterpriseSource {
  type: "TENANT";
  name: string;
  id: string;
  detail: string;
  confidence: number;
  structured?: {
    tables: AskStructuredTable[];
  };
}

export type TenantStructuredSource = TenantEnterpriseSource & {
  confidence: 0.99;
};

type TenantLookupInput = string | CanonicalTenant | null | undefined;

const ENTERPRISE_QUERY_RE =
  /\b(profile|company|enterprise|tenant|organization|organisation|org|structure|leadership|leaders?|executive|executives|business|function\s+leads?|c[-\s]?level|cxo|cio|cdio|cto|cmio|cmo|cno|coo|ceo|cfo|svp|vp|director|direct\s+reports?|reports?|reports?\s+to|owner|sponsor|budget|spend|financials?|capex|opex|capital|funding|approval|approver|authority|fy\s*26|fy2026|current\s+state|what\s+do\s+you\s+know|application|applications|apps?|systems?|portfolio|criticality|vendor|vendors?|supplier|suppliers?|contract|contracts?|renewal|renewals?|initiative|initiatives?|moves?|kill|accelerate|hold|restructure|replatform|dependency|dependencies|blocks?|blocked|blockers?|regulatory|regulation|fda|eu\s+ai\s+act|annex|mdr|ivdr|sbom|gxp|iso\s*13485|sap|s\/4|s4|wave|airline|skyharbor|ibm|mainframe|aws|z\s+workloads?|mips|modernization|amala|cio\s+challenge|pressure|value\s+ledger|duplicate\s+complexity|gcc|global\s+capability|dora|mttr|lead\s+time|deploy\s+frequency|change\s+failure|engineering\s+productivity|operating\s+model|target\s+operating\s+model|\btom\b|sdlc|cobol|edp|true[-\s]?up|snowflake|databricks|cyber|security\s+stack|ai\s+tooling|sourcing\s+events?|data|analytics|warehouse|lakehouse|data\s*lake|\bbi\b|business\s+intelligence|reporting|dashboards?|etl|elt|\bcube\b|data\s*marts?|tableau|power\s*bi|cognos|teradata|infrastructure|infra|data\s*center|datacenter|datacentre|virtualization|virtualisation|vmware|vsphere|hyperconverged|nutanix|storage|\bsan\b|\bnas\b|netapp|network(ing)?|compute|hosting|colo|cloud\s+account|estate)\b/i;

const OFF_DOMAIN_GENERAL_KNOWLEDGE_RE =
  /^\s*(?:what|where)\s+(?:is|are)\s+the\s+capital\s+of\b/i;

const SEGMENT_LABELS: Record<string, string> = {
  enterprise_profile: "Enterprise profile",
  org_structure: "Org structure and leadership",
  it_financials: "IT financials and funding authority",
  it_landscape: "IT landscape",
  program_inventory: "Program inventory",
  data_estate: "Data and analytics estate",
  infrastructure: "Infrastructure estate",
};

const SEGMENT_LIMITS: Partial<Record<SegmentId, number>> = {
  enterprise_profile: 8,
  org_structure: 36,
  it_financials: 48,
  it_landscape: 32,
  program_inventory: 12,
  data_estate: 40,
  infrastructure: 40,
};

const structuredFactSession = createDefaultSession(
  "tenant-enterprise-structured-facts",
);

const STOPWORDS = new Set([
  "about",
  "across",
  "after",
  "again",
  "also",
  "and",
  "any",
  "are",
  "budget",
  "can",
  "current",
  "does",
  "for",
  "from",
  "have",
  "how",
  "into",
  "know",
  "our",
  "tell",
  "team",
  "that",
  "the",
  "their",
  "this",
  "what",
  "with",
  "you",
]);

export function isTenantEnterpriseQuestion(query: string): boolean {
  const trimmed = query.trim();
  if (OFF_DOMAIN_GENERAL_KNOWLEDGE_RE.test(trimmed)) return false;
  return ENTERPRISE_QUERY_RE.test(trimmed);
}

export function selectTenantEnterpriseSegments(query: string): SegmentId[] {
  const normalized = query.toLowerCase();
  const segments: SegmentId[] = [];

  if (
    /\b(profile|company|enterprise|tenant|organization|organisation|who are we|what do you know|regulatory|regulation|fda|eu\s+ai\s+act|annex|mdr|ivdr|sbom|gxp|iso\s*13485|airline|skyharbor|modernization|ibm|mainframe|aws|duplicate\s+complexity|pressure|operating\s+model|target\s+operating\s+model|\btom\b|dora|engineering\s+productivity|sdlc|cobol|edp|true[-\s]?up|snowflake|databricks|cyber|security\s+stack|ai\s+tooling)\b/.test(
      normalized,
    )
  ) {
    segments.push("enterprise_profile");
  }
  if (
    /\b(org|organization|organisation|structure|leadership|leaders?|executive|executives|business|function\s+leads?|c[-\s]?level|team|cxo|cio|cdio|cto|cmio|cmo|cno|coo|ceo|cfo|svp|vp|director|reports?\s+to|owner|sponsor|who|amala|cio\s+challenge|pressure)\b/.test(
      normalized,
    )
  ) {
    segments.push("org_structure");
  }
  if (
    /\b(budget|spend|financials?|capex|opex|capital|funding|approval|approver|authority|fy\s*26|fy2026|run|change|transform|value\s+ledger|promised|realized|disputed|projected|value\s+stuck|ibm|mips|dora|mttr|lead\s+time|deploy\s+frequency|change\s+failure|edp|true[-\s]?up)\b/.test(
      normalized,
    )
  ) {
    segments.push("it_financials");
  }
  if (
    /\b(technology|tech|system|systems|platform|cloud|data|analytics|warehouse|lakehouse|bi|ml|ai|vendor|vendors?|supplier|suppliers?|contract|contracts?|renewal|renewals?|application|applications|apps?|criticality|portfolio|sap|s\/4|s4|erp|ibm|mainframe|aws|z\s+workloads?|departure|crew|irops|revenue\s+accounting|baggage|cargo|dora|mttr|lead\s+time|deploy\s+frequency|change\s+failure|sdlc|cobol|edp|snowflake|databricks|cyber|security\s+stack|ai\s+tooling)\b/.test(
      normalized,
    )
  ) {
    segments.push("it_landscape");
  }
  if (
    /\b(program|initiative|initiatives|move|moves|in[-\s]?flight|portfolio|roadmap|kill|fund|pause|hold|accelerate|restructure|sap|s\/4|s4|wave|modernization|dependency|dependencies|blocks?|blocked|blockers?|ibm|mainframe|aws|value\s+ledger|through-line|pressure|operating\s+model|target\s+operating\s+model|\btom\b|gcc|global\s+capability|dora|engineering\s+productivity|sdlc|cobol|edp|true[-\s]?up|snowflake|databricks|cyber|security\s+stack|ai\s+tooling|sourcing\s+events?)\b/.test(
      normalized,
    )
  ) {
    segments.push("program_inventory");
  }

  if (
    /\b(data\s+stack|analytics\s+stack|data\s*(?:&|and)\s*analytics|data\s+landscape|analytics\s+landscape|data\s+estate|data\s+platforms?|analytics\s+platforms?|data\s+warehouse|warehouse|lakehouse|data\s*lake|\bbi\b|business\s+intelligence|reporting|dashboards?|olap|cube|data\s*marts?|semantic\s+layer|etl|elt|pipelines?|snowflake|databricks|teradata|netezza|power\s*bi|tableau|cognos|microstrategy|clarity|caboodle|informatica|dbt)\b/.test(
      normalized,
    )
  ) {
    segments.push("data_estate");
  }
  if (
    /\b(infrastructure|infra|data\s*center|datacenter|datacentre|virtualization|virtualisation|vmware|vsphere|hyper-?v|hyperconverged|nutanix|vxrail|storage|san\b|nas\b|netapp|pure\s+storage|isilon|network(ing)?|cisco|arista|sd-?wan|f5|server|servers|compute|hosting|colo|cloud\s+account|subscription|landing\s+zone|estate)\b/.test(
      normalized,
    )
  ) {
    segments.push("infrastructure");
  }

  // Meridian + Lakeshore enterprise-context-layer segments. These literal
  // record_type values are stored as enterprise_context_chunks; map common
  // intents onto them so those tenants' facts surface instead of being
  // starved behind the 5 canonical segment ids.
  if (
    /\b(application|applications|apps?|cmdb|service\s+catalog|software\s+inventory|system\s+inventory)\b/.test(
      normalized,
    )
  ) {
    segments.push("cmdb_applications_services", "cmdb_application");
  }
  if (
    /\b(vendor|vendors?|supplier|suppliers?|contract|contracts?|renewal|renewals?|spend|spending|spend\s+baseline|sourcing|procurement)\b/.test(
      normalized,
    )
  ) {
    segments.push(
      "vendors_contract_inventory",
      "renewal_calendar",
      "spend_baseline",
      "contract",
    );
  }
  if (
    /\b(risk|risks|compliance|regulatory|regulation|policy|policies|procedure|procedures|control|controls|audit)\b/.test(
      normalized,
    )
  ) {
    segments.push(
      "risk_compliance_register",
      "policies_procedures",
      "risk",
    );
  }
  if (
    /\b(data\s+domain|data\s+domains|steward|stewardship|data\s+owner|data\s+asset|data\s+assets|master\s+data|golden\s+record)\b/.test(
      normalized,
    )
  ) {
    segments.push("data_domains_stewardship", "data_asset");
  }
  if (
    /\b(facility|facilities|site|sites|location|locations|business\s+unit|business\s+units|division|divisions)\b/.test(
      normalized,
    )
  ) {
    segments.push(
      "facilities_business_units",
      "facility",
      "business_unit",
    );
  }
  if (
    /\b(incident|incidents|outage|outages|change|changes|problem|problems|sla|slas|service\s+level|ticket|tickets)\b/.test(
      normalized,
    )
  ) {
    segments.push("incidents", "changes", "problems", "slas");
  }
  if (
    /\b(dependency|dependencies|depends\s+on|integration|integrations|interface|interfaces|coupling|ci\s+relationship)\b/.test(
      normalized,
    )
  ) {
    segments.push("ci_relationships_dependencies", "integration");
  }
  if (
    /\b(initiative|initiatives|portfolio|program|programs|roadmap|project|projects)\b/.test(
      normalized,
    )
  ) {
    segments.push("initiative_portfolio", "initiative");
  }
  if (
    /\b(org|organization|organisation|role|roles|decision\s+rights?|accountab|raci|owner|ownership|governance)\b/.test(
      normalized,
    )
  ) {
    segments.push("org_decision_rights", "org_role");
  }
  if (
    /\b(capability|capabilities|business\s+capability|capability\s+map|value\s+stream)\b/.test(
      normalized,
    )
  ) {
    segments.push("business_capability");
  }
  if (
    /\b(kpi|kpis|metric|metrics|measure|measures|measurement|scorecard|target)\b/.test(
      normalized,
    )
  ) {
    segments.push("kpi_metric");
  }
  if (
    /\b(configuration\s+item|configuration\s+items|\bci\b|cis|asset|assets|hardware|server|servers)\b/.test(
      normalized,
    )
  ) {
    segments.push("configuration_item");
  }

  if (segments.length === 0 && isTenantEnterpriseQuestion(query)) {
    segments.push(
      "enterprise_profile",
      "org_structure",
      "it_financials",
      // Broaden the generic "what do you know about us" fallback so
      // Meridian/Lakeshore enterprise-context rows surface too.
      "cmdb_applications_services",
      "initiative_portfolio",
      "vendors_contract_inventory",
      "cmdb_application",
      "initiative",
      "contract",
      "business_capability",
    );
  }

  return [...new Set(segments)];
}

export async function retrieveTenantEnterpriseSources(
  tenantKey: TenantLookupInput,
  query: string,
  opts: {
    perSegment?: number;
    activePersonGraphNodeId?: string | null;
    activePersonDisplayName?: string | null;
    userContextBlock?: string | null;
  } = {},
): Promise<TenantEnterpriseSource[]> {
  if (!tenantKey || !isTenantEnterpriseQuestion(query)) return [];
  const canonicalTenantKey = normalizeTenantEnterpriseKey(tenantKey);
  if (!canonicalTenantKey) return [];

  const segments = selectTenantEnterpriseSegments(query);
  if (segments.length === 0) return [];

  try {
    const adapter = getTenantDataAdapter();
    const tenantQueryKeys = tenantAliasesFor(canonicalTenantKey);
    const [directReportSource, cLevelSource, structuredSources, grouped] =
      await Promise.all([
        retrieveDirectReportsSource(canonicalTenantKey, query, opts).catch(
          () => null,
        ),
        retrieveCLevelLeaderSource(canonicalTenantKey, query).catch(() => null),
        retrieveStructuredTenantSources(canonicalTenantKey, query).catch(
          () => [],
        ),
        Promise.all(
          segments.map(async (segmentId) => {
            const chunksById = new Map<string, ContextChunk>();
            for (const tenantQueryKey of tenantQueryKeys) {
              const chunks = await adapter
                .listContextChunks(tenantQueryKey, {
                  segmentIds: [segmentId],
                  limit: SEGMENT_LIMITS[segmentId] ?? 24,
                })
                .catch(() => []);
              for (const chunk of chunks) {
                chunksById.set(chunk.chunkId, chunk);
              }
            }
            return {
              segmentId,
              chunks: rankChunks(
                Array.from(chunksById.values()),
                query,
                segmentId,
              ).slice(0, opts.perSegment ?? 4),
            };
          }),
        ),
      ]);

    const segmentSources = grouped
      .filter((group) => group.chunks.length > 0)
      .map((group) => ({
        type: "TENANT" as const,
        name: `${SEGMENT_LABELS[group.segmentId] ?? group.segmentId} (${canonicalTenantKey})`,
        id: `${canonicalTenantKey}:${group.segmentId}`,
        detail: [
          `${SEGMENT_LABELS[group.segmentId] ?? group.segmentId} records for ${canonicalTenantKey}.`,
          "Use these persisted setup-data chunks before saying tenant profile, org structure, budget, or system context is unavailable.",
          ...group.chunks.map(formatChunk),
        ].join("\n- "),
        confidence: 0.94,
      }));

    return [
      directReportSource,
      cLevelSource,
      ...structuredSources,
      ...segmentSources,
    ].filter((source): source is TenantEnterpriseSource => Boolean(source));
  } catch {
    return [];
  }
}

interface ClientProfileRow {
  id: string;
  name: string | null;
  legal_name: string | null;
  tenant_key: string | null;
  slug: string | null;
  annual_revenue_usd: number | string | null;
  it_budget_usd: number | string | null;
  ai_budget_usd: number | string | null;
  employee_count: number | string | null;
  operational_units: number | string | null;
  business_description: string | null;
}

interface ApplicationRow {
  id: string;
  name: string;
  vendor: string | null;
  business_function: string | null;
  deployment_model: string | null;
  criticality: string | null;
  status: string | null;
  annual_cost_usd: number | string | null;
}

interface ApplicationDomainCountRow {
  business_function: string | null;
  application_count: number | string;
  annual_cost_usd: number | string | null;
}

interface InitiativeRow {
  initiative_id: string;
  display_id: string | null;
  name: string;
  stage: string | null;
  status_flag: string | null;
  committed_total_usd: number | string | null;
  measured_value_usd: number | string | null;
  status_summary: string | null;
  metadata: Record<string, unknown> | null;
}

interface VendorContractRow {
  vendor_id: string | null;
  vendor_name: string;
  contract_category: string | null;
  annual_contract_value_usd: number | string | null;
  renewal_date: string | null;
  exit_terms_jsonb: Record<string, unknown> | null;
  ai_usage_clauses: boolean | null;
  indemnity_provided: boolean | null;
  concentration_pct: number | string | null;
}

interface EnterpriseContextChunkRow {
  chunk_id: string | null;
  chunk_text: string | null;
  source_segment_id: string | null;
  source_doc: string | null;
}

function normalizeTenantEnterpriseKey(
  tenant: TenantLookupInput,
): string | null {
  if (!tenant) return null;
  if (typeof tenant === "object") return tenant.canonicalKey;
  return canonicalTenantKey(tenant.trim().toLowerCase());
}

async function retrieveStructuredTenantSources(
  tenantKey: string,
  query: string,
): Promise<TenantEnterpriseSource[]> {
  const normalized = query.toLowerCase();
  const wantsProfile =
    /\b(profile|company|enterprise|tenant|what\s+do\s+you\s+know|who\s+are\s+we|budget|spend|financials?|revenue|employees?|five\s+years?|progress|operating\s+model|target\s+operating\s+model|\btom\b|gcc|global\s+capability|dora|engineering\s+productivity)\b/.test(
      normalized,
    );
  const wantsApps =
    /\b(application|applications|apps?|systems?|portfolio|criticality|replatform|legacy|erp|sap|as\/?400|mainframe|z\s+workloads?|workloads?|extract|extraction|cobol|safety[-\s]?critical|duplicate\s+complexity)\b/.test(
      normalized,
    );
  const wantsVendors =
    /\b(vendor|vendors?|supplier|suppliers?|contract|contracts?|renewal|renewals?|ams|bafo|rfi|rfp|sourcing|source|ibm|aws|edp|true[-\s]?up|snowflake|databricks|cyber|security\s+stack|ai\s+tooling)\b/.test(
      normalized,
    );
  const wantsInitiatives =
    /\b(initiative|initiatives|move|moves|program|programs|kill|fund|pause|hold|accelerate|restructure|roadmap|sap|s\/4|s4|wave|modernization|operating\s+model|target\s+operating\s+model|\btom\b|sdlc|cobol|gcc|global\s+capability|90\s+days?|board)\b/.test(
      normalized,
    );
  const wantsEngineeringProductivity =
    /\b(dora|mttr|lead\s+time|deploy\s+frequency|deployment\s+frequency|change\s+failure|engineering\s+productivity|modernization\s+correlation|factory\s+throughput)\b/.test(
      normalized,
    );
  const wantsContextChunks =
    /\b(data\s*(?:&|and)\s*analytics|data\s+landscape|analytics\s+landscape|data\s+estate|data\s+platforms?|analytics\s+platforms?|platforms?|owners?|loaded\s+context|current\s+data|warehouse|lakehouse|\bbi\b|business\s+intelligence|reporting|dashboards?|semantic\s+layer|etl|elt|snowflake|databricks|tableau|power\s*bi)\b/.test(
      normalized,
    );
  // The keyword loaded-context retriever is domain-agnostic: it must run for
  // ANY substantive question (e.g. legal contract intake, HR, finance ops),
  // not only the IT/CIO vocabulary the wants* gates recognize. Otherwise
  // freshly-loaded tenant context that doesn't use IT phrasing is never read
  // back — "loaded but not retrievable". Only short-circuit when there is no
  // usable keyword token AND no domain gate matched.
  const hasKeywordTokens = tokenize(normalized).some(
    (term) => term.length >= 5,
  );
  if (
    !wantsProfile &&
    !wantsApps &&
    !wantsVendors &&
    !wantsInitiatives &&
    !wantsEngineeringProductivity &&
    !wantsContextChunks &&
    !hasKeywordTokens
  )
    return [];

  try {
    return await structuredFactSession(async (run) => {
      const clientId = await resolveClientIdForTenantKey(run, tenantKey);
      if (!clientId) return [];
      const results = await Promise.all([
        wantsProfile
          ? readClientProfileSource(run, tenantKey, clientId)
          : Promise.resolve(null),
        wantsApps
          ? readApplicationPortfolioSource(run, tenantKey, clientId)
          : Promise.resolve(null),
        wantsVendors
          ? readVendorContractsSource(run, tenantKey, clientId)
          : Promise.resolve(null),
        wantsInitiatives
          ? readInitiativesSource(run, tenantKey, clientId)
          : Promise.resolve(null),
        wantsEngineeringProductivity
          ? readEngineeringProductivitySource(run, tenantKey, clientId)
          : Promise.resolve(null),
        // Always attempt the loaded-context retriever (returns null fast when
        // no chunk matches), so ingestion -> retrieval holds for every domain.
        readKeywordContextChunkSource(run, tenantKey, clientId, query),
      ]);
      return results.filter((source): source is TenantEnterpriseSource =>
        Boolean(source),
      );
    });
  } catch {
    return [];
  }
}

const SKYHARBOR_DORA_DOMAINS = [
  "Mobile Digital",
  "Web Booking",
  "Mainframe Core",
  "Crew Systems",
  "Airport Ops",
  "Baggage",
  "Loyalty",
  "Revenue Accounting",
  "AWS Platform",
  "Data Platform",
  "Security Engineering",
  "Contact Center",
  "MRO Tech",
  "Cargo",
  "Finance IT",
  "GCC Delivery",
  "Modernization Factory",
  "DevEx Tooling",
];

async function readEngineeringProductivitySource(
  run: SqlRunner,
  tenantKey: string,
  clientId: string,
): Promise<TenantEnterpriseSource | null> {
  const rows = await run<EnterpriseContextChunkRow>(
    `SELECT chunk_id, chunk_text, source_segment_id, source_doc
       FROM enterprise_context_chunks
      WHERE client_id = $1
        AND chunk_text ILIKE '%S09_ENGINEERING_PRODUCTIVITY%'
      ORDER BY chunk_id ASC
      LIMIT 60`,
    [clientId],
  );
  const scorecards = rows
    .map((row) => parseDoraScorecard(row.chunk_text ?? ""))
    .filter((row): row is DoraScorecard => Boolean(row))
    .filter((row) =>
      row.scorecardId.startsWith(`${tenantRecordPrefix(tenantKey)}-DORA-`),
    )
    .slice(0, 18);
  if (scorecards.length === 0) return null;

  const fast = scorecards.filter(
    (row) => row.deployFrequencyPerWeek >= 8 && row.leadTimeHours <= 36,
  );
  const constrained = scorecards.filter(
    (row) => row.deployFrequencyPerWeek <= 3 || row.leadTimeHours >= 72,
  );
  return {
    type: "TENANT",
    name: `Structured engineering productivity / DORA baseline (${tenantKey})`,
    id: `${tenantKey}:structured:engineering_productivity`,
    detail: [
      `DORA scorecards from S09_ENGINEERING_PRODUCTIVITY for ${tenantKey}.`,
      "Use these exact scorecard IDs and metrics before saying DORA, lead time, deployment frequency, MTTR, change failure, or modernization correlation is unavailable.",
      `Modernization correlation: cloud-native/customer domains are faster (${
        fast
          .map((row) => row.domain)
          .slice(0, 4)
          .join(", ") || "none surfaced"
      }); mainframe-adjacent or operations domains are constrained (${
        constrained
          .map((row) => row.domain)
          .slice(0, 6)
          .join(", ") || "none surfaced"
      }).`,
      ...scorecards.map(
        (row) =>
          `${row.scorecardId} · ${row.domain} · lead_time ${row.leadTimeHours}h · deploy_frequency ${row.deployFrequencyPerWeek}/week · MTTR ${row.mttrHours}h · change_failure ${row.changeFailurePct}%`,
      ),
    ].join("\n- "),
    confidence: 0.98,
  };
}

async function readKeywordContextChunkSource(
  run: SqlRunner,
  tenantKey: string,
  clientId: string,
  query: string,
): Promise<TenantEnterpriseSource | null> {
  const patterns = tokenize(query)
    .filter((term) => term.length >= 5)
    .slice(0, 12)
    .map((term) => `%${term}%`);
  if (patterns.length === 0) return null;

  // Pull a wide candidate pool ordered by recency (newest first) so that
  // freshly-loaded / operator-confirmed context is guaranteed to be a
  // candidate and is not crowded out of a small LIMIT by the large
  // pre-existing corpus. Relevance ranking (rankChunks) then selects the
  // best matches from this pool. Operator-confirmed rows are surfaced ahead
  // of still-in-review rows for the same recency.
  const rows = await run<EnterpriseContextChunkRow>(
    `SELECT chunk_id, chunk_text, source_segment_id, source_doc
       FROM enterprise_context_chunks
      WHERE client_id = $1
        AND (
          chunk_text ILIKE ANY($2::text[])
          OR source_doc ILIKE ANY($2::text[])
        )
      ORDER BY
        CASE WHEN classification_source = 'OPERATOR_CONFIRMED' THEN 0 ELSE 1 END,
        updated_at DESC NULLS LAST,
        chunk_id ASC
      LIMIT 240`,
    [clientId, patterns],
  );
  const chunks: ContextChunk[] = rows.map((row) => ({
    tenantKey,
    chunkId:
      row.chunk_id ?? `${tenantKey}:keyword:${row.source_doc ?? "chunk"}`,
    sourceSegmentId: row.source_segment_id ?? undefined,
    sourceDoc: row.source_doc ?? undefined,
    text: row.chunk_text ?? "",
    embeddingStatus: "embedded",
  }));
  const ranked = rankChunks(chunks, query, "it_landscape").slice(0, 8);
  if (ranked.length === 0) return null;

  return {
    type: "TENANT",
    name: `Loaded context chunks matching the question (${tenantKey})`,
    id: `${tenantKey}:context:keyword:${tokenize(query).slice(0, 3).join("-") || "query"}`,
    detail: [
      `Question-matched chunks from public.enterprise_context_chunks for ${tenantKey}.`,
      "Use these loaded tenant chunks before saying application, vendor, initiative, or finance evidence has not been ingested.",
      ...ranked.map(formatChunk),
    ].join("\n- "),
    confidence: 0.96,
  };
}

interface DoraScorecard {
  scorecardId: string;
  domain: string;
  leadTimeHours: number;
  deployFrequencyPerWeek: number;
  mttrHours: number;
  changeFailurePct: number;
}

function parseDoraScorecard(text: string): DoraScorecard | null {
  const scorecardId = text.match(/scorecard_id=([A-Z]+-DORA-\d{3})/)?.[1];
  const index = Number(scorecardId?.match(/(\d{3})$/)?.[1] ?? 0);
  const leadTimeHours = Number(
    text.match(/lead_time_for_change_hours=([0-9.]+)/)?.[1],
  );
  const deployFrequencyPerWeek = Number(
    text.match(/deploy_frequency_per_week=([0-9.]+)/)?.[1],
  );
  const mttrHours = Number(text.match(/MTTR_hours=([0-9.]+)/)?.[1]);
  const changeFailurePct = Number(
    text.match(/change_failure_rate_pct=([0-9.]+)/)?.[1],
  );
  if (
    !scorecardId ||
    !index ||
    !Number.isFinite(leadTimeHours) ||
    !Number.isFinite(deployFrequencyPerWeek) ||
    !Number.isFinite(mttrHours) ||
    !Number.isFinite(changeFailurePct)
  ) {
    return null;
  }
  return {
    scorecardId,
    domain: SKYHARBOR_DORA_DOMAINS[index - 1] ?? `Domain ${index}`,
    leadTimeHours,
    deployFrequencyPerWeek,
    mttrHours,
    changeFailurePct,
  };
}

export async function retrieveTenantStructuredFacts(
  tenantKey: TenantLookupInput,
  query: string,
): Promise<TenantStructuredSource[]> {
  if (!tenantKey) return [];
  const canonicalTenantKey = normalizeTenantEnterpriseKey(tenantKey);
  if (!canonicalTenantKey) return [];
  const normalized = query.toLowerCase();
  const wantsVisual =
    /\b(chart|charts|visual|visually|visuali[sz]e|plot|graph|graphs|map|topology|network|dependency|dependencies|lineage|relationship|relationships|blast radius)\b/.test(
      normalized,
    );
  const wantsTopApps =
    /top\s+\d+\s+(?:apps?|applications?)\s+by\s+criticality|(?:application|app)\s+portfolio.*criticality|(?:application|app|system|systems)\s+(?:count|counts)\s+by\s+(?:domain|function|capability)|(?:applications?|apps?|systems?).*(?:domain|function|capability|lifecycle|status|system\s+of\s+record|systems\s+of\s+record)|(?:core|key)\s+systems?|business\s+capabilit(?:y|ies).*(?:applications?|apps?|systems?)/.test(
      normalized,
    );
  const wantsRetiringApps =
    /(?:which\s+)?(?:applications?|apps?).*(?:retiring|retire|decommission|sunset)/.test(
      normalized,
    );
  const wantsTopVendors =
    /(?:top|biggest|largest)\s+vendors?|vendor.*\b(?:spend|cost|annual|concentration|contract|contracts?)\b|contracts?.*(?:value|renewal|vendor|supplier)|\b(?:ibm|aws|edp|true[-\s]?up|snowflake|databricks|cyber|security\s+stack|ai\s+tooling|tooling\s+stack|sourcing\s+events?)\b/.test(
      normalized,
    );
  const wantsVendorRenewals =
    /vendor\s+renewal|renewing|renewals?\s+(?:window|date)|renewals?.*(?:next|6\s+months|six\s+months|exposed)|sourcing\s+events?|restructure\s+window|contract\s+restructure|edp|true[-\s]?up/.test(
      normalized,
    );
  const wantsActiveInitiatives =
    /active\s+initiatives?|in[-\s]?flight\s+initiatives?|biggest\s+in[-\s]?flight\s+initiative|initiatives?.*(?:committed|realized|measured|value|stage|impact|effort|risk|owner|spend|fund|kill|pause|accelerate)|ai\s+(?:spend|investment|investments?|initiatives?|portfolio|commitment|commitments?)|value\s+at\s+stake|top\s+bets?|\b(?:sap|s\/4|s4)\b.*\bwave\b|\bwave\s*0\b|operating\s+model|target\s+operating\s+model|\btom\b|modernization\s+moves?|90\s+days?|ai\s+tooling|sdlc|cobol|gcc|global\s+capability|value\s+stuck|projected/.test(
      normalized,
    );
  const wantsInitiativesByStage = /initiatives?\s+by\s+(?:stage|phase)/.test(
    normalized,
  );
  const wantsKillInitiatives =
    /(?:which\s+)?(?:initiatives?|moves?).*(?:kill|stop|pause|cut)/.test(
      normalized,
    );
  const wantsDependencyGraph =
    wantsVisual &&
    /\b(dependency|dependencies|depend|depends|relationship|relationships|connect|connected|integration|integrations|interface|interfaces|topology|lineage|feeds?|upstream|downstream|blast radius|platforms?)\b/.test(
      normalized,
    );
  const wantsAnyVisualSource =
    wantsVisual &&
    /\b(application|applications|apps?|systems?|vendors?|contracts?|renewals?|initiatives?|portfolio|domain|function|capability|data products?|analytics|platforms?)\b/.test(
      normalized,
    );

  if (
    !wantsTopApps &&
    !wantsRetiringApps &&
    !wantsTopVendors &&
    !wantsVendorRenewals &&
    !wantsActiveInitiatives &&
    !wantsInitiativesByStage &&
    !wantsKillInitiatives &&
    !wantsDependencyGraph &&
    !wantsAnyVisualSource
  ) {
    return [];
  }

  try {
    return await structuredFactSession(async (run) => {
      const clientId = await resolveClientIdForTenantKey(
        run,
        canonicalTenantKey,
      );
      if (!clientId) return [];
      const sources: TenantStructuredSource[] = [];
      if (wantsTopApps || wantsDependencyGraph || wantsAnyVisualSource) {
        if (
          /(?:application|app|system|systems)\s+(?:count|counts)\s+by\s+(?:domain|function|capability)|(?:application|app)\s+count|count\s+by\s+(?:domain|function|capability)/.test(
            normalized,
          )
        ) {
          const source = await readStructuredApplicationDomainCountsSource(
            run,
            canonicalTenantKey,
            clientId,
          );
          if (source) sources.push(source);
        }
        const source = await readStructuredTopApplicationsSource(
          run,
          canonicalTenantKey,
          clientId,
        );
        if (source) sources.push(source);
      }
      if (wantsRetiringApps) {
        const source = await readStructuredRetiringApplicationsSource(
          run,
          canonicalTenantKey,
          clientId,
        );
        if (source) sources.push(source);
      }
      if (wantsTopVendors || wantsDependencyGraph || wantsAnyVisualSource) {
        const source = await readStructuredTopVendorsSource(
          run,
          canonicalTenantKey,
          clientId,
        );
        if (source) sources.push(source);
      }
      if (wantsVendorRenewals) {
        const source = await readStructuredVendorRenewalsSource(
          run,
          canonicalTenantKey,
          clientId,
        );
        if (source) sources.push(source);
      }
      if (
        wantsActiveInitiatives ||
        wantsInitiativesByStage ||
        wantsKillInitiatives ||
        wantsDependencyGraph ||
        wantsAnyVisualSource
      ) {
        const source = await readStructuredInitiativesSource(
          run,
          canonicalTenantKey,
          clientId,
          {
            byStage: wantsInitiativesByStage,
            killOnly: wantsKillInitiatives,
          },
        );
        if (source) sources.push(source);
      }
      return sources;
    });
  } catch {
    return [];
  }
}

async function readStructuredApplicationDomainCountsSource(
  run: SqlRunner,
  tenantKey: string,
  clientId: string,
): Promise<TenantStructuredSource | null> {
  const rows = await run<ApplicationDomainCountRow>(
    `SELECT COALESCE(NULLIF(TRIM(business_function), ''), 'unknown') AS business_function,
            count(*)::int AS application_count,
            SUM(COALESCE(annual_cost_usd, 0)) AS annual_cost_usd
       FROM applications
      WHERE client_id = $1
      GROUP BY COALESCE(NULLIF(TRIM(business_function), ''), 'unknown')
      ORDER BY application_count DESC, annual_cost_usd DESC NULLS LAST
      LIMIT 12`,
    [clientId],
  );
  if (rows.length === 0) return null;
  return {
    type: "TENANT",
    name: `Structured fact · application count by function (${tenantKey})`,
    id: `${tenantKey}:structured-fact:application-count-by-function`,
    detail: [
      `Application counts by business function from public.applications for ${tenantKey}.`,
      ...rows.map(
        (row) =>
          `${row.business_function ?? "unknown"} · ${row.application_count} applications · ${formatUsd(row.annual_cost_usd) ?? "$0"} annual run cost`,
      ),
    ].join("\n- "),
    confidence: 0.99,
    structured: {
      tables: [
        {
          id: `${tenantKey}-application-count-by-function`,
          title: "Application Count by Function",
          columns: [
            { key: "function", label: "Function" },
            {
              key: "applicationCount",
              label: "Application Count",
              format: "number",
              align: "right",
            },
            {
              key: "annualCost",
              label: "Annual Cost",
              format: "currency",
              align: "right",
            },
          ],
          rows: rows.map((row) => ({
            function: row.business_function ?? "unknown",
            applicationCount: numericValue(row.application_count) ?? 0,
            annualCost: numericValue(row.annual_cost_usd),
          })),
          chart: {
            labelKey: "function",
            valueKey: "applicationCount",
            title: "Application Count by Function",
          },
        },
      ],
    },
  };
}

async function readStructuredTopApplicationsSource(
  run: SqlRunner,
  tenantKey: string,
  clientId: string,
): Promise<TenantStructuredSource | null> {
  const data = await run<ApplicationRow>(
    `SELECT id, name, vendor, business_function, deployment_model, criticality, status, annual_cost_usd
       FROM applications
      WHERE client_id = $1
      ORDER BY criticality ASC NULLS LAST, annual_cost_usd DESC NULLS LAST
      LIMIT 10`,
    [clientId],
  );
  if (data.length === 0) return null;
  const prefix = tenantRecordPrefix(tenantKey);
  const rows = data.filter((row) =>
    ["tier1", "tier2", "tier3"].includes(
      String(row.criticality ?? "").toLowerCase(),
    ),
  );
  if (rows.length === 0) return null;
  return {
    type: "TENANT",
    name: `Structured fact · top applications by criticality (${tenantKey})`,
    id: `${tenantKey}:structured-fact:top-applications`,
    detail: [
      `Top ${rows.length} applications by criticality from public.applications for ${tenantKey}.`,
      ...rows.map((row) => {
        const appRef = deriveAppRef(prefix, row.name, row.id);
        return `${appRef} · ${row.name} · ${row.criticality ?? "unknown"} · ${formatUsd(row.annual_cost_usd) ?? "unknown"}/yr · ${row.vendor ?? "unknown"} · ${row.deployment_model ?? "unknown"} · ${row.business_function ?? "unknown"}-owned`;
      }),
      "Do not substitute industry-typical provider EHR or interoperability systems unless they appear in these tenant rows.",
    ].join("\n- "),
    confidence: 0.99,
    structured: {
      tables: [
        {
          id: `${tenantKey}-top-applications`,
          title: "Top Applications by Criticality",
          columns: [
            { key: "application", label: "Application" },
            { key: "vendor", label: "Vendor" },
            { key: "function", label: "Function" },
            { key: "criticality", label: "Criticality" },
            { key: "annualCost", label: "Annual Cost", format: "currency", align: "right" },
            { key: "status", label: "Status" },
          ],
          rows: rows.map((row) => ({
            application: row.name,
            vendor: row.vendor ?? "unknown",
            function: row.business_function ?? "unknown",
            criticality: row.criticality ?? "unknown",
            annualCost: numericValue(row.annual_cost_usd),
            status: row.status ?? "unknown",
          })),
          chart: {
            labelKey: "application",
            valueKey: "annualCost",
            title: "Annual Application Cost",
          },
          graph: {
            fromKey: "application",
            toKey: "function",
            labelKey: "criticality",
            title: "Application Ownership Map",
          },
        },
      ],
    },
  };
}

async function readStructuredRetiringApplicationsSource(
  run: SqlRunner,
  tenantKey: string,
  clientId: string,
): Promise<TenantStructuredSource | null> {
  const data = await run<ApplicationRow>(
    `SELECT id, name, vendor, business_function, deployment_model, criticality, status, annual_cost_usd
       FROM applications
      WHERE client_id = $1
      ORDER BY annual_cost_usd DESC NULLS LAST
      LIMIT 80`,
    [clientId],
  );
  const prefix = tenantRecordPrefix(tenantKey);
  const rows = data
    .filter((row) =>
      /retir|sunset|decommission/i.test(String(row.status ?? "")),
    )
    .slice(0, 12);
  if (rows.length === 0) return null;
  return {
    type: "TENANT",
    name: `Structured fact · retiring applications (${tenantKey})`,
    id: `${tenantKey}:structured-fact:retiring-applications`,
    detail: [
      `Applications marked retiring/sunset/decommission from public.applications for ${tenantKey}.`,
      ...rows.map(
        (row) =>
          `${deriveAppRef(prefix, row.name, row.id)} · ${row.name} · status ${row.status ?? "unknown"} · criticality ${row.criticality ?? "unknown"} · ${formatUsd(row.annual_cost_usd) ?? "unknown"}/yr`,
      ),
    ].join("\n- "),
    confidence: 0.99,
  };
}

async function readStructuredTopVendorsSource(
  run: SqlRunner,
  tenantKey: string,
  clientId: string,
): Promise<TenantStructuredSource | null> {
  const rows = await run<VendorContractRow>(
    `SELECT vendor_id, vendor_name, contract_category, annual_contract_value_usd, renewal_date,
            exit_terms_jsonb, ai_usage_clauses, indemnity_provided, concentration_pct
       FROM vendor_contracts
      WHERE client_id = $1
      ORDER BY annual_contract_value_usd DESC NULLS LAST
      LIMIT 10`,
    [clientId],
  );
  if (rows.length === 0) return null;
  return {
    type: "TENANT",
    name: `Structured fact · top vendors by annual spend (${tenantKey})`,
    id: `${tenantKey}:structured-fact:top-vendors`,
    detail: [
      `Top ${rows.length} vendors by annual contract value from public.vendor_contracts for ${tenantKey}.`,
      ...rows.map(
        (row) =>
          `${row.vendor_id ?? "vendor_contract"} · ${row.vendor_name} · ${formatUsd(row.annual_contract_value_usd) ?? "unknown"}/yr · renewal ${formatDate(row.renewal_date) ?? "unknown"} · category ${row.contract_category ?? "unknown"} · concentration ${formatPct(row.concentration_pct) ?? "unknown"}`,
      ),
    ].join("\n- "),
    confidence: 0.99,
    structured: {
      tables: [
        {
          id: `${tenantKey}-top-vendors`,
          title: "Top Vendors by Annual Spend",
          columns: [
            { key: "vendor", label: "Vendor" },
            { key: "category", label: "Category" },
            { key: "annualValue", label: "Annual Value", format: "currency", align: "right" },
            { key: "renewalDate", label: "Renewal Date", format: "date" },
            { key: "concentration", label: "Concentration", format: "percent", align: "right" },
          ],
          rows: rows.map((row) => ({
            vendor: row.vendor_name,
            category: row.contract_category ?? "unknown",
            annualValue: numericValue(row.annual_contract_value_usd),
            renewalDate: formatDate(row.renewal_date),
            concentration: numericValue(row.concentration_pct),
          })),
          chart: {
            labelKey: "vendor",
            valueKey: "annualValue",
            title: "Annual Vendor Spend",
          },
          graph: {
            fromKey: "vendor",
            toKey: "category",
            labelKey: "renewalDate",
            title: "Vendor Category Map",
          },
        },
      ],
    },
  };
}

async function readStructuredVendorRenewalsSource(
  run: SqlRunner,
  tenantKey: string,
  clientId: string,
): Promise<TenantStructuredSource | null> {
  const data = await run<VendorContractRow>(
    `SELECT vendor_id, vendor_name, contract_category, annual_contract_value_usd, renewal_date,
            exit_terms_jsonb, ai_usage_clauses, indemnity_provided, concentration_pct
       FROM vendor_contracts
      WHERE client_id = $1
      ORDER BY renewal_date ASC NULLS LAST
      LIMIT 90`,
    [clientId],
  );
  const now = Date.now();
  const sixMonths = now + 183 * 24 * 60 * 60 * 1000;
  const rows = data
    .filter((row) => {
      if (!row.renewal_date) return false;
      const renewal = new Date(row.renewal_date).getTime();
      return Number.isFinite(renewal) && renewal >= now && renewal <= sixMonths;
    })
    .slice(0, 10);
  if (rows.length === 0) return null;
  return {
    type: "TENANT",
    name: `Structured fact · vendor renewals next 6 months (${tenantKey})`,
    id: `${tenantKey}:structured-fact:vendor-renewals-6mo`,
    detail: [
      `Vendor renewals in the next six months from public.vendor_contracts for ${tenantKey}.`,
      ...rows.map((row) => {
        const exitTerms =
          typeof row.exit_terms_jsonb?.summary === "string"
            ? row.exit_terms_jsonb.summary
            : "not specified";
        return `${row.vendor_id ?? "vendor_contract"} · ${row.vendor_name} · renewal ${formatDate(row.renewal_date) ?? "unknown"} · ${formatUsd(row.annual_contract_value_usd) ?? "unknown"}/yr · exit terms ${exitTerms} · AI clauses ${row.ai_usage_clauses ? "yes" : "no"} · indemnity ${row.indemnity_provided ? "yes" : "no"}`;
      }),
    ].join("\n- "),
    confidence: 0.99,
    structured: {
      tables: [
        {
          id: `${tenantKey}-vendor-renewals-6mo`,
          title: "Vendor Renewals in the Next Six Months",
          columns: [
            { key: "vendor", label: "Vendor" },
            { key: "renewalDate", label: "Renewal Date", format: "date" },
            { key: "annualValue", label: "Annual Value", format: "currency", align: "right" },
            { key: "exitTerms", label: "Exit Terms" },
            { key: "aiClauses", label: "AI Clauses" },
            { key: "indemnity", label: "Indemnity" },
          ],
          rows: rows.map((row) => ({
            vendor: row.vendor_name,
            renewalDate: formatDate(row.renewal_date),
            annualValue: numericValue(row.annual_contract_value_usd),
            exitTerms:
              typeof row.exit_terms_jsonb?.summary === "string"
                ? row.exit_terms_jsonb.summary
                : "not specified",
            aiClauses: row.ai_usage_clauses ? "yes" : "no",
            indemnity: row.indemnity_provided ? "yes" : "no",
          })),
          chart: {
            labelKey: "vendor",
            valueKey: "annualValue",
            title: "Renewal Exposure by Vendor",
          },
          graph: {
            fromKey: "vendor",
            toKey: "exitTerms",
            labelKey: "renewalDate",
            title: "Renewal Exit-Term Exposure",
          },
        },
      ],
    },
  };
}

async function readStructuredInitiativesSource(
  run: SqlRunner,
  tenantKey: string,
  clientId: string,
  opts: { byStage?: boolean; killOnly?: boolean } = {},
): Promise<TenantStructuredSource | null> {
  const data = await run<InitiativeRow>(
    `SELECT initiative_id, display_id, name, stage, status_flag, committed_total_usd,
            measured_value_usd, status_summary, metadata
       FROM ai_initiatives
      WHERE client_id = $1
      ORDER BY committed_total_usd DESC NULLS LAST
      LIMIT 80`,
    [clientId],
  );
  const activeRows = data.filter(
    (row) =>
      !/closed|sunset|archived/i.test(
        `${row.initiative_id ?? ""} ${row.status_flag ?? ""} ${row.stage ?? ""}`,
      ),
  );
  const rows = (
    opts.killOnly
      ? activeRows.filter((row) => initiativePriority(row) === 0)
      : activeRows
  )
    .sort((a, b) => {
      const priorityDelta = initiativePriority(a) - initiativePriority(b);
      if (priorityDelta !== 0) return priorityDelta;
      return (
        Number(b.committed_total_usd ?? 0) - Number(a.committed_total_usd ?? 0)
      );
    })
    .slice(0, 12);
  if (rows.length === 0) return null;
  if (opts.byStage) {
    const counts = rows.reduce<Record<string, number>>((acc, row) => {
      const stage = row.stage ?? "unknown";
      acc[stage] = (acc[stage] ?? 0) + 1;
      return acc;
    }, {});
    return {
      type: "TENANT",
      name: `Structured fact · active initiatives by stage (${tenantKey})`,
      id: `${tenantKey}:structured-fact:initiatives-by-stage`,
      detail: [
        `Active initiatives by stage from public.ai_initiatives for ${tenantKey}.`,
        ...Object.entries(counts).map(([stage, count]) => `${stage}: ${count}`),
        ...rows.map((row) => formatInitiativeStructuredLine(row)),
      ].join("\n- "),
      confidence: 0.99,
      structured: {
        tables: [
          {
            id: `${tenantKey}-initiatives-by-stage`,
            title: "Active Initiatives by Stage",
            columns: [
              { key: "stage", label: "Stage" },
              { key: "count", label: "Count", format: "number", align: "right" },
            ],
            rows: Object.entries(counts).map(([stage, count]) => ({
              stage,
              count,
            })),
            chart: {
              labelKey: "stage",
              valueKey: "count",
              title: "Initiative Count by Stage",
            },
          },
        ],
      },
    };
  }
  return {
    type: "TENANT",
    name: opts.killOnly
      ? `Structured fact · kill-candidate initiatives (${tenantKey})`
      : `Structured fact · active initiatives (${tenantKey})`,
    id: opts.killOnly
      ? `${tenantKey}:structured-fact:kill-initiatives`
      : `${tenantKey}:structured-fact:active-initiatives`,
    detail: [
      opts.killOnly
        ? `Active kill/stalled initiative candidates from public.ai_initiatives for ${tenantKey}.`
        : `Active initiatives from public.ai_initiatives for ${tenantKey}.`,
      ...rows.map(formatInitiativeStructuredLine),
    ].join("\n- "),
    confidence: 0.99,
    structured: {
      tables: [
        {
          id: opts.killOnly
            ? `${tenantKey}-kill-initiatives`
            : `${tenantKey}-active-initiatives`,
          title: opts.killOnly
            ? "Kill-Candidate Initiatives"
            : "Active Initiatives",
          columns: [
            { key: "initiative", label: "Initiative" },
            { key: "stage", label: "Stage" },
            { key: "status", label: "Status" },
            { key: "posture", label: "Posture" },
            { key: "committed", label: "Committed", format: "currency", align: "right" },
            { key: "value", label: "Value", format: "currency", align: "right" },
          ],
          rows: rows.map((row) => {
            const posture =
              typeof row.metadata?.sentinel_posture === "string"
                ? row.metadata.sentinel_posture
                : row.status_summary;
            return {
              initiative: row.name,
              stage: row.stage ?? "unknown",
              status: row.status_flag ?? "unknown",
              posture: posture ?? "unknown",
              committed: numericValue(row.committed_total_usd),
              value: numericValue(row.measured_value_usd),
            };
          }),
          chart: {
            labelKey: "initiative",
            valueKey: "committed",
            title: "Committed Investment by Initiative",
          },
          graph: {
            fromKey: "initiative",
            toKey: "stage",
            labelKey: "posture",
            title: "Initiative Stage/Posture Map",
          },
        },
      ],
    },
  };
}

function formatInitiativeStructuredLine(row: InitiativeRow): string {
  const posture =
    typeof row.metadata?.sentinel_posture === "string"
      ? row.metadata.sentinel_posture
      : row.status_summary;
  return `${row.initiative_id} · ${row.name} · stage ${row.stage ?? "unknown"} · status ${row.status_flag ?? "unknown"} · posture ${posture ?? "unknown"} · committed ${formatUsd(row.committed_total_usd) ?? "unknown"} · value ${formatUsd(row.measured_value_usd) ?? "unknown"}`;
}

async function resolveClientIdForTenantKey(
  run: SqlRunner,
  tenantKey: string,
): Promise<string | null> {
  const aliases = tenantAliasesFor(tenantKey.toLowerCase());
  const rows = await run<{ id: string }>(
    `SELECT id
       FROM clients
      WHERE tenant_key = ANY($1::text[]) OR slug = ANY($1::text[])
      LIMIT 1`,
    [aliases],
  );
  return rows[0]?.id ?? null;
}

async function readClientProfileSource(
  run: SqlRunner,
  tenantKey: string,
  clientId: string,
): Promise<TenantEnterpriseSource | null> {
  const rows = await run<ClientProfileRow>(
    `SELECT id, name, legal_name, tenant_key, slug, annual_revenue_usd, it_budget_usd,
            ai_budget_usd, employee_count, operational_units, business_description
       FROM clients
      WHERE id = $1
      LIMIT 1`,
    [clientId],
  );
  const row = rows[0];
  if (!row) return null;
  const revenue = formatUsd(row.annual_revenue_usd);
  const itBudget = formatUsd(row.it_budget_usd);
  const aiBudget = formatUsd(row.ai_budget_usd);
  return {
    type: "TENANT",
    name: `Structured client profile (${tenantKey})`,
    id: `${tenantKey}:structured:client_profile:${clientId}`,
    detail: [
      `clients[${clientId}] structured profile.`,
      row.name ? `Name: ${row.name}.` : null,
      row.legal_name ? `Legal name: ${row.legal_name}.` : null,
      revenue ? `Annual revenue: ${revenue}.` : null,
      itBudget ? `IT budget: ${itBudget}.` : null,
      aiBudget ? `AI budget: ${aiBudget}.` : null,
      row.employee_count != null
        ? `Employees: ${Number(row.employee_count).toLocaleString("en-US")}.`
        : null,
      row.operational_units != null
        ? `Operational units/plants/stores: ${Number(row.operational_units).toLocaleString("en-US")}.`
        : null,
      row.business_description
        ? `Business description: ${row.business_description}.`
        : null,
      "Use this row before saying tenant scale, annual IT spend, or company profile is unavailable.",
    ]
      .filter(Boolean)
      .join("\n- "),
    confidence: 0.98,
  };
}

async function readApplicationPortfolioSource(
  run: SqlRunner,
  tenantKey: string,
  clientId: string,
): Promise<TenantEnterpriseSource | null> {
  const rows = await run<ApplicationRow>(
    `SELECT id, name, vendor, business_function, deployment_model, criticality, status, annual_cost_usd
       FROM applications
      WHERE client_id = $1
      ORDER BY criticality ASC NULLS LAST, annual_cost_usd DESC NULLS LAST
      LIMIT 15`,
    [clientId],
  );
  if (rows.length === 0) return null;
  const prefix = tenantRecordPrefix(tenantKey);
  return {
    type: "TENANT",
    name: `Structured application portfolio (${tenantKey})`,
    id: `${tenantKey}:structured:applications`,
    detail: [
      `Top critical applications from public.applications for ${tenantKey}.`,
      "Answer app-portfolio and criticality questions from these rows before using generic industry systems.",
      ...rows.map((row) => {
        const appRef = deriveAppRef(prefix, row.name, row.id);
        return `${appRef} ${row.name} — criticality ${row.criticality ?? "unknown"}, status ${row.status ?? "unknown"}, vendor/AMS ${row.vendor ?? "unknown"}, business_unit ${row.business_function ?? "unknown"}, deployment ${row.deployment_model ?? "unknown"}, annual_run_cost ${formatUsd(row.annual_cost_usd) ?? "unknown"}`;
      }),
    ].join("\n- "),
    confidence: 0.97,
    structured: {
      tables: [
        {
          id: `${tenantKey}-application-portfolio`,
          title: "Application Portfolio",
          columns: [
            { key: "application", label: "Application" },
            { key: "vendor", label: "Vendor" },
            { key: "function", label: "Function" },
            { key: "deployment", label: "Deployment" },
            { key: "criticality", label: "Criticality" },
            { key: "annualRunCost", label: "Annual Run Cost", format: "currency", align: "right" },
            { key: "status", label: "Status" },
          ],
          rows: rows.map((row) => ({
            application: row.name,
            vendor: row.vendor ?? "unknown",
            function: row.business_function ?? "unknown",
            deployment: row.deployment_model ?? "unknown",
            criticality: row.criticality ?? "unknown",
            annualRunCost: numericValue(row.annual_cost_usd),
            status: row.status ?? "unknown",
          })),
          chart: {
            labelKey: "application",
            valueKey: "annualRunCost",
            title: "Annual Run Cost by Application",
          },
          graph: {
            fromKey: "application",
            toKey: "function",
            labelKey: "vendor",
            title: "Application to Function Map",
          },
        },
      ],
    },
  };
}

async function readVendorContractsSource(
  run: SqlRunner,
  tenantKey: string,
  clientId: string,
): Promise<TenantEnterpriseSource | null> {
  const rows = await run<VendorContractRow>(
    `SELECT vendor_id, vendor_name, contract_category, annual_contract_value_usd, renewal_date,
            exit_terms_jsonb, ai_usage_clauses, indemnity_provided, concentration_pct
       FROM vendor_contracts
      WHERE client_id = $1
      ORDER BY annual_contract_value_usd DESC NULLS LAST
      LIMIT 15`,
    [clientId],
  );
  if (rows.length === 0) return null;
  return {
    type: "TENANT",
    name: `Structured vendor contracts (${tenantKey})`,
    id: `${tenantKey}:structured:vendor_contracts`,
    detail: [
      `Largest vendor contracts from public.vendor_contracts for ${tenantKey}.`,
      "Use these exact vendor_id, annual value, renewal, exit terms, and AI-clause fields for vendor concentration and sourcing questions.",
      ...rows.map((row) => {
        const exitTerms =
          typeof row.exit_terms_jsonb?.summary === "string"
            ? row.exit_terms_jsonb.summary
            : "not specified";
        return `${row.vendor_id ?? "vendor_contract"} ${row.vendor_name} — ${row.contract_category ?? "contract"}, annual_value ${formatUsd(row.annual_contract_value_usd) ?? "unknown"}, renewal ${formatDate(row.renewal_date) ?? "unknown"}, exit_terms "${exitTerms}", AI clauses ${row.ai_usage_clauses ? "yes" : "no"}, indemnity ${row.indemnity_provided ? "yes" : "no"}, concentration ${formatPct(row.concentration_pct) ?? "unknown"}`;
      }),
    ].join("\n- "),
    confidence: 0.97,
    structured: {
      tables: [
        {
          id: `${tenantKey}-vendor-contracts`,
          title: "Vendor Contracts",
          columns: [
            { key: "vendor", label: "Vendor" },
            { key: "category", label: "Category" },
            { key: "annualValue", label: "Annual Value", format: "currency", align: "right" },
            { key: "renewalDate", label: "Renewal Date", format: "date" },
            { key: "exitTerms", label: "Exit Terms" },
            { key: "aiClauses", label: "AI Clauses" },
            { key: "indemnity", label: "Indemnity" },
            { key: "concentration", label: "Concentration", format: "percent", align: "right" },
          ],
          rows: rows.map((row) => ({
            vendor: row.vendor_name,
            category: row.contract_category ?? "unknown",
            annualValue: numericValue(row.annual_contract_value_usd),
            renewalDate: formatDate(row.renewal_date),
            exitTerms:
              typeof row.exit_terms_jsonb?.summary === "string"
                ? row.exit_terms_jsonb.summary
                : "not specified",
            aiClauses: row.ai_usage_clauses ? "yes" : "no",
            indemnity: row.indemnity_provided ? "yes" : "no",
            concentration: numericValue(row.concentration_pct),
          })),
          chart: {
            labelKey: "vendor",
            valueKey: "annualValue",
            title: "Annual Contract Value by Vendor",
          },
          graph: {
            fromKey: "vendor",
            toKey: "category",
            labelKey: "renewalDate",
            title: "Vendor Category Map",
          },
        },
      ],
    },
  };
}

async function readInitiativesSource(
  run: SqlRunner,
  tenantKey: string,
  clientId: string,
): Promise<TenantEnterpriseSource | null> {
  const data = await run<InitiativeRow>(
    `SELECT initiative_id, display_id, name, stage, status_flag, committed_total_usd,
            measured_value_usd, status_summary, metadata
       FROM ai_initiatives
      WHERE client_id = $1
      ORDER BY committed_total_usd DESC NULLS LAST
      LIMIT 80`,
    [clientId],
  );
  if (data.length === 0) return null;
  const rows = data
    .sort((a, b) => initiativePriority(a) - initiativePriority(b))
    .slice(0, 18);
  return {
    type: "TENANT",
    name: `Structured initiatives (${tenantKey})`,
    id: `${tenantKey}:structured:ai_initiatives`,
    detail: [
      `Active initiative portfolio from public.ai_initiatives for ${tenantKey}.`,
      "Use initiative_id/status_flag/status_summary for kill, restructure, accelerate, and funding questions.",
      ...rows.map((row) => {
        const posture =
          typeof row.metadata?.sentinel_posture === "string"
            ? row.metadata.sentinel_posture
            : row.status_summary;
        return `${row.initiative_id} (${row.display_id ?? row.initiative_id}) ${row.name} — stage ${row.stage ?? "unknown"}, status_flag ${row.status_flag ?? "unknown"}, Sentinel posture ${posture ?? "unknown"}, committed ${formatUsd(row.committed_total_usd) ?? "unknown"}, measured/projected value ${formatUsd(row.measured_value_usd) ?? "unknown"}`;
      }),
    ].join("\n- "),
    confidence: 0.97,
    structured: {
      tables: [
        {
          id: `${tenantKey}-initiatives`,
          title: "Initiatives",
          columns: [
            { key: "initiative", label: "Initiative" },
            { key: "stage", label: "Stage" },
            { key: "status", label: "Status" },
            { key: "posture", label: "Posture" },
            { key: "committed", label: "Committed", format: "currency", align: "right" },
            { key: "value", label: "Value", format: "currency", align: "right" },
          ],
          rows: rows.map((row) => {
            const posture =
              typeof row.metadata?.sentinel_posture === "string"
                ? row.metadata.sentinel_posture
                : row.status_summary;
            return {
              initiative: row.name,
              stage: row.stage ?? "unknown",
              status: row.status_flag ?? "unknown",
              posture: posture ?? "unknown",
              committed: numericValue(row.committed_total_usd),
              value: numericValue(row.measured_value_usd),
            };
          }),
          chart: {
            labelKey: "initiative",
            valueKey: "committed",
            title: "Committed Investment by Initiative",
          },
          graph: {
            fromKey: "initiative",
            toKey: "stage",
            labelKey: "posture",
            title: "Initiative Stage/Posture Map",
          },
        },
      ],
    },
  };
}

function initiativePriority(row: InitiativeRow): number {
  const posture =
    `${row.status_summary ?? ""} ${typeof row.metadata?.sentinel_posture === "string" ? row.metadata.sentinel_posture : ""} ${row.status_flag ?? ""}`.toLowerCase();
  if (posture.includes("kill") || posture.includes("stalled")) return 0;
  if (posture.includes("restructure")) return 1;
  if (posture.includes("hold") || posture.includes("value_lag")) return 2;
  if (posture.includes("warning")) return 3;
  return 4;
}

function isDirectReportsQuestion(query: string): boolean {
  return /\b(my\s+)?direct\s+reports?\b|\bwho\s+reports?\s+to\s+(?:me|my|the|[a-z])|\breports?\s+to\s+me\b/i.test(
    query,
  );
}

function isCLevelLeaderQuestion(query: string): boolean {
  return /\b(c[-\s]?level|c-suite|executive\s+bench|executives?|business\s+leaders?|business\s+leadership|ceo|cfo|coo|cmo|cno|cmio|chief)\b/i.test(
    query,
  );
}

async function retrieveCLevelLeaderSource(
  tenantKey: string,
  query: string,
): Promise<TenantEnterpriseSource | null> {
  if (!isCLevelLeaderQuestion(query)) return null;

  const adapter = getTenantDataAdapter();
  const chunks = await adapter.listContextChunks(tenantKey, {
    segmentIds: ["org_structure"],
    limit: 180,
  });
  const businessOnly = /\bbusiness\b/i.test(query);
  const lines = chunks
    .map((chunk) => parsePersonRecordFromChunk(chunk))
    .filter((record): record is PersonRecord => Boolean(record))
    .filter((record) => isCLevelRecord(record, businessOnly))
    .map(formatPersonRecord)
    .filter((line, index, all) => all.indexOf(line) === index)
    .sort((a, b) => a.localeCompare(b));

  if (lines.length === 0) return null;

  return {
    type: "TENANT",
    name: `C-level and business leaders (${tenantKey})`,
    id: `${tenantKey}:c_level_business_leaders`,
    detail: [
      businessOnly
        ? `Business-side C-level and executive leaders visible in ${tenantKey}'s persisted org structure.`
        : `C-level and executive leaders visible in ${tenantKey}'s persisted org structure.`,
      "This is an in-domain tenant org-structure lookup. Answer it directly; do not say the executive bench is unavailable.",
      ...lines,
    ].join("\n- "),
    confidence: 0.96,
  };
}

interface PersonRecord {
  id: string | null;
  name: string | null;
  title: string | null;
  scope: string | null;
  reportsTo: string | null;
  sourceDoc: string | null;
}

function parsePersonRecordFromChunk(chunk: ContextChunk): PersonRecord | null {
  const normalized = normalizeLegacyClientAliases(chunk.text)
    .replace(/\s+/g, " ")
    .trim();
  const id =
    readFlattenedField(normalized, "id") ?? readJsonLikeField(normalized, "id");
  const name =
    readFlattenedField(normalized, "full_name") ??
    readFlattenedField(normalized, "name") ??
    readJsonLikeField(normalized, "full_name") ??
    readJsonLikeField(normalized, "name");
  const title =
    readFlattenedField(normalized, "title") ??
    readFlattenedField(normalized, "role") ??
    readJsonLikeField(normalized, "title") ??
    readJsonLikeField(normalized, "role");
  const scope =
    readFlattenedField(normalized, "scope") ??
    readFlattenedField(normalized, "role_scope") ??
    readJsonLikeField(normalized, "scope") ??
    readJsonLikeField(normalized, "role_scope");
  const reportsTo =
    readFlattenedField(normalized, "reports_to") ??
    readJsonLikeField(normalized, "reports_to");
  if (!name && !title) return null;
  return {
    id,
    name,
    title,
    scope,
    reportsTo,
    sourceDoc: chunk.sourceDoc ?? null,
  };
}

function isCLevelRecord(record: PersonRecord, businessOnly: boolean): boolean {
  const title = record.title ?? "";
  const isExecutive =
    /\b(chief|ceo|cfo|coo|cmo|cno|cmio|president|general counsel|board chair)\b/i.test(
      title,
    );
  if (!isExecutive) return false;
  if (/\b(associate|assistant|deputy)\b/i.test(title)) return false;
  if (!businessOnly) return true;
  if (/\bboard chair\b/i.test(title)) return false;
  return !/\b(digital|information|technology|cio|cdio|cto|ciso|data|analytics|security)\b/i.test(
    title,
  );
}

function formatPersonRecord(record: PersonRecord): string {
  return [
    record.name,
    record.title,
    record.scope ? `scope: ${record.scope}` : null,
    record.reportsTo ? `reports_to: ${record.reportsTo}` : null,
  ]
    .filter(Boolean)
    .join(" — ");
}

async function retrieveDirectReportsSource(
  tenantKey: string,
  query: string,
  opts: {
    activePersonGraphNodeId?: string | null;
    activePersonDisplayName?: string | null;
    userContextBlock?: string | null;
  },
): Promise<TenantEnterpriseSource | null> {
  if (!isDirectReportsQuestion(query)) return null;

  const adapter = getTenantDataAdapter();
  const people = await adapter.listGraphNodes(tenantKey, "person");
  const activePerson = findActivePersonNode(people, opts);
  const activeNodeId =
    activePerson?.nodeId ?? opts.activePersonGraphNodeId?.trim() ?? null;

  if (activePerson) {
    const incoming = await adapter.listGraphEdgesForNode(
      tenantKey,
      activePerson.nodeId,
      "incoming",
    );
    const reportIds = new Set(
      incoming
        .filter((edge) => edge.kind === "REPORTS_TO")
        .map((edge) => edge.fromNodeId),
    );
    const reports = people
      .filter((person) => reportIds.has(person.nodeId))
      .sort((a, b) => a.title.localeCompare(b.title));

    if (reports.length > 0) {
      return buildDirectReportsSource({
        tenantKey,
        activePersonLabel: formatPersonNode(activePerson),
        activePersonNodeId: activePerson.nodeId,
        reportLines: reports.map((person) => formatPersonNode(person)),
        confidence: 0.98,
      });
    }
  }

  if (!activeNodeId) return null;

  const chunks = await adapter.listContextChunks(tenantKey, {
    segmentIds: ["org_structure"],
    limit: 160,
  });
  const reportLines = chunks
    .filter((chunk) => chunkReportsTo(chunk, activeNodeId))
    .map((chunk) => parsePersonLineFromChunk(chunk))
    .filter((line): line is string => Boolean(line))
    .filter((line, index, all) => all.indexOf(line) === index)
    .sort((a, b) => a.localeCompare(b));

  if (reportLines.length === 0) return null;

  return buildDirectReportsSource({
    tenantKey,
    activePersonLabel:
      opts.activePersonDisplayName ??
      extractUserDisplayName(opts.userContextBlock) ??
      activeNodeId,
    activePersonNodeId: activeNodeId,
    reportLines,
    confidence: 0.95,
  });
}

function buildDirectReportsSource(args: {
  tenantKey: string;
  activePersonLabel: string;
  activePersonNodeId: string;
  reportLines: string[];
  confidence: number;
}): TenantEnterpriseSource {
  return {
    type: "TENANT",
    name: `Direct reports (${args.tenantKey})`,
    id: `${args.tenantKey}:direct_reports:${args.activePersonNodeId}`,
    detail: [
      `Direct reports view for ${args.activePersonLabel}.`,
      "This is an in-domain tenant org-structure lookup. Answer it directly; do not redirect as HR/admin.",
      ...args.reportLines,
    ].join("\n- "),
    confidence: args.confidence,
  };
}

function chunkReportsTo(chunk: ContextChunk, activeNodeId: string): boolean {
  const text = chunk.text.toLowerCase();
  const target = activeNodeId.toLowerCase();
  return (
    text.includes(`reports_to: ${target}`) ||
    text.includes(`"reports_to": "${target}"`) ||
    text.includes(`reports_to ${target}`)
  );
}

function parsePersonLineFromChunk(chunk: ContextChunk): string | null {
  const record = parsePersonRecordFromChunk(chunk);
  if (record)
    return [
      record.name,
      record.title,
      record.scope ? `scope: ${record.scope}` : null,
    ]
      .filter(Boolean)
      .join(" — ");
  return normalizeLegacyClientAliases(chunk.text)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function readFlattenedField(text: string, field: string): string | null {
  const match = text.match(
    new RegExp(`(?:^| )${field}: ([^:]+?)(?= [a-zA-Z_]+: |$)`),
  );
  return match?.[1]?.trim().replace(/^"|"$/g, "") ?? null;
}

function readJsonLikeField(text: string, field: string): string | null {
  const match = text.match(new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`));
  return match?.[1]?.trim() ?? null;
}

function findActivePersonNode(
  people: GraphNode[],
  opts: {
    activePersonGraphNodeId?: string | null;
    activePersonDisplayName?: string | null;
    userContextBlock?: string | null;
  },
): GraphNode | null {
  const graphNodeId = opts.activePersonGraphNodeId?.trim();
  if (graphNodeId) {
    const exact = people.find((person) => person.nodeId === graphNodeId);
    if (exact) return exact;
  }

  const displayName =
    opts.activePersonDisplayName?.trim() ||
    extractUserDisplayName(opts.userContextBlock);
  if (!displayName) return null;
  const normalizedDisplayName = normalizeName(displayName);
  return (
    people.find(
      (person) => normalizeName(person.title) === normalizedDisplayName,
    ) ??
    people.find((person) =>
      normalizeName(person.title).includes(normalizedDisplayName),
    ) ??
    null
  );
}

function extractUserDisplayName(
  userContextBlock: string | null | undefined,
): string | null {
  if (!userContextBlock) return null;
  const firstLine = userContextBlock
    .split("\n")
    .find((line) => line.startsWith("USER CONTEXT · "));
  const match = firstLine?.match(/^USER CONTEXT · ([^·]+?) · /);
  return match?.[1]?.trim() ?? null;
}

function formatPersonNode(person: GraphNode): string {
  const title =
    readStringPayload(person, "title") ??
    readStringPayload(person, "role") ??
    readStringPayload(person, "job_title");
  const functionName =
    readStringPayload(person, "function") ??
    readStringPayload(person, "domain") ??
    readStringPayload(person, "cxo_function");
  return [person.title, title, functionName].filter(Boolean).join(" — ");
}

function readStringPayload(node: GraphNode, key: string): string | null {
  const value = node.payload[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tenantRecordPrefix(tenantKey: string): string {
  const normalized = tenantKey.toLowerCase();
  if (normalized.includes("northstar")) return "NST";
  if (normalized.includes("apex")) return "APX";
  if (normalized.includes("meridian")) return "MR";
  if (normalized.includes("first") || normalized.includes("arcturus"))
    return "FCF";
  if (normalized.includes("skyharbor")) return "SHA";
  return (
    normalized
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 3)
      .toUpperCase() || "TEN"
  );
}

function deriveAppRef(
  prefix: string,
  name: string,
  fallbackId: string,
): string {
  const match = name.match(/\bCapability\s+(\d+)\b/i);
  if (match) return `${prefix}-APP-${match[1].padStart(3, "0")}`;
  return `${prefix}-APP-${fallbackId.slice(0, 8)}`;
}

function formatUsd(value: number | string | null | undefined): string | null {
  if (value == null) return null;
  const numeric = numericValue(value);
  if (numeric == null) return null;
  if (Math.abs(numeric) >= 1_000_000_000)
    return `$${(numeric / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(numeric) >= 1_000_000)
    return `$${(numeric / 1_000_000).toFixed(1)}M`;
  if (Math.abs(numeric) >= 1_000) return `$${(numeric / 1_000).toFixed(1)}K`;
  return `$${numeric.toLocaleString("en-US")}`;
}

function numericValue(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatPct(value: number | string | null | undefined): string | null {
  if (value == null) return null;
  const numeric = numericValue(value);
  if (numeric == null) return null;
  return `${numeric.toFixed(2)}%`;
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function rankChunks(
  chunks: ContextChunk[],
  query: string,
  segmentId: SegmentId,
): ContextChunk[] {
  return chunks
    .map((chunk, index) => ({
      chunk,
      score: scoreChunk(chunk, query, segmentId) - index * 0.001,
    }))
    .filter((item) => item.chunk.text.trim().length > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.chunk);
}

function scoreChunk(
  chunk: ContextChunk,
  query: string,
  segmentId: SegmentId,
): number {
  const normalizedQuery = query.toLowerCase();
  const haystack =
    `${chunk.sourceDoc ?? ""} ${chunk.recordId ?? ""} ${chunk.text}`.toLowerCase();
  const terms = tokenize(normalizedQuery);
  let score = 0;

  for (const term of terms) {
    if (haystack.includes(term)) score += term.length > 5 ? 3 : 2;
  }

  if (
    segmentId === "org_structure" &&
    /\b(leadership|leaders?|executive|executives|business|function\s+leads?|c[-\s]?level|team|cxo|cio|cdio|cmio|cmo|cno|coo|ceo|cfo|svp|vp|director|direct\s+reports?|reports?|owner|sponsor|who)\b/.test(
      normalizedQuery,
    )
  ) {
    score += 8;
  }
  if (
    segmentId === "it_financials" &&
    /\b(budget|spend|financial|capex|opex|capital|funding|approval|authority|fy\s*26|fy2026)\b/.test(
      normalizedQuery,
    )
  ) {
    score += 8;
  }
  if (
    segmentId === "enterprise_profile" &&
    /\b(profile|company|enterprise|tenant|what\s+do\s+you\s+know)\b/.test(
      normalizedQuery,
    )
  ) {
    score += 5;
  }
  if (
    segmentId === "it_landscape" &&
    /\b(data|analytics|technology|system|platform|cloud|vendor)\b/.test(
      normalizedQuery,
    )
  ) {
    score += 6;
  }
  if (
    segmentId === "data_estate" &&
    /\b(data|analytics|warehouse|lakehouse|bi|reporting|dashboard|etl|elt|snowflake|databricks|tableau|power\s*bi|cube|mart)\b/.test(
      normalizedQuery,
    )
  ) {
    score += 8;
  }
  if (
    segmentId === "infrastructure" &&
    /\b(infrastructure|infra|data\s*center|datacenter|virtualization|vmware|storage|network|server|compute|hosting|cloud\s+account|colo)\b/.test(
      normalizedQuery,
    )
  ) {
    score += 8;
  }

  if (/\b(cio|cdio|cto|cmio|cfo)\b/.test(haystack)) score += 2;
  if (/\b(fy2026|fy26|budget|capex|opex)\b/.test(haystack)) score += 2;

  return score;
}

function formatChunk(chunk: ContextChunk): string {
  const doc = chunk.sourceDoc ? `${chunk.sourceDoc}: ` : "";
  const text = normalizeLegacyClientAliases(chunk.text)
    .replace(/\s+/g, " ")
    .trim();
  const clipped =
    text.length > 460
      ? `${text.slice(0, 457).replace(/\s+\S*$/, "")}...`
      : text;
  return `${doc}${clipped}`;
}

function normalizeLegacyClientAliases(text: string): string {
  return text
    .replace(/\bAsterline Retail Group\b/g, "Apex Retail Group")
    .replace(/\bAsterline Retail\b/g, "Apex Retail")
    .replace(/\bHeliara Health Alliance\b/g, "Meridian Health")
    .replace(/\bHeliara Health\b/g, "Meridian Health")
    .replace(/\bHeliara\b/g, "Meridian")
    .replace(/\bBrindlemark Financial Group\b/g, "First Capital Financial")
    .replace(/\bBrindlemark Financial\b/g, "First Capital Financial")
    .replace(/\bBrindlemark\b/g, "First Capital");
}

function tokenize(value: string): string[] {
  return value
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}
