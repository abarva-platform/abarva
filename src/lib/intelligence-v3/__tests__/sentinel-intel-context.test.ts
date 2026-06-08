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
        expect.stringContaining('Apex Retail is the active retail client'),
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
        expect.stringContaining('current-state answers must start from the visible surface'),
        expect.stringContaining('plain strategic language'),
      ]),
    }));

    expect((context.facts as string[]).join('\n')).toContain('portfolio relationships');
  });

  it('threads Enterprise Context facts into Sentinel for Meridian current-state questions', () => {
    const context = buildSentinelIntelContext({
      activeClient: 'Meridian Health',
      clientKey: 'meridian',
      stage: 'enterprise-context',
      isApexBound: false,
      status: null,
      patterns: [],
      todayItems: [],
      aopBands: APEX_RETAIL_AOP_DEMO,
      enterpriseContext: {
        tenantKey: 'meridian',
        tenantName: 'Meridian Health',
        counts: {
          sources: 11,
          records: 1030,
          facts: 11428,
          relationships: 220,
          evidence: 1030,
          qualityIssues: 146,
          stewardshipTasks: 146,
          chunkQueue: 1030,
        },
        recordTypeCounts: { incidents: 180, cmdb_applications_services: 82 },
        freshnessCounts: { fresh: 1030 },
        sourceSystems: ['ServiceNow', 'Workday'],
        evidenceUsableCount: 966,
        confidenceAverage: 0.86,
        qualitySummary: { 'medium:open:low_confidence': 82 },
        cards: [{
          key: 'incident-problem-pressure',
          title: 'Incident and problem pressure',
          whatWeKnow: '180 incidents and 36 problems are available.',
          whyItMatters: 'Operational pain can shape sourcing scope.',
          owner: 'IT Service Management',
          freshness: '1030/1030 fresh',
          confidence: '86%',
          evidenceCount: 216,
          sourceSystems: ['ServiceNow'],
          actions: ['Ask Sentinel'],
        }],
        sentinelFacts: [
          'Meridian Health Enterprise Context: 1030 records, 11428 facts, 220 CI relationships, and 1030 evidence rows are loaded from internal context sources.',
        ],
        vendorSpendRows: [],
      },
    });

    expect(context).toMatchObject({
      activeTab: 'enterprise-context',
      activeClient: 'Meridian Health',
      clientKey: 'meridian',
      evidenceContext: {
        kind: 'enterprise_context',
        tenantKey: 'meridian',
        recordCount: 1030,
        factCount: 11428,
        relationshipCount: 220,
        evidenceCount: 1030,
        usableEvidenceCount: 966,
        sourceCount: 11,
        sourceSystems: ['ServiceNow', 'Workday'],
      },
    });
    expect(context).toEqual(expect.objectContaining({
      tenantFacts: expect.arrayContaining([
        expect.stringContaining('Enterprise Context layer loaded from internal client data'),
        expect.stringContaining('1030 records'),
      ]),
      qualityFacts: expect.arrayContaining([
        expect.stringContaining('146 open quality issues'),
      ]),
    }));
    expect((context.facts as string[]).join('\n')).toContain('Incident and problem pressure');
  });

  it('does not inject Apex as the active tenant for a non-Apex Sentinel call', () => {
    const context = buildSentinelIntelContext({
      activeClient: 'Northstar Clinical Technologies',
      clientKey: 'northstar-clinical',
      stage: 'brief',
      isApexBound: false,
      status: null,
      patterns: [],
      todayItems: [],
      aopBands: APEX_RETAIL_AOP_DEMO,
      enterpriseContext: {
        tenantKey: 'northstar-clinical',
        tenantName: 'Northstar Clinical Technologies',
        counts: {
          sources: 96,
          records: 0,
          facts: 728,
          relationships: 0,
          evidence: 728,
          qualityIssues: 0,
          stewardshipTasks: 0,
          chunkQueue: 728,
        },
        recordTypeCounts: {},
        freshnessCounts: { fresh: 728 },
        sourceSystems: ['Northstar synthetic substrate'],
        evidenceUsableCount: 728,
        confidenceAverage: 0.9,
        qualitySummary: {},
        cards: [],
        sentinelFacts: [
          'Northstar Clinical Technologies Enterprise Context: named executives, application portfolio, vendor contracts, and initiatives are loaded.',
        ],
        vendorSpendRows: [],
      },
    });
    const facts = (context.facts as string[]).join('\n');

    expect(facts).toContain('This is the Northstar Clinical Technologies Intelligence layer');
    expect(facts).toContain('Northstar Clinical Technologies Enterprise Context');
    expect(facts).not.toContain('Apex Retail is the active');
    expect(facts).not.toContain('This is the Apex Retail Intelligence layer');
    expect(context).toMatchObject({ clientKey: 'northstar-clinical' });
  });
});
