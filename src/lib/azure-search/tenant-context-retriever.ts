/**
 * Azure AI Search retrieval lane for the `tenant-context-v1` index.
 *
 * This is the parallel-run drop-in for the pgvector / Pinecone path the
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

import { DefaultAzureCredential } from '@azure/identity';

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
  embeddingStatus: 'pending' | 'embedding' | 'embedded' | 'error';
  sourceBasis?: string;
  classification?: 'public' | 'internal' | 'confidential' | 'restricted';
  vectorScore?: number;
}

/**
 * App-tier `ClientKey` form → canonical Azure-side tenant-key form.
 *
 * This is the same map the backfill uses (`tenant-context-backfill.ts`),
 * duplicated here on purpose: the retriever is on the read path and
 * shouldn't take a runtime dep on the backfill module (which pulls in
 * Postgres types). If a fourth tenant arrives, both maps update in
 * lockstep — and the parity test pins the canonical outputs so a drift
 * shows up as a red test, not a silent miss.
 *
 * Memory ref: `project_apex_tenant_key_split` — app ClientKey is
 * `apexretail` (no dash); broker/data-room is `apex-retail` (with dash).
 */
const TENANT_KEY_ALIASES: Readonly<Record<string, string>> = {
  apexretail: 'apex-retail',
  arcturus: 'first-capital',
  meridian: 'meridian-health',
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
export const TENANT_CONTEXT_INDEX_NAME = 'tenant-context-v1';

const DEFAULT_TOP_K = 8;
const MAX_TOP_K = 50;

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
}

/** Raw row shape we expect back from the search index. */
interface TenantContextSearchHit {
  '@search.score'?: number;
  id?: string;
  tenant_key?: string;
  source_segment?: string;
  record_id?: string;
  chunk_id?: string;
  title?: string;
  body?: string;
  source_uri?: string;
  confidence?: number;
  sensitivity?: string;
  last_seen_at?: string;
}

function endpointBase(): string {
  const explicit = process.env.AZURE_SEARCH_ENDPOINT?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const serviceName = process.env.AZURE_SEARCH_SERVICE_NAME?.trim()
    ?? 'srch-abarva-context-lab-eastus';
  return `https://${serviceName}.search.windows.net`;
}

function apiVersion(): string {
  return process.env.AZURE_SEARCH_API_VERSION?.trim() || '2024-07-01';
}

async function authHeaders(): Promise<Record<string, string>> {
  const apiKey = process.env.AZURE_SEARCH_ADMIN_KEY?.trim();
  if (apiKey) return { 'api-key': apiKey };

  const credential = new DefaultAzureCredential(
    process.env.AZURE_CLIENT_ID?.trim()
      ? { managedIdentityClientId: process.env.AZURE_CLIENT_ID.trim() }
      : undefined,
  );
  const token = await credential.getToken('https://search.azure.com/.default');
  if (!token?.token) {
    throw new Error('azure_search_aad_token_unavailable');
  }
  return { Authorization: `Bearer ${token.token}` };
}

function escapeOdataLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

function buildFilter(canonicalTenantKey: string, filters?: TenantContextFilters): string {
  // tenant_key is always pinned — broker boundary invariant.
  const parts: string[] = [`tenant_key eq '${escapeOdataLiteral(canonicalTenantKey)}'`];

  if (filters?.minConfidence !== undefined && Number.isFinite(filters.minConfidence)) {
    parts.push(`confidence ge ${filters.minConfidence}`);
  }
  if (filters?.sensitivity && filters.sensitivity.length > 0) {
    const list = filters.sensitivity
      .map((s) => `'${escapeOdataLiteral(s)}'`)
      .join(',');
    parts.push(`sensitivity in (${list})`);
  }
  if (filters?.extra) {
    for (const expr of filters.extra) {
      const trimmed = expr.trim();
      if (trimmed) parts.push(`(${trimmed})`);
    }
  }
  return parts.join(' and ');
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
  if (!chunkId || typeof body !== 'string') return null;

  return {
    tenantKey: canonicalTenantKey,
    chunkId,
    sourceSegmentId: hit.source_segment,
    sourceDoc: hit.title,
    recordId: hit.record_id,
    text: body,
    // Azure-side rows are always 'embedded' by construction (the backfill
    // only writes embedded chunks). Keep the field present so downstream
    // type-checks behave identically to pgvector.
    embeddingStatus: 'embedded',
    sourceBasis: hit.source_uri,
    // `sensitivity` field in the index is the chunk's classification.
    classification: normalizeClassification(hit.sensitivity),
    vectorScore: typeof hit['@search.score'] === 'number' ? hit['@search.score'] : undefined,
  };
}

function normalizeClassification(
  value: string | undefined,
): TenantContextChunk['classification'] {
  switch (value) {
    case 'public':
    case 'internal':
    case 'confidential':
    case 'restricted':
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
    throw new Error('queryTenantContext: tenantClientKey is required.');
  }

  const topK = clampTopK(input.topK);
  const filter = buildFilter(canonical, input.filters);
  const body = {
    search: input.query?.trim() || '*',
    queryType: 'simple',
    top: topK,
    filter,
    count: false,
  };

  const url = `${endpointBase()}/indexes/${encodeURIComponent(
    TENANT_CONTEXT_INDEX_NAME,
  )}/docs/search?api-version=${encodeURIComponent(apiVersion())}`;

  const headers = {
    'content-type': 'application/json',
    ...(await authHeaders()),
  };

  const doFetch = input.fetchImpl ?? fetch;
  const res = await doFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`azure_search_query_failed:${res.status}:${text}`);
  }
  const payload = (await res.json()) as { value?: TenantContextSearchHit[] };
  const hits = payload.value ?? [];

  const chunks: TenantContextChunk[] = [];
  for (const hit of hits) {
    const chunk = mapHitToTenantContextChunk(hit, canonical);
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}
