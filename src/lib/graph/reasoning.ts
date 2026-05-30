import { azureRead } from '@/lib/data-plane/azureRead';

export interface UseCaseReasoningResult {
  useCase: Record<string, unknown>;
  vendorStack: Array<{ vendor: Record<string, unknown>; product: Record<string, unknown>; posture: Record<string, unknown> }>;
  regulations: Array<{ regulation: Record<string, unknown>; section: Record<string, unknown> }>;
  patterns: Array<{ pattern: Record<string, unknown>; violates: Record<string, unknown> }>;
  benchmarks: Array<Record<string, unknown>>;
  peerEngagementsSamePattern: number;
}

export interface VendorRiskProfile {
  vendor: Record<string, unknown>;
  posture: Record<string, unknown>;
  compliesWith: string[];
  applicableRegulations: string[];
}

export interface PeerBenchmarkResult {
  benchmark: Record<string, unknown>;
  clientValue: number;
  percentile: number | null;
}

export interface PatternHistoryResult {
  failureRate: number | null;
  totalEngagements: number;
  succeeded: number;
  failed: number;
  recent: Array<{ engagement: string; client: string | null; outcome: string | null }>;
}

export interface ApplicableRegulation {
  code: string;
  name: string;
  jurisdiction: string | null;
  relevantSections: Array<{ code: string; title: string }>;
}

export interface CrossClientLearning {
  engagementId: string;
  outcome: string | null;
  lesson: string | null;
  coTriggeredPatterns: string[];
  useCases: string[];
}

