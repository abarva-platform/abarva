import { azureRead } from '@/lib/data-plane/azureRead';
import {
  RETAIL_OVERLAY_NAMESPACE,
  getRequiredOverlayPacksForCategory,
  type QuestionCategory,
} from '@/lib/knowledge/coverage';
import type { CanonicalTenant } from '@/lib/tenant/CanonicalTenant';
import type { AskSource } from '../types';

type RetailOverlayRow = {
  chunk_id: string;
  chunk_text: string;
  source_doc: string | null;
  source_pack: string | null;
  source_super_category: string | null;
  pattern_id: string | null;
  chunk_role: string | null;
  rank_score: string | number | null;
};

const SEARCH_STOPWORDS = new Set([
  'about',
  'across',
  'apex',
  'and',
  'before',
  'between',
  'could',
  'does',
  'from',
  'have',
  'how',
  'retail',
  'should',
  'that',
  'their',
  'what',
  'where',
  'which',
  'with',
  'would',
]);

function isRetailTenant(tenant: CanonicalTenant | null | undefined): tenant is CanonicalTenant {
  if (!tenant) return false;
  return tenant.canonicalKey === 'apex-retail' || tenant.industryCode?.toUpperCase() === 'RETAIL';
}

function numeric(value: string | number | null | undefined, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function compact(value: string, max = 520): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 3).replace(/\s+\S*$/, '')}...`;
}

function buildSearchQuery(query: string): string {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !SEARCH_STOPWORDS.has(term))
    .slice(0, 12);
  return terms.length ? terms.join(' OR ') : query;
}

function sourceFromRow(row: RetailOverlayRow): AskSource {
  const patternId = row.pattern_id ?? row.chunk_id.replace(/^retail-v1:/, '').toUpperCase();
  const pack = row.source_pack ?? 'unknown-pack';
  const category = row.source_super_category ?? 'unknown-category';
  const role = row.chunk_role ?? 'pattern';
  return {
    type: 'PATTERN',
    name: `Retail overlay ${patternId} · ${pack}`,
    id: row.chunk_id,
    detail: [
      `overlay=${RETAIL_OVERLAY_NAMESPACE}`,
      `pattern_id=${patternId}`,
      `source_pack=${pack}`,
      `source_super_category=${category}`,
      `chunk_role=${role}`,
      row.source_doc ? `source_doc=${row.source_doc}` : null,
      compact(row.chunk_text),
    ].filter((part): part is string => Boolean(part)).join(' · '),
    confidence: Math.min(0.98, 0.84 + numeric(row.rank_score) / 20),
  };
}

export async function retrieveRetailOverlaySources(
  tenant: CanonicalTenant | null | undefined,
  query: string,
  category: QuestionCategory,
  limit = 5,
): Promise<AskSource[]> {
  if (!isRetailTenant(tenant)) return [];
  const overlayContract = getRequiredOverlayPacksForCategory(category, 'retail');
  if (!overlayContract) return [];

  const requiredPacks = overlayContract.requiredPacks.slice(0, 8);
  const searchQuery = buildSearchQuery(query);
  const maxRows = Math.min(Math.max(limit, 1), 8);
  const rows = await azureRead.query<RetailOverlayRow>(
    `
      WITH ranked AS (
        SELECT
          chunk_id,
          chunk_text,
          source_doc,
          chunk_metadata->>'source_pack' AS source_pack,
          chunk_metadata->>'source_super_category' AS source_super_category,
          chunk_metadata->>'pattern_id' AS pattern_id,
          chunk_metadata->>'chunk_role' AS chunk_role,
          (
            ts_rank_cd(
              to_tsvector('english', coalesce(chunk_text, '')),
              websearch_to_tsquery('english', $3)
            )
            + CASE WHEN chunk_metadata->>'source_pack' = ANY($4::text[]) THEN 0.08 ELSE 0 END
            + CASE WHEN chunk_metadata->>'chunk_role' = 'pattern' THEN 0.02 ELSE 0 END
          ) AS rank_score
        FROM public.enterprise_context_chunks
        WHERE tenant_key = $1
          AND chunk_metadata->>'overlay_namespace' = $2
          AND embedding_status = 'embedded'
          AND (
            chunk_metadata->>'source_pack' = ANY($4::text[])
            OR to_tsvector('english', coalesce(chunk_text, '')) @@ websearch_to_tsquery('english', $3)
            OR chunk_text ILIKE '%' || $3 || '%'
          )
      )
      SELECT *
        FROM ranked
       ORDER BY rank_score DESC, chunk_id ASC
       LIMIT $5
    `,
    [
      tenant.canonicalKey,
      overlayContract.overlayNamespace,
      searchQuery,
      requiredPacks,
      maxRows,
    ],
    { missingTable: 'empty' },
  ).catch(() => []);

  return rows.map(sourceFromRow);
}
