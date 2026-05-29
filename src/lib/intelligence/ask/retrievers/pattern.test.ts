import { retrievePattern } from './pattern';
import { azureRead } from '@/lib/data-plane/azureRead';
import { searchCanonicalPatternIndex } from '@/lib/intelligence/canonical/runtime-pattern-index';

jest.mock('server-only', () => ({}));
jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: jest.fn(),
  },
}));
jest.mock('@/lib/intelligence/canonical/runtime-pattern-index', () => ({
  searchCanonicalPatternIndex: jest.fn(),
}));

const mockAzureRead = jest.mocked(azureRead);
const mockSearchCanonicalPatternIndex = jest.mocked(searchCanonicalPatternIndex);

describe('retrievePattern', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('falls back to persisted canonical corpus when genome_patterns has no matches', async () => {
    mockAzureRead.query.mockResolvedValue([]);
    mockSearchCanonicalPatternIndex.mockResolvedValue({
      source: 'persisted_canonical_corpus',
      status: 'ready',
      patterns: [{
        canonical_id: 'AIP-HEALTHCARE-PRIOR_AUTH_AGENTIC_WORKFLOW',
        title: 'Prior Authorization Agentic Workflow',
        summary: 'Coordinate payer prior authorization intake, evidence checks, and escalation.',
        industry: ['healthcare'],
        enterprise_area: 'middle_office',
        function: 'utilization_management',
        process_area: 'prior_authorization',
        use_case_category: 'agentic_workflow',
        strategic_move_phases: ['diagnose_discover', 'design'],
        maturity_level: 'proven',
        confidence_level: 'high',
        value_hypothesis: 'Reduce authorization rework while improving evidence completeness.',
        primary_kpis: ['authorization_cycle_time', 'denial_rate', 'touchless_review_rate'],
        secondary_kpis: ['provider_follow_up_rate'],
        baseline_needed: ['current_cycle_time'],
        measurement_method: 'Compare baseline and post-change authorization cohorts.',
        value_levers: ['productivity', 'experience'],
        quantitative_claims: [],
        source_basis: 'inferred_from_patterns',
        source_references: [],
        confidence_rationale: 'Inferred from canonical corpus pattern.',
        missing_required_fields: [],
        missing_provenance: false,
        unsupported_claim_flags: [],
        duplicate_risk: null,
        score: 0.74,
        match_reasons: ['query:prior+authorization+agentic+workflow'],
      }],
      total: 1,
      warnings: [],
      filters_applied: { query: 'prior auth agentic workflow', limit: 5 },
      cache: { mode: 'disabled', key: null, ttl_ms: 0 },
    });

    const result = await retrievePattern(['prior auth agentic workflow']);

    expect(mockAzureRead.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM genome_patterns'),
      ['prior auth agentic workflow'],
      { missingTable: 'empty' },
    );
    expect(mockSearchCanonicalPatternIndex).toHaveBeenCalledWith({
      query: 'prior auth agentic workflow',
      limit: 5,
    }, { useCache: false });
    expect(result.sources).toEqual([expect.objectContaining({
      type: 'PATTERN',
      id: 'AIP-HEALTHCARE-PRIOR_AUTH_AGENTIC_WORKFLOW',
      name: 'Prior Authorization Agentic Workflow',
      confidence: 0.74,
      detail: expect.stringContaining('source_basis=inferred_from_patterns'),
    })]);
    expect(result.averageConfidence).toBe(0.74);
  });
});
