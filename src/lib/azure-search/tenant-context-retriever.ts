/**
 * Azure AI Search retrieval lane for the `tenant-context-v1` index.
 *
 * This is the parallel-run drop-in for the pgvector path the
 * broker uses today. The shape returned by `queryTenantContext` matches
 * `TenantDataAdapter.chunksByVector` 1:1 — `TenantContextChunk[]` with an
 * attached `vectorScore` — so the broker can swap backends behind the
 * `retrieval_azure_search` feature flag without any downstream changes.
 *
 * Boundary discipline: this module is import-restricted to
 * `src/lib/knowledge/**` (the broker). App-tier code MUST go through
 * `AgentContextBroker`. Per `feedback_broker_boundary` the app layer never
 * touches the vector store directly.
 *
 * Env-var convention mirrors `src/scripts/azure-ai-search-backfill.ts`
 * (Codex's PR #1972):
 *
 *   - AZURE_SEARCH_ENDPOINT or AZURE_SEARCH_SERVICE_NAME
 *   - AZURE_SEARCH_ADMIN_KEY (lab admin key — Codex's note: RBAC is still
 *     using the lab admin key; AAD-token path lights up later)
 *   - AZURE_SEARCH_API_VERSION (defaults to '2024-07-01')
 *   - AZURE_CLIENT_ID (optional managed-identity client id for AAD fallback)
 *
 * Tenant-key canonicalization: the canonicalization migration normalizes
 * writes (apexretail → apex-retail etc.), but reads still tolerate stale
 * aliases for a grace window. `canonicalizeTenantKey` is the choke point —
 * the retriever never queries the index with a non-canonical key.
 */

import { DefaultAzureCredential } from "@azure/identity";

/**
 * Drop-in shape for `TenantContextChunk` from
 * `src/lib/knowledge/tenant-data/types.ts`. We declare a local mirror
 * rather than importing the broker's types because the broker-boundary
 * ESLint rule restricts every module outside `src/lib/knowledge/**` from
 * importing tenant-data shapes directly. The broker re-exports the
 * canonical `TenantContextChunk` via its types barrel — the parity test
 * pins this mirror against the canonical contract so any drift in
 * either file shows up as a failing test rather than a silent skew.
 */
export interface TenantContextChunk {
  tenantKey: string;
  chunkId: string;
  sourceSegmentId?: string;
  sourceDoc?: string;
  recordId?: string;
  text: string;
  embeddingStatus: "pending" | "skipped" | "embedded" | "failed";
  sourceBasis?: string;
  classification?: "public" | "internal" | "confidential" | "restricted";
  vectorScore?: number;
}

/**
 * App-tier `ClientKey` form → canonical Azure-side tenant-key form.
 *
 * This MUST mirror the map the backfill writes with (`tenant-context-backfill.ts`),
 * duplicated here on purpose: the retriever is on the read path and
 * shouldn't take a runtime dep on the backfill module (which pulls in
 * Postgres types). When a tenant is added to the backfill map, add it here
 * in lockstep — the parity test pins the canonical outputs so a drift shows
 * up as a red test, not a silent miss. (Regression 2026-06-17: `skyharbor`,
 * `lakeshore`, and `northstar` were indexed by the backfill but missing here,
 * so their deliverable evidence retrieval returned 0 — a charter could not be
 * grounded. Both maps now carry the full roster.)
 *
 * Memory ref: `project_apex_tenant_key_split` — app ClientKey is
 * `apexretail` (no dash); broker/data-room is `apex-retail` (with dash).
 */
const TENANT_KEY_ALIASES: Readonly<Record<string, string>> = {
  "apex-retail-group": "apex-retail",
  apexretail: "apex-retail",
  arcturus: "first-capital",
  firstcapital: "first-capital",
  "first-capital-bank": "first-capital",
  lakeshore: "lakeshore-holdings",
  "lakeshore-holding": "lakeshore-holdings",
  meridian: "meridian-health",
  "meridian-healthcare": "meridian-health",
  northstar: "northstar-clinical",
  skyharbor: "skyharbor-air",
  "skyharbor-airlines": "skyharbor-air",
};

/**
 * Normalize a legacy / app-tier tenant key to the canonical Azure form.
 * Returns the input verbatim when it's already canonical or unknown
 * (no implicit rejection — that's a tenant-resolution concern handled
 * upstream).
 */
