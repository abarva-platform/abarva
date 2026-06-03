import { buildSourceGenerationContext } from '@/lib/source/agent-generation/context-binder';
import type { SourcingEventDetail } from '@/lib/source/types';

jest.mock('@/lib/source/canvas-substrate/queries', () => ({
  listArtifactStatesForEvent: jest.fn(),
  listEvidenceStatesForEvent: jest.fn(),
  listGateCriterionStatesForEvent: jest.fn(),
}));

jest.mock('@/lib/source/queries', () => ({
  getSourcingEvent: jest.fn(),
  isUuid: jest.fn(),
  resolveSourceEventUuidForClient: jest.fn(),
}));

jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: jest.fn(),
}));

jest.mock('@/lib/client-config', () => ({
  canonicalClientDisplayName: jest.fn(() => 'Apex Retail'),
}));

const {
  listArtifactStatesForEvent,
  listEvidenceStatesForEvent,
  listGateCriterionStatesForEvent,
} = jest.requireMock('@/lib/source/canvas-substrate/queries') as {
  listArtifactStatesForEvent: jest.Mock;
  listEvidenceStatesForEvent: jest.Mock;
  listGateCriterionStatesForEvent: jest.Mock;
};

const { getSourcingEvent, isUuid, resolveSourceEventUuidForClient } =
  jest.requireMock('@/lib/source/queries') as {
    getSourcingEvent: jest.Mock;
    isUuid: jest.Mock;
    resolveSourceEventUuidForClient: jest.Mock;
  };

const { getActiveClientRow } = jest.requireMock('@/lib/active-client') as {
  getActiveClientRow: jest.Mock;
};

function makeSeedEvent(): SourcingEventDetail {
  return {
    id: 'apex-retail-ams-outsourcing-2026',
    code: 'SRC-004',
    name: 'AMS Outsourcing 2026',
    accountName: 'Apex Retail',
    leadAgent: 'Sentinel',
    archetype: 'Managed Services / Outsourcing',
    rigor: 'strategic',
    status: 'active',
    statusLabel: 'Active',
    priority: 'high',
    currentStageKey: 'strategy',
    currentStageLabel: 'Strategy',
    openAlerts: 0,
    owner: 'Carlos Rivera',
    agingDays: 0,
    blocker: null,
    nextAction: 'Continue Source workflow',
    isAtRisk: false,
    valueAtStakeUsd: 35_000_000,
    projectedValueUsd: 35_000_000,
    realizedValueUsd: 0,
    nextDecision: 'Continue Source workflow',
    synopsis: 'Test synopsis',
    problemStatement: 'Why now: renewal and run-cost pressure.',
    stages: [],
    alerts: [],
    artifacts: [],
    scorecard: {
      decisionOwner: 'Carlos Rivera',
      reviewCadence: 'Stage-gate',
      approvalState: 'default_generated',
      criteria: [],
    },
    valueLedger: {
      updatedAt: '2026-06-03T00:00:00.000Z',
      projected: [],
      realized: [],
    },
    dataReadiness: [],
  };
}

describe('buildSourceGenerationContext', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    listArtifactStatesForEvent.mockResolvedValue([]);
    listGateCriterionStatesForEvent.mockResolvedValue([]);
    listEvidenceStatesForEvent.mockResolvedValue([]);
    getActiveClientRow.mockResolvedValue({
      id: 'client-apex',
      key: 'apexretail',
      name: 'Apex Retail',
      industry_code: 'RETAIL',
    });
  });

  it('re-binds seeded golden slugs to the persisted event UUID before substrate reads', async () => {
    getSourcingEvent.mockResolvedValue(makeSeedEvent());
    isUuid.mockImplementation((value: string) =>
      value === '522eedf2-ff6b-4307-b312-3e0903c6fd42',
    );
    resolveSourceEventUuidForClient.mockImplementation(
      async (value: string, clientKey: string) => {
        if (
          clientKey === 'apexretail' &&
          (value === 'apex-retail-ams-outsourcing-2026' || value === 'SRC-004')
        ) {
          return '522eedf2-ff6b-4307-b312-3e0903c6fd42';
        }
        return null;
      },
    );

    const ctx = await buildSourceGenerationContext(
      'apex-retail-ams-outsourcing-2026',
    );

    expect(ctx?.event.id).toBe('522eedf2-ff6b-4307-b312-3e0903c6fd42');
    expect(resolveSourceEventUuidForClient).toHaveBeenCalledWith(
      'apex-retail-ams-outsourcing-2026',
      'apexretail',
    );
    expect(listArtifactStatesForEvent).toHaveBeenCalledWith(
      '522eedf2-ff6b-4307-b312-3e0903c6fd42',
    );
    expect(listGateCriterionStatesForEvent).toHaveBeenCalledWith(
      '522eedf2-ff6b-4307-b312-3e0903c6fd42',
    );
    expect(listEvidenceStatesForEvent).toHaveBeenCalledWith(
      '522eedf2-ff6b-4307-b312-3e0903c6fd42',
    );
  });
});
