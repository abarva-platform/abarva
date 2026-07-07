import {
  buildAtlasGroundingDisclosure,
  buildAtlasValueGrounding,
  renderAtlasValueGrounding,
} from '@/lib/atlas/value-grounding';
import type { AtlasPortfolioSummary } from '@/lib/atlas/types';
import type { AtlasTowerCurrentState } from '@/lib/atlas/tower-grounding';
import type { CanonicalPatternIndexResult } from '@/lib/intelligence/canonical/runtime-pattern-index';

const portfolio: AtlasPortfolioSummary = {
  clientId: 'client-1',
  clientName: 'Meridian Health',
  activeUseCaseCount: 4,
  criticalSignalCount: 1,
  warningSignalCount: 2,
  governedAiSpendUsd: 1_000_000,
  shadowAiSpendUsd: 100_000,
  estimatedValueUsd: 2_400_000,
  realizedValueUsd: 300_000,
  averageTrustworthinessScore: 72,
  staleIntegrationCount: 0,
  adoptionPenetrationPctAvg: 38,
  trackedActiveUsers: 820,
  distinctAiVendorsCount: 6,
  valueAttainmentPctAvg: 12,
  adoptionPercentile: null,
  spendIntensityPercentile: null,
  valueAttainmentPercentile: null,
  vendorCountPercentile: null,
  asOf: '2026-05-09',
};

const towerState = {
  client: {
    clientId: 'client-1',
    clientName: 'Meridian Health',
    tenantKey: 'meridian',
    industryCode: 'HEALTHCARE_IDN',
  },
  pressuresView: {
    cards: [
      {
        headline: 'Ambient documentation value is pre-baseline',
      },
    ],
  },
} as unknown as AtlasTowerCurrentState;

function indexResult(overrides: Partial<CanonicalPatternIndexResult> = {}): CanonicalPatternIndexResult {
  return {
    source: 'persisted_canonical_corpus',
    status: 'ready',
    patterns: [
      {
        canonical_id: 'AIP-HEALTHCARE-AMBIENT-DOC-VALUE',
        title: 'Ambient Documentation Value Measurement',
        summary: 'Measure ambient documentation value without overclaiming ROI.',
        industry: ['healthcare'],
        enterprise_area: 'middle_office',
        function: 'clinical_operations',
        process_area: 'documentation',
        use_case_category: 'copilot',
        strategic_move_phases: ['roadmap_business_case_change_value_plan'],
        maturity_level: 'proven',
        confidence_level: 'high',
        value_hypothesis: 'Ambient documentation can improve clinician capacity when baseline and adoption are measured.',
        primary_kpis: ['clinician_time_saved', 'documentation_lag', 'note_quality'],
        secondary_kpis: ['clinician_satisfaction'],
        baseline_needed: ['pre_pilot_documentation_time', 'same-cohort_note_quality'],
        measurement_method: 'Compare pre-pilot baseline to matched pilot cohort by specialty.',
        value_levers: ['productivity', 'experience'],
        quantitative_claims: [],
        source_basis: 'internal_pattern',
        source_references: [{ label: 'Pattern source', source_id: 'PAT-AMBIENT-001' }],
        confidence_rationale: 'Reviewed pattern with explicit KPI gates.',
        missing_required_fields: [],
        missing_provenance: false,
        unsupported_claim_flags: [],
        duplicate_risk: null,
        score: 0.82,
        match_reasons: ['industry:healthcare', 'query:ambient+value'],
      },
    ],
    total: 1,
    warnings: [],
    filters_applied: {},
    cache: { mode: 'disabled', key: null, ttl_ms: 60_000 },
    ...overrides,
  };
}

describe('Atlas value grounding', () => {
  it('separates projected, tracked, and verified value and queries canonical patterns', async () => {
    const search = jest.fn(async () => indexResult());

    const grounding = await buildAtlasValueGrounding({
      ctx: { clientId: 'client-1', userId: 'user-1' },
      message: 'How should we think about ROI and value?',
      portfolio,
      towerState,
    }, { search });

    expect(search).toHaveBeenCalledWith(expect.objectContaining({
      client_id: 'client-1',
      tenant_key: 'meridian',
      industry: 'healthcare_provider',
      limit: 3,
    }), expect.any(Object));
    expect(grounding.valueSeparation.projected).toMatchObject({
      value: '$2.4M',
      status: 'projected',
    });
    expect(grounding.valueSeparation.tracked[0]).toMatchObject({
      label: 'Tracked value attainment',
      value: '12%',
      status: 'tracked',
    });
    expect(grounding.valueSeparation.verified).toMatchObject({
      value: '$300K',
      status: 'verified',
    });
    expect(grounding.patterns[0]).toMatchObject({
      confidenceLevel: 'high',
      primaryKpis: ['clinician_time_saved', 'documentation_lag', 'note_quality'],
      baselineNeeded: ['pre_pilot_documentation_time', 'same-cohort_note_quality'],
      measurementMethod: 'Compare pre-pilot baseline to matched pilot cohort by specialty.',
    });

    expect(buildAtlasGroundingDisclosure(grounding)).toMatchObject({
      source: 'persisted_canonical_corpus',
      status: 'ready',
      retrievedPatternCount: 1,
      sourceBasis: ['internal_pattern'],
      confidenceLevels: ['high'],
      patterns: [
        expect.objectContaining({
          canonicalId: 'AIP-HEALTHCARE-AMBIENT-DOC-VALUE',
          sourceReferenceCount: 1,
          quantitativeClaimCount: 0,
        }),
      ],
    });
  });

  it('surfaces missing baseline, measurement, provenance, and quantified claim support', async () => {
    const thin = indexResult({
      patterns: [{
        ...indexResult().patterns[0],
        primary_kpis: [],
        baseline_needed: [],
        measurement_method: '',
        source_references: [],
        missing_required_fields: ['primary_kpis', 'baseline_needed', 'measurement_method'],
        missing_provenance: true,
      }],
    });

    const grounding = await buildAtlasValueGrounding({
      ctx: { clientId: 'client-1', userId: null },
      message: 'Give me the ROI',
      portfolio: {
        ...portfolio,
        realizedValueUsd: 0,
        valueAttainmentPctAvg: null,
      },
      towerState,
    }, { search: jest.fn(async () => thin) });
    const rendered = renderAtlasValueGrounding(grounding);

    expect(grounding.missingEvidence).toEqual(expect.arrayContaining([
      'verified realized value is absent or zero in the Atlas portfolio aggregate',
      'Tracked value attainment is missing from tracked portfolio metrics',
      'canonical pattern primary KPIs are missing',
      'canonical pattern baseline requirements are missing',
      'canonical pattern measurement method is missing',
      'canonical pattern provenance is missing or thin',
      'canonical pattern has no quantified outcome claim; do not state external lift or savings',
    ]));
    expect(rendered).toContain('Verified realized value: missing (missing)');
    expect(rendered).toContain('Measurement: missing');
  });
});
