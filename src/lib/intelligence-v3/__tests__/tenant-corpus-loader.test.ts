jest.mock('server-only', () => ({}));

jest.mock('@/lib/intelligence-v3/lakeshore-live', () => ({
  loadLakeshoreIntelligenceData: jest.fn(async (client) => ({
    briefData: {
      tenantName: client.name,
      bets: [{ useCase: { name: 'Kyriba global treasury rollout' } }],
      patternsTriggered: [{ pattern: { name: 'Daily cash position before market open' } }],
      totals: { totalUseCases: 1, totalPatterns: 350 },
    },
    mapData: {
      tenantName: client.name,
      totalUseCases: 1,
    },
  })),
}));

import { loadTenantIntelligenceCorpusData } from '../tenant-corpus-loader';

describe('loadTenantIntelligenceCorpusData', () => {
  it('loads Meridian Health System seeded corpus data', async () => {
    const corpus = await loadTenantIntelligenceCorpusData(
      {
        id: 'client_meridian',
        key: 'meridian',
        name: 'Meridian Health System',
        industry_code: 'healthcare',
      },
      'meridian',
    );

    expect(corpus?.briefData.tenantName).toBe('Meridian Health System');
    expect(corpus?.briefData.bets[0]?.useCase.name).toContain('Population Health AI');
    expect(corpus?.mapData.totalUseCases).toBeGreaterThan(0);
  });

  it('loads First Capital seeded corpus data', async () => {
    const corpus = await loadTenantIntelligenceCorpusData(
      {
        id: 'client_firstcapital',
        key: 'firstcapital',
        name: 'First Capital Financial',
        industry_code: 'finserv',
      },
      'firstcapital',
    );

    expect(corpus?.briefData.tenantName).toBe('First Capital Financial');
    expect(corpus?.briefData.bets[0]?.useCase.name).toContain('FedNow');
    expect(corpus?.mapData.totalUseCases).toBeGreaterThan(0);
  });

  it('loads SkyHarbor seeded airline corpus data', async () => {
    const corpus = await loadTenantIntelligenceCorpusData(
      {
        id: 'client_skyharbor',
        key: 'skyharbor',
        name: 'SkyHarbor Air',
        industry_code: 'airline',
      },
      'skyharbor',
    );

    expect(corpus?.briefData.tenantName).toBe('SkyHarbor Air');
    expect(corpus?.briefData.bets[0]?.useCase.name).toContain('IROPs Recovery');
    expect(corpus?.mapData.totalUseCases).toBeGreaterThan(0);
  });

  it('loads Lakeshore live corpus data', async () => {
    const corpus = await loadTenantIntelligenceCorpusData(
      {
        id: 'client_lakeshore',
        key: 'lakeshore',
        name: 'Lakeshore Holdings',
        industry_code: 'diversified',
      },
      'lakeshore',
    );

    expect(corpus?.briefData.tenantName).toBe('Lakeshore Holdings');
    expect(corpus?.briefData.bets[0]?.useCase.name).toContain('Kyriba');
    expect(corpus?.briefData.patternsTriggered[0]?.pattern.name).toContain('cash');
    expect(corpus?.mapData.totalUseCases).toBeGreaterThan(0);
  });
});
