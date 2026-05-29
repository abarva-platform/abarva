import { azureRead } from '@/lib/data-plane/azureRead';
import {
  searchCanonicalPatternIndex,
  type CanonicalPatternIndexHit,
} from '@/lib/intelligence/canonical/runtime-pattern-index';
import type { RetrievalResult, AskSource } from '../types';

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

function buildCanonicalSource(hit: CanonicalPatternIndexHit): AskSource {
  const kpis = [...hit.primary_kpis, ...hit.secondary_kpis].slice(0, 4);
  const detailParts = [
    hit.summary,
    hit.source_basis ? `source_basis=${hit.source_basis}` : null,
    hit.confidence_level ? `confidence=${hit.confidence_level}` : null,
    kpis.length > 0 ? `KPIs: ${kpis.join(', ')}` : null,
  ].filter((part): part is string => Boolean(part));
  return {
    type: 'PATTERN',
    name: hit.title,
    id: hit.canonical_id,
    detail: detailParts.join(' · '),
    confidence: hit.score,
  };
}

async function retrieveCanonicalFallback(
  entities: string[],
  seen: Set<string>,
): Promise<AskSource[]> {
  const sources: AskSource[] = [];
  for (const entity of entities.slice(0, 3)) {
    const result = await searchCanonicalPatternIndex({
      query: entity,
      limit: 5,
    }, { useCache: false });
    for (const hit of result.patterns) {
      const key = hit.canonical_id;
      if (seen.has(key)) continue;
      seen.add(key);
      sources.push(buildCanonicalSource(hit));
      if (sources.length >= 8) return sources;
    }
  }
  return sources;
}

export async function retrievePattern(entities: string[]): Promise<RetrievalResult> {
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
    const fallbackSources = await retrieveCanonicalFallback(entities, seen);
    sources.push(...fallbackSources);
  }

  const avg = sources.length > 0
    ? sources.reduce((s, x) => s + (x.confidence ?? 0), 0) / sources.length
    : 0;
  return { sources: sources.slice(0, 8), averageConfidence: avg };
}