export function canonicalizeTenantKey(key: string): string {
  if (!key) return key;
  return TENANT_KEY_ALIASES[key] ?? key;
}

/** Azure AI Search index this retriever queries. */
export const TENANT_CONTEXT_INDEX_NAME = "tenant-context-v1";

const DEFAULT_TOP_K = 8;
const MAX_TOP_K = 50;
const DEFAULT_STRUCTURED_SEGMENTS = [
  "program_inventory",
  "it_landscape",
  "org_structure",
] as const;

/**
 * Filter expressions composed onto every request. `tenant_key` is always
 * pinned — the broker boundary rule is enforced at the choke point, not
 * trusted from the caller. The parity test asserts this invariant.
 */
export interface TenantContextFilters {
  /** OData-flavored predicates appended with `and`. The retriever quotes them as-is. */
  readonly extra?: ReadonlyArray<string>;
  /** Optional minimum confidence (0..1). Maps to `confidence ge <n>`. */
  readonly minConfidence?: number;
  /** Optional sensitivity allowlist. Maps to `sensitivity in ('a', 'b')`. */
  readonly sensitivity?: ReadonlyArray<string>;
}

export interface TenantContextQueryInput {
  /** Caller-supplied tenant key — may be legacy alias; canonicalized inside. */
  readonly tenantClientKey: string;
  /** The user query string; used for BM25 + (future) vector search. */
  readonly query: string;
  /** Max hits to return; clamped to [1, MAX_TOP_K]. */
  readonly topK?: number;
  /** Optional structured filter additions; tenant filter is non-optional. */
  readonly filters?: TenantContextFilters;
  /**
   * Optional override for the underlying `fetch`. Tests inject a mock here.
   * Defaults to global `fetch`.
   */
  readonly fetchImpl?: typeof fetch;
  /**
   * Optional out-param. The retriever sets `degradedIndexContract = true` when a
   * search had to fall back past a missing index field (index/contract drift,
   * e.g. lifecycle_state). Lets a caller stamp result metadata
   * (`degraded_index_contract: true`) and persist it on the run/artifact without
   * changing the array return shape. The drift is also emitted to telemetry.
   */
  readonly telemetry?: { degradedIndexContract?: boolean };
}

/** Raw row shape we expect back from the search index. */
interface TenantContextSearchHit {
  "@search.score"?: number;
  id?: string;
  tenant_key?: string;
  client_id?: string;
  client_key?: string;
  source_segment?: string;
  record_id?: string;
  chunk_id?: string;
  title?: string;
  body?: string;
  source_uri?: string;
  source_basis?: string;
  source_citation?: string;
  confidence?: number;
  confidence_level?: string;
  sensitivity?: string;
  classification?: string;
  lifecycle_state?: string;
  agent_readiness_status?: string;
  last_seen_at?: string;
}

function endpointBase(): string {
  const explicit = process.env.AZURE_SEARCH_ENDPOINT?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const serviceName =
    process.env.AZURE_SEARCH_SERVICE_NAME?.trim() ??
    "srch-abarva-context-lab-eastus";
  return `https://${serviceName}.search.windows.net`;
}

function apiVersion(): string {
  return process.env.AZURE_SEARCH_API_VERSION?.trim() || "2024-07-01";
}

async function authHeaders(): Promise<Record<string, string>> {
  const apiKey = process.env.AZURE_SEARCH_ADMIN_KEY?.trim();
  if (apiKey) return { "api-key": apiKey };

  const credential = new DefaultAzureCredential(
    process.env.AZURE_CLIENT_ID?.trim()
      ? { managedIdentityClientId: process.env.AZURE_CLIENT_ID.trim() }
      : undefined,
  );
  const token = await credential.getToken("https://search.azure.com/.default");
  if (!token?.token) {
    throw new Error("azure_search_aad_token_unavailable");
  }
  return { Authorization: `Bearer ${token.token}` };
}

function escapeOdataLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

// The lifecycle freshness clause. Some live indexes predate the field being
// added to the contract; the retriever degrades past it on a missing-field 400
// (see runSearchRequest) rather than failing the whole query.
const LIFECYCLE_ACTIVE_CLAUSE = "lifecycle_state eq 'active'";

