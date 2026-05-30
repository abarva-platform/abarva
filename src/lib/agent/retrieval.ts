import { Pinecone } from '@pinecone-database/pinecone';
import { azureRead } from '@/lib/data-plane/azureRead';
import { preflightOpenAIDirectClient } from '@/lib/integrations/ai-egress';
import {
  clientVectorMetadataFilter,
  clientVectorNamespace,
} from '@/lib/knowledge/client-vector-namespace';

type IndustryCode = 'HEALTHCARE_IDN' | 'FINSERV' | 'RETAIL' | 'GENERAL';

export interface RetrievedChunk {
  text: string;
  sourceKey: string;
  publisher?: string;
  attribution?: string;
  section?: string;
  pageNumber?: number;
  licenseClass?: string;
  score: number;
  decayedScore: number;
  publishedAt?: string;
  halfLifeDays?: number;
}

export interface RetrievalContext {
  industry: IndustryCode | null;
  clientId: string | null;
  userQuery: string;
  clientChunks: RetrievedChunk[];
  industryChunks: RetrievedChunk[];
  topicChunks: RetrievedChunk[];
}

export interface AssembleRetrievalArgs {
  engagementId?: string | null;
  clientId?: string | null;
  industry?: IndustryCode | null;
  currentPhase?: number | null;
  userQuery: string;
  turnHistory?: Array<{ role: string; content: string }>;
  topKClient?: number;
  topKIndustry?: number;
  topKTopic?: number;
}

const DAY_MS = 86_400_000;
const EMBED_MODEL = 'text-embedding-3-large';
const EMBED_DIMS = 3072;
const INDEX_NAME = process.env.PINECONE_INDEX ?? 'nexus-knowledge';

let _pinecone: Pinecone | null = null;

function getPinecone(): Pinecone | null {
  if (_pinecone) return _pinecone;
  const key = process.env.PINECONE_API_KEY;
  if (!key) return null;
  _pinecone = new Pinecone({ apiKey: key });
  return _pinecone;
}

function industryNamespace(industry: IndustryCode | null | undefined): string {
  if (industry === 'HEALTHCARE_IDN') return 'global:healthcare_idn';
  if (industry === 'FINSERV') return 'global:finserv';
  if (industry === 'RETAIL') return 'global:retail';
  return 'global:general_macro';
}

/**
 * Tenant-scoped topic namespace for AI-governance frameworks.
 *
 * Atlas Fix A (2026-05-30) — closes the second leg of the P0 retrieval
 * leak. Previously this pulled from the un-tenant-scoped global
 * `global:ai_governance` namespace, which could return Meridian (Abridge
 * / HIPAA / BAA) content into a retail tenant's response.
 *
 * The new namespace is keyed on industry so a retail tenant cannot
 * receive healthcare-specific governance chunks. When a tenant is not
 * resolved, we fall back to the generic-macro namespace (which carries
 * only industry-agnostic governance text) — never the unscoped global
 * pool.
 */
export function __testOnly_topicNamespace(
  industry: IndustryCode | null | undefined,
): string {
  return topicNamespace(industry);
}

function topicNamespace(industry: IndustryCode | null | undefined): string {
  if (industry === 'HEALTHCARE_IDN') return 'industry:healthcare_idn:ai_governance';
  if (industry === 'FINSERV') return 'industry:finserv:ai_governance';
  if (industry === 'RETAIL') return 'industry:retail:ai_governance';
  return 'industry:general_macro:ai_governance';
}

/**
 * Legacy-alias scrubber.
 *
 * Atlas Fix A (2026-05-30) — same pattern used by
 *   - src/lib/azure-search/tenant-context-retriever.ts
 *   - src/lib/knowledge/tenant-enterprise-context.ts (×2)
 *
 * Any chunk pulled into the Atlas prompt must be normalized BEFORE it
 * enters retrieval output. Otherwise retired legacy alias names leak
 * straight into the model context.
 */
export function __testOnly_normalizeLegacyClientAliases(text: string): string {
  return normalizeLegacyClientAliases(text);
}

