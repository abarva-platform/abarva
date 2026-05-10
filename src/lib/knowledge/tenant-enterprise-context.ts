import 'server-only';

import {
  getTenantDataAdapter,
  type ContextChunk,
  type GraphNode,
  type SegmentId,
} from '@/lib/knowledge/tenant-data';

export interface TenantEnterpriseSource {
  type: 'TENANT';
  name: string;
  id: string;
  detail: string;
  confidence: number;
}

const ENTERPRISE_QUERY_RE =
  /\b(profile|company|enterprise|tenant|organization|organisation|org|structure|leadership|leaders?|executive|executives|business|function\s+leads?|c[-\s]?level|cxo|cio|cdio|cto|cmio|cmo|cno|coo|ceo|cfo|svp|vp|director|direct\s+reports?|reports?|reports?\s+to|owner|sponsor|budget|spend|financials?|capex|opex|capital|funding|approval|approver|authority|fy\s*26|fy2026|current\s+state|what\s+do\s+you\s+know)\b/i;

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
  if (/\b(org|organization|organisation|structure|leadership|leaders?|executive|executives|business|function\s+leads?|c[-\s]?level|team|cxo|cio|cdio|cto|cmio|cmo|cno|coo|ceo|cfo|svp|vp|director|reports?\s+to|owner|sponsor|who)\b/.test(normalized)) {
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
  opts: {
    perSegment?: number;
    activePersonGraphNodeId?: string | null;
    activePersonDisplayName?: string | null;
    userContextBlock?: string | null;
  } = {},
): Promise<TenantEnterpriseSource[]> {
  if (!tenantKey || !isTenantEnterpriseQuestion(query)) return [];

  const segments = selectTenantEnterpriseSegments(query);
  if (segments.length === 0) return [];

  try {
    const adapter = getTenantDataAdapter();
    const [directReportSource, cLevelSource, grouped] = await Promise.all([
      retrieveDirectReportsSource(tenantKey, query, opts),
      retrieveCLevelLeaderSource(tenantKey, query),
      Promise.all(segments.map(async (segmentId) => {
        const chunks = await adapter.listContextChunks(tenantKey, {
          segmentIds: [segmentId],
          limit: SEGMENT_LIMITS[segmentId] ?? 24,
        });
        return {
          segmentId,
          chunks: rankChunks(chunks, query, segmentId).slice(0, opts.perSegment ?? 4),
        };
      })),
    ]);

    const segmentSources = grouped
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

    return [directReportSource, cLevelSource, ...segmentSources]
      .filter((source): source is TenantEnterpriseSource => Boolean(source));
  } catch {
    return [];
  }
}

function isDirectReportsQuestion(query: string): boolean {
  return /\b(my\s+)?direct\s+reports?\b|\bwho\s+reports?\s+to\s+(?:me|my|the|[a-z])|\breports?\s+to\s+me\b/i.test(query);
}

function isCLevelLeaderQuestion(query: string): boolean {
  return /\b(c[-\s]?level|c-suite|executive\s+bench|executives?|business\s+leaders?|business\s+leadership|ceo|cfo|coo|cmo|cno|cmio|chief)\b/i.test(query);
}

async function retrieveCLevelLeaderSource(
  tenantKey: string,
  query: string,
): Promise<TenantEnterpriseSource | null> {
  if (!isCLevelLeaderQuestion(query)) return null;

  const adapter = getTenantDataAdapter();
  const chunks = await adapter.listContextChunks(tenantKey, {
    segmentIds: ['org_structure'],
    limit: 180,
  });
  const businessOnly = /\bbusiness\b/i.test(query);
  const lines = chunks
    .map((chunk) => parsePersonRecordFromChunk(chunk))
    .filter((record): record is PersonRecord => Boolean(record))
    .filter((record) => isCLevelRecord(record, businessOnly))
    .map(formatPersonRecord)
    .filter((line, index, all) => all.indexOf(line) === index)
    .sort((a, b) => a.localeCompare(b));

  if (lines.length === 0) return null;

  return {
    type: 'TENANT',
    name: `C-level and business leaders (${tenantKey})`,
    id: `${tenantKey}:c_level_business_leaders`,
    detail: [
      businessOnly
        ? `Business-side C-level and executive leaders visible in ${tenantKey}'s persisted org structure.`
        : `C-level and executive leaders visible in ${tenantKey}'s persisted org structure.`,
      'This is an in-domain tenant org-structure lookup. Answer it directly; do not say the executive bench is unavailable.',
      ...lines,
    ].join('\n- '),
    confidence: 0.96,
  };
}