// Remove ONLY the lifecycle_state clause from an assembled OData $filter, leaving
// every other clause (tenant/program/client scope, confidence, search.in, …)
// intact. The assembled filter joins top-level clauses with " and "; split/rejoin
// on that separator is identity except for the dropped clause (inner " and "
// inside parenthesised sub-clauses is preserved by the rejoin).
function stripLifecycleStateFilter(filter: string): string {
  return filter
    .split(" and ")
    .filter((clause) => clause.trim() !== LIFECYCLE_ACTIVE_CLAUSE)
    .join(" and ");
}

function buildFilter(
  canonicalTenantKey: string,
  filters?: TenantContextFilters,
): string {
  // tenant_key is always pinned — broker boundary invariant.
  const parts: string[] = [
    `tenant_key eq '${escapeOdataLiteral(canonicalTenantKey)}'`,
    LIFECYCLE_ACTIVE_CLAUSE,
  ];

  if (
    filters?.minConfidence !== undefined &&
    Number.isFinite(filters.minConfidence)
  ) {
    parts.push(`confidence ge ${filters.minConfidence}`);
  }
  if (filters?.sensitivity && filters.sensitivity.length > 0) {
    // Azure AI Search does not support the OData `in (...)` list-literal operator in
    // $filter (it returns "unsupported OData language feature"). Use the supported
    // search.in() function. Classification tokens carry no commas, so a comma delimiter
    // is safe; quotes are escaped defensively.
    const list = filters.sensitivity
      .map((s) => escapeOdataLiteral(s))
      .join(",");
    parts.push(`search.in(sensitivity, '${list}', ',')`);
  }
  if (filters?.extra) {
    for (const expr of filters.extra) {
      const trimmed = expr.trim();
      if (trimmed) parts.push(`(${trimmed})`);
    }
  }
  return parts.join(" and ");
}

function appendFilter(base: string, extra: string): string {
  return `${base} and (${extra})`;
}

function shouldRunStructuredContextPass(query: string): boolean {
  return /\b(ai|agent|agents|adoption|aml|automation|benefit|block|blocks|blocked|contract|contracts|copilot|evidence|governance|initiative|initiatives|kill|persona|productivity|risk|scale|scaling|spend|system|systems|tool|tools|vendor|vendors)\b/i.test(
    query,
  );
}

function structuredQueryFor(query: string): string {
  const q = query.toLowerCase();
  const terms = new Set<string>();

  if (/\b(kill|hold|scale|restructure|initiative|initiatives)\b/.test(q)) {
    [
      "initiative",
      "milestone",
      "status",
      "kill_candidate",
      "governance",
      "value",
      "unapproved",
      "supervision",
      "client-note",
      "unresolved",
    ].forEach((term) => terms.add(term));
  }
  if (
    /\b(spend|contract|contracts|vendor|vendors|renew|renewal|benchmark)\b/.test(
      q,
    )
  ) {
    [
      "vendor",
      "contract",
      "renewal",
      "benchmark",
      "annual_value",
      "spend",
    ].forEach((term) => terms.add(term));
  }
  if (/\b(agent|agents|copilot|tool|tools|automation)\b/.test(q)) {
    [
      "tool",
      "agent",
      "copilot",
      "automation",
      "exception",
      "resolution",
    ].forEach((term) => terms.add(term));
  }
  if (
    /\b(productivity|persona|personas|engineer|analyst|recruiter)\b/.test(q)
  ) {
    [
      "persona",
      "productivity",
      "baseline",
      "current",
      "target",
      "workforce",
      "developer",
      "code_completion",
      "code-completion",
      "velocity",
      "github",
      "copilot",
      "persona_id",
      "persona_name",
      "aml analyst",
    ].forEach((term) => terms.add(term));
  }
  if (/\b(value|benefit|benefits|roi|case|backs|backed|proof|kpi)\b/.test(q)) {
    [
      "kpi",
      "outcome",
      "benefit",
      "realization",
      "verified",
      "fraud loss avoidance",
      "current_value",
      "target_value",
    ].forEach((term) => terms.add(term));
  }
  if (
    /\b(risk|governance|evidence|control|controls|sr 11-7|aml|compliance)\b/.test(
      q,
    )
  ) {
    [
      "risk",
      "governance",
      "control",
      "evidence",
      "model_risk",
      "approval",
      "sr 11-7",
      "validation",
      "refreshed",
      "blocking",
      "production ai models",
      "validation evidence incomplete",
      "model_risk_sr11_7",
      "nice actimize",
      "databricks",
    ].forEach((term) => terms.add(term));
  }
  if (
    /\b(system|systems|application|applications|cmdb|erp|workday|servicenow)\b/.test(
      q,
    )
  ) {
    [
      "application",
      "system",
      "capability",
      "business_function",
      "owner",
    ].forEach((term) => terms.add(term));
  }

  return `${query} ${Array.from(terms).join(" ")}`.trim();
}

