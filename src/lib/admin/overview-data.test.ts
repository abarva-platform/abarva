import { azureRead } from '@/lib/data-plane/azureRead';
import { getOverviewSupplementalData } from './overview-data';
import { listInitiativesForClient } from './ai-initiatives/queries';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    select: jest.fn(),
  },
}));

jest.mock('./ai-initiatives/queries', () => ({
  listInitiativesForClient: jest.fn(),
}));

const selectMock = azureRead.select as jest.MockedFunction<typeof azureRead.select>;
const listInitiativesForClientMock = listInitiativesForClient as jest.MockedFunction<
  typeof listInitiativesForClient
>;

describe('admin overview supplemental data', () => {
  beforeEach(() => {
    selectMock.mockReset();
    listInitiativesForClientMock.mockReset();
  });

  it('reads overview counts through azureRead and fail-soft initiative loading', async () => {
    selectMock
      .mockResolvedValueOnce([
        { id: 'eng-1', current_phase: 6 },
        { id: 'eng-2', current_phase: 3 },
      ])
      .mockResolvedValueOnce([
        { id: 'src-1', lifecycle_state: 'blocked' },
        { id: 'src-2', lifecycle_state: 'approved' },
      ]);
    listInitiativesForClientMock.mockResolvedValue([]);

    await expect(getOverviewSupplementalData('apex-retail', 'client-1')).resolves.toEqual({
      programsCount: 2,
      programsP6Count: 1,
      sourceEventsCount: 2,
      sourceEventsAtRiskCount: 1,
      initiativesList: [],
    });
    expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
      table: 'engagements',
      where: { client_id: 'client-1' },
    }));
    expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
      table: 'source_events',
      where: { client_key: 'apex-retail' },
    }));
  });

  it('returns zeroes when azureRead fails', async () => {
    selectMock.mockRejectedValue(new Error('connection failed'));
    listInitiativesForClientMock.mockRejectedValue(new Error('connection failed'));

    await expect(getOverviewSupplementalData('apex-retail', 'client-1')).resolves.toEqual({
      programsCount: 0,
      programsP6Count: 0,
      sourceEventsCount: 0,
      sourceEventsAtRiskCount: 0,
      initiativesList: [],
    });
  });
});
