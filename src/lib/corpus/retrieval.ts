import { createHash } from 'node:crypto';
import { queryCorpusSearch } from './azure-search';
import { toJsonArray, toJsonRecord, toStringArray, withCorpusClient } from './db';
import { embedPatternText } from './embedding';
import type { CorpusPatternRecord, CorpusSearchHit, CorpusSearchOptions } from './types';

type PatternSearchRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: CorpusPatternRecord['status'];
  confidence: string | number;
  version: number;
  parent_version_id: string | null;
  primary_author_id: string | null;
  approved_by_id: string | null;
  published_at: string | null;
  retired_at: string | null;
  search_doc_id: string | null;
  depth_score: string | number;
  vertical_overlays: string[] | null;
  region_overlays: string[] | null;
  applicable_horizons: string[] | null;
  markdown_body: string | null;
  claims_jsonb: unknown;
  evidence_jsonb: unknown;
  counterarguments_jsonb: unknown;
  synthesis_jsonb: unknown;
  created_at: string;
  updated_at: string;
  text_rank: string | number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; hits: CorpusSearchHit[] }>();

function numeric(value: string | number | null | undefined, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function mapRow(row: PatternSearchRow, score: number, source: CorpusSearchHit['source']): CorpusSearchHit {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    status: row.status,
    confidence: numeric(row.confidence, 0.75),
    version: row.version,
    parentVersionId: row.parent_version_id,
    primaryAuthorId: row.primary_author_id,
    approvedById: row.approved_by_id,
    publishedAt: row.published_at,
    retiredAt: row.retired_at,
    searchDocId: row.search_doc_id,
    depthScore: numeric(row.depth_score),
    verticalOverlays: toStringArray(row.vertical_overlays),
    regionOverlays: toStringArray(row.region_overlays),
    applicableHorizons: toStringArray(row.applicable_horizons),
    markdownBody: row.markdown_body ?? '',
    claims: toJsonArray(row.claims_jsonb),
    evidence: toJsonArray(row.evidence_jsonb),
    counterarguments: toJsonArray(row.counterarguments_jsonb),
    synthesis: toJsonRecord(row.synthesis_jsonb),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    score,
    source,
  };
}

function cacheKey(query: string, opts: CorpusSearchOptions): string {
  return createHash('sha256')
    .update(JSON.stringify({ query, opts }))
    .digest('hex');
}

function overlapFilterSql(column: string, values: string[] | undefined, args: unknown[], clauses: string[]): void {
  if (!values || values.length === 0) return;
  args.push(values);
  clauses.push(`${column} && $${args.length}::text[]`);
}