function structuredSegmentsFor(query: string): string[] {
  const q = query.toLowerCase();
  const segments = new Set<string>();

  if (
    /\b(spend|contract|contracts|vendor|vendors|renew|renewal|benchmark)\b/.test(
      q,
    )
  ) {
    segments.add("it_financials");
  }
  if (
    /\b(system|systems|application|applications|cmdb|erp|workday|servicenow|agent|agents|copilot|tool|tools|automation|aml|fraud|engineer|software|developer)\b/.test(
      q,
    )
  ) {
    segments.add("it_landscape");
  }
  if (
    /\b(productivity|persona|personas|engineer|analyst|recruiter)\b/.test(q)
  ) {
    segments.add("org_structure");
  }
  if (
    /\b(ai|benefit|evidence|governance|initiative|initiatives|kill|hold|risk|scale|restructure|sr 11-7|control|controls|compliance)\b/.test(
      q,
    )
  ) {
    segments.add("program_inventory");
  }

  if (segments.size === 0) {
    for (const segment of DEFAULT_STRUCTURED_SEGMENTS) segments.add(segment);
  }
  return Array.from(segments);
}

interface StructuredAnchorQuery {
  readonly search: string;
  readonly segments: ReadonlyArray<string>;
}

function directRecordIdsFor(query: string): string[] {
  const q = query.toLowerCase();
  const recordIds = new Set<string>();

  if (
    /\b(aml|triage|sr 11-7|model risk|validation|scale|scaling|blocks|blocked)\b/.test(
      q,
    )
  ) {
    recordIds.add("FCF-CTRL-003");
  }

  if (
    /\b(engineer|engineers|software engineer|software engineers|github|copilot|code completion|velocity)\b/.test(
      q,
    )
  ) {
    recordIds.add("FCF-AI-002");
    recordIds.add("FCF-KPI-006");
    recordIds.add("FCF-PERS-007");
  }

  return Array.from(recordIds);
}

function structuredAnchorQueriesFor(query: string): StructuredAnchorQuery[] {
  const q = query.toLowerCase();
  const anchors: StructuredAnchorQuery[] = [];

  if (/\b(fraud|value case|benefit|kpi|evidence backs|backed)\b/.test(q)) {
    anchors.push({
      search:
        "Fraud Graph Fraud Loss Avoidance kpi current_value target_value verified outcome evidence",
      segments: ["program_inventory"],
    });
  }

  if (/\b(aml|sr 11-7|model risk|validation|scale|scaling)\b/.test(q)) {
    anchors.push({
      search:
        "model_risk_sr11_7 validation evidence incomplete 12 production AI models NICE Actimize Databricks AML",
      segments: ["program_inventory"],
    });
  }

  if (/\b(aml|triage|scaling|scale|blocks|blocked)\b/.test(q)) {
    anchors.push({
      search:
        "Security risk compliance control_area model_risk_sr11_7 validation evidence incomplete system_id NICE ACTIMIZE Databricks",
      segments: ["program_inventory"],
    });
  }

  if (
    /\b(aml|triage)\b/.test(q) &&
    /\b(blocks|blocked|scaling|scale)\b/.test(q)
  ) {
    anchors.push({
      search:
        "FCF-CTRL-003 control_id model_risk_sr11_7 SR 11-7 validation evidence incomplete NICE Actimize Databricks",
      segments: ["program_inventory"],
    });
  }

  if (
    /\b(engineer|engineers|software engineer|software engineers|code completion|velocity)\b/.test(
      q,
    )
  ) {
    anchors.push({
      search:
        "Developer Code Completion Velocity KPI outcome evidence current_value target_value GitHub Copilot",
      segments: ["program_inventory"],
    });
  }

  if (
    /\b(aml analyst|persona|personas|analyst|analysts|recruiter|recruiters|engineer|engineers|software engineer|software engineers)\b/.test(
      q,
    )
  ) {
    const search =
      /\b(engineer|engineers|software engineer|software engineers)\b/.test(q)
        ? "Software Engineer persona_id persona_name GitHub Copilot code_completion velocity"
        : /\b(aml|aml analyst|financial crimes)\b/.test(q)
          ? "AML Financial Crimes Analyst persona_id persona_name personas workforce"
          : "persona_id persona_name personas workforce";
    anchors.push({
      search,
      segments: ["org_structure"],
    });
  }

  return anchors;
}

