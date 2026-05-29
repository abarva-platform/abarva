import { azureRead } from '@/lib/data-plane/azureRead';
import { searchCorpus } from '@/lib/corpus/retrieval';
import type { CorpusSearchHit } from '@/lib/corpus/types';
import type { AskSource, AskSurfaceContext, RetrievalResult } from '../types';

// GP-1 · Supabase-native pattern retriever.
//
// Previously queried Neo4j GenomePattern nodes via Cypher. Neo4j is being
// retired; genome_patterns in Supabase Postgres is now the canonical store.
// Migration 20260509100000_genome_patterns_normalize.sql adds the normalized
// columns (code, name, description, failure_rate_pct, office_category,
// summary) this retriever reads.
//
// Retrieval strategy:
//   1. Exact F-code match — confidence 0.95
//   2. Full-text search on name+description — confidence 0.85
//   3. Vertical / tag filter fallback — confidence 0.70

type PatternRow = {
  id: string;
  code: string | null;
  name: string | null;
  description: string | null;
  failure_rate_pct: number | null;
  office_category: string | null;
  vertical: string | null;
  summary: string | null;
  tags: string[] | null;
};

function buildSource(row: PatternRow, confidence: number): AskSource {
  const label = row.code ? `${row.code} · ${row.name ?? 'Pattern'}` : (row.name ?? 'Pattern');
  const parts: string[] = [];
  if (row.failure_rate_pct != null) parts.push(`Failure rate ${row.failure_rate_pct}%`);
  if (row.office_category) parts.push(row.office_category.replace(/_/g, ' '));
  if (row.vertical) parts.push(row.vertical);
  const prose = row.summary ?? (row.description ? row.description.slice(0, 280) : null);
  if (prose) parts.push(prose);
  return {
    type: 'PATTERN',
    name: label,
    id: row.code ?? row.id,
    detail: parts.join(' · '),
    confidence,
  };
}

export interface PatternRetrievalOptions {
  query?: string;
  tenantInventoryKey?: string | null;
  surfaceContext?: AskSurfaceContext | null;
}

function inferIndustry(opts: PatternRetrievalOptions): string | null {
  const haystack = [
    opts.tenantInventoryKey,
    opts.surfaceContext?.clientKey,
    opts.surfaceContext?.activeClient,
    ...(opts.surfaceContext?.facts ?? []),
    ...(opts.surfaceContext?.tenantFacts ?? []),
  ]
    .filter((item): item is string => Boolean(item))
    .join(' ')
    .toLowerCase();
  if (/\b(apex|retail|merchandising|store|loyalty|inventory|assortment|sku)\b/.test(haystack)) return 'retail';
  if (/\b(meridian|northstar|helix|health|healthcare|clinical|patient|payer|provider|epic|ehr|medtech|med-tech)\b/.test(haystack)) return 'healthcare';
  if (/\b(first[- ]?capital|brindlemark|arcturus|financial|bank|wealth|aml|kyc|underwriting|fraud)\b/.test(haystack)) return 'financial_services';
  if (/\b(keystone|energy|utility|utilities|grid)\b/.test(haystack)) return 'energy';
  if (/\b(skyharbor|airline|aviation|air)\b/.test(haystack)) return 'airline';
  return null;
}

function corpusVerticalOverlays(opts: PatternRetrievalOptions): string[] | undefined {
  const industry = inferIndustry(opts);
  if (!industry) return undefined;
  return Array.from(new Set([industry, 'cross_industry']));
}

function buildCorpusSource(hit: CorpusSearchHit): AskSource {
  const provenance = hit.synthesis?.provenance && typeof hit.synthesis.provenance === 'object'
    ? hit.synthesis.provenance as Record<string, unknown>
    : null;
  const source = typeof provenance?.source === 'string' ? provenance.source : null;
  const sourceBasis = typeof hit.synthesis?.source_basis === 'string' ? hit.synthesis.source_basis : source;
  const detailParts = [
    hit.category ? `category=${hit.category}` : null,
    hit.verticalOverlays.length > 0 ? `industry_scope=${hit.verticalOverlays.join(', ')}` : null,
    sourceBasis ? `source_basis=${sourceBasis}` : null,
    `depth_score=${hit.depthScore.toFixed(1)}`,
    hit.markdownBody ? hit.markdownBody.replace(/\s+/g, ' ').slice(0, 280) : null,
  ].filter((part): part is string => Boolean(part));
  return {
    type: 'PATTERN',
    name: hit.title,
    id: hit.slug,
    detail: detailParts.join(' · '),
    confidence: Math.max(0, Math.min(1, hit.score || hit.confidence)),
  };
}

