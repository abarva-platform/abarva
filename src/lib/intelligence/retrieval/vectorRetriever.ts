// Azure tenant-context retrieval for the Nexus "vector" lane.
//
// The pipeline dimension is still named `vector` for API compatibility, but
// this implementation reads the Azure Postgres `enterprise_context_chunks`
// substrate and ranks matches with Postgres full-text search plus lightweight
// keyword fallback. Azure AI Search can sit in front of the same chunks;
// Azure Postgres remains the private data-plane source of truth.

import { azureRead } from '@/lib/data-plane/azureRead';
import type { RetrievalResult, Source, TenancyCtx } from '../types';

export interface VectorSearchArgs {
  query: string;
  tenancy: TenancyCtx;
  namespaces?: string[];
  topK?: number;
}

type ContextChunkRow = {
  chunk_id: string | null;
  chunk_text: string | null;
  source_doc: string | null;
  source_segment_id: string | null;
  tenant_key: string | null;
  rank_score: string | number | null;
};

const SEARCH_STOPWORDS = new Set([
  'about',
  'after',
  'against',
  'between',
  'could',
  'from',
  'have',
  'into',
  'next',
  'should',
  'that',
  'their',
  'there',
  'through',
  'what',
  'where',
  'which',
  'with',
  'would',
]);

function numeric(value: string | number | null | undefined, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function buildSearchQuery(query: string): string {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !SEARCH_STOPWORDS.has(term))
    .slice(0, 12);
  return terms.length ? terms.join(' OR ') : query.trim();
}

function confidenceFor(score: number): Source['confidence'] {
  if (score >= 0.15) return 'high';
  if (score >= 0.04) return 'medium';
  return 'low';
}

export async function vectorSearch(args: VectorSearchArgs): Promise<RetrievalResult> {
  const started = Date.now();
  const searchQuery = buildSearchQuery(args.query);
  const topK = Math.min(Math.max(args.topK ?? 8, 1), 12);

  try {
    const rows = await azureRead.query<ContextChunkRow>(
      `
        WITH ranked AS (
          SELECT
            chunk_id,
            chunk_text,
            source_doc,
            source_segment_id,
            tenant_key,
            ts_rank_cd(
              to_tsvector('english', coalesce(chunk_text, '')),
              websearch_to_tsquery('english', $2)
            ) AS rank_score
          FROM enterprise_context_chunks
          WHERE (client_id::text = $1 OR tenant_key = $1)
            AND coalesce(chunk_text, '') <> ''
            AND (
              $2 = ''
              OR to_tsvector('english', coalesce(chunk_text, '')) @@ websearch_to_tsquery('english', $2)
              OR chunk_text ILIKE '%' || $2 || '%'
            )
        )
        SELECT *
          FROM ranked
         ORDER BY rank_score DESC, chunk_id ASC
         LIMIT $3
      `,
      [args.tenancy.clientId, searchQuery, topK],
      { missingTable: 'empty' },
    );

    const claims = rows.map((row) => {
      const score = numeric(row.rank_score);
      const source: Source = {
        id: `context:${row.chunk_id ?? row.source_doc ?? 'chunk'}`,
        type: 'client_fact',
        name: row.source_doc ?? row.source_segment_id ?? row.chunk_id ?? 'Tenant context chunk',
        detail: row.chunk_text?.replace(/\s+/g, ' ').slice(0, 240),
        confidence: confidenceFor(score),
      };
      return {
        text: row.chunk_text?.replace(/\s+/g, ' ').slice(0, 480) ?? '',
        source,
        confidence: source.confidence ?? 'medium',
      };
    });

    return { dimension: 'vector', claims, latencyMs: Date.now() - started, partial: false };
  } catch (err) {
    return {
      dimension: 'vector',
      claims: [],
      latencyMs: Date.now() - started,
      partial: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
