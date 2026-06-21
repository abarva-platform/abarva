import { azureRead } from '@/lib/data-plane/azureRead';
import {
  allowedCorpusIndustryScopes,
  normalizeCorpusIndustryScope,
} from '@/lib/corpus/industry-scope';
import type { AskSurfaceContext, RetrievalResult, AskSource, SourceType } from '../types';

export interface KnowledgeRetrievalOptions {
  tenantInventoryKey?: string | null;
  surfaceContext?: AskSurfaceContext | null;
}

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
  opts: KnowledgeRetrievalOptions = {},
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

  const sources: AskSource[] = rows.filter((row) => knowledgeRowMatchesTenant(row, opts)).map((r) => ({
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

function knowledgeRowMatchesTenant(
  row: { source_key: string; title: string; publisher: string; industry_tags: string[] | null; topic_tags: string[] | null; summary: string | null },
  opts: KnowledgeRetrievalOptions,
): boolean {
  const allowedScopes = allowedCorpusIndustryScopes({
    tenantKey: opts.tenantInventoryKey,
    clientKey: opts.surfaceContext?.clientKey,
    activeClient: opts.surfaceContext?.activeClient,
    facts: [...(opts.surfaceContext?.facts ?? []), ...(opts.surfaceContext?.tenantFacts ?? [])],
  });

  const industryTags = (row.industry_tags ?? []).map(normalizeCorpusIndustryScope);
  if (allowedScopes && industryTags.length > 0) {
    const allowed = new Set(allowedScopes.map(normalizeCorpusIndustryScope));
    if (!industryTags.some((tag) => allowed.has(tag))) return false;
  }

  const activeTenantSignal =
    opts.tenantInventoryKey ??
    opts.surfaceContext?.clientKey ??
    opts.surfaceContext?.activeClient ??
    null;
  const hasActiveTenantSignal = (activeTenantSignal ?? '').trim().length > 0;
  const activeTenant = normalizeTenantMarker(activeTenantSignal);

  // Tenant-strict fence: only blanket-allow when there is genuinely no active
  // tenant signal (cross-tenant library browsing). When a tenant IS active,
  // fail CLOSED — exclude any row carrying another recognized tenant's marker,
  // even if the active tenant itself is not yet a recognized marker. Defaulting
  // to another tenant's facts (e.g. Apex) for an un-mapped tenant is a P0 leak.
  if (!activeTenant && !hasActiveTenantSignal) return true;

  const haystack = [
    row.source_key,
    row.title,
    row.publisher,
    row.summary ?? '',
    ...(row.topic_tags ?? []),
  ].join(' ').toLowerCase();

  return !tenantMarkers()
    .filter((marker) => marker.tenant !== activeTenant)
    .some((marker) => marker.pattern.test(haystack));
}

function normalizeTenantMarker(value: string | null): string | null {
  const normalized = value?.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() ?? '';
  if (!normalized) return null;
  if (/\b(lakeshore|lakeshore holdings|holdco)\b/.test(normalized)) return 'lakeshore';
  if (/\b(apex|apexretail|retail)\b/.test(normalized)) return 'apex';
  if (/\b(meridian|health)\b/.test(normalized)) return 'meridian';
  if (/\b(first capital|firstcapital|arcturus|financial)\b/.test(normalized)) return 'firstcapital';
  if (/\b(northstar|medtech|clinical technologies)\b/.test(normalized)) return 'northstar';
  if (/\b(skyharbor|airline|aviation)\b/.test(normalized)) return 'skyharbor';
  return null;
}

function tenantMarkers(): Array<{ tenant: string; pattern: RegExp }> {
  return [
    { tenant: 'apex', pattern: /\b(apex|apex retail|apexretail)\b/ },
    { tenant: 'meridian', pattern: /\b(meridian|meridian health|heliara)\b/ },
    { tenant: 'firstcapital', pattern: /\b(first capital|firstcapital|arcturus|financial)\b/ },
    { tenant: 'northstar', pattern: /\b(northstar|northstar clinical)\b/ },
    { tenant: 'skyharbor', pattern: /\b(skyharbor|skyharbor air)\b/ },
    { tenant: 'lakeshore', pattern: /\b(lakeshore|lakeshore holdings|holdco)\b/ },
  ];
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
