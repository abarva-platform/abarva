import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

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
): Promise<RetrievedChunk[]> {
  const pc = getPinecone();
  if (!pc) return [];
  const index = pc.index(INDEX_NAME).namespace(namespace);
  const res = await index.query({ vector, topK, includeMetadata: true });
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
  if (!vector) return emptyCtx;

  const clientPromise = clientId
    ? queryNamespace(vector, `client:${clientId}`, args.topKClient ?? 5)
    : Promise.resolve<RetrievedChunk[]>([]);
  const industryPromise = queryNamespace(vector, industryNamespace(industry), args.topKIndustry ?? 3);
  const topicPromise = queryNamespace(vector, 'global:ai_governance', args.topKTopic ?? 2);

  const [clientChunks, industryChunks, topicChunks] = await Promise.all([
    clientPromise,
    industryPromise,
    topicPromise,
  ]);

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
