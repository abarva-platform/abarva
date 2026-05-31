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
      .mockResolvedValueOnce([
        {
          note_id: 'NOTE-1',
          stakeholder_name: 'Dr. Singh',
          stakeholder_title: 'Chief Medical Officer',
          interview_date: new Date('2026-05-28T00:00:00.000Z'),
          quote: 'The clinical workflow is stable.',
          themes: ['workflow'],
          attribution_consent: true,
          loaded_via_template: 'seed',
        },
      ])
      .mockResolvedValueOnce([
        {
          decision_id: 'DEC-1',
          decision_name: 'Scale intake',
          decision_date: new Date('2026-05-29T00:00:00.000Z'),
          sponsor_name: 'Dr. Rivera',
          decision_status: 'decided',
          dissent_recorded: false,
          dissent_summary: null,
          outcome_status: 'approved',
          loaded_via_template: 'seed',
        },
      ])
      .mockResolvedValueOnce([
        {
          vendor_id: 'VEND-1',
          vendor_name: 'Abridge',
          contract_value_usd: '1200000',
          renewal_date: new Date('2026-11-30T00:00:00.000Z'),
          financial_health: 'strong',
          notes: null,
          loaded_via_template: 'seed',
        },
      ])
      .mockResolvedValueOnce([]);

    await expect(getInitiativeDetail('client-1', 'INIT-1')).resolves.toMatchObject({
      initiative: { initiativeId: 'INIT-1' },
      kpis: [{ kpiName: 'Visit cycle time', kpiValue: 42, targetValue: 35 }],
      stakeholderNotes: [{ noteId: 'NOTE-1', interviewDate: '2026-05-28' }],
      decisions: [{ decisionId: 'DEC-1', decisionDate: '2026-05-29' }],
      vendors: [{ vendorId: 'VEND-1', renewalDate: '2026-11-30' }],
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
