// Vector retrieval via Pinecone. Per spec §7.3 metadata filters enforce
// tenancy on every query. Spec calls for Voyage-3 embeddings; repo
// currently uses OpenAI text-embedding-3-large at 1024 dims (matches
// nexus-knowledge Pinecone index). Voyage-3 migration remains a follow-up.

import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import type { RetrievalResult, Source, TenancyCtx } from '../types';
import {
  clientVectorMetadataFilter,
  isClientVectorNamespace,
} from '@/lib/knowledge/client-vector-namespace';

const EMBED_MODEL = 'text-embedding-3-large';
const EMBED_DIMS = 1024;
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

async function embed(query: string): Promise<number[] | null> {
  const oai = getOpenAI();
  if (!oai) return null;
  try {
    const res = await oai.embeddings.create({
      model: EMBED_MODEL,
      input: query,
      dimensions: EMBED_DIMS,
    });
    return res.data[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

export interface VectorSearchArgs {
  query: string;
  tenancy: TenancyCtx;
  namespaces?: string[];
  topK?: number;
}

/**
 * Per spec §7.3 Pinecone namespaces:
 *   public-*       — shared (patterns, benchmarks, vendors, regs)
 *   client-{id}-*  — tenant-isolated
 * Current repo uses `global:<industry>` naming. We pass clientId as a
 * metadata filter so cross-tenant hits are architecturally impossible.
 */
export async function vectorSearch(args: VectorSearchArgs): Promise<RetrievalResult> {
  const started = Date.now();
  const pc = getPinecone();
  if (!pc) {
    return { dimension: 'vector', claims: [], latencyMs: Date.now() - started, partial: true, error: 'Pinecone not configured' };
  }

  const vector = await embed(args.query);
  if (!vector) {
    return { dimension: 'vector', claims: [], latencyMs: Date.now() - started, partial: true, error: 'Embedding failed' };
  }

  const index = pc.index(INDEX_NAME);
  const topK = args.topK ?? 8;
  const namespaces = args.namespaces ?? ['global:general_macro'];

  const claims: RetrievalResult['claims'] = [];
  let partial = false;

  await Promise.all(
    namespaces.map(async (ns) => {
      try {
        const result = await index.namespace(ns).query({
          vector,
          topK,
          includeMetadata: true,
          filter: isClientVectorNamespace(ns)
            ? clientVectorMetadataFilter(args.tenancy.clientId)
            : undefined,
        });
        for (const match of result.matches ?? []) {
          const meta = (match.metadata ?? {}) as Record<string, unknown>;
          const text = typeof meta.text === 'string' ? meta.text : '';
          const sourceKey = typeof meta.source_key === 'string' ? meta.source_key : match.id;
          const publisher = typeof meta.publisher === 'string' ? meta.publisher : undefined;
          const confidence = (match.score ?? 0) > 0.75 ? 'high' : (match.score ?? 0) > 0.55 ? 'medium' : 'low';
          const source: Source = {
            id: sourceKey,
            type: (meta.content_type as Source['type']) ?? 'research',
            name: publisher ?? sourceKey,
            detail: text.slice(0, 240),
            confidence,
          };
          claims.push({ text: text.slice(0, 480), source, confidence });
        }
      } catch (err) {
        partial = true;
        console.warn(`[vectorRetriever] namespace ${ns} failed:`, (err as Error).message);
      }
    }),
  );

  return { dimension: 'vector', claims, latencyMs: Date.now() - started, partial };
}