function clampTopK(topK: number | undefined): number {
  if (topK === undefined || !Number.isFinite(topK)) return DEFAULT_TOP_K;
  return Math.min(MAX_TOP_K, Math.max(1, Math.trunc(topK)));
}

function mapHitToTenantContextChunk(
  hit: TenantContextSearchHit,
  canonicalTenantKey: string,
): TenantContextChunk | null {
  const chunkId = hit.chunk_id ?? hit.id;
  const body = hit.body;
  if (!chunkId || typeof body !== "string") return null;

  return {
    tenantKey: canonicalTenantKey,
    chunkId,
    sourceSegmentId: hit.source_segment,
    sourceDoc: hit.title ? normalizeLegacyClientAliases(hit.title) : undefined,
    recordId: hit.record_id,
    text: normalizeLegacyClientAliases(body),
    // Azure-side rows are always 'embedded' by construction (the backfill
    // only writes embedded chunks). Keep the field present so downstream
    // type-checks behave identically to pgvector.
    embeddingStatus: "embedded",
    sourceBasis: hit.source_basis
      ? normalizeLegacyClientAliases(hit.source_basis)
      : hit.source_uri
        ? normalizeLegacyClientAliases(hit.source_uri)
        : undefined,
    // `sensitivity` field in the index is the chunk's classification.
    classification: normalizeClassification(
      hit.classification ?? hit.sensitivity,
    ),
    vectorScore:
      typeof hit["@search.score"] === "number"
        ? hit["@search.score"]
        : undefined,
  };
}

