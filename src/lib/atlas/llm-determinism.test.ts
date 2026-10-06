/**
 * Atlas Fix C — determinism + truncation guard
 *
 * The CXO-quality audit (PR #2562) found two structural bugs on the Atlas
 * Anthropic call path in `src/lib/atlas/llm.ts`:
 *
 *   1. No `temperature` was set, so the SDK default (~1.0) applied. The same
 *      `signal:<id>` rendered as "critical-severity" on one read and
 *      "93rd-percentile outlier" on the next.
 *   2. `max_tokens: 500` truncated industry-context responses mid-sentence
 *      (audit example: "...vs peer median.").
 *
 * Follow-up (Atlas-IAC E2E audit, 2026-05-30): `claude-opus-4-7` removed the
 * `temperature` parameter — Anthropic now returns 400 invalid_request_error
 * when it is set. Determinism is intrinsic to the model. The
 * `ATLAS_TEMPERATURE` constant is kept exported (value 0) to record the
 * intent and to fail this guard if someone re-introduces the literal
 * `temperature: ATLAS_TEMPERATURE` into the call site.
 *
 * These tests pin the contract so a future refactor that loosens either
 * lever fails loudly. They live alongside `llm.ts` because they exercise the
 * exact exported symbols and mocked egress boundary the code path uses.
 */

const mockMessagesCreate = jest.fn();
const mockGetAuditedAnthropicClient = jest.fn();
const mockQueryTowerCurrentState = jest.fn();
const mockQueryPortfolioAggregates = jest.fn();
const mockQuerySignals = jest.fn();
const mockQuerySignalEvidence = jest.fn();
const mockQueryCohortBenchmarks = jest.fn();
const mockQueryUseCases = jest.fn();
const mockQueryPrograms = jest.fn();
const mockAssembleRetrievalContext = jest.fn();
const mockLoadCuratedSemanticDossier = jest.fn();

jest.mock('@/lib/agent/stream', () => ({
  getAuditedAnthropicClient: (...args: unknown[]) =>
    mockGetAuditedAnthropicClient(...args),
}));

jest.mock('@/lib/atlas/tool-belt', () => ({
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

jest.mock('@/lib/agent/retrieval', () => ({
  assembleRetrievalContext: (...args: unknown[]) =>
    mockAssembleRetrievalContext(...args),
}));

jest.mock('@/lib/semantic-dossiers', () => ({
  loadCuratedSemanticDossier: (...args: unknown[]) =>
    mockLoadCuratedSemanticDossier(...args),
}));

jest.mock('@/lib/atlas/value-grounding', () => ({
  buildAtlasValueGrounding: jest.fn(async () => ({
    valueSeparation: {
      projected: { label: 'Projected value', value: '$10.0M', status: 'modeled' },
      verified: { label: 'Verified realized value', value: '$0', status: 'missing' },
      tracked: [],
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
  substrateCounts: {
    initiatives: 1,
    vendors: 1,
    kpiSnapshots: 0,
    decisions: 0,
    scenarios: 0,
    stakeholderNotes: 0,
    pressures: 0,
    observations: 0,
    alignmentDots: 0,
  },
  bandMetrics: { metrics: [] },
  budgetRollups: [],
  pressuresView: { cards: [] },
  initiatives: [],
  vendors: [],
  kpiSnapshots: [],
  decisions: [],
  scenarios: [],
  stakeholderNotes: [],
  atlasObservationsView: { observations: [] },
  alignment2x2View: { dots: [], strategicBets: [], totalPlotted: 0 },
} as never;

const portfolio = {
  clientId: 'client-demo',
  clientName: 'Demo Client',
  activeUseCaseCount: 1,
  criticalSignalCount: 0,
  warningSignalCount: 0,
  governedAiSpendUsd: 1_000_000,
  shadowAiSpendUsd: 0,
  estimatedValueUsd: 1_000_000,
  realizedValueUsd: 0,
  averageTrustworthinessScore: null,
  staleIntegrationCount: 0,
  adoptionPenetrationPctAvg: 20,
  trackedActiveUsers: 100,
  distinctAiVendorsCount: 1,
  valueAttainmentPctAvg: null,
  adoptionPercentile: null,
  spendIntensityPercentile: null,
  valueAttainmentPercentile: null,
  vendorCountPercentile: null,
  asOf: '2026-09-21',
};

import { ATLAS_MAX_TOKENS, ATLAS_TEMPERATURE, runAtlasLlm } from './llm';

describe('Atlas LLM determinism and truncation guards', () => {
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Your data\nDemo Client has a bounded Tower read.' }],
    });
    mockGetAuditedAnthropicClient.mockResolvedValue({
      client: { messages: { create: mockMessagesCreate } },
    });
    mockQueryTowerCurrentState.mockResolvedValue(towerState);
    mockQueryPortfolioAggregates.mockResolvedValue(portfolio);
    mockQuerySignals.mockResolvedValue([]);
    mockQueryPrograms.mockResolvedValue([]);
    mockQueryUseCases.mockResolvedValue([]);
    mockQueryCohortBenchmarks.mockResolvedValue(null);
    mockQuerySignalEvidence.mockResolvedValue(null);
    mockAssembleRetrievalContext.mockResolvedValue({
      industryChunks: [],
      topicChunks: [],
      clientChunks: [],
      atlasIacComposition: null,
    });
    mockLoadCuratedSemanticDossier.mockResolvedValue(null);
  });

  afterEach(() => {
    if (originalAnthropicKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
    }
  });

  it('declares ATLAS_TEMPERATURE=0 as intent (model no longer accepts temperature)', () => {
    expect(ATLAS_TEMPERATURE).toBe(0);
  });

  it('uses a max_tokens cap that covers the canonical CXO response shapes', () => {
    // The audit-flagged 500-token cap was the bug. 500 chops industry-context
    // responses mid-sentence. The new cap must comfortably cover the canon
    // (lead-bullet briefs, lead-tables, 12-20 line industry-context reads).
    expect(ATLAS_MAX_TOKENS).toBeGreaterThanOrEqual(1500);
  });

  it('passes max_tokens into the Anthropic call but no longer sets temperature', async () => {
    const result = await runAtlasLlm(
      { clientId: 'client-demo', clientKey: 'demo-client', userId: 'user-demo' },
      'Summarize the Tower posture without a factual-spine shortcut.',
    );

    expect(result.atlasMode).toBe('live');
    expect(mockGetAuditedAnthropicClient).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'client-demo',
        workflow: 'atlas-llm',
        model: 'claude-opus-4-7',
      }),
    );
    expect(mockMessagesCreate).toHaveBeenCalledTimes(1);
    expect(mockMessagesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-opus-4-7',
        max_tokens: ATLAS_MAX_TOKENS,
      }),
    );
    expect(mockMessagesCreate.mock.calls[0]?.[0]).not.toHaveProperty(
      'temperature',
    );
    expect(mockQueryTowerCurrentState).toHaveBeenCalledTimes(1);
  });
});
