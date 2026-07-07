export type EmbeddingTier = 'frontier' | 'cost_optimized';

export interface EmbeddingCostLookup {
  tier: EmbeddingTier;
  exemplar: string;
  inputPerMTokUsd: number;
  vendor: string;
  asOf: string;
  notes: string;
}

export const EMBEDDING_COST_CATALOG_VERSION =
  'ai-ops-embedding-costs-2026-05-31';
export const EMBEDDING_COST_CATALOG_AS_OF = '2026-05-31';

export const EMBEDDING_COST_CATALOG: Record<
  EmbeddingTier,
  EmbeddingCostLookup
> = {
  frontier: {
    tier: 'frontier',
    exemplar: 'text-embedding-3-large',
    inputPerMTokUsd: 0.13,
    vendor: 'OpenAI',
    asOf: EMBEDDING_COST_CATALOG_AS_OF,
    notes:
      'OpenAI API pricing page lists text-embedding-3-large at $0.13 per 1M tokens.',
  },
  cost_optimized: {
    tier: 'cost_optimized',
    exemplar: 'gemini-embedding-001-file-search',
    inputPerMTokUsd: 0.15,
    vendor: 'Google',
    asOf: EMBEDDING_COST_CATALOG_AS_OF,
    notes:
      'Gemini Developer API pricing page lists File Search embeddings at $0.15 per 1M tokens.',
  },
};

export const DEFAULT_QUERY_TOKENS_PER_EMBEDDING_QUERY = 512;