function normalizeLegacyClientAliases(text: string): string {
  return text
    .replace(/\bAsterline Retail Group\b/g, 'Apex Retail Group')
    .replace(/\bAsterline Retail\b/g, 'Apex Retail')
    .replace(/\bAsterline\b/g, 'Apex Retail')
    .replace(/\bHeliara Health Alliance\b/g, 'Meridian Health')
    .replace(/\bHeliara Health\b/g, 'Meridian Health')
    .replace(/\bHeliara\b/g, 'Meridian')
    .replace(/\bBrindlemark Financial Group\b/g, 'First Capital Financial')
    .replace(/\bBrindlemark Financial\b/g, 'First Capital Financial')
    .replace(/\bBrindlemark\b/g, 'First Capital');
}

function scrubChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  for (const c of chunks) {
    c.text = normalizeLegacyClientAliases(c.text);
    if (c.section) c.section = normalizeLegacyClientAliases(c.section);
    if (c.attribution) c.attribution = normalizeLegacyClientAliases(c.attribution);
    if (c.publisher) c.publisher = normalizeLegacyClientAliases(c.publisher);
  }
  return chunks;
}

function applyFreshnessDecay(score: number, publishedAt?: string, halfLifeDays?: number): number {
  if (!publishedAt) return score;
  const ts = Date.parse(publishedAt);
  if (!Number.isFinite(ts)) return score;
  const ageDays = Math.max(0, (Date.now() - ts) / DAY_MS);
  const hl = halfLifeDays ?? 365;
  return score * Math.exp(-Math.LN2 * (ageDays / hl));
}

function composeEmbeddingQuery(userQuery: string, history?: Array<{ role: string; content: string }>): string {
  const recent = (history ?? []).slice(-4).map((m) => m.content).join('\n');
  return recent ? `${recent}\n${userQuery}`.slice(-4000) : userQuery.slice(-4000);
}

async function embed(text: string, clientId?: string | null): Promise<number[] | null> {
  if (!clientId || !process.env.OPENAI_API_KEY) return null;
  const preflight = await preflightOpenAIDirectClient({
    tenantId: clientId,
    workflow: 'agent-retrieval-embedding',
    model: EMBED_MODEL,
    prompt: text,
    dataClass: 'confidential',
    metadata: { dimensions: EMBED_DIMS },
  });
  if (!preflight.ok) return null;
  const res = await preflight.client.embeddings.create({
    model: EMBED_MODEL,
    input: text,
    dimensions: EMBED_DIMS,
  });
  return res.data[0]?.embedding ?? null;
}

async function queryNamespace(
  vector: number[],
  namespace: string,
  topK: number,
  filter?: Record<string, unknown>,
): Promise<RetrievedChunk[]> {
  const pc = getPinecone();
  if (!pc) return [];
  const index = pc.index(INDEX_NAME).namespace(namespace);
  const res = await index.query({ vector, topK, includeMetadata: true, filter });
  const out: RetrievedChunk[] = [];
  for (const m of res.matches ?? []) {
    const md = (m.metadata ?? {}) as Record<string, unknown>;
    const score = m.score ?? 0;
    const publishedAt = typeof md.published_at === 'string' ? md.published_at : undefined;
    const halfLifeDays = typeof md.half_life_days === 'number' ? md.half_life_days : undefined;
    out.push({
      text: String(md.text ?? md.chunk_text ?? ''),
      sourceKey: String(md.source_key ?? ''),
      publisher: typeof md.publisher === 'string' ? md.publisher : undefined,
      attribution: typeof md.attribution === 'string' ? md.attribution : undefined,
      section: typeof md.section === 'string' && md.section.length > 0 ? md.section : undefined,
      pageNumber: typeof md.page_number === 'number' && md.page_number > 0 ? md.page_number : undefined,
      licenseClass: typeof md.license_class === 'string' ? md.license_class : undefined,
      score,
      decayedScore: applyFreshnessDecay(score, publishedAt, halfLifeDays),
      publishedAt,
      halfLifeDays,
    });
  }
  return out;
}