function buildAzureFilter(opts: CorpusSearchOptions): string | undefined {
  const filters: string[] = [`confidence ge ${opts.minConfidence ?? 0}`, `depth_score ge ${opts.minDepthScore ?? 0}`];
  if (opts.category) filters.push(`category eq '${opts.category.replace(/'/g, "''")}'`);
  if (typeof opts.versionPin === 'number') filters.push(`version eq ${Math.trunc(opts.versionPin)}`);
  const collectionFilter = (field: string, values: string[] | undefined): string | null => {
    if (!values || values.length === 0) return null;
    const escaped = values.map((value) => value.replace(/'/g, "''"));
    return `${field}/any(item: ${escaped.map((value) => `item eq '${value}'`).join(' or ')})`;
  };
  const verticalFilter = collectionFilter('vertical_overlays', opts.verticalOverlays);
  if (verticalFilter) filters.push(verticalFilter);
  const regionFilter = collectionFilter('region_overlays', opts.regionOverlays);
  if (regionFilter) filters.push(regionFilter);
  return filters.join(' and ');
}

async function postgresSearch(query: string, opts: CorpusSearchOptions): Promise<CorpusSearchHit[]> {
  return withCorpusClient(async (client) => {
    const args: unknown[] = [];
    const clauses = [`p.status = 'published'`];
    if (opts.category) {
      args.push(opts.category);
      clauses.push(`p.category = $${args.length}`);
    }
    if (typeof opts.minConfidence === 'number') {
      args.push(opts.minConfidence);
      clauses.push(`p.confidence >= $${args.length}`);
    }
    if (typeof opts.minDepthScore === 'number') {
      args.push(opts.minDepthScore);
      clauses.push(`p.depth_score >= $${args.length}`);
    }
    if (typeof opts.versionPin === 'number') {
      args.push(opts.versionPin);
      clauses.push(`p.version = $${args.length}`);
    }
    overlapFilterSql('p.vertical_overlays', opts.verticalOverlays, args, clauses);
    overlapFilterSql('p.region_overlays', opts.regionOverlays, args, clauses);
    args.push(query);
    const queryIndex = args.length;
    args.push(Math.min(Math.max(opts.limit ?? 10, 1), 50));
    const { rows } = await client.query<PatternSearchRow>(
      `
        SELECT
          p.*,
          c.markdown_body,
          c.claims_jsonb,
          c.evidence_jsonb,
          c.counterarguments_jsonb,
          c.synthesis_jsonb,
          ts_rank_cd(
            to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(c.markdown_body, '')),
            plainto_tsquery('english', $${queryIndex})
          ) AS text_rank
        FROM public.corpus_patterns p
        JOIN public.corpus_pattern_content c ON c.pattern_id = p.id
        WHERE ${clauses.join(' AND ')}
          AND (
            $${queryIndex} = ''
            OR to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(c.markdown_body, ''))
               @@ plainto_tsquery('english', $${queryIndex})
            OR p.title ILIKE '%' || $${queryIndex} || '%'
            OR c.markdown_body ILIKE '%' || $${queryIndex} || '%'
          )
        ORDER BY text_rank DESC, p.depth_score DESC, p.confidence DESC, p.updated_at DESC
        LIMIT $${args.length}
      `,
      args,
    );
    return rows.map((row) => mapRow(row, numeric(row.text_rank), 'postgres'));
  });
}

async function hydrateAzureOnlyHits(
  azureHits: Array<{ slug?: string; version?: number; score: number }>,
  postgresHits: CorpusSearchHit[],
  opts: CorpusSearchOptions,
): Promise<CorpusSearchHit[]> {
  const existingSlugs = new Set(postgresHits.map((hit) => hit.slug));
  const scoreBySlug = new Map<string, number>();
  for (const hit of azureHits) {
    if (!hit.slug || existingSlugs.has(hit.slug)) continue;
    scoreBySlug.set(hit.slug, Math.max(scoreBySlug.get(hit.slug) ?? 0, hit.score));
  }
  const slugs = Array.from(scoreBySlug.keys());
  if (slugs.length === 0) return [];

  return withCorpusClient(async (client) => {
    const args: unknown[] = [slugs];
    const clauses = [`p.status = 'published'`, `p.slug = ANY($1::text[])`];
    if (opts.category) {
      args.push(opts.category);
      clauses.push(`p.category = $${args.length}`);
    }
    if (typeof opts.minConfidence === 'number') {
      args.push(opts.minConfidence);
      clauses.push(`p.confidence >= $${args.length}`);
    }
    if (typeof opts.minDepthScore === 'number') {
      args.push(opts.minDepthScore);
      clauses.push(`p.depth_score >= $${args.length}`);
    }
    if (typeof opts.versionPin === 'number') {
      args.push(opts.versionPin);
      clauses.push(`p.version = $${args.length}`);
    }
    overlapFilterSql('p.vertical_overlays', opts.verticalOverlays, args, clauses);
    overlapFilterSql('p.region_overlays', opts.regionOverlays, args, clauses);
    const { rows } = await client.query<PatternSearchRow>(
      `
        SELECT
          p.*,
          c.markdown_body,
          c.claims_jsonb,
          c.evidence_jsonb,
          c.counterarguments_jsonb,
          c.synthesis_jsonb,
          0 AS text_rank
        FROM public.corpus_patterns p
        JOIN public.corpus_pattern_content c ON c.pattern_id = p.id
        WHERE ${clauses.join(' AND ')}
      `,
      args,
    );
    return rows.map((row) => mapRow(row, scoreBySlug.get(row.slug) ?? 0, 'azure'));
  });
}

function reciprocalRankFusion(
  postgresHits: CorpusSearchHit[],
  azureSlugs: Array<{ slug?: string; version?: number; score: number }>,
): CorpusSearchHit[] {
  const byKey = new Map<string, CorpusSearchHit>();
  postgresHits.forEach((hit, index) => {
    const key = `${hit.slug}:${hit.version}`;
    byKey.set(key, {
      ...hit,
      score: hit.score + 1 / (60 + index + 1),
      source: 'postgres',
    });
  });
  azureSlugs.forEach((hit, index) => {
    if (!hit.slug) return;
    const key = `${hit.slug}:${hit.version ?? ''}`;
    const exact = byKey.get(key);
    const fallback = Array.from(byKey.values()).find((candidate) => candidate.slug === hit.slug);
    const row = exact ?? fallback;
    if (!row) return;
    const prior = byKey.get(`${row.slug}:${row.version}`) ?? row;
    byKey.set(`${row.slug}:${row.version}`, {
      ...prior,
      score: prior.score + 1 / (60 + index + 1) + hit.score / 100,
      source: prior.source === 'postgres' ? 'fused' : prior.source,
    });
  });
  return Array.from(byKey.values()).sort((a, b) => b.score - a.score);
}

export async function searchCorpus(query: string, opts: CorpusSearchOptions): Promise<CorpusSearchHit[]> {
  const normalizedQuery = query.trim();
  const key = cacheKey(normalizedQuery, opts);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.hits;

  const [pgHits, azureHits] = await Promise.all([
    postgresSearch(normalizedQuery, opts),
    (async () => {
      try {
        const embedding = await embedPatternText({
          text: normalizedQuery || 'corpus',
          clientId: opts.clientId,
          userId: opts.userId,
        });
        return await queryCorpusSearch({
          query: normalizedQuery,
          clientId: opts.clientId,
          clientKey: opts.clientKey,
          includePrivate: opts.includePrivate,
          vector: embedding.embedding,
          filter: buildAzureFilter(opts),
          top: opts.limit ?? 10,
        });
      } catch {
        try {
          return await queryCorpusSearch({
            query: normalizedQuery,
            clientId: opts.clientId,
            clientKey: opts.clientKey,
            includePrivate: opts.includePrivate,
            filter: buildAzureFilter(opts),
            top: opts.limit ?? 10,
          });
        } catch {
          return [];
        }
      }
    })(),
  ]);

  const hydratedAzureHits = await hydrateAzureOnlyHits(azureHits, pgHits, opts);
  const hits = reciprocalRankFusion([...pgHits, ...hydratedAzureHits], azureHits).slice(0, opts.limit ?? 10);
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, hits });
  return hits;
}
