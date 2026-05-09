import {
  evaluateSampleRetrievalQa,
  evaluateSampleRetrievalQuery,
  formatSampleRetrievalQaMarkdown,
  type PreviewRow,
} from './sample-retrieval-qa';

const rows: PreviewRow[] = [
  {
    canonical_id: 'AIP-RETAIL-STORE-OPERATIONS',
    title: 'Retail Store Operations AI',
    upsert_payload: {
      title: 'Retail Store Operations AI',
      summary: 'Store operations assistant for retail labor and inventory.',
      industry: ['retail'],
      enterprise_area: 'middle_office',
      function: 'store_operations',
      process_area: 'store_labor_and_inventory_operations',
      primary_kpis: ['labor_productivity', 'inventory_accuracy', 'task_completion'],
      secondary_kpis: [],
      required_data_domains: ['pos', 'labor', 'inventory'],
      common_failure_modes: ['Bad store data.'],
    },
  },
  {
    canonical_id: 'AIP-HEALTHCARE-PRIOR-AUTH',
    title: 'Prior Authorization Automation',
    upsert_payload: {
      title: 'Prior Authorization Automation',
      summary: 'Payer prior authorization agentic workflow.',
      industry: ['healthcare'],
      enterprise_area: 'middle_office',
      function: 'utilization_management',
      process_area: 'prior_authorization',
      primary_kpis: ['cycle_time', 'approval_rate', 'touchless_rate'],
      secondary_kpis: [],
      required_data_domains: ['claims', 'clinical_policy', 'member'],
      common_failure_modes: ['Missing policy evidence.'],
    },
  },
];

describe('sample retrieval QA', () => {
  it('passes query expectations when the top hit has the expected facets', () => {
    const result = evaluateSampleRetrievalQuery(rows, {
      id: 'store',
      query: 'AI use cases for retail store operations',
      expectation: {
        industry: 'retail',
        function_terms: ['store'],
        process_terms: ['store'],
        title_terms: ['store'],
        kpi_minimum: 3,
      },
    });

    expect(result.status).toBe('pass');
    expect(result.top_hit?.canonical_id).toBe('AIP-RETAIL-STORE-OPERATIONS');
  });

  it('fails query expectations when retrieval finds a plausible but incorrectly classified hit', () => {
    const result = evaluateSampleRetrievalQuery(rows, {
      id: 'fs_aml',
      query: 'Financial services AML agentic workflow',
      expectation: {
        industry: 'financial_services',
        title_terms: ['aml'],
      },
    });

    expect(result.status).toBe('fail');
    expect(result.top_hit).not.toBeNull();
  });

  it('marks no-match control as passing when there is no top hit', () => {
    const result = evaluateSampleRetrievalQa({ preview_rows: rows });

    expect(result.no_match_case.status).toBe('pass');
    expect(result.no_match_case.top_hit).toBeNull();
  });

  it('formats markdown with target query results', () => {
    const markdown = formatSampleRetrievalQaMarkdown(evaluateSampleRetrievalQa({ preview_rows: rows }));

    expect(markdown).toContain('# Sample Retrieval QA Report - 2026-05-09');
    expect(markdown).toContain('Target Query Results');
  });
});