function numeric(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function computePercentile(clientValue: number, b: Record<string, unknown>): number | null {
  const median = typeof b.national_median === 'number' ? b.national_median : null;
  const p25 = typeof b.p25 === 'number' ? b.p25 : null;
  const p75 = typeof b.p75 === 'number' ? b.p75 : null;
  if (median == null) return null;
  if (p25 != null && clientValue <= p25) return 25;
  if (p75 != null && clientValue >= p75) return 75;
  if (clientValue < median) return 40;
  if (clientValue > median) return 60;
  return 50;
}

export async function getUseCaseReasoning(useCaseId: string): Promise<UseCaseReasoningResult | null> {
  const row = await azureRead.maybeSingle<Record<string, unknown>>({
    table: 'use_cases',
    columns: '*',
    where: { id: useCaseId },
    missingTable: 'empty',
  }).catch(() => null);
  if (!row) return null;

  return {
    useCase: row,
    vendorStack: [],
    regulations: [],
    patterns: [],
    benchmarks: [],
    peerEngagementsSamePattern: 0,
  };
}

export async function getVendorRiskProfile(
  vendorName: string,
  clientIndustry: string,
  dataClasses: string[],
): Promise<VendorRiskProfile | null> {
  const row = await azureRead.maybeSingle<Record<string, unknown>>({
    table: 'vendor_contracts',
    columns: '*',
    where: { vendor: vendorName },
    missingTable: 'empty',
  }).catch(() => null);
  if (!row) return null;
  return {
    vendor: row,
    posture: {
      clientIndustry,
      dataClasses,
      source: 'azure_postgres_vendor_contracts',
    },
    compliesWith: [],
    applicableRegulations: [],
  };
}

export async function getPeerBenchmark(
  metricName: string,
  industry: string,
  clientValue: number,
): Promise<PeerBenchmarkResult | null> {
  const row = await azureRead.maybeSingle<Record<string, unknown>>({
    table: 'benchmarks',
    columns: '*',
    where: { metric_name: { op: 'ilike', value: `%${metricName}%` }, industry_code: industry },
    orderBy: { column: 'as_of_date', direction: 'desc', nulls: 'last' },
    missingTable: 'empty',
  }).catch(() => null);
  if (!row) return null;
  return { benchmark: row, clientValue, percentile: computePercentile(clientValue, row) };
}

export async function getPatternHistory(
  patternCode: string,
  industry?: string,
): Promise<PatternHistoryResult | null> {
  const pattern = await azureRead.maybeSingle<Record<string, unknown>>({
    table: 'genome_patterns',
    columns: ['code', 'failure_rate_pct'],
    where: { code: patternCode },
    missingTable: 'empty',
  }).catch(() => null);
  if (!pattern) return null;
  const rows = await azureRead.query<{ engagement_id: string | null; outcome: string | null; lesson: string | null }>(
    `
      SELECT
        from_node_id AS engagement_id,
        properties->>'outcome' AS outcome,
        properties->>'lesson' AS lesson
      FROM enterprise_graph_edges
      WHERE to_node_id = $1
        AND edge_type IN ('SURFACED', 'TRIGGERED', 'cites_pattern', 'pattern_signal')
        AND ($2::text IS NULL OR tenant_key = $2 OR properties->>'industry' = $2)
      LIMIT 5
    `,
    [patternCode, industry ?? null],
    { missingTable: 'empty' },
  ).catch(() => []);
  return {
    failureRate: pattern.failure_rate_pct == null ? null : numeric(pattern.failure_rate_pct),
    totalEngagements: rows.length,
    succeeded: rows.filter((row) => row.outcome === 'succeeded').length,
    failed: rows.filter((row) => row.outcome === 'failed').length,
    recent: rows.map((row) => ({
      engagement: row.engagement_id ?? '',
      client: null,
      outcome: row.outcome,
    })),
  };
}

export async function getApplicableRegulations(
  industryCode: string,
  topicKeys?: string[],
): Promise<ApplicableRegulation[]> {
  const rows = await azureRead.query<Record<string, unknown>>(
    `
      SELECT code, name, jurisdiction, sections
      FROM regulations
      WHERE industry_code = $1
        AND ($2::text[] IS NULL OR topic_keys && $2::text[])
      ORDER BY code ASC
      LIMIT 50
    `,
    [industryCode, topicKeys && topicKeys.length ? topicKeys : null],
    { missingTable: 'empty' },
  ).catch(() => []);

  return rows.map((row) => ({
    code: String(row.code ?? ''),
    name: String(row.name ?? ''),
    jurisdiction: typeof row.jurisdiction === 'string' ? row.jurisdiction : null,
    relevantSections: Array.isArray(row.sections)
      ? row.sections
          .filter((section): section is { code?: unknown; title?: unknown } => typeof section === 'object' && section !== null)
          .map((section) => ({ code: String(section.code ?? ''), title: String(section.title ?? '') }))
      : [],
  })).filter((row) => row.code.length > 0);
}

export async function getCrossClientLearning(
  currentEngagementId: string,
  patternCode: string,
): Promise<CrossClientLearning[]> {
  const rows = await azureRead.query<{
    engagement_id: string | null;
    outcome: string | null;
    lesson: string | null;
    co_triggered: string[] | null;
    use_cases: string[] | null;
  }>(
    `
      SELECT
        from_node_id AS engagement_id,
        properties->>'outcome' AS outcome,
        properties->>'lesson' AS lesson,
        ARRAY[]::text[] AS co_triggered,
        ARRAY[]::text[] AS use_cases
      FROM enterprise_graph_edges
      WHERE to_node_id = $2
        AND from_node_id <> $1
        AND edge_type IN ('SURFACED', 'TRIGGERED', 'cites_pattern', 'pattern_signal')
      LIMIT 5
    `,
    [currentEngagementId, patternCode],
    { missingTable: 'empty' },
  ).catch(() => []);

  return rows.map((row) => ({
    engagementId: row.engagement_id ?? '',
    outcome: row.outcome,
    lesson: row.lesson,
    coTriggeredPatterns: row.co_triggered ?? [],
    useCases: row.use_cases ?? [],
  })).filter((row) => row.engagementId.length > 0);
}