interface PersonRecord {
  id: string | null;
  name: string | null;
  title: string | null;
  scope: string | null;
  reportsTo: string | null;
  sourceDoc: string | null;
}

function parsePersonRecordFromChunk(chunk: ContextChunk): PersonRecord | null {
  const normalized = normalizeLegacyClientAliases(chunk.text).replace(/\s+/g, ' ').trim();
  const id = readFlattenedField(normalized, 'id') ?? readJsonLikeField(normalized, 'id');
  const name = readFlattenedField(normalized, 'full_name')
    ?? readFlattenedField(normalized, 'name')
    ?? readJsonLikeField(normalized, 'full_name')
    ?? readJsonLikeField(normalized, 'name');
  const title = readFlattenedField(normalized, 'title')
    ?? readFlattenedField(normalized, 'role')
    ?? readJsonLikeField(normalized, 'title')
    ?? readJsonLikeField(normalized, 'role');
  const scope = readFlattenedField(normalized, 'scope')
    ?? readFlattenedField(normalized, 'role_scope')
    ?? readJsonLikeField(normalized, 'scope')
    ?? readJsonLikeField(normalized, 'role_scope');
  const reportsTo = readFlattenedField(normalized, 'reports_to') ?? readJsonLikeField(normalized, 'reports_to');
  if (!name && !title) return null;
  return { id, name, title, scope, reportsTo, sourceDoc: chunk.sourceDoc ?? null };
}

function isCLevelRecord(record: PersonRecord, businessOnly: boolean): boolean {
  const title = record.title ?? '';
  const isExecutive = /\b(chief|ceo|cfo|coo|cmo|cno|cmio|president|general counsel|board chair)\b/i.test(title);
  if (!isExecutive) return false;
  if (/\b(associate|assistant|deputy)\b/i.test(title)) return false;
  if (!businessOnly) return true;
  if (/\bboard chair\b/i.test(title)) return false;
  return !/\b(digital|information|technology|cio|cdio|cto|ciso|data|analytics|security)\b/i.test(title);
}

function formatPersonRecord(record: PersonRecord): string {
  return [
    record.name,
    record.title,
    record.scope ? `scope: ${record.scope}` : null,
    record.reportsTo ? `reports_to: ${record.reportsTo}` : null,
  ].filter(Boolean).join(' — ');
}

async function retrieveDirectReportsSource(
  tenantKey: string,
  query: string,
  opts: {
    activePersonGraphNodeId?: string | null;
    activePersonDisplayName?: string | null;
    userContextBlock?: string | null;
  },
): Promise<TenantEnterpriseSource | null> {
  if (!isDirectReportsQuestion(query)) return null;

  const adapter = getTenantDataAdapter();
  const people = await adapter.listGraphNodes(tenantKey, 'person');
  const activePerson = findActivePersonNode(people, opts);
  const activeNodeId = activePerson?.nodeId ?? opts.activePersonGraphNodeId?.trim() ?? null;

  if (activePerson) {
    const incoming = await adapter.listGraphEdgesForNode(tenantKey, activePerson.nodeId, 'incoming');
    const reportIds = new Set(
      incoming
        .filter((edge) => edge.kind === 'REPORTS_TO')
        .map((edge) => edge.fromNodeId),
    );
    const reports = people
      .filter((person) => reportIds.has(person.nodeId))
      .sort((a, b) => a.title.localeCompare(b.title));

    if (reports.length > 0) {
      return buildDirectReportsSource({
        tenantKey,
        activePersonLabel: formatPersonNode(activePerson),
        activePersonNodeId: activePerson.nodeId,
        reportLines: reports.map((person) => formatPersonNode(person)),
        confidence: 0.98,
      });
    }
  }

  if (!activeNodeId) return null;

  const chunks = await adapter.listContextChunks(tenantKey, {
    segmentIds: ['org_structure'],
    limit: 160,
  });
  const reportLines = chunks
    .filter((chunk) => chunkReportsTo(chunk, activeNodeId))
    .map((chunk) => parsePersonLineFromChunk(chunk))
    .filter((line): line is string => Boolean(line))
    .filter((line, index, all) => all.indexOf(line) === index)
    .sort((a, b) => a.localeCompare(b));

  if (reportLines.length === 0) return null;

  return buildDirectReportsSource({
    tenantKey,
    activePersonLabel: opts.activePersonDisplayName ?? extractUserDisplayName(opts.userContextBlock) ?? activeNodeId,
    activePersonNodeId: activeNodeId,
    reportLines,
    confidence: 0.95,
  });
}

