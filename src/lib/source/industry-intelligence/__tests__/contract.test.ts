import {
  POLICY_VERSION,
  type GovernedObject,
} from '@/lib/governance/context-corpus-policy';
import { listSourceArchetypes } from '@/lib/source/archetypes/registry';
import {
  buildIndustryCitationView,
  evaluateIndustryBenchmarkObservation,
  type IndustryBenchmarkObservation,
} from '../contract';
import { SOURCE_ARCHETYPE_INDUSTRY_INTELLIGENCE } from '../archetype-registry';

function governedSource(
  overrides: Partial<GovernedObject> = {},
): GovernedObject {
  return {
    id: 'industry-source-1',
    tenant_id: null,
    client_key: 'corpus_global',
    object_type: 'industry_benchmark_source',
    source_layer: 'industry_corpus',
    industry: 'cross-industry',
    enterprise_area: 'cross_enterprise',
    function: 'technology_sourcing',
    process_area: 'commercial_benchmarking',
    use_case_category: 'source_event_benchmark',
    strategic_move_phase_applicability: [],
    applicable_agents: ['source', 'sentinel'],
    source_basis: 'Official public pricing publication',
    source_references: ['source-page#pricing-table'],
    classification: 'public',
    compliance_basis: null,
    agent_readiness_status: 'agent_ready',
    retrievability: 'search_indexed',
    confidence_level: 'high',
    confidence_rationale: 'Publisher-controlled pricing table',
    cited_render_verified_at: '2026-09-01T00:00:00Z',
    last_reviewed_at: '2026-09-01T00:00:00Z',
    owner: 'industry-intelligence-ops',
    data_domains: ['technology_sourcing'],
    required_kpis: [],
    baseline_requirements: [],
    measurement_method: 'Published unit rate',
    value_levers: ['unit_rate'],
    known_failure_modes: ['wrong_region', 'stale_price'],
    guardrails: ['Do not substitute public list price for negotiated client price.'],
    human_in_loop_controls: ['Benchmark applicability review'],
    allowed_agent_actions: ['cite', 'compare'],
    blocked_agent_actions: ['approve', 'award'],
    provenance: {
      source_file: 'pricing-snapshot.html',
      ingestion_run_id: 'industry-run-1',
      parse_method: 'structured_html_table',
      committed_at: '2026-09-01T00:00:00Z',
      indexed_at: '2026-09-01T00:00:00Z',
      index_name: 'corpus-global',
    },
    policy_version: POLICY_VERSION,
    contract_hash: 'sha256:industry-source-1',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

function observation(
  overrides: Partial<IndustryBenchmarkObservation> = {},
): IndustryBenchmarkObservation {
  return {
    id: 'benchmark-1',
    source: {
      governance: governedSource(),
      publisher: 'Official Publisher',
      title: 'Regional service pricing',
      authority: 'official_public',
      citationMode: 'public_link_and_excerpt',
      publicUrl: 'https://example.com/pricing',
      publicationDate: '2026-08-01',
      retrievedAt: '2026-09-01T00:00:00Z',
      versionHash: 'sha256:pricing-v1',
    },
    archetypeIds: ['CLOUD_FINOPS'],
    metricKey: 'cloud_public_rate',
    metricLabel: 'Published on-demand service rate',
    kind: 'published_rate',
    unit: 'usd_per_service_unit',
    currency: 'USD',
    median: 0.42,
    geography: 'us-east',
    industry: 'cross-industry',
    serviceScope: 'compute',
    scaleBand: 'enterprise',
    deliveryModel: 'public_cloud',
    sourceLocator: 'Pricing table · compute · us-east',
    supportingExcerpt: 'Published regional unit rate for the selected service.',
    effectiveFrom: '2026-08-01',
    confidence: 'high',
    comparabilityNotes: 'Exact service and region match required.',
    ...overrides,
  };
}

describe('industry-intelligence contract', () => {
  it('allows a governed, comparable, citation-ready observation', () => {
    const result = evaluateIndustryBenchmarkObservation(observation(), {
      archetypeId: 'CLOUD_FINOPS',
      requiredComparabilityFields: ['geography', 'serviceScope'],
      asOf: new Date('2026-09-15T00:00:00Z'),
    });
    expect(result).toEqual({
      decision: 'usable_for_calculation',
      reasons: [],
      warnings: [],
    });
  });

  it('blocks a source that is loaded but not agent-ready', () => {
    const result = evaluateIndustryBenchmarkObservation(
      observation({
        source: {
          ...observation().source,
          governance: governedSource({
            agent_readiness_status: 'committed_not_indexed',
            retrievability: 'committed_not_indexed',
            cited_render_verified_at: null,
          }),
        },
      }),
      { archetypeId: 'CLOUD_FINOPS' },
    );
    expect(result.decision).toBe('blocked');
    expect(result.reasons.join(' ')).toMatch(/not agent_ready/i);
  });

  it('blocks an observation from the wrong archetype or missing comparability', () => {
    const result = evaluateIndustryBenchmarkObservation(
      observation({ geography: null }),
      {
        archetypeId: 'AMS_MANAGED_SERVICES',
        requiredComparabilityFields: ['geography'],
      },
    );
    expect(result.decision).toBe('blocked');
    expect(result.reasons.join(' ')).toMatch(/not approved.*AMS_MANAGED_SERVICES/i);
    expect(result.reasons.join(' ')).toMatch(/geography is missing/i);
  });

  it('keeps a non-numeric source as narrative context only', () => {
    const result = evaluateIndustryBenchmarkObservation(
      observation({ low: null, median: null, high: null }),
      { archetypeId: 'CLOUD_FINOPS' },
    );
    expect(result.decision).toBe('context_only');
  });

  it('does not expose licensed excerpts or links', () => {
    const citation = buildIndustryCitationView(
      observation({
        source: {
          ...observation().source,
          authority: 'licensed_research',
          citationMode: 'licensed_reference_only',
          licenseReference: 'enterprise-license',
        },
      }),
    );
    expect(citation.href).toBeNull();
    expect(citation.excerpt).toBeNull();
    expect(citation.locator).toContain('Pricing table');
  });
});

describe('Source archetype industry-intelligence coverage', () => {
  it('defines benchmark requirements for every registered Source archetype', () => {
    const archetypeIds = listSourceArchetypes()
      .map((item) => item.id)
      .sort();
    expect(Object.keys(SOURCE_ARCHETYPE_INDUSTRY_INTELLIGENCE).sort()).toEqual(
      archetypeIds,
    );
  });

  it('requires each archetype to declare multiple stage-bound metrics', () => {
    for (const pack of Object.values(
      SOURCE_ARCHETYPE_INDUSTRY_INTELLIGENCE,
    )) {
      expect(pack.benchmarkMetrics.length).toBeGreaterThanOrEqual(3);
      for (const item of pack.benchmarkMetrics) {
        expect(item.stages.length).toBeGreaterThan(0);
        expect(item.requiredComparability.length).toBeGreaterThan(0);
        expect(item.sourceAuthorities.length).toBeGreaterThan(0);
      }
    }
  });

  it('declares AI engineering partner metrics without inventing public benchmarks', () => {
    const pack = SOURCE_ARCHETYPE_INDUSTRY_INTELLIGENCE.AI_ENGINEERING_PARTNER;

    expect(pack.benchmarkMetrics.map((metric) => metric.key)).toEqual([
      'ai_partner_role_rate',
      'ai_eval_acceptance_coverage',
      'ai_milestone_holdback',
      'ai_modelops_support_ratio',
    ]);
    expect(
      pack.benchmarkMetrics.flatMap((metric) => metric.sourceAuthorities),
    ).not.toContain('official_public');
    expect(pack.benchmarkMetrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'ai_eval_acceptance_coverage',
          requiredComparability: expect.arrayContaining([
            'serviceScope',
            'deliveryModel',
          ]),
        }),
      ]),
    );
  });
});