function queryTerms(text: string): string[] {
  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((term) => term.length >= 4)
      .slice(0, 18),
  )];
}

function lexicalScore(text: string, terms: ReadonlyArray<string>): number {
  const lower = text.toLowerCase();
  const matches = terms.filter((term) => lower.includes(term)).length;
  return matches / Math.max(terms.length, 1);
}

async function resolveTenantKey(clientId: string | null): Promise<string | null> {
  if (!clientId) return null;
  const row = await azureRead.maybeSingle<{ tenant_key: string | null; slug: string | null }>({
    table: 'clients',
    columns: ['tenant_key', 'slug'],
    where: { id: clientId },
  }).catch(() => null);
  return row?.tenant_key ?? row?.slug ?? null;
}

async function queryPostgresContextChunks(args: {
  clientId: string | null;
  userQuery: string;
  topKClient: number;
  topKIndustry: number;
  topKTopic: number;
}): Promise<Pick<RetrievalContext, 'clientChunks' | 'industryChunks' | 'topicChunks'>> {
  const tenantKey = await resolveTenantKey(args.clientId);
  if (!tenantKey) return { clientChunks: [], industryChunks: [], topicChunks: [] };

  // Segments the agent can pull tenant context from. Includes:
  //  - industry_context, program_inventory, evidence_ledger, operating_telemetry,
  //    vendor_contracts, compliance, cross_program_signals (long-standing).
  //  - org_structure, it_landscape, it_financials, kpi_dictionary (added
  //    2026-05-10 founder directive: "ensure the agents are intelligent to
  //    tap into the current state and datasets"). Without these, function
  //    capacity, FY2026 capital plan, funding authority matrix, system
  //    inventory, and IT spend breakdown are loaded into Supabase but the
  //    agent never sees them at retrieval time.
  const segmentIds = [
      'enterprise_profile',
      'org_structure',
      'it_landscape',
      'it_financials',
      'kpi_dictionary',
      'industry_context',
      'program_inventory',
      'evidence_ledger',
      'operating_telemetry',
      'vendor_contracts',
      'compliance',
      'cross_program_signals',
    ];
  const data = await azureRead.select<Record<string, unknown>>({
    table: 'enterprise_context_chunks',
    columns: [
      'chunk_text',
      'source_doc',
      'source_segment_id',
      'chunk_index',
      'chunk_metadata',
      'provenance',
      'embedded_at',
    ],
    where: {
      tenant_key: tenantKey,
      source_segment_id: { op: 'in', value: segmentIds },
    },
    limit: 160,
  }).catch(() => []);

  const terms = queryTerms(args.userQuery);
  const rows = data
    .map((row) => {
      const text = String(row.chunk_text ?? '');
      const segment = String(row.source_segment_id ?? '');
      const score = lexicalScore(text, terms) + (segment === 'industry_context' ? 0.08 : 0);
      const metadata = (row.chunk_metadata ?? {}) as Record<string, unknown>;
      const provenance = (row.provenance ?? {}) as Record<string, unknown>;
      return {
        text,
        sourceKey: String(row.source_doc ?? metadata.source_key ?? `${tenantKey}:${segment}`),
        publisher: typeof provenance.publisher === 'string' ? provenance.publisher : undefined,
        attribution: typeof provenance.attribution === 'string' ? provenance.attribution : undefined,
        section: segment || undefined,
        pageNumber: typeof row.chunk_index === 'number' ? row.chunk_index + 1 : undefined,
        licenseClass: typeof metadata.license_class === 'string' ? metadata.license_class : undefined,
        score,
        decayedScore: applyFreshnessDecay(score, typeof row.embedded_at === 'string' ? row.embedded_at : undefined, 365),
        publishedAt: typeof row.embedded_at === 'string' ? row.embedded_at : undefined,
        segment,
      };
    })
    .filter((row) => row.text.length > 0)
    .sort((a, b) => b.decayedScore - a.decayedScore);

  const withoutSegment = (row: (typeof rows)[number]) => ({
    text: row.text,
    sourceKey: row.sourceKey,
    publisher: row.publisher,
    attribution: row.attribution,
    section: row.section,
    pageNumber: row.pageNumber,
    licenseClass: row.licenseClass,
    score: row.score,
    decayedScore: row.decayedScore,
    publishedAt: row.publishedAt,
  });
  const industryChunks = rows
    .filter((row) => row.segment === 'industry_context')
    .slice(0, args.topKIndustry)
    .map(withoutSegment);
  const topicChunks = rows
    .filter((row) => row.segment === 'compliance' || row.segment === 'cross_program_signals')
    .slice(0, args.topKTopic)
    .map(withoutSegment);
  const clientChunks = rows
    .filter((row) => row.segment !== 'industry_context' && row.segment !== 'compliance' && row.segment !== 'cross_program_signals')
    .slice(0, args.topKClient)
    .map(withoutSegment);

  return { clientChunks, industryChunks, topicChunks };
}

