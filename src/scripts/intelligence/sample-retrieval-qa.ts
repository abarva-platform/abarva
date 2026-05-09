import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export const SAMPLE_RETRIEVAL_INPUT =
  'docs/knowledge-corpus/generated/canonical-corpus-backfill-preview.json';
export const SAMPLE_RETRIEVAL_REPORT =
  'docs/knowledge-corpus/SAMPLE_RETRIEVAL_QA_REPORT_2026-05-09.md';

type QueryStatus = 'pass' | 'fail' | 'no_match';

export interface PreviewRow {
  canonical_id: string;
  title: string;
  upsert_payload: Record<string, unknown>;
}

export interface PreviewReport {
  preview_rows?: PreviewRow[];
}

export interface SampleRetrievalExpectation {
  industry?: string;
  enterprise_area?: string;
  function_terms?: string[];
  process_terms?: string[];
  title_terms?: string[];
  kpi_minimum?: number;
}

export interface SampleRetrievalQuery {
  id: string;
  query: string;
  expectation: SampleRetrievalExpectation;
}

export interface SampleRetrievalHit {
  canonical_id: string;
  title: string;
  industry: string[];
  enterprise_area: string;
  function: string;
  process_area: string;
  primary_kpis: string[];
  secondary_kpis: string[];
  score: number;
  matched_terms: string[];
  passed_expectations: string[];
  failed_expectations: string[];
}

export interface SampleRetrievalCaseResult {
  id: string;
  query: string;
  status: QueryStatus;
  top_hit: SampleRetrievalHit | null;
  expected: SampleRetrievalExpectation;
  notes: string[];
}

export interface SampleRetrievalQaResult {
  generated_at: string;
  input_path: string;
  total_queries: number;
  pass_count: number;
  fail_count: number;
  no_match_count: number;
  cases: SampleRetrievalCaseResult[];
  no_match_case: SampleRetrievalCaseResult;
}

export const SAMPLE_RETRIEVAL_QUERIES: SampleRetrievalQuery[] = [
  {
    id: 'retail_store_operations',
    query: 'AI use cases for retail store operations',
    expectation: {
      industry: 'retail',
      function_terms: ['store', 'operations', 'allocation', 'clienteling'],
      process_terms: ['store', 'operations', 'clustering'],
      title_terms: ['store', 'operations', 'allocation', 'clienteling'],
    },
  },
  {
    id: 'healthcare_prior_auth',
    query: 'How should a payer use agentic AI for prior auth?',
    expectation: {
      industry: 'healthcare',
      title_terms: ['prior', 'authorization'],
      function_terms: ['utilization', 'industry_specific'],
      process_terms: ['utilization', 'authorization', 'industry_specific'],
    },
  },
  {
    id: 'financial_services_aml',
    query: 'Financial services AML agentic workflow',
    expectation: {
      industry: 'financial_services',
      title_terms: ['aml', 'bsa', 'compliance'],
      function_terms: ['financial_crimes', 'compliance'],
      process_terms: ['financial_crimes', 'compliance'],
    },
  },
  {
    id: 'healthcare_back_office_productivity',
    query: 'Back office AI productivity use cases for healthcare',
    expectation: {
      industry: 'healthcare',
      enterprise_area: 'back_office',
      function_terms: ['productivity', 'finance', 'hr', 'it', 'operations'],
      process_terms: ['productivity', 'finance', 'hr', 'it', 'operations'],
    },
  },
  {
    id: 'retail_merchandising',
    query: 'How should a retailer reimagine merchandising with AI?',
    expectation: {
      industry: 'retail',
      function_terms: ['merchandising', 'merchandise'],
      process_terms: ['merchandising', 'scenario', 'margin'],
      title_terms: ['merchandise', 'merchandising', 'margin'],
    },
  },
  {
    id: 'contact_center_kpis',
    query: 'What are the KPIs for AI-enabled contact center transformation?',
    expectation: {
      title_terms: ['contact', 'center'],
      function_terms: ['contact', 'service', 'ai_programs'],
      process_terms: ['contact', 'service', 'ai_programs'],
      kpi_minimum: 3,
    },
  },
];

const NO_MATCH_QUERY: SampleRetrievalQuery = {
  id: 'no_match_control',
  query: 'zzzxqv ploonth narvix',
  expectation: {
    title_terms: ['quantum', 'banana', 'lunar'],
  },
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/financial services/g, 'financial_services')
    .replace(/prior auth/g, 'prior authorization')
    .split(/[^a-z0-9_]+/g)
    .filter((term) => term.length > 1)
    .filter((term) => !['how', 'should', 'what', 'are', 'the', 'for', 'use', 'uses', 'with', 'and'].includes(term));
}

