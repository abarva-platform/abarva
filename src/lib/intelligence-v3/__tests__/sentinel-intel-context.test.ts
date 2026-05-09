jest.mock('server-only', () => ({}));

import { APEX_RETAIL_AOP_DEMO } from '@/components/intelligence-v3/demo-data';
import { buildSentinelIntelContext } from '../sentinel-intel-context';

describe('buildSentinelIntelContext', () => {
  it('builds an Apex Retail 360 packet for Sentinel Intel', () => {
    const context = buildSentinelIntelContext({
      activeClient: 'Apex Retail Group',
      stage: 'vendors',
      isApexBound: true,
      status: {
        runtime: 'supabase',
        patterns: 40,
        sources: 20,
        summarizedSources: 20,
        useCases: 12,
        contradictions: 5,
        graphEdges: 242,
      },
      patterns: [],
      todayItems: [],
      aopBands: APEX_RETAIL_AOP_DEMO,
    });

    expect(context).toMatchObject({
      activeTab: 'vendors',
      activeClient: 'Apex Retail Group',
      clientKey: 'apexretail',
    });

    expect(context).toEqual(expect.objectContaining({
      tenantFacts: expect.arrayContaining([
        expect.stringContaining('Apex Retail is the active retail demo tenant'),
      ]),
      vendorFacts: expect.arrayContaining([
        expect.stringContaining('Data and analytics landscape'),
        expect.stringContaining('Adobe Experience Platform'),
      ]),
      graphFacts: expect.arrayContaining([
        expect.stringContaining('integration-hub adjacency'),
        expect.stringContaining('data readiness'),
      ]),
      qualityFacts: expect.arrayContaining([
        expect.stringContaining('current-state answers must start from SURFACE'),
      ]),
    }));

    expect((context.facts as string[]).join('\n')).toContain('Neo4j not required');
  });
});
