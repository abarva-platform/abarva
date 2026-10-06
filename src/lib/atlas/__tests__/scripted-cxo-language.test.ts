const mockQueryTowerCurrentState = jest.fn();
const mockQueryPortfolioAggregates = jest.fn();
const mockQuerySignals = jest.fn();
const mockQuerySignalEvidence = jest.fn();
const mockQueryCohortBenchmarks = jest.fn();
const mockQueryUseCases = jest.fn();
const mockQueryPrograms = jest.fn();
const mockGetScriptedOpening = jest.fn();

jest.mock('@/lib/atlas/tool-belt', () => ({
  get_scripted_opening: (...args: unknown[]) => mockGetScriptedOpening(...args),
  query_cohort_benchmarks: (...args: unknown[]) =>
    mockQueryCohortBenchmarks(...args),
  query_portfolio_aggregates: (...args: unknown[]) =>
    mockQueryPortfolioAggregates(...args),
  query_programs: (...args: unknown[]) => mockQueryPrograms(...args),
  query_signal_evidence: (...args: unknown[]) =>
    mockQuerySignalEvidence(...args),
  query_signals: (...args: unknown[]) => mockQuerySignals(...args),
  query_tower_current_state: (...args: unknown[]) =>
    mockQueryTowerCurrentState(...args),
  query_use_cases: (...args: unknown[]) => mockQueryUseCases(...args),
}));

jest.mock('@/lib/atlas/value-grounding', () => ({
  buildAtlasValueGrounding: jest.fn(async () => ({
    valueSeparation: {
      projected: { label: 'Projected value', value: '$10.0M', status: 'modeled' },
      verified: { label: 'Verified realized value', value: '$0', status: 'missing' },
      tracked: [
        { label: 'Tracked value attainment', value: '42%', status: 'tracked' },
        { label: 'Tracked active users', value: '1,200', status: 'tracked' },
      ],
    },
    missingEvidence: ['Finance baseline is not attached.'],
  })),
  renderAtlasValueGrounding: jest.fn(
    () => 'Value grounding: projected, tracked, and verified value are separated.',
  ),
}));

const towerState = {
  client: {
    clientId: 'client-demo',
    clientName: 'Demo Client',
    tenantKey: 'demo-client',
    industryCode: 'GENERAL',
  },
  todayIso: '2026-09-21',
  substrateCounts: {
    initiatives: 2,
    vendors: 1,
    kpiSnapshots: 0,
    decisions: 0,
    scenarios: 0,
    stakeholderNotes: 0,
    pressures: 1,
    observations: 0,
    alignmentDots: 0,
  },
  bandMetrics: {
    isEmpty: false,
    deterministicSeed: true,
    metrics: [
      {
        key: 'portfolio_roi',
        label: 'Portfolio ROI',
        hero: true,
        value: 'gap',
        subtext: 'measured value missing',
        confidence: 'none',
        tooltip: 'Verified value is missing.',
      },
    ],
  },
  pressuresView: { cards: [{ headline: 'Value evidence is incomplete.' }] },
  initiatives: [
    {
      initiativeId: 'init-1',
      displayId: 'AI-01',
      name: 'Copilot adoption',
      description: 'M365 Copilot rollout',
      primaryCategoryId: 'copilot',
      primaryCategoryName: 'Copilot',
      secondaryCategoryName: null,
      statusSummary: 'Value lag',
      statusFlag: 'value_lag',
      confidenceLevel: 'MED',
      committedAnnualUsd: 1_000_000,
      measuredValueUsd: 250_000,
    },
  ],
  vendors: [],
  kpiSnapshots: [],
} as never;

const portfolio = {
  clientId: 'client-demo',
  clientName: 'Demo Client',
  activeUseCaseCount: 2,
  criticalSignalCount: 1,
  warningSignalCount: 1,
  governedAiSpendUsd: 1_000_000,
  shadowAiSpendUsd: 250_000,
  estimatedValueUsd: 3_000_000,
  realizedValueUsd: 500_000,
  averageTrustworthinessScore: 0.76,
  staleIntegrationCount: 1,
  adoptionPenetrationPctAvg: 24,
  trackedActiveUsers: 1200,
  distinctAiVendorsCount: 3,
  valueAttainmentPctAvg: 42,
  adoptionPercentile: 52,
  spendIntensityPercentile: 60,
  valueAttainmentPercentile: 45,
  vendorCountPercentile: 55,
  asOf: '2026-09-21',
};

