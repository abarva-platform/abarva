import { azureRead } from '@/lib/data-plane/azureRead';
import { retrieveKnowledge } from './knowledge';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

const mockAzureRead = jest.mocked(azureRead);

describe('retrieveKnowledge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries active knowledge sources through the Azure read boundary', async () => {
    mockAzureRead.query.mockResolvedValue([
      {
        id: 'ks-1',
        source_key: 'nist-ai-rmf',
        title: 'NIST AI Risk Management Framework',
        publisher: 'NIST',
        content_type: 'framework',
        industry_tags: ['RETAIL'],
        topic_tags: ['ai'],
        published_at: '2023-01-01',
        summary: 'Risk management framework for AI governance.',
      },
    ]);

    const result = await retrieveKnowledge(['ai'], ['framework'], 'REGULATION');

    expect(mockAzureRead.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM knowledge_sources'),
      ['active', ['framework'], '%ai%', ['ai'], ['AI']],
      { missingTable: 'empty' },
    );
    expect(result.sources).toEqual([
      expect.objectContaining({
        type: 'REGULATION',
        name: 'NIST AI Risk Management Framework',
        id: 'ks-1',
        detail: expect.stringContaining('Risk management framework'),
        confidence: 0.85,
      }),
    ]);
  });

  it('degrades to no sources on read failure', async () => {
    mockAzureRead.query.mockRejectedValue(new Error('read failed'));

    const result = await retrieveKnowledge(['ai']);

    expect(result).toEqual({ sources: [], averageConfidence: 0 });
  });

  it('filters off-tenant legacy composite seeds for a SkyHarbor request', async () => {
    mockAzureRead.query.mockResolvedValue([
      {
        id: 'ks-skyharbor',
        source_key: 'seed_wave_skyharbor_modernization',
        title: 'SkyHarbor Air initiative · IBM modernization',
        publisher: 'AbarVa Composite Seed',
        content_type: 'research_report',
        industry_tags: ['airline'],
        topic_tags: ['skyharbor', 'modernization'],
        published_at: '2026-04-21',
        summary: 'SkyHarbor modernization evidence.',
      },
      {
        id: 'ks-apex',
        source_key: 'seed_wave_apex_initiative_6_9_workforce_modernization',
        title: 'Apex Retail Group initiative · Workforce Modernization',
        publisher: 'AbarVa Composite Seed',
        content_type: 'research_report',
        industry_tags: ['retail'],
        topic_tags: ['apex', 'modernization'],
        published_at: '2026-04-21',
        summary: 'Apex retail modernization evidence.',
      },
      {
        id: 'ks-energy',
        source_key: 'seed_wave_energy_grid_modernization',
        title: 'Retired Energy Holdings initiative · Grid Modernization',
        publisher: 'AbarVa Composite Seed',
        content_type: 'research_report',
        industry_tags: ['energy'],
        topic_tags: ['energy', 'modernization'],
        published_at: '2026-04-21',
        summary: 'Retired tenant modernization evidence.',
      },
    ]);

    const result = await retrieveKnowledge(['modernization'], null, 'GENERAL', {
      tenantInventoryKey: 'skyharbor',
      surfaceContext: {
        activeClient: 'SkyHarbor Air',
        clientKey: 'skyharbor',
        tenantFacts: ['Active tenant is SkyHarbor Air.'],
      },
    });

    expect(result.sources.map((source) => source.name)).toEqual([
      'SkyHarbor Air initiative · IBM modernization',
    ]);
  });

  // P0 tenant-isolation regression: a Lakeshore request must NEVER receive
  // Apex enterprise-profile / company-scale facts. Lakeshore was previously
  // absent from the tenant-marker map, so `normalizeTenantMarker` returned
  // null and the cross-tenant fence failed OPEN (`if (!activeTenant) return
  // true`), leaking Apex rows on a "company scale / size" query.
  it('never returns Apex company_scale facts for a Lakeshore request', async () => {
    mockAzureRead.query.mockResolvedValue([
      {
        id: 'ks-apex-scale',
        source_key: 'seed_wave_apex_enterprise_profile',
        title: 'Apex Retail Group · Enterprise Profile',
        publisher: 'AbarVa Composite Seed',
        content_type: 'research_report',
        // Untagged for industry so only the tenant-marker fence can catch it.
        industry_tags: null,
        topic_tags: ['apex', 'company_scale', 'enterprise_profile'],
        published_at: '2026-04-21',
        summary:
          'Apex Retail Group is a $12.4B omnichannel retailer with 28,000 employees.',
      },
      {
        id: 'ks-lakeshore-scale',
        source_key: 'seed_wave_lakeshore_enterprise_profile',
        title: 'Lakeshore Holdings · Enterprise Profile',
        publisher: 'AbarVa Composite Seed',
        content_type: 'research_report',
        industry_tags: ['private-holdings'],
        topic_tags: ['lakeshore', 'company_scale', 'enterprise_profile'],
        published_at: '2026-04-21',
        summary: 'Lakeshore Holdings is a diversified conglomerate.',
      },
    ]);

    const result = await retrieveKnowledge(
      ['company scale'],
      null,
      'GENERAL',
      {
        tenantInventoryKey: 'lakeshore',
        surfaceContext: {
          activeClient: 'Lakeshore Holdings',
          clientKey: 'lakeshore',
          tenantFacts: ['Active tenant is Lakeshore Holdings.'],
        },
      },
    );

    const names = result.sources.map((source) => source.name);
    // No Apex facts leak through.
    expect(names).not.toContain('Apex Retail Group · Enterprise Profile');
    // Lakeshore's own profile is still returned.
    expect(names).toEqual(['Lakeshore Holdings · Enterprise Profile']);
  });

  it("still returns Apex's own company_scale facts for an Apex request", async () => {
    mockAzureRead.query.mockResolvedValue([
      {
        id: 'ks-apex-scale',
        source_key: 'seed_wave_apex_enterprise_profile',
        title: 'Apex Retail Group · Enterprise Profile',
        publisher: 'AbarVa Composite Seed',
        content_type: 'research_report',
        industry_tags: ['retail'],
        topic_tags: ['apex', 'company_scale', 'enterprise_profile'],
        published_at: '2026-04-21',
        summary:
          'Apex Retail Group is a $12.4B omnichannel retailer with 28,000 employees.',
      },
    ]);

    const result = await retrieveKnowledge(['company scale'], null, 'GENERAL', {
      tenantInventoryKey: 'apexretail',
      surfaceContext: {
        activeClient: 'Apex Retail Group',
        clientKey: 'apexretail',
        tenantFacts: ['Active tenant is Apex Retail Group.'],
      },
    });

    expect(result.sources.map((source) => source.name)).toEqual([
      'Apex Retail Group · Enterprise Profile',
    ]);
  });
});
