jest.mock('server-only', () => ({}));

import {
  retrieveTenantEnterpriseSources,
  selectTenantEnterpriseSegments,
} from '@/lib/knowledge/tenant-enterprise-context';
import type {
  ContextChunk,
  GraphNeighborhood,
  SegmentId,
  TenantDataAdapter,
} from '@/lib/knowledge/tenant-data';

let fakeAdapter: TenantDataAdapter;

jest.mock('@/lib/knowledge/tenant-data', () => {
  const actual = jest.requireActual('@/lib/knowledge/tenant-data');
  return {
    ...actual,
    getTenantDataAdapter: (): TenantDataAdapter => fakeAdapter,
  };
});

function makeEmptyAdapter(): TenantDataAdapter {
  return {
    listSegments: () => Promise.resolve([]),
    listRecords: () => Promise.resolve([]),
    getRecord: () => Promise.resolve(null),
    listGraphNodes: () => Promise.resolve([]),
    listGraphEdgesForNode: () => Promise.resolve([]),
    getGraphNeighborhood: (_tenantKey, rootId) => {
      const neighborhood: GraphNeighborhood = { rootId, nodes: [], edges: [], depth: 0 };
      return Promise.resolve(neighborhood);
    },
    pathBetween: () => Promise.resolve(null),
    listContextChunks: () => Promise.resolve([]),
    chunksByRecord: () => Promise.resolve([]),
    chunksByKeyword: () => Promise.resolve([]),
    chunksByVector: () => Promise.reject(new Error('Vector retrieval not enabled.')),
    getEvidence: () => Promise.resolve(null),
    hasPersistedData: () => Promise.resolve(false),
  };
}

function chunk(segmentId: SegmentId, text: string, sourceDoc = `${segmentId}.csv`): ContextChunk {
  return {
    tenantKey: 'meridian-health',
    chunkId: `${segmentId}:chunk:1`,
    sourceSegmentId: segmentId,
    sourceDoc,
    recordId: `${segmentId}:record:1`,
    text,
    embeddingStatus: 'pending',
  };
}

describe('tenant enterprise context retrieval', () => {
  beforeEach(() => {
    const chunks = [
      chunk(
        'enterprise_profile',
        'enterprise: Meridian Health integrated delivery network with Epic as system of record and an enterprise IT operating model.',
        'enterprise_profile.md',
      ),
      chunk(
        'org_structure',
        'name: Dr. Anita Krishnamurthy role: EVP CDIO reports_to: CEO owns: Data and Analytics, Clinical Informatics, AI Platform',
        'executive_bench.csv',
      ),
      chunk(
        'it_financials',
        'category: Total IT Spend fy2026_planned_usd: 312000000 run_change_transform: CIO_run / CIO_change / CIO_transform notes: FY2026 IT budget envelope',
        'it_spend_breakdown.csv',
      ),
      chunk(
        'it_landscape',
        'system_name: Epic Cogito vendor: Epic category: clinical analytics platform owner_id: person:meridian:data-analytics',
        'systems_inventory.csv',
      ),
    ];
    fakeAdapter = {
      ...makeEmptyAdapter(),
      listContextChunks: (_tenantKey, opts) => {
        const requested = new Set(opts?.segmentIds ?? []);
        return Promise.resolve(chunks.filter((item) => requested.has(item.sourceSegmentId as SegmentId)));
      },
    };
  });

  it('selects both org structure and IT financials for leadership plus budget questions', () => {
    expect(selectTenantEnterpriseSegments('What do you know about my IT leadership team and my budget?')).toEqual(
      expect.arrayContaining(['org_structure', 'it_financials']),
    );
  });

  it('retrieves persisted org and budget chunks for any tenant key before Sentinel says data is unavailable', async () => {
    const sources = await retrieveTenantEnterpriseSources(
      'meridian-health',
      'What do you know about my IT leadership team and my budget?',
    );
    const detail = sources.map((source) => source.detail).join('\n');

    expect(sources.map((source) => source.id)).toEqual(
      expect.arrayContaining([
        'meridian-health:enterprise_profile',
        'meridian-health:org_structure',
        'meridian-health:it_financials',
      ]),
    );
    expect(detail).toContain('Dr. Anita Krishnamurthy');
    expect(detail).toContain('FY2026 IT budget envelope');
    expect(detail).toContain('Use these persisted setup-data chunks before saying tenant profile, org structure, budget, or system context is unavailable.');
  });

  it('does not inject tenant enterprise context for off-domain questions', async () => {
    const sources = await retrieveTenantEnterpriseSources('first-capital-financial', 'What is the capital of Italy?');

    expect(sources).toEqual([]);
  });

  it('normalizes legacy Apex aliases before chunks reach the Sentinel prompt', async () => {
    fakeAdapter = {
      ...makeEmptyAdapter(),
      listContextChunks: (_tenantKey, opts) => {
        const requested = new Set(opts?.segmentIds ?? []);
        if (!requested.has('enterprise_profile')) return Promise.resolve([]);
        return Promise.resolve([
          chunk('enterprise_profile', 'Asterline Retail Group is the active tenant. Asterline Retail operates specialty banners.'),
        ]);
      },
    };

    const sources = await retrieveTenantEnterpriseSources('apex-retail', 'What do you know about my company profile?');
    const detail = sources.map((source) => source.detail).join('\n');

    expect(detail).toContain('Apex Retail Group');
    expect(detail).toContain('Apex Retail operates specialty banners');
    expect(detail).not.toContain('Asterline');
  });

  it('normalizes legacy Meridian and First Capital aliases before chunks reach the Sentinel prompt', async () => {
    fakeAdapter = {
      ...makeEmptyAdapter(),
      listContextChunks: (_tenantKey, opts) => {
        const requested = new Set(opts?.segmentIds ?? []);
        if (!requested.has('enterprise_profile')) return Promise.resolve([]);
        return Promise.resolve([
          chunk('enterprise_profile', 'Heliara Health Alliance and Brindlemark Financial Group are legacy demo labels.'),
        ]);
      },
    };

    const sources = await retrieveTenantEnterpriseSources('meridian-health', 'What do you know about my company profile?');
    const detail = sources.map((source) => source.detail).join('\n');

    expect(detail).toContain('Meridian Health');
    expect(detail).toContain('First Capital Financial');
    expect(detail).not.toContain('Heliara');
    expect(detail).not.toContain('Brindlemark');
  });
});