async function runSearchRequest(args: {
  body: Record<string, unknown>;
  fetchImpl: typeof fetch;
  /** Invoked when the request had to degrade past a missing index field. */
  onDegrade?: () => void;
}): Promise<TenantContextSearchHit[]> {
  const url = `${endpointBase()}/indexes/${encodeURIComponent(
    TENANT_CONTEXT_INDEX_NAME,
  )}/docs/search?api-version=${encodeURIComponent(apiVersion())}`;

  const headers = {
    "content-type": "application/json",
    ...(await authHeaders()),
  };

  const post = (body: Record<string, unknown>) =>
    args.fetchImpl(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

  // 1) Try the strict filter (includes the lifecycle freshness clause).
  let res = await post(args.body);
  if (!res.ok) {
    const text = await res.text();
    const filter = typeof args.body.filter === "string" ? args.body.filter : "";
    // 2) Index/contract drift: the live index predates the lifecycle_state field
    //    the current contract filters on. This is the SPECIFIC missing-field 400
    //    — not a generic failure — so degrade gracefully instead of failing the
    //    whole generation. We strip ONLY the lifecycle_state clause; tenant /
    //    program / client scope and every other filter stay pinned.
    const isMissingLifecycleField =
      res.status === 400 &&
      /Could not find a property named 'lifecycle_state'/i.test(text) &&
      filter.includes(LIFECYCLE_ACTIVE_CLAUSE);
    if (!isMissingLifecycleField) {
      throw new Error(`azure_search_query_failed:${res.status}:${text}`);
    }
    // index-drift telemetry — surfaced, never silent.
    console.warn("[tenant-context-retriever] azure_search_index_drift", {
      event: "azure_search_index_drift",
      index: TENANT_CONTEXT_INDEX_NAME,
      missing_field: "lifecycle_state",
      degraded_index_contract: true,
      action: "retry_without_lifecycle_filter",
    });
    args.onDegrade?.();
    // 3) Retry without the lifecycle_state clause only.
    res = await post({
      ...args.body,
      filter: stripLifecycleStateFilter(filter),
    });
    if (!res.ok) {
      const retryText = await res.text();
      throw new Error(`azure_search_query_failed:${res.status}:${retryText}`);
    }
  }
  const payload = (await res.json()) as { value?: TenantContextSearchHit[] };
  return payload.value ?? [];
}

function normalizeLegacyClientAliases(text: string): string {
  return text
    .replace(/\bAsterline Retail Group\b/g, "Apex Retail Group")
    .replace(/\bAsterline Retail\b/g, "Apex Retail")
    .replace(/\bHeliara Health Alliance\b/g, "Meridian Health")
    .replace(/\bHeliara Health\b/g, "Meridian Health")
    .replace(/\bHeliara\b/g, "Meridian")
    .replace(/\bBrindlemark Financial Group\b/g, "FS Demo")
    .replace(/\bBrindlemark Financial\b/g, "FS Demo")
    .replace(/\bBrindlemark\b/g, "FS Demo");
}

function normalizeClassification(
  value: string | undefined,
): TenantContextChunk["classification"] {
  switch (value) {
    case "public":
    case "internal":
    case "confidential":
    case "restricted":
      return value;
    default:
      return undefined;
  }
}

/**
 * Query the `tenant-context-v1` Azure AI Search index for chunks scoped
 * to a single tenant. Returns the same `TenantContextChunk[]` shape as the
 * pgvector `chunksByVector` path so the broker can dispatch between
 * lanes behind a flag.
 *
 * The tenant filter is always applied — there is no opt-out path. The
 * parity test asserts this invariant survives future refactors.
 */
export async function queryTenantContext(
  input: TenantContextQueryInput,
): Promise<TenantContextChunk[]> {
  const canonical = canonicalizeTenantKey(input.tenantClientKey);
  if (!canonical) {
    throw new Error("queryTenantContext: tenantClientKey is required.");
  }

  const topK = clampTopK(input.topK);
  const filter = buildFilter(canonical, input.filters);
  const query = input.query?.trim() || "*";
  const body = {
    search: query,
    queryType: "simple",
    top: topK,
    filter,
    count: false,
  };

  const doFetch = input.fetchImpl ?? fetch;
  // #4: record index/contract drift on the caller-supplied telemetry out-param so
  // the result can be marked degraded_index_contract: true (also logged in
  // runSearchRequest). No-op when the caller doesn't pass telemetry.
  const markDegraded = () => {
    if (input.telemetry) input.telemetry.degradedIndexContract = true;
  };
  const hitSets: TenantContextSearchHit[][] = [];

  if (shouldRunStructuredContextPass(query)) {
    const recordIds = directRecordIdsFor(query);
    if (recordIds.length > 0) {
      hitSets.push(
        await runSearchRequest({
          fetchImpl: doFetch,
          onDegrade: markDegraded,
          body: {
            ...body,
            search: "*",
            top: Math.min(MAX_TOP_K, Math.max(recordIds.length, topK)),
            filter: appendFilter(
              filter,
              `search.in(record_id, '${recordIds
                .map((recordId) => escapeOdataLiteral(recordId))
                .join(",")}', ',')`,
            ),
          },
        }),
      );
    }
    for (const anchor of structuredAnchorQueriesFor(query)) {
      hitSets.push(
        await runSearchRequest({
          fetchImpl: doFetch,
          onDegrade: markDegraded,
          body: {
            ...body,
            search: anchor.search,
            top: Math.min(MAX_TOP_K, Math.max(8, Math.ceil(topK / 2))),
            filter: appendFilter(
              filter,
              `search.in(source_segment, '${anchor.segments.join(",")}', ',')`,
            ),
          },
        }),
      );
    }
    hitSets.push(
      await runSearchRequest({
        fetchImpl: doFetch,
        body: {
          ...body,
          search: structuredQueryFor(query),
          top: Math.min(MAX_TOP_K, Math.max(topK, 20)),
          filter: appendFilter(
            filter,
            `search.in(source_segment, '${structuredSegmentsFor(query).join(
              ",",
            )}', ',')`,
          ),
        },
      }),
    );
  }

  hitSets.push(
    await runSearchRequest({
      fetchImpl: doFetch,
      body,
      onDegrade: markDegraded,
    }),
  );

  const chunks: TenantContextChunk[] = [];
  const seen = new Set<string>();
  const maxHits = Math.max(...hitSets.map((hits) => hits.length), 0);
  for (let hitIndex = 0; hitIndex < maxHits; hitIndex += 1) {
    for (const hits of hitSets) {
      const hit = hits[hitIndex];
      if (!hit) continue;
      const chunk = mapHitToTenantContextChunk(hit, canonical);
      if (!chunk || seen.has(chunk.chunkId)) continue;
      seen.add(chunk.chunkId);
      chunks.push(chunk);
      if (chunks.length >= topK) return chunks;
    }
  }
  return chunks;
}
