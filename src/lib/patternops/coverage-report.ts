import { azureRead, type AzureReadClient } from '@/lib/data-plane/azureRead';

export interface PatternOpsGenomeCoverageRow {
  vertical: string;
  enterpriseArea: string;
  patternCount: number;
  demoRelevantCount: number;
  aiPatternCount: number;
  reviewedCount: number;
  averageQualityScore: number | null;
}

export interface PatternOpsCorpusCoverageRow {
  source: 'corpus_patterns' | 'canonical_industry_ai_patterns';
  category: string;
  status: string;
  patternCount: number;
  averageConfidence: number | null;
}

export interface PatternOpsTenantContextRow {
  clientId: string;
  chunkCount: number;
  embeddedCount: number;
  sourceFileCount: number;
}

export interface PatternOpsCoverageReport {
  generatedAt: string;
  genomeCoverage: PatternOpsGenomeCoverageRow[];
  corpusCoverage: PatternOpsCorpusCoverageRow[];
  tenantContext: PatternOpsTenantContextRow[];
  totals: {
    genomePatterns: number;
    aiPatterns: number;
    demoRelevantPatterns: number;
    corpusPatterns: number;
    tenantContextChunks: number;
    embeddedTenantContextChunks: number;
  };
}

interface GenomeCoverageDbRow {
  vertical: string | null;
  enterprise_area: string | null;
  pattern_count: string | number;
  demo_relevant_count: string | number;
  ai_pattern_count: string | number;
  reviewed_count: string | number;
  average_quality_score: string | number | null;
}

interface CorpusCoverageDbRow {
  source: PatternOpsCorpusCoverageRow['source'];
  category: string | null;
  status: string | null;
  pattern_count: string | number;
  average_confidence: string | number | null;
}

interface TenantContextDbRow {
  client_id: string | null;
  chunk_count: string | number;
  embedded_count: string | number;
  source_file_count: string | number;
}

function numberValue(value: string | number | null | undefined, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function nullableNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = numberValue(value, Number.NaN);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

function sum(rows: readonly { patternCount?: number; chunkCount?: number; embeddedCount?: number; aiPatternCount?: number; demoRelevantCount?: number }[], key: 'patternCount' | 'chunkCount' | 'embeddedCount' | 'aiPatternCount' | 'demoRelevantCount'): number {
  return rows.reduce((total, row) => total + (row[key] ?? 0), 0);
}

async function safeQuery<R>(
  client: AzureReadClient,
  sql: string,
  params: readonly unknown[] = [],
): Promise<R[]> {
  return client.query<R>(sql, params, { missingTable: 'empty' }).catch(() => []);
}

export async function getPatternOpsCoverageReport(
  client: AzureReadClient = azureRead,
  now: Date = new Date(),
): Promise<PatternOpsCoverageReport> {
  const genomeRows = await safeQuery<GenomeCoverageDbRow>(
    client,
    `
      SELECT
        COALESCE(vertical, data->>'vertical', 'unknown') AS vertical,
        COALESCE(office_category, data->>'office_category', sub_category, 'unknown') AS enterprise_area,
        count(*)::int AS pattern_count,
        count(*) FILTER (WHERE lower(COALESCE(data->>'demo_relevant', 'false')) = 'true')::int AS demo_relevant_count,
        count(*) FILTER (WHERE NULLIF(data->>'ai_capability_type', '') IS NOT NULL)::int AS ai_pattern_count,
        count(*) FILTER (WHERE COALESCE(data->>'curation_status', '') IN ('reviewed', 'trusted'))::int AS reviewed_count,
        avg(NULLIF(data->>'quality_score', '')::numeric)::float AS average_quality_score
      FROM public.genome_patterns
      GROUP BY 1, 2
      ORDER BY 1, 2
    `,
  );

  const corpusRows = await safeQuery<CorpusCoverageDbRow>(
    client,
    `
      SELECT
        'corpus_patterns'::text AS source,
        COALESCE(category, 'uncategorized') AS category,
        COALESCE(status, 'unknown') AS status,
        count(*)::int AS pattern_count,
        avg(confidence)::float AS average_confidence
      FROM public.corpus_patterns
      GROUP BY 1, 2, 3
      ORDER BY 1, 2, 3
    `,
  );

  const canonicalRows = await safeQuery<CorpusCoverageDbRow>(
    client,
    `
      SELECT
        'canonical_industry_ai_patterns'::text AS source,
        COALESCE(industry, 'uncategorized') AS category,
        COALESCE(status, 'unknown') AS status,
        count(*)::int AS pattern_count,
        avg(confidence)::float AS average_confidence
      FROM public.canonical_industry_ai_patterns
      GROUP BY 1, 2, 3
      ORDER BY 1, 2, 3
    `,
  );

  const tenantRows = await safeQuery<TenantContextDbRow>(
    client,
    `
      SELECT
        COALESCE(client_id, tenant_key, 'unknown') AS client_id,
        count(*)::int AS chunk_count,
        count(*) FILTER (WHERE embedding IS NOT NULL)::int AS embedded_count,
        count(DISTINCT source_file_id)::int AS source_file_count
      FROM public.enterprise_context_chunks
      GROUP BY 1
      ORDER BY chunk_count DESC
    `,
  );

  const genomeCoverage = genomeRows.map((row) => ({
    vertical: row.vertical ?? 'unknown',
    enterpriseArea: row.enterprise_area ?? 'unknown',
    patternCount: numberValue(row.pattern_count),
    demoRelevantCount: numberValue(row.demo_relevant_count),
    aiPatternCount: numberValue(row.ai_pattern_count),
    reviewedCount: numberValue(row.reviewed_count),
    averageQualityScore: nullableNumber(row.average_quality_score),
  }));

  const corpusCoverage = [...corpusRows, ...canonicalRows].map((row) => ({
    source: row.source,
    category: row.category ?? 'uncategorized',
    status: row.status ?? 'unknown',
    patternCount: numberValue(row.pattern_count),
    averageConfidence: nullableNumber(row.average_confidence),
  }));

  const tenantContext = tenantRows.map((row) => ({
    clientId: row.client_id ?? 'unknown',
    chunkCount: numberValue(row.chunk_count),
    embeddedCount: numberValue(row.embedded_count),
    sourceFileCount: numberValue(row.source_file_count),
  }));

  return {
    generatedAt: now.toISOString(),
    genomeCoverage,
    corpusCoverage,
    tenantContext,
    totals: {
      genomePatterns: sum(genomeCoverage, 'patternCount'),
      aiPatterns: sum(genomeCoverage, 'aiPatternCount'),
      demoRelevantPatterns: sum(genomeCoverage, 'demoRelevantCount'),
      corpusPatterns: sum(corpusCoverage, 'patternCount'),
      tenantContextChunks: sum(tenantContext, 'chunkCount'),
      embeddedTenantContextChunks: sum(tenantContext, 'embeddedCount'),
    },
  };
}
