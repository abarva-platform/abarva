jest.mock('server-only', () => ({}));

import { loadTenantIntelligenceCorpusData } from '../tenant-corpus-loader';

describe('loadTenantIntelligenceCorpusData', () => {
  it('loads Meridian Health seeded corpus data', async () => {
    const corpus = await loadTenantIntelligenceCorpusData(
      {
        id: 'client_meridian',
        key: 'meridian',
        name: 'Meridian Health',
        industry_code: 'healthcare',
      },
      'meridian',
    );

    expect(corpus?.briefData.tenantName).toBe('Meridian Health');
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
});
