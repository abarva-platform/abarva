import {
  emptyAiControlTowerReadModel,
  getAiControlTowerReadModel,
} from '../read-model';
import { getControlTowerLensProjection } from '@/lib/tower/control-tower-lens-projection';
import type { ControlTowerLensProjection } from '@/lib/tower/control-tower-lens-projection';
import type {
  AiControlTowerInitiativeRead,
  AiControlTowerSpendRead,
} from '../read-model';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    maybeSingle: jest.fn(async () => null),
    select: jest.fn(async () => []),
  },
}));

jest.mock('@/lib/tower/control-tower-lens-projection', () => ({
  getControlTowerLensProjection: jest.fn(async () => null),
}));

const mockGetProjection = getControlTowerLensProjection as jest.MockedFunction<
  typeof getControlTowerLensProjection
>;

function projectionInitiative(
  overrides: Partial<AiControlTowerInitiativeRead> = {},
): AiControlTowerInitiativeRead {
  return {
    id: 'init-proj-1',
    title: 'Context-projected initiative',
    functionName: 'Technology',
    category: 'AI initiative',
    stage: 'portfolio',
    posture: 'monitor',
    owner: 'CDO',
    sponsor: 'CIO',
    vendor: 'Microsoft',
    system: 'Copilot',
    personas: [],
    promisedBenefit: 'Throughput lift',
    metric: 'benefit_realization_usd',
    baseline: null,
    target: null,
    committedUsd: 1_000_000,
    spendUsd: 500_000,
    promisedUsd: 2_000_000,
    realizedUsd: 900_000,
    realizedPct: 45,
    confidence: 'high',
    evidenceState: 'retrieval_proven',
    status: 'on_track',
    notes: '',
    risks: [],
    citations: [],
    ...overrides,
  };
}

function projectionSpend(overrides: Partial<AiControlTowerSpendRead> = {}): AiControlTowerSpendRead {
  return {
    id: 'spend-proj-1',
    initiativeId: 'init-proj-1',
    functionName: 'Technology',
    vendor: 'Microsoft',
    product: 'Copilot',
    spendType: 'committed',
    monthlySpendUsd: 40_000,
    annualizedSpendUsd: 480_000,
    renewalDate: null,
    unitMetric: '',
    unitValue: null,
    evidenceState: 'committed',
    notes: '',
    ...overrides,
  };
}

function buildProjection(
  overrides: Partial<ControlTowerLensProjection> = {},
): ControlTowerLensProjection {
  return {
    tenantKey: 'first-capital',
    clientId: 'client-firstcapital',
    source: 'context_projection',
    recordCount: 2,
    initiatives: [projectionInitiative()],
    spend: [projectionSpend()],
    risks: [],
    agents: [],
    productivity: [],
    usage: [],
    evidence: [],
    actions: [],
    ...overrides,
  };
}

beforeEach(() => {
  mockGetProjection.mockReset();
  mockGetProjection.mockResolvedValue(null);
});

describe('ai-control-tower read model', () => {
  it('keeps an unloaded tenant honest', () => {
    const model = emptyAiControlTowerReadModel({
      clientId: 'client-empty',
      clientKey: 'empty',
      tenantName: 'Empty Client',
    });

    expect(model.source).toBe('empty');
    expect(model.rowCounts.initiatives).toBe(0);
    expect(model.kpis.find((kpi) => kpi.key === 'spend')?.tone).toBe('red');
    expect(model.kpis.find((kpi) => kpi.key === 'evidence')?.tone).toBe('red');
  });

  it('returns the durable context projection ahead of the synthetic fallback', async () => {
    mockGetProjection.mockResolvedValue(buildProjection());

    const model = await getAiControlTowerReadModel({
      clientId: 'client-firstcapital',
      clientKey: 'first-capital',
      tenantName: 'First Capital Financial',
    });

    expect(mockGetProjection).toHaveBeenCalledWith({
      tenantKey: 'first-capital',
      clientId: 'client-firstcapital',
    });
    expect(model.source).toBe('context_projection');
    expect(model.sourceDisclosure).toContain('committed context layer');
    expect(model.rowCounts.initiatives).toBe(1);
    expect(model.rowCounts.spend).toBe(1);
    // Derived lenses (functions/kpis) are computed from the projected rows.
    expect(model.functions.some((row) => row.name === 'Technology')).toBe(true);
    expect(model.kpis.find((kpi) => kpi.key === 'spend')?.value).not.toBe('$0');
  });

  it('falls back to today’s behavior unchanged when the projection is null (graceful degradation)', async () => {
    mockGetProjection.mockResolvedValue(null);

    const model = await getAiControlTowerReadModel({
      clientId: 'client-firstcapital',
      clientKey: 'firstcapital',
      tenantName: 'First Capital Financial',
    });

    expect(model.source).toBe('first_capital_local_synthetic_fallback');
    expect(model.rowCounts.initiatives).toBeGreaterThan(0);
    expect(model.rowCounts.spend).toBeGreaterThan(0);
    expect(model.rowCounts.risks).toBeGreaterThan(0);
    expect(model.functions.some((row) => row.name === 'Technology')).toBe(true);
    expect(model.kpis.find((kpi) => kpi.key === 'spend')?.value).not.toBe('$0');
  });

  it('returns empty (not synthetic) for a non-First-Capital tenant with no projection', async () => {
    mockGetProjection.mockResolvedValue(null);

    const model = await getAiControlTowerReadModel({
      clientId: 'client-other',
      clientKey: 'some-other-tenant',
      tenantName: 'Some Other Tenant',
    });

    expect(model.source).toBe('empty');
  });
});
