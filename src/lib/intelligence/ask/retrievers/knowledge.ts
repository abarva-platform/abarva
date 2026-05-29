import { azureRead } from '@/lib/data-plane/azureRead';
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
  const params: unknown[] = [];
  const predicates = ['status = $1'];
  params.push('active');

  if (contentTypes && contentTypes.length > 0) {
    params.push(contentTypes);
    predicates.push(`content_type = ANY($${params.length}::text[])`);
  }
  const normalizedEntities = entities
    .slice(0, 3)
    .map((e) => e.replace(/[%_]/g, '').trim())
    .filter(Boolean);
  if (normalizedEntities.length > 0) {
    const entityPredicates: string[] = [];
    for (const entity of normalizedEntities) {
      params.push(`%${entity}%`);
      const titleParam = `$${params.length}`;
      params.push([entity.toLowerCase()]);
      const topicParam = `$${params.length}`;
      params.push([entity.toUpperCase()]);
      const industryParam = `$${params.length}`;
      entityPredicates.push(
        `(title ILIKE ${titleParam} OR topic_tags @> ${topicParam}::text[] OR industry_tags @> ${industryParam}::text[])`,
      );
    }
    predicates.push(`(${entityPredicates.join(' OR ')})`);
  }

  let rows: Array<{ id: string; source_key: string; title: string; publisher: string; content_type: string; industry_tags: string[] | null; topic_tags: string[] | null; published_at: string | null; summary: string | null }> = [];
  try {
    rows = await azureRead.query(
      `SELECT id, source_key, title, publisher, content_type, industry_tags, topic_tags,
              published_at, status, summary
         FROM knowledge_sources
        WHERE ${predicates.join(' AND ')}
        LIMIT 8`,
      params,
      { missingTable: 'empty' },
    );
  } catch {
    return { sources: [], averageConfidence: 0 };
  }

  const sources: AskSource[] = rows.map((r) => ({
    type: typeMap(r.content_type) ?? sourceTypeLabel,
    name: r.title,
    id: r.id,
    detail: [
      r.publisher,
      r.content_type,
      r.published_at ? `Published ${r.published_at}` : null,
      // Summary is the authoritative prose sent to the synthesizer — without it,
      // the model only has the title to reason from.
      r.summary ? r.summary : null,
      r.topic_tags && r.topic_tags.length > 0 ? `Topics: ${r.topic_tags.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    url: `/intelligence/library?source=${r.source_key}`,
    confidence: r.summary ? 0.85 : 0.5,
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