const signal = {
  id: 'signal-1',
  headline: 'Shadow AI exposure is above tolerance',
  severity: 'critical',
  state: 'new',
  impactUsd: 1_250_000,
  firedAt: '2026-09-21',
  signalKey: 'shadow_ai_detected',
  signalTitle: 'Shadow AI detected',
  pillar: 'risk',
  cohortLabel: 'General cohort',
  percentile: 93,
  evidenceSummary: {},
};

const signalDetail = {
  ...signal,
  benchmark: { p50: 500_000 },
  cohortContext: { apex_to_median_ratio: 2.5 },
  evidence: [
    {
      vendorName: 'Example Vendor',
      title: 'Spend record',
      amountUsd: 1_250_000,
    },
  ],
};

const benchmark = {
  metricName: 'adoption_penetration_pct_avg',
  pillar: 'adoption',
  label: 'General adoption',
  sampleSize: 12,
  p25: 10,
  p50: 30,
  p75: 55,
  apexValue: 24,
  apexPercentile: 42,
  peers: [],
  note: 'Directional benchmark only.',
};

const program = {
  id: 'program-1',
  name: 'Copilot adoption',
  status: 'active',
  ownerName: 'CIO',
  stage: 'pilot',
  expectedValueUsd: 2_000_000,
  realizedValueUsd: 500_000,
};

const useCase = {
  id: 'use-case-1',
  name: 'M365 Copilot',
  vendor: 'Microsoft',
};

const ctx = {
  clientId: 'client-demo',
  clientKey: 'demo-client',
  userId: 'user-demo',
};

const SCRIPTED_INTENTS = [
  'morning_summary',
  'portfolio_status',
  'shadow_ai_detail',
  'shadow_ai_exposure',
  'signal_detail',
  'signal_drilldown',
  'cohort_position',
  'peer_adoption_compare',
  'cohort_lagging',
  'industry_leaders',
  'lagging_programs_by_value',
  'value_attainment_vs_commitment',
  'federated_visibility_boundary',
  'at_risk_gates',
  'portfolio_confidence',
  'ai_spend_vs_budget',
  'vendor_concentration_risk',
  'cost_overruns',
  'governance_coverage_gaps',
  'regulatory_open_items',
  'fund_next_why',
  'kill_next_why',
  'reshape_next_why',
  'cut_program_impact',
  'fund_x_vs_y',
  'program_drilldown',
  'vendor_drilldown',
  'roi',
  'idle_seats',
  'copilot_usage_value',
  'strategy_refusal',
] as const;

const IMPLEMENTATION_GAP_LANGUAGE =
  /\bquery_[a-z_]+\b|does not exist yet|tool ships|requires .* tool|without a .* tool/i;

describe('Atlas scripted CXO language', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryTowerCurrentState.mockResolvedValue(towerState);
    mockQueryPortfolioAggregates.mockResolvedValue(portfolio);
    mockQuerySignals.mockResolvedValue([signal]);
    mockQuerySignalEvidence.mockResolvedValue(signalDetail);
    mockQueryCohortBenchmarks.mockResolvedValue(benchmark);
    mockQueryPrograms.mockResolvedValue([program]);
    mockQueryUseCases.mockResolvedValue([useCase]);
    mockGetScriptedOpening.mockResolvedValue({
      portfolio,
      observations: [],
      signals: [signal],
    });
  });

  it('does not expose implementation tool gaps in user-visible scripted responses', async () => {
    const { runScriptedAtlasIntent } = await import('@/lib/atlas/scripted-engine');

    for (const intent of SCRIPTED_INTENTS) {
      const result = await runScriptedAtlasIntent(
        ctx,
        intent,
        'What should leadership review next?',
      );

      expect(result.response).not.toMatch(IMPLEMENTATION_GAP_LANGUAGE);
      for (const suggestion of result.suggestions) {
        expect(suggestion.label).not.toMatch(IMPLEMENTATION_GAP_LANGUAGE);
      }
    }
    expect(mockQueryTowerCurrentState).toHaveBeenCalledTimes(
      SCRIPTED_INTENTS.length,
    );
  });
});

export {};