function payloadText(row: PreviewRow): string {
  const payload = row.upsert_payload;
  return [
    row.canonical_id,
    row.title,
    payload.title,
    payload.summary,
    payload.business_problem,
    payload.value_hypothesis,
    payload.function,
    payload.process_area,
    payload.use_case_category,
    ...asStringArray(payload.primary_kpis),
    ...asStringArray(payload.secondary_kpis),
    ...asStringArray(payload.required_data_domains),
    ...asStringArray(payload.common_failure_modes),
  ].join(' ').toLowerCase();
}

function termMatches(value: string, terms: string[] | undefined): boolean {
  if (!terms || terms.length === 0) return true;
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term.toLowerCase()));
}

function scoreRow(row: PreviewRow, query: SampleRetrievalQuery): SampleRetrievalHit {
  const payload = row.upsert_payload;
  const terms = tokenize(query.query);
  const haystack = payloadText(row);
  const matchedTerms = terms.filter((term) => haystack.includes(term));
  const industry = asStringArray(payload.industry);
  const enterpriseArea = asString(payload.enterprise_area);
  const functionName = asString(payload.function);
  const processArea = asString(payload.process_area);
  const title = asString(payload.title) || row.title;
  const primaryKpis = asStringArray(payload.primary_kpis);
  const secondaryKpis = asStringArray(payload.secondary_kpis);
  const allKpis = new Set([...primaryKpis, ...secondaryKpis]);

  let score = matchedTerms.length * 0.1;
  if (query.expectation.industry && industry.includes(query.expectation.industry)) score += 0.4;
  if (query.expectation.enterprise_area && enterpriseArea === query.expectation.enterprise_area) score += 0.25;
  if (query.expectation.function_terms && termMatches(functionName, query.expectation.function_terms)) score += 0.2;
  if (query.expectation.process_terms && termMatches(processArea, query.expectation.process_terms)) score += 0.2;
  if (query.expectation.title_terms && termMatches(title, query.expectation.title_terms)) score += 0.2;
  if (query.expectation.kpi_minimum && allKpis.size >= query.expectation.kpi_minimum) score += 0.2;

  const passed: string[] = [];
  const failed: string[] = [];
  if (query.expectation.industry) {
    (industry.includes(query.expectation.industry) ? passed : failed).push(`industry:${query.expectation.industry}`);
  }
  if (query.expectation.enterprise_area) {
    (enterpriseArea === query.expectation.enterprise_area ? passed : failed).push(`enterprise_area:${query.expectation.enterprise_area}`);
  }
  if (query.expectation.function_terms) {
    (termMatches(functionName, query.expectation.function_terms) ? passed : failed).push('function_terms');
  }
  if (query.expectation.process_terms) {
    (termMatches(processArea, query.expectation.process_terms) ? passed : failed).push('process_terms');
  }
  if (query.expectation.title_terms) {
    (termMatches(title, query.expectation.title_terms) ? passed : failed).push('title_terms');
  }
  if (query.expectation.kpi_minimum) {
    (allKpis.size >= query.expectation.kpi_minimum ? passed : failed).push(`kpi_minimum:${query.expectation.kpi_minimum}`);
  }

  return {
    canonical_id: row.canonical_id,
    title,
    industry,
    enterprise_area: enterpriseArea,
    function: functionName,
    process_area: processArea,
    primary_kpis: primaryKpis,
    secondary_kpis: secondaryKpis,
    score: Number(score.toFixed(3)),
    matched_terms: matchedTerms,
    passed_expectations: passed,
    failed_expectations: failed,
  };
}

export function evaluateSampleRetrievalQuery(
  rows: PreviewRow[],
  query: SampleRetrievalQuery,
): SampleRetrievalCaseResult {
  const hits = rows
    .map((row) => scoreRow(row, query))
    .filter((hit) => hit.matched_terms.length > 0 || hit.score >= 0.4)
    .sort((a, b) => b.score - a.score || a.canonical_id.localeCompare(b.canonical_id));
  const top = hits[0] ?? null;
  if (!top) {
    return {
      id: query.id,
      query: query.query,
      status: 'no_match',
      top_hit: null,
      expected: query.expectation,
      notes: ['No deterministic preview match above threshold.'],
    };
  }

  const status: QueryStatus = top.failed_expectations.length === 0 ? 'pass' : 'fail';
  return {
    id: query.id,
    query: query.query,
    status,
    top_hit: top,
    expected: query.expectation,
    notes: status === 'pass'
      ? ['Top hit satisfied configured expectations.']
      : [`Top hit missed: ${top.failed_expectations.join(', ')}.`],
  };
}