async function retrieveCorpusFallback(
  entities: string[],
  seen: Set<string>,
  opts: PatternRetrievalOptions,
): Promise<AskSource[]> {
  const sources: AskSource[] = [];
  const queries = Array.from(new Set([
    opts.query?.trim(),
    ...entities.slice(0, 3).map((entity) => entity.trim()),
  ].filter((query): query is string => Boolean(query))));
  const verticalOverlays = corpusVerticalOverlays(opts);
  for (const query of queries) {
    const hits = await searchCorpus(query, {
      clientId: opts.tenantInventoryKey ?? opts.surfaceContext?.clientKey ?? 'global',
      verticalOverlays,
      minConfidence: 0,
      minDepthScore: 0,
      limit: 5,
    }).catch(() => []);
    for (const hit of hits) {
      const key = hit.slug || hit.id;
      if (seen.has(key)) continue;
      seen.add(key);
      sources.push(buildCorpusSource(hit));
      if (sources.length >= 8) return sources;
    }
  }
  return sources;
}

export async function retrievePattern(entities: string[], opts: PatternRetrievalOptions = {}): Promise<RetrievalResult> {
  if (entities.length === 0) return { sources: [], averageConfidence: 0 };

  const sources: AskSource[] = [];
  const seen = new Set<string>();
  let shouldTryCanonicalFallback = false;

  for (const entity of entities.slice(0, 3)) {
    const isCode = /^F\d{3}$/i.test(entity);

    if (isCode) {
      const rows = await azureRead.query<PatternRow>(
        `SELECT id, code, name, description, failure_rate_pct, office_category, vertical, summary, tags
           FROM genome_patterns
          WHERE code = $1 AND is_active = true
          LIMIT 1`,
        [entity.toUpperCase()],
        { missingTable: 'empty' },
      ).catch(() => {
        shouldTryCanonicalFallback = true;
        return [];
      });
      const data = rows[0] ?? null;
      if (data) {
        const key = String(data.code ?? data.id);
        if (!seen.has(key)) { seen.add(key); sources.push(buildSource(data as PatternRow, 0.95)); }
      }
      continue;
    }

    // Full-text search on name + description
    const ftsRows = await azureRead.query<PatternRow>(
      `SELECT id, code, name, description, failure_rate_pct, office_category, vertical, summary, tags
         FROM genome_patterns
        WHERE is_active = true
          AND to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
              @@ websearch_to_tsquery('english', $1)
        LIMIT 5`,
      [entity],
      { missingTable: 'empty' },
    ).catch(() => {
      shouldTryCanonicalFallback = true;
      return [];
    });
    for (const row of (ftsRows ?? [])) {
      const key = String(row.code ?? row.id);
      if (!seen.has(key)) { seen.add(key); sources.push(buildSource(row as PatternRow, 0.85)); }
    }

    // Vertical / tag fallback for broad queries like "retail patterns" or "supply chain"
    if (sources.length < 3) {
      const tagRows = await azureRead.query<PatternRow>(
        `SELECT id, code, name, description, failure_rate_pct, office_category, vertical, summary, tags
           FROM genome_patterns
          WHERE is_active = true
            AND (vertical ILIKE $1 OR name ILIKE $1)
          LIMIT 5`,
        [`%${entity}%`],
        { missingTable: 'empty' },
      ).catch(() => {
        shouldTryCanonicalFallback = true;
        return [];
      });
      for (const row of (tagRows ?? [])) {
        const key = String(row.code ?? row.id);
        if (!seen.has(key)) { seen.add(key); sources.push(buildSource(row as PatternRow, 0.70)); }
      }
    }
  }
  if (shouldTryCanonicalFallback || sources.length === 0) {
    const fallbackSources = await retrieveCorpusFallback(entities, seen, opts);
    sources.push(...fallbackSources);
  }

  const avg = sources.length > 0
    ? sources.reduce((s, x) => s + (x.confidence ?? 0), 0) / sources.length
    : 0;
  return { sources: sources.slice(0, 8), averageConfidence: avg };
}
