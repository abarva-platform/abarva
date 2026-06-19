import {
  derivedEnterpriseReadToAskSources,
  derivedEnterpriseReadToTowerFacts,
  getDerivedEnterpriseReadForTenant,
} from '../derived-enterprise-read';

describe('derived enterprise read accessor', () => {
  it('loads generated V4 Enterprise Reads by tenant alias', async () => {
    const read = await getDerivedEnterpriseReadForTenant('firstcapital');

    expect(read?.tenantKey).toBe('first-capital');
    expect(read?.headline).toContain('First Capital');
    expect(read?.insights.length).toBeGreaterThanOrEqual(4);
    expect(read?.recommendedMoves.length).toBeGreaterThanOrEqual(3);
  });

  it('converts Enterprise Reads into Sentinel ask sources', async () => {
    const read = await getDerivedEnterpriseReadForTenant('lakeshore');
    const sources = derivedEnterpriseReadToAskSources(read);

    expect(sources[0]).toMatchObject({
      type: 'TENANT',
      id: read?.readId,
    });
    expect(sources.some((source) => source.type === 'INSIGHT' && /Kyriba/i.test(source.detail))).toBe(true);
  });

  it('converts Enterprise Reads into Atlas Tower facts', async () => {
    const read = await getDerivedEnterpriseReadForTenant('meridian');
    const facts = derivedEnterpriseReadToTowerFacts({
      read,
      clientId: 'meridian-client-id',
      refreshRunId: 'run-2026-05',
    });

    expect(facts[0]).toMatchObject({
      clientId: 'meridian-client-id',
      refreshRunId: 'run-2026-05',
      recordType: 'derived_enterprise_read',
      factKey: 'enterprise_context_read',
    });
    expect(facts.length).toBeGreaterThan(3);
  });
});
