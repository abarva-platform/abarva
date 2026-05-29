import { azureRead } from '@/lib/data-plane/azureRead';
import { getInitiativeDetail } from './detail-queries';
import { listInitiativesForClient } from './queries';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    select: jest.fn(),
  },
}));

jest.mock('./queries', () => ({
  listInitiativesForClient: jest.fn(),
}));

const selectMock = azureRead.select as jest.MockedFunction<typeof azureRead.select>;
const listInitiativesForClientMock = listInitiativesForClient as jest.MockedFunction<
  typeof listInitiativesForClient
>;

describe('AI initiative detail queries', () => {
  beforeEach(() => {
    selectMock.mockReset();
    listInitiativesForClientMock.mockReset();
  });

  it('loads initiative detail child rows through azureRead after tenant-scoped initiative lookup', async () => {
    listInitiativesForClientMock.mockResolvedValue([
      {
        initiativeId: 'INIT-1',
        displayId: 'INIT-1',
        name: 'Ambient clinical intake',
        description: 'Modernize clinical intake.',
        primaryCategoryId: 'CAT-1',
        primaryCategoryName: 'Clinical AI',
        secondaryCategoryId: null,
        secondaryCategoryName: null,
        primaryGoalId: 'GOAL-1',
        primaryGoalName: 'Access',
        stage: 'scaled',
        stageDetail: null,
        ownerName: 'Dr. Rivera',
        ownerTitle: 'CMIO',
        ownerFunction: 'Clinical',
        committedAnnualUsd: null,
        committedTotalUsd: null,
        measuredValueUsd: null,
        statusFlag: 'healthy',
        statusSummary: 'On track',
        confidenceLevel: 'HIGH',
        alignedCallout: true,
        alignedRationale: null,
        loadedViaTemplate: 'packet-18',
      },
    ]);
    selectMock
      .mockResolvedValueOnce([
        {
          kpi_name: 'Visit cycle time',
          kpi_unit: 'minutes',
          quarter: '2026-Q2',
          kpi_value: '42',
          target_value: '35',
          peer_median: null,
          confidence_level: 'HIGH',
          loaded_via_template: 'seed',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await expect(getInitiativeDetail('client-1', 'INIT-1')).resolves.toMatchObject({
      initiative: { initiativeId: 'INIT-1' },
      kpis: [{ kpiName: 'Visit cycle time', kpiValue: 42, targetValue: 35 }],
      stakeholderNotes: [],
      decisions: [],
      vendors: [],
      scenarios: [],
    });
    expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
      table: 'ai_initiative_kpis',
      where: { initiative_id: 'INIT-1' },
      orderBy: { column: 'quarter', direction: 'asc' },
    }));
  });

  it('returns null when the initiative is outside the tenant-scoped list', async () => {
    listInitiativesForClientMock.mockResolvedValue([]);

    await expect(getInitiativeDetail('client-1', 'INIT-2')).resolves.toBeNull();
    expect(selectMock).not.toHaveBeenCalled();
  });
});
