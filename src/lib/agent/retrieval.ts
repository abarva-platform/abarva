import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { getServerSupabase } from '@/lib/supabase-server';
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

let _openai: OpenAI | null = null;
let _pinecone: Pinecone | null = null;

function getOpenAI(): OpenAI | null {
  if (_openai) return _openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  _openai = new OpenAI({ apiKey: key });
  return _openai;
}

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

async function embed(text: string): Promise<number[] | null> {
  const openai = getOpenAI();
  if (!openai) return null;
  const res = await openai.embeddings.create({
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
  const { data } = await getServerSupabase()
    .from('clients')
    .select('tenant_key, slug')
    .eq('id', clientId)
    .maybeSingle();
  const row = data as { tenant_key?: string | null; slug?: string | null } | null;
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

  const { data } = await getServerSupabase()
    .from('enterprise_context_chunks')
    .select('chunk_text, source_doc, source_segment_id, chunk_index, chunk_metadata, provenance, embedded_at')
    .eq('tenant_key', tenantKey)
    .in('source_segment_id', [
      'industry_context',
      'program_inventory',
      'evidence_ledger',
      'operating_telemetry',
      'vendor_contracts',
      'compliance',
      'cross_program_signals',
    ])
    .limit(80);

  const terms = queryTerms(args.userQuery);
  const rows = ((data as Array<Record<string, unknown>> | null) ?? [])
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

  const vector = await embed(composeEmbeddingQuery(args.userQuery, args.turnHistory));
  if (!vector) {
    const fallback = await queryPostgresContextChunks({
      clientId,
      userQuery: args.userQuery,
      topKClient: args.topKClient ?? 5,
      topKIndustry: args.topKIndustry ?? 3,
      topKTopic: args.topKTopic ?? 2,
    });
    return { ...emptyCtx, ...fallback };
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
  const topicPromise = queryNamespace(vector, 'global:ai_governance', args.topKTopic ?? 2);

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
    return { ...emptyCtx, ...fallback };
  }

  industryChunks.sort((a, b) => b.decayedScore - a.decayedScore);
  topicChunks.sort((a, b) => b.decayedScore - a.decayedScore);

  return {
    industry,
    clientId,
    userQuery: args.userQuery,
    clientChunks,
    industryChunks,
    topicChunks,
  };
}
