import { getServerSupabase } from '@/lib/supabase-server';
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

export async function retrievePattern(entities: string[]): Promise<RetrievalResult> {
  if (entities.length === 0) return { sources: [], averageConfidence: 0 };

  const sb = getServerSupabase();
  const sources: AskSource[] = [];
  const seen = new Set<string>();

  for (const entity of entities.slice(0, 3)) {
    const isCode = /^F\d{3}$/i.test(entity);

    if (isCode) {
      const { data } = await sb
        .from('genome_patterns')
        .select('id, code, name, description, failure_rate_pct, office_category, vertical, summary, tags')
        .eq('code', entity.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        const key = String(data.code ?? data.id);
        if (!seen.has(key)) { seen.add(key); sources.push(buildSource(data as PatternRow, 0.95)); }
      }
      continue;
    }

    // Full-text search on name + description
    const { data: ftsRows } = await sb
      .from('genome_patterns')
      .select('id, code, name, description, failure_rate_pct, office_category, vertical, summary, tags')
      .eq('is_active', true)
      .textSearch('name', entity, { config: 'english', type: 'websearch' })
      .limit(5);

    for (const row of (ftsRows ?? [])) {
      const key = String(row.code ?? row.id);
      if (!seen.has(key)) { seen.add(key); sources.push(buildSource(row as PatternRow, 0.85)); }
    }

    // Vertical / tag fallback for broad queries like "retail patterns" or "supply chain"
    if (sources.length < 3) {
      const { data: tagRows } = await sb
        .from('genome_patterns')
        .select('id, code, name, description, failure_rate_pct, office_category, vertical, summary, tags')
        .eq('is_active', true)
        .or(`vertical.ilike.%${entity}%,name.ilike.%${entity}%`)
        .limit(5);

      for (const row of (tagRows ?? [])) {
        const key = String(row.code ?? row.id);
        if (!seen.has(key)) { seen.add(key); sources.push(buildSource(row as PatternRow, 0.70)); }
      }
    }
  }

  const avg = sources.length > 0
    ? sources.reduce((s, x) => s + (x.confidence ?? 0), 0) / sources.length
    : 0;
  return { sources: sources.slice(0, 8), averageConfidence: avg };
}