export async function assembleRetrievalContext(args: AssembleRetrievalArgs): Promise<RetrievalContext> {
  const industry = args.industry ?? null;
  const clientId = args.clientId ?? null;

  const emptyCtx: RetrievalContext = {
    industry,
    clientId,
    userQuery: args.userQuery,
    clientChunks: [],
    industryChunks: [],
    topicChunks: [],
  };

  const vector = await embed(composeEmbeddingQuery(args.userQuery, args.turnHistory), clientId);
  if (!vector) {
    const fallback = await queryPostgresContextChunks({
      clientId,
      userQuery: args.userQuery,
      topKClient: args.topKClient ?? 5,
      topKIndustry: args.topKIndustry ?? 3,
      topKTopic: args.topKTopic ?? 2,
    });
    return {
      ...emptyCtx,
      clientChunks: scrubChunks(fallback.clientChunks),
      industryChunks: scrubChunks(fallback.industryChunks),
      topicChunks: scrubChunks(fallback.topicChunks),
    };
  }

  const clientPromise = clientId
    ? queryNamespace(
        vector,
        clientVectorNamespace(clientId),
        args.topKClient ?? 5,
        clientVectorMetadataFilter(clientId),
      )
    : Promise.resolve<RetrievedChunk[]>([]);
  const industryPromise = queryNamespace(vector, industryNamespace(industry), args.topKIndustry ?? 3);
  // Atlas Fix A — was 'global:ai_governance' (unscoped). Now keyed on
  // the tenant's industry so retail tenants cannot receive healthcare
  // (Abridge / HIPAA / BAA) governance chunks, etc.
  const topicPromise = queryNamespace(vector, topicNamespace(industry), args.topKTopic ?? 2);

  const [clientChunks, industryChunks, topicChunks] = await Promise.all([
    clientPromise,
    industryPromise,
    topicPromise,
  ]);

  const hasVectorResults =
    clientChunks.length > 0 || industryChunks.length > 0 || topicChunks.length > 0;
  if (!hasVectorResults) {
    const fallback = await queryPostgresContextChunks({
      clientId,
      userQuery: args.userQuery,
      topKClient: args.topKClient ?? 5,
      topKIndustry: args.topKIndustry ?? 3,
      topKTopic: args.topKTopic ?? 2,
    });
    return {
      ...emptyCtx,
      clientChunks: scrubChunks(fallback.clientChunks),
      industryChunks: scrubChunks(fallback.industryChunks),
      topicChunks: scrubChunks(fallback.topicChunks),
    };
  }

  industryChunks.sort((a, b) => b.decayedScore - a.decayedScore);
  topicChunks.sort((a, b) => b.decayedScore - a.decayedScore);

  return {
    industry,
    clientId,
    userQuery: args.userQuery,
    clientChunks: scrubChunks(clientChunks),
    industryChunks: scrubChunks(industryChunks),
    topicChunks: scrubChunks(topicChunks),
  };
}
