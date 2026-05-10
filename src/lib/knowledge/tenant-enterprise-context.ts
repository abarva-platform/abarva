import 'server-only';

import { getTenantDataAdapter, type ContextChunk, type SegmentId } from '@/lib/knowledge/tenant-data';

export interface TenantEnterpriseSource {
  type: 'TENANT';
  name: string;
  id: string;
  detail: string;
  confidence: number;
}

const ENTERPRISE_QUERY_RE =
  /\b(profile|company|enterprise|tenant|organization|organisation|org|structure|leadership|leader|team|cxo|cio|cdio|cto|cmio|cfo|svp|vp|director|reports?\s+to|owner|sponsor|budget|spend|financials?|capex|opex|capital|funding|approval|approver|authority|fy\s*26|fy2026|current\s+state|what\s+do\s+you\s+know)\b/i;

const OFF_DOMAIN_GENERAL_KNOWLEDGE_RE =
  /^\s*(?:what|where)\s+(?:is|are)\s+the\s+capital\s+of\b/i;

const SEGMENT_LABELS: Record<string, string> = {
  enterprise_profile: 'Enterprise profile',
  org_structure: 'Org structure and leadership',
  it_financials: 'IT financials and funding authority',
  it_landscape: 'IT landscape',
  program_inventory: 'Program inventory',
};

const SEGMENT_LIMITS: Partial<Record<SegmentId, number>> = {
  enterprise_profile: 8,
  org_structure: 36,
  it_financials: 48,
  it_landscape: 32,
  program_inventory: 12,
};

const STOPWORDS = new Set([
  'about',
  'across',
  'after',
  'again',
  'also',
  'and',
  'any',
  'are',
  'budget',
  'can',
  'current',
  'does',
  'for',
  'from',
  'have',
  'how',
  'into',
  'know',
  'our',
  'tell',
  'team',
  'that',
  'the',
  'their',
  'this',
  'what',
  'with',
  'you',
]);

export function isTenantEnterpriseQuestion(query: string): boolean {
  const trimmed = query.trim();
  if (OFF_DOMAIN_GENERAL_KNOWLEDGE_RE.test(trimmed)) return false;
  return ENTERPRISE_QUERY_RE.test(trimmed);
}

export function selectTenantEnterpriseSegments(query: string): SegmentId[] {
  const normalized = query.toLowerCase();
  const segments: SegmentId[] = [];

  if (/\b(profile|company|enterprise|tenant|organization|organisation|who are we|what do you know)\b/.test(normalized)) {
    segments.push('enterprise_profile');
  }
  if (/\b(org|organization|organisation|structure|leadership|leader|team|cxo|cio|cdio|cto|cmio|cfo|svp|vp|director|reports?\s+to|owner|sponsor|who)\b/.test(normalized)) {
    segments.push('org_structure');
  }
  if (/\b(budget|spend|financials?|capex|opex|capital|funding|approval|approver|authority|fy\s*26|fy2026|run|change|transform)\b/.test(normalized)) {
    segments.push('it_financials');
  }
  if (/\b(technology|tech|system|platform|cloud|data|analytics|warehouse|lakehouse|bi|ml|ai|vendor|application)\b/.test(normalized)) {
    segments.push('it_landscape');
  }
  if (/\b(program|initiative|move|in[-\s]?flight|portfolio|roadmap)\b/.test(normalized)) {
    segments.push('program_inventory');
  }

  if (segments.length === 0 && isTenantEnterpriseQuestion(query)) {
    segments.push('enterprise_profile', 'org_structure', 'it_financials');
  }

  return [...new Set(segments)];
}

