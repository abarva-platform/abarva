import {
  getWorldviewPineconeClient,
} from '@/lib/knowledge/context-broker/pinecone-client';
import {
  embedTexts,
  EMBEDDING_MODEL_WORLDVIEW,
} from '@/lib/knowledge/context-broker/embedding-client';
import type { RetrievalResult, AskSource } from '../types';

/**
 * Retrieve worldview corpus chunks relevant to a query.
 * Uses text-embedding-3-large (3072-dim) to match the worldview index.
 * chunk_text lives in Pinecone metadata but is not in the typed interface —
 * we cast to Record<string,unknown> to access it.
 */
export async function retrieveWorldview(query: string, topK = 3): Promise<RetrievalResult> {
  const client = getWorldviewPineconeClient();
  if (!client) return { sources: [], averageConfidence: 0 };

  let vector: number[];
  try {
    const result = await embedTexts([query], { modelConfig: EMBEDDING_MODEL_WORLDVIEW });
    vector = result.results[0]?.embedding ?? [];
    if (vector.length === 0) return { sources: [], averageConfidence: 0 };
  } catch {
    return { sources: [], averageConfidence: 0 };
  }

  let hits;
  try {
    hits = await client.query({ vector, topK });
  } catch {
    return { sources: [], averageConfidence: 0 };
  }

  const sources: AskSource[] = hits
    .filter((h) => h.score >= 0.35)
    .map((h) => {
      const raw = h.metadata as unknown as Record<string, unknown>;
      const text = typeof raw.chunk_text === 'string' ? raw.chunk_text : '';
      const thesisTitle = typeof h.metadata.thesis_title === 'string' ? h.metadata.thesis_title : 'AbarVa Worldview';
      const chunkTitle = typeof h.metadata.chunk_title === 'string' ? h.metadata.chunk_title : null;
      return {
        type: 'WORLDVIEW' as const,
        name: chunkTitle ?? thesisTitle,
        id: h.id,
        detail: text.slice(0, 280),
        confidence: h.score,
      };
    });

  const avg = sources.length > 0
    ? sources.reduce((s, x) => s + (x.confidence ?? 0), 0) / sources.length
    : 0;

  return { sources, averageConfidence: avg };
}
