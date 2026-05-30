import 'server-only';

import { searchCorpus } from '@/lib/corpus/retrieval';
import type { WorldviewChunkHit } from './types';

const DEFAULT_TOP_K = 6;
const MAX_TOP_K = 50;
const EMBEDDING_DIM = 3072;

export interface WorldviewQueryArgs {
  queryVector: number[];
  topK?: number;
  audienceFilter?: string;
  thesisFilter?: string;
  minConfidence?: number;
  queryText?: string;
}

export interface WorldviewRetrievalResult {
  hits: WorldviewChunkHit[];
  reached: boolean;
}

export async function queryWorldviewChunks(
  args: WorldviewQueryArgs,
): Promise<WorldviewRetrievalResult> {
  if (args.queryVector.length !== EMBEDDING_DIM) {
    throw new Error(
      `queryWorldviewChunks: expected ${EMBEDDING_DIM}-dim vector, got ${args.queryVector.length}`,
    );
  }

  const query = args.queryText?.trim() || args.thesisFilter || args.audienceFilter || 'AbarVa worldview';
  const topK = clamp(args.topK ?? DEFAULT_TOP_K, 1, MAX_TOP_K);
  const hits = await searchCorpus(query, {
    clientId: 'system',
    verticalOverlays: ['cross_industry', 'universal', 'general'],
    minConfidence: args.minConfidence ?? 0.5,
    minDepthScore: 4,
    limit: topK,
  }).catch(() => []);

  return {
    reached: hits.length > 0,
    hits: hits.map((hit, index) => ({
      chunkId: hit.slug,
      thesisId: typeof hit.synthesis.thesis_id === 'string' ? hit.synthesis.thesis_id : 'corpus',
      thesisTitle: hit.title,
      chunkPosition: index + 1,
      chunkTitle: hit.category,
      chunkType: 'corpus_pattern',
      primaryAudience: args.audienceFilter,
      audienceTags: args.audienceFilter ? [args.audienceFilter] : undefined,
      confidence: hit.confidence,
      isForecast: false,
      score: hit.score,
    })),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export type WorldviewRetriever = (
  args: WorldviewQueryArgs,
) => Promise<WorldviewRetrievalResult>;

let injectedRetriever: WorldviewRetriever | null = null;

export function setWorldviewRetrieverForTests(
  retriever: WorldviewRetriever | null,
): void {
  injectedRetriever = retriever;
}

export async function callWorldviewRetriever(
  args: WorldviewQueryArgs,
): Promise<WorldviewRetrievalResult> {
  if (injectedRetriever) return injectedRetriever(args);
  return queryWorldviewChunks(args);
}