function buildDirectReportsSource(args: {
  tenantKey: string;
  activePersonLabel: string;
  activePersonNodeId: string;
  reportLines: string[];
  confidence: number;
}): TenantEnterpriseSource {
  return {
    type: 'TENANT',
    name: `Direct reports (${args.tenantKey})`,
    id: `${args.tenantKey}:direct_reports:${args.activePersonNodeId}`,
    detail: [
      `Direct reports view for ${args.activePersonLabel}.`,
      'This is an in-domain tenant org-structure lookup. Answer it directly; do not redirect as HR/admin.',
      ...args.reportLines,
    ].join('\n- '),
    confidence: args.confidence,
  };
}

function chunkReportsTo(chunk: ContextChunk, activeNodeId: string): boolean {
  const text = chunk.text.toLowerCase();
  const target = activeNodeId.toLowerCase();
  return text.includes(`reports_to: ${target}`)
    || text.includes(`"reports_to": "${target}"`)
    || text.includes(`reports_to ${target}`);
}

function parsePersonLineFromChunk(chunk: ContextChunk): string | null {
  const record = parsePersonRecordFromChunk(chunk);
  if (record) return [record.name, record.title, record.scope ? `scope: ${record.scope}` : null].filter(Boolean).join(' — ');
  return normalizeLegacyClientAliases(chunk.text).replace(/\s+/g, ' ').trim().slice(0, 220);
}

function readFlattenedField(text: string, field: string): string | null {
  const match = text.match(new RegExp(`(?:^| )${field}: ([^:]+?)(?= [a-zA-Z_]+: |$)`));
  return match?.[1]?.trim().replace(/^"|"$/g, '') ?? null;
}

function readJsonLikeField(text: string, field: string): string | null {
  const match = text.match(new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`));
  return match?.[1]?.trim() ?? null;
}

function findActivePersonNode(
  people: GraphNode[],
  opts: {
    activePersonGraphNodeId?: string | null;
    activePersonDisplayName?: string | null;
    userContextBlock?: string | null;
  },
): GraphNode | null {
  const graphNodeId = opts.activePersonGraphNodeId?.trim();
  if (graphNodeId) {
    const exact = people.find((person) => person.nodeId === graphNodeId);
    if (exact) return exact;
  }

  const displayName = opts.activePersonDisplayName?.trim() || extractUserDisplayName(opts.userContextBlock);
  if (!displayName) return null;
  const normalizedDisplayName = normalizeName(displayName);
  return people.find((person) => normalizeName(person.title) === normalizedDisplayName)
    ?? people.find((person) => normalizeName(person.title).includes(normalizedDisplayName))
    ?? null;
}

function extractUserDisplayName(userContextBlock: string | null | undefined): string | null {
  if (!userContextBlock) return null;
  const firstLine = userContextBlock.split('\n').find((line) => line.startsWith('USER CONTEXT · '));
  const match = firstLine?.match(/^USER CONTEXT · ([^·]+?) · /);
  return match?.[1]?.trim() ?? null;
}

function formatPersonNode(person: GraphNode): string {
  const title = readStringPayload(person, 'title')
    ?? readStringPayload(person, 'role')
    ?? readStringPayload(person, 'job_title');
  const functionName = readStringPayload(person, 'function')
    ?? readStringPayload(person, 'domain')
    ?? readStringPayload(person, 'cxo_function');
  return [person.title, title, functionName].filter(Boolean).join(' — ');
}

function readStringPayload(node: GraphNode, key: string): string | null {
  const value = node.payload[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
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

  if (segmentId === 'org_structure' && /\b(leadership|leaders?|executive|executives|business|function\s+leads?|c[-\s]?level|team|cxo|cio|cdio|cmio|cmo|cno|coo|ceo|cfo|svp|vp|director|direct\s+reports?|reports?|owner|sponsor|who)\b/.test(normalizedQuery)) {
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
    .replace(/\bHeliara\b/g, 'Meridian')
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
