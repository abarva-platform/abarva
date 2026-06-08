jest.mock('server-only', () => ({}));

const mockAzureReadQuery = jest.fn();

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: (...args: unknown[]) => mockAzureReadQuery(...args),
  },
}));

import { loadLakeshoreIntelligenceData } from '../lakeshore-live';

describe('loadLakeshoreIntelligenceData', () => {
  beforeEach(() => {
    mockAzureReadQuery.mockReset();
  });

  it('renders a corpus-backed candidate view when Lakeshore initiatives are not loaded yet', async () => {
    mockAzureReadQuery
      .mockResolvedValueOnce([
        {
          slug: 'pat-lsh-d14-00416',
          title: 'Daily cash position originates in Kyriba, reconciled to ERP by 9am Central',
          category: 'D14:treasury-data-pipeline',
          confidence: 0.92,
          depth_score: 9,
          vertical_overlays: ['lakeshore-capital', 'private-holdings', 'treasury'],
          region_overlays: [],
          published_at: '2026-06-05T00:00:00.000Z',
        },
        {
          slug: 'pat-lsh-d01-00250',
          title: 'HoldCo capital allocation starts with cash visibility not opportunity lists',
          category: 'D01:capital-allocation-discipline',
          confidence: 0.91,
          depth_score: 9,
          vertical_overlays: ['lakeshore-capital', 'private-holdings'],
          region_overlays: [],
          published_at: '2026-06-04T00:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          code: 'LSH-TMS-002',
          name: 'Kyriba cash visibility before allocation gate',
          summary: 'Treasury visibility must be proven before HoldCo capital allocation gates move.',
          confidence: 0.95,
        },
      ])
      .mockResolvedValueOnce([]);

    const corpus = await loadLakeshoreIntelligenceData({
      id: '49fc8aee-3d39-48c5-82ac-1313c31470c7',
      key: 'lakeshore',
      name: 'Lakeshore Holdings',
    });

    expect(corpus).not.toBeNull();
    expect(corpus?.briefData.tenantName).toBe('Lakeshore Holdings');
    expect(corpus?.briefData.synthesis).toContain('corpus-backed candidate view');
    expect(corpus?.briefData.bets[0]?.useCase.name).toContain('Kyriba');
    expect(corpus?.briefData.bets[0]?.scoreFactors[0]?.name).toContain('initiative substrate pending');
    expect(corpus?.mapData.candidateCount).toBeGreaterThan(0);
    expect(corpus?.mapData.inFlightCount).toBe(0);
  });

  it('still returns null when Lakeshore has no published corpus patterns', async () => {
    mockAzureReadQuery
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await expect(loadLakeshoreIntelligenceData({
      id: 'client_lakeshore',
      key: 'lakeshore',
      name: 'Lakeshore Holdings',
    })).resolves.toBeNull();
  });
});
