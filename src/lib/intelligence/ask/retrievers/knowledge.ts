import { getServerSupabase } from '@/lib/supabase-server';
import type { RetrievalResult, AskSource, SourceType } from '../types';

/**
 * Shared retriever for regulation_query / research_query / benchmark_query /
 * general_synthesis. Reads from knowledge_sources (Pack B registry).
 * Will return rows as soon as ingestion runs; returns empty gracefully
 * while the namespace is unpopulated.
 */
export async function retrieveKnowledge(
  entities: string[],
  contentTypes: Array<'regulation' | 'framework' | 'benchmark' | 'research_report' | 'vendor_doc' | 'vendor_posture' | 'news_article' | 'case_study' | 'enforcement_action'> | null = null,
  sourceTypeLabel: SourceType = 'GENERAL',
): Promise<RetrievalResult> {
  const sb = getServerSupabase();
  let query = sb
    .from('knowledge_sources')
    .select('id, source_key, title, publisher, content_type, industry_tags, topic_tags, published_at, status')
    .eq('status', 'active')
    .limit(8);

  if (contentTypes && contentTypes.length > 0) {
    query = query.in('content_type', contentTypes);
  }
  if (entities.length > 0) {
    const pattern = entities
      .slice(0, 3)
      .map((e) => e.replace(/[%_]/g, ''))
      .map((e) => `title.ilike.%${e}%,topic_tags.cs.{${e.toLowerCase()}},industry_tags.cs.{${e.toUpperCase()}}`)
      .join(',');
    query = query.or(pattern);
  }

  const { data, error } = await query;
  if (error) return { sources: [], averageConfidence: 0 };
  const rows = (data as Array<{ id: string; source_key: string; title: string; publisher: string; content_type: string; industry_tags: string[] | null; topic_tags: string[] | null; published_at: string | null }> | null) ?? [];

  const sources: AskSource[] = rows.map((r) => ({
    type: typeMap(r.content_type) ?? sourceTypeLabel,
    name: r.title,
    id: r.id,
    detail: [
      r.publisher,
      r.content_type,
      r.published_at ? `Published ${r.published_at}` : null,
      r.topic_tags && r.topic_tags.length > 0 ? `Topics: ${r.topic_tags.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    url: `/intelligence/library?source=${r.source_key}`,
    confidence: 0.8,
  }));

  const avg = sources.length > 0 ? sources.reduce((s, x) => s + (x.confidence ?? 0), 0) / sources.length : 0;
  return { sources, averageConfidence: avg };
}

function typeMap(ct: string): SourceType | null {
  if (ct === 'regulation') return 'REGULATION';
  if (ct === 'framework') return 'REGULATION';
  if (ct === 'benchmark') return 'BENCHMARK';
  if (ct === 'research_report') return 'RESEARCH';
  if (ct === 'vendor_doc' || ct === 'vendor_posture') return 'VENDOR';
  if (ct === 'case_study' || ct === 'news_article' || ct === 'enforcement_action') return 'RESEARCH';
  return null;
}