export function evaluateSampleRetrievalQa(
  preview: PreviewReport,
  inputPath = SAMPLE_RETRIEVAL_INPUT,
): SampleRetrievalQaResult {
  const rows = preview.preview_rows ?? [];
  const cases = SAMPLE_RETRIEVAL_QUERIES.map((query) => evaluateSampleRetrievalQuery(rows, query));
  const noMatchCase = evaluateSampleRetrievalQuery(rows, NO_MATCH_QUERY);

  return {
    generated_at: new Date().toISOString(),
    input_path: inputPath,
    total_queries: cases.length,
    pass_count: cases.filter((item) => item.status === 'pass').length,
    fail_count: cases.filter((item) => item.status === 'fail').length,
    no_match_count: cases.filter((item) => item.status === 'no_match').length,
    cases,
    no_match_case: {
      ...noMatchCase,
      status: noMatchCase.status === 'no_match' ? 'pass' : 'fail',
      notes: noMatchCase.status === 'no_match'
        ? ['No-match control behaved correctly.']
        : ['No-match control returned a hit and should be investigated.'],
    },
  };
}

function markdownTable(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map((cell) => cell.replace(/\n/g, '<br>')).join(' | ')} |`),
  ].join('\n');
}

function expectationSummary(expectation: SampleRetrievalExpectation): string {
  return Object.entries(expectation)
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join('/') : String(value)}`)
    .join('; ');
}

export function formatSampleRetrievalQaMarkdown(result: SampleRetrievalQaResult): string {
  const rows = result.cases.map((item) => [
    item.status,
    item.query,
    expectationSummary(item.expected),
    item.top_hit ? item.top_hit.canonical_id : 'none',
    item.top_hit ? `${item.top_hit.title} (${item.top_hit.score})` : 'none',
    item.notes.join(' '),
  ]);
  const noMatch = result.no_match_case;

  return `# Sample Retrieval QA Report - 2026-05-09

Generated at: \`${result.generated_at}\`

Input: \`${result.input_path}\`

Mode: deterministic canonical preview retrieval fallback. This does not mutate database content.

## Summary

- Target queries: ${result.total_queries}
- Passing target queries: ${result.pass_count}
- Failing target queries: ${result.fail_count}
- Target queries with no match: ${result.no_match_count}
- No-match control: ${noMatch.status}

## Target Query Results

${markdownTable(['Status', 'Query', 'Expected facets', 'Top canonical id', 'Top hit', 'Notes'], rows)}

## No-Match Behavior

${markdownTable(
  ['Status', 'Query', 'Top canonical id', 'Notes'],
  [[noMatch.status, noMatch.query, noMatch.top_hit?.canonical_id ?? 'none', noMatch.notes.join(' ')]],
)}

## Interpretation

- \`pass\` means the top deterministic hit satisfied the configured industry/function/process/title/KPI expectations.
- \`fail\` means retrieval found a plausible pattern, but the current corpus does not yet satisfy the expected facet for that executive query.
- \`no_match\` on target queries means the canonical preview has no usable pattern for the query under the deterministic fallback.
- ${result.fail_count > 0
    ? 'Current failures should drive Wave 3 content enrichment before strict retrieval QA is made a hard CI gate.'
    : 'All configured target queries pass in the deterministic preview fallback; keep this suite green as new content lands.'}
`;
}

function parseArgs(argv: string[]): { inputPath: string; outputPath: string } {
  const inputIndex = argv.indexOf('--input');
  const outputIndex = argv.indexOf('--output');
  return {
    inputPath: inputIndex >= 0 ? argv[inputIndex + 1] : SAMPLE_RETRIEVAL_INPUT,
    outputPath: outputIndex >= 0 ? argv[outputIndex + 1] : SAMPLE_RETRIEVAL_REPORT,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(process.cwd(), args.inputPath);
  const outputPath = path.resolve(process.cwd(), args.outputPath);
  const preview = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as PreviewReport;
  const result = evaluateSampleRetrievalQa(preview, args.inputPath);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, formatSampleRetrievalQaMarkdown(result));
  process.stdout.write(`${args.outputPath}\n`);
  process.stdout.write(`target_pass=${result.pass_count} target_fail=${result.fail_count} target_no_match=${result.no_match_count}\n`);
}

if (require.main === module) {
  void main();
}