export async function retrieveTenantEnterpriseSources(
  tenantKey: string | null | undefined,
  query: string,
  opts: { perSegment?: number } = {},
): Promise<TenantEnterpriseSource[]> {
  if (!tenantKey || !isTenantEnterpriseQuestion(query)) return [];

  const segments = selectTenantEnterpriseSegments(query);
  if (segments.length === 0) return [];

  try {
    const adapter = getTenantDataAdapter();
    const grouped = await Promise.all(
      segments.map(async (segmentId) => {
        const chunks = await adapter.listContextChunks(tenantKey, {
          segmentIds: [segmentId],
          limit: SEGMENT_LIMITS[segmentId] ?? 24,
        });
        return {
          segmentId,
          chunks: rankChunks(chunks, query, segmentId).slice(0, opts.perSegment ?? 4),
        };
      }),
    );

    return grouped
      .filter((group) => group.chunks.length > 0)
      .map((group) => ({
        type: 'TENANT' as const,
        name: `${SEGMENT_LABELS[group.segmentId] ?? group.segmentId} (${tenantKey})`,
        id: `${tenantKey}:${group.segmentId}`,
        detail: [
          `${SEGMENT_LABELS[group.segmentId] ?? group.segmentId} records for ${tenantKey}.`,
          'Use these persisted setup-data chunks before saying tenant profile, org structure, budget, or system context is unavailable.',
          ...group.chunks.map(formatChunk),
        ].join('\n- '),
        confidence: 0.94,
      }));
  } catch {
    return [];
  }
}

function rankChunks(chunks: ContextChunk[], query: string, segmentId: SegmentId): ContextChunk[] {
  return chunks
    .map((chunk, index) => ({
      chunk,
      score: scoreChunk(chunk, query, segmentId) - index * 0.001,
    }))
    .filter((item) => item.chunk.text.trim().length > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.chunk);
}

function scoreChunk(chunk: ContextChunk, query: string, segmentId: SegmentId): number {
  const normalizedQuery = query.toLowerCase();
  const haystack = `${chunk.sourceDoc ?? ''} ${chunk.recordId ?? ''} ${chunk.text}`.toLowerCase();
  const terms = tokenize(normalizedQuery);
  let score = 0;

  for (const term of terms) {
    if (haystack.includes(term)) score += term.length > 5 ? 3 : 2;
  }

  if (segmentId === 'org_structure' && /\b(leadership|leader|team|cxo|cio|cdio|cmio|svp|vp|director|reports?|owner|sponsor|who)\b/.test(normalizedQuery)) {
    score += 8;
  }
  if (segmentId === 'it_financials' && /\b(budget|spend|financial|capex|opex|capital|funding|approval|authority|fy\s*26|fy2026)\b/.test(normalizedQuery)) {
    score += 8;
  }
  if (segmentId === 'enterprise_profile' && /\b(profile|company|enterprise|tenant|what\s+do\s+you\s+know)\b/.test(normalizedQuery)) {
    score += 5;
  }
  if (segmentId === 'it_landscape' && /\b(data|analytics|technology|system|platform|cloud|vendor)\b/.test(normalizedQuery)) {
    score += 6;
  }

  if (/\b(cio|cdio|cto|cmio|cfo)\b/.test(haystack)) score += 2;
  if (/\b(fy2026|fy26|budget|capex|opex)\b/.test(haystack)) score += 2;

  return score;
}

function formatChunk(chunk: ContextChunk): string {
  const doc = chunk.sourceDoc ? `${chunk.sourceDoc}: ` : '';
  const text = normalizeLegacyClientAliases(chunk.text).replace(/\s+/g, ' ').trim();
  const clipped = text.length > 460 ? `${text.slice(0, 457).replace(/\s+\S*$/, '')}...` : text;
  return `${doc}${clipped}`;
}

function normalizeLegacyClientAliases(text: string): string {
  return text
    .replace(/\bAsterline Retail Group\b/g, 'Apex Retail Group')
    .replace(/\bAsterline Retail\b/g, 'Apex Retail')
    .replace(/\bHeliara Health Alliance\b/g, 'Meridian Health')
    .replace(/\bHeliara Health\b/g, 'Meridian Health')
    .replace(/\bBrindlemark Financial Group\b/g, 'First Capital Financial')
    .replace(/\bBrindlemark Financial\b/g, 'First Capital Financial')
    .replace(/\bBrindlemark\b/g, 'First Capital');
}

function tokenize(value: string): string[] {
  return value
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}
