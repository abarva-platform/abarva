import 'server-only';

import { getTenantDataAdapter } from '@/lib/knowledge/tenant-data';
import type { TenantRecord } from '@/lib/knowledge/tenant-data/types';

export interface TenantTechnologySource {
  type: 'TENANT';
  name: string;
  id: string;
  detail: string;
  confidence: number;
}

const TECHNOLOGY_QUESTION_PATTERNS = [
  /\b(current state|today|what do we have|what technologies|tech stack|technology inventory|systems inventory)\b/i,
  /\b(data analytics|analytics platform|data platform|data stack|bi|business intelligence)\b/i,
  /\b(warehouse|lakehouse|snowflake|databricks|tableau|power bi|dbt|fivetran|etl|elt)\b/i,
  /\b(ml platform|ai platform|vector database|model platform|activation stack)\b/i,
];

const ANALYTICS_TERMS = [
  'analytics',
  'data',
  'bi',
  'business intelligence',
  'warehouse',
  'lakehouse',
  'integration',
  'transformation',
  'etl',
  'elt',
  'ml',
  'ai',
  'vector',
  'cdp',
  'measurement',
  'reporting',
];

const DETAIL_KEYS = [
  'vendor',
  'category',
  'domain',
  'deployment_model',
  'annual_cost_usd',
  'renewal_date',
  'business_criticality',
  'technical_debt_rating',
  'owner_id',
  'owner_person_id',
  'business_owner',
  'scope',
  'notes',
  'description',
];

export function isTenantTechnologyQuestion(query: string): boolean {
  const normalized = query.trim();
  if (!normalized) return false;
  return TECHNOLOGY_QUESTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function selectTenantTechnologyRecords(
  records: TenantRecord[],
  query: string,
  limit = 8,
): TenantRecord[] {
  const scored = records
    .filter((record) => record.segmentId === 'it_landscape')
    .map((record) => ({
      record,
      score: scoreTechnologyRecord(record, query),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title));

  return scored.slice(0, limit).map((item) => item.record);
}

export function formatTenantTechnologySource(record: TenantRecord): TenantTechnologySource {
  const payload = record.payload ?? {};
  const id = readString(payload.system_id) ?? record.recordId;
  const vendor = readString(payload.vendor);
  const category = readString(payload.category);
  const domain = readString(payload.domain);
  const deployment = readString(payload.deployment_model);
  const annualCost = readScalar(payload.annual_cost_usd);
  const renewalDate = readString(payload.renewal_date);
  const criticality = readString(payload.business_criticality) ?? readString(payload.criticality);
  const techDebt = readString(payload.technical_debt_rating);
  const owner =
    readString(payload.owner_id) ??
    readString(payload.owner_person_id) ??
    readString(payload.it_owner);
  const businessOwner = readString(payload.business_owner);
  const notes = readString(payload.notes) ?? readString(payload.description);

  const detail = [
    id,
    vendor ? `vendor ${vendor}` : null,
    category ? `category ${category}` : null,
    domain ? `domain ${domain}` : null,
    deployment ? `deployment ${deployment}` : null,
    annualCost !== undefined ? `annual cost ${formatMoney(annualCost)}` : null,
    renewalDate ? `renewal ${renewalDate}` : null,
    criticality ? `criticality ${criticality}` : null,
    techDebt ? `technical debt ${techDebt}` : null,
    owner ? `owner ${owner}` : null,
    businessOwner ? `business owner ${businessOwner}` : null,
    notes ? `note ${notes}` : null,
  ]
    .filter((piece): piece is string => Boolean(piece))
    .join('; ');

  return {
    type: 'TENANT',
    name: record.title,
    id,
    detail,
    confidence: record.confidence ?? 0.92,
  };
}

export async function retrieveTenantTechnologySources(
  tenantKey: string | null | undefined,
  query: string,
  opts: { limit?: number } = {},
): Promise<TenantTechnologySource[]> {
  if (!tenantKey || !isTenantTechnologyQuestion(query)) return [];

  try {
    const records = await getTenantDataAdapter().listRecords(tenantKey, 'it_landscape', {
      limit: 120,
    });
    return selectTenantTechnologyRecords(records, query, opts.limit ?? 8).map(
      formatTenantTechnologySource,
    );
  } catch {
    return [];
  }
}

export async function buildTenantTechnologyContextBlock(
  tenantKey: string | null | undefined,
  query: string,
  opts: { tenantName?: string | null; limit?: number } = {},
): Promise<string> {
  const sources = await retrieveTenantTechnologySources(tenantKey, query, {
    limit: opts.limit ?? 10,
  });
  if (sources.length === 0) return '';

  const title = opts.tenantName ? `${opts.tenantName} (${tenantKey})` : tenantKey;
  const lines = [
    `--- TENANT TECHNOLOGY CONTEXT: ${title} ---`,
    'Use these it_landscape records before saying the tenant technology inventory is unavailable. Cite system names and system ids in natural language when answering current-state technology questions.',
    ...sources.map((source) => `- ${source.name}: ${source.detail}`),
    '--- END TENANT TECHNOLOGY CONTEXT ---',
  ];
  return lines.join('\n');
}

function scoreTechnologyRecord(record: TenantRecord, query: string): number {
  const haystack = recordHaystack(record);
  const normalizedQuery = query.toLowerCase();
  const analyticsQuestion = ANALYTICS_TERMS.some((term) => normalizedQuery.includes(term));

  let score = 0;
  for (const term of ANALYTICS_TERMS) {
    if (haystack.includes(term)) score += analyticsQuestion ? 3 : 1;
  }

  for (const token of tokenize(normalizedQuery)) {
    if (token.length > 2 && haystack.includes(token)) score += 2;
  }

  const criticality = lower(readString(record.payload.business_criticality) ?? readString(record.payload.criticality));
  if (criticality === 'critical') score += 2;
  if (criticality === 'high') score += 1;

  const title = record.title.toLowerCase();
  if (/(snowflake|databricks|tableau|power bi|dbt|fivetran|airbyte|pinecone|segment|tealium|analytics)/i.test(title)) {
    score += 4;
  }

  return score;
}

function recordHaystack(record: TenantRecord): string {
  const payload = record.payload ?? {};
  return [
    record.title,
    record.recordId,
    record.recordKind,
    ...DETAIL_KEYS.map((key) => readScalar(payload[key])),
  ]
    .filter((piece): piece is string | number | boolean => piece !== undefined)
    .join(' ')
    .toLowerCase();
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readScalar(value: unknown): string | number | boolean | undefined {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return undefined;
}

function lower(value: string | undefined): string | undefined {
  return value?.toLowerCase();
}

function formatMoney(value: string | number | boolean): string {
  if (typeof value === 'number') return `$${value.toLocaleString('en-US')}`;
  if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
    return `$${Number(value).toLocaleString('en-US')}`;
  }
  return String(value);
}
