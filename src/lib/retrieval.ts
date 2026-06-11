/*
 * AbarVa Confidential — Trade Secret (TS-05)
 * Protected under the AbarVa Trade Secret Policy (docs/ip/trade-secret-policy.md) and
 * Trade Secret Register (docs/ip/trade-secret-register.md). Do not distribute externally
 * or expose outside the tenant boundary. Access requires NDA + IP assignment (T075).
 */
import { azureRead } from '@/lib/data-plane/azureRead';
import { searchCorpus } from '@/lib/corpus/retrieval';

type Vertical = 'healthcare' | 'finserv' | 'retail' | 'universal';

const MIN_SCORE = 0.12;
const STOPWORDS = new Set([
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

type RetrievalRow = {
  source: string | null;
  text: string | null;
  score: string | number | null;
};

const VERTICAL_OVERLAYS: Record<Vertical, string[]> = {
  healthcare: ['healthcare_provider', 'healthcare_idn', 'healthcare', 'cross_industry'],
  finserv: ['financial_services_banking', 'finserv', 'financial_services', 'cross_industry'],
  retail: ['retail', 'consumer', 'commerce', 'cross_industry'],
  universal: ['cross_industry', 'universal', 'general'],
};

function normalizeTerms(query: string): string[] {
  return [...new Set(
    query
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3 && !STOPWORDS.has(term))
      .slice(0, 12),
  )];
}

function websearchQuery(query: string): string {
  const terms = normalizeTerms(query);
  return terms.length ? terms.join(' OR ') : query.trim();
}

function numeric(value: string | number | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export async function retrieveContext(
  query: string,
  vertical: Vertical,
  topK = 4,
  tenantKey?: string,
): Promise<string> {
  const searchQuery = websearchQuery(query);
  const limit = Math.min(Math.max(topK, 1), 10);

  try {
    const corpusHits = await searchCorpus(query, {
      clientId: 'system',
      verticalOverlays: VERTICAL_OVERLAYS[vertical],
      minConfidence: 0.5,
      minDepthScore: 4,
      limit,
    }).catch(() => []);

    const rows = await azureRead.query<RetrievalRow>(
      `
        SELECT
          coalesce(source_doc, chunk_id, id::text) AS source,
          chunk_text AS text,
          ts_rank_cd(
            to_tsvector('english', coalesce(chunk_text, '')),
            websearch_to_tsquery('english', $1)
          ) AS score
        FROM enterprise_context_chunks
        WHERE ($3::text IS NULL OR tenant_key = $3)
          AND coalesce(chunk_metadata->>'lifecycle_state', 'active') = 'active'
          AND (
            to_tsvector('english', coalesce(chunk_text, '')) @@ websearch_to_tsquery('english', $1)
            OR chunk_text ILIKE '%' || $1 || '%'
          )
          AND coalesce(chunk_text, '') <> ''
        ORDER BY score DESC, source ASC
        LIMIT $2
      `,
      [searchQuery, limit, tenantKey ?? null],
      { missingTable: 'empty' },
    );

    const corpusRows: RetrievalRow[] = corpusHits.map((hit) => ({
      source: hit.slug,
      text: [hit.title, hit.markdownBody].filter(Boolean).join('\n'),
      score: hit.score,
    }));
    const hits = [...corpusRows, ...rows]
      .filter((row) => numeric(row.score) >= MIN_SCORE || rows.length <= limit)
      .sort((a, b) => numeric(b.score) - numeric(a.score));
    if (!hits.length) return '';

    return hits
      .slice(0, limit)
      .map((row) => `[Source: ${row.source ?? 'azure-corpus'}]\n${String(row.text ?? '').trim()}`)
      .join('\n\n---\n\n');
  } catch {
    return '';
  }
}

export function verticalFromClientContext(clientVertical: string | undefined): Vertical {
  const v = (clientVertical ?? '').toLowerCase();
  if (v.includes('health') || v.includes('hospital') || v.includes('idn') || v.includes('clinical')) return 'healthcare';
  if (v.includes('finance') || v.includes('bank') || v.includes('asset') || v.includes('insurance') || v.includes('finserv')) return 'finserv';
  if (v.includes('retail') || v.includes('commerce') || v.includes('cpg') || v.includes('consumer')) return 'retail';
  return 'universal';
}
