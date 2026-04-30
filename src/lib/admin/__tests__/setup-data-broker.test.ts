/**
 * Setup data broker · unit tests · SETUP-1.2
 *
 * Verifies the segment-rollup + audit-log + ingestion-run reads
 * for tenant `apex-retail` against a chainable mock Supabase
 * client. Live integration coverage runs in SETUP-1.7.
 */

const fromMock = jest.fn();

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({ from: fromMock }),
}));

import { getSetupInventorySnapshot } from '../setup-data-broker';

interface BuilderResult {
  data: unknown;
  error: unknown;
}

function makeBuilder(result: BuilderResult) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = chain;
  builder.eq = chain;
  builder.order = chain;
  builder.limit = chain;
  builder.then = (resolve: (r: BuilderResult) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder as {
    select: () => unknown;
    eq: () => unknown;
    order: () => unknown;
    limit: () => unknown;
    then: (r: (x: BuilderResult) => unknown) => Promise<unknown>;
  };
}

describe('getSetupInventorySnapshot', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('returns null when segments query errors', async () => {
    fromMock.mockImplementation(() =>
      makeBuilder({ data: null, error: { message: 'boom' } }),
    );
    const snapshot = await getSetupInventorySnapshot('apex-retail');
    expect(snapshot).toBeNull();
  });

  it('returns null when segments query returns empty', async () => {
    fromMock.mockImplementation(() => makeBuilder({ data: [], error: null }));
    const snapshot = await getSetupInventorySnapshot('apex-retail');
    expect(snapshot).toBeNull();
  });

  it('builds a snapshot with rollup totals and recent activity', async () => {
    const segmentRows = [
      {
        segment_id: 'enterprise_profile',
        segment_name: 'Enterprise profile',
        family_number: 1,
        record_count: 1,
        coverage_score: 100,
        stale_count: 0,
        missing_count: 0,
        health_state: 'complete',
        last_reviewed_at: null,
        last_ingested_at: '2026-04-29T12:00:00Z',
      },
      {
        segment_id: 'org_structure',
        segment_name: 'Org structure',
        family_number: 2,
        record_count: 36,
        coverage_score: 72,
        stale_count: 0,
        missing_count: 14,
        health_state: 'partial',
        last_reviewed_at: null,
        last_ingested_at: '2026-04-29T12:00:00Z',
      },
    ];
    const auditRows = [
      {
        action: 'segment_imported',
        actor_id: null,
        actor_role: 'system_import',
        segment_id: 'enterprise_profile',
        source_doc: 'enterprise_profile.md',
        created_at: '2026-04-29T12:00:00Z',
      },
    ];
    const ingestionRows = [
      {
        source_label: 'Apex synthetic dataset import · 2026-04-29',
        records_loaded: 403,
        chunks_loaded: 415,
        nodes_loaded: 257,
        edges_loaded: 275,
        status: 'completed',
        started_at: '2026-04-29T11:30:00Z',
        completed_at: '2026-04-29T12:00:00Z',
      },
    ];

    fromMock.mockImplementation((table: string) => {
      if (table === 'data_inventory_segments')
        return makeBuilder({ data: segmentRows, error: null });
      if (table === 'data_inventory_audit_log')
        return makeBuilder({ data: auditRows, error: null });
      if (table === 'data_ingestion_runs')
        return makeBuilder({ data: ingestionRows, error: null });
      return makeBuilder({ data: null, error: { message: 'unknown table' } });
    });

    const snapshot = await getSetupInventorySnapshot('apex-retail');
    expect(snapshot).not.toBeNull();
    expect(snapshot?.tenantKey).toBe('apex-retail');
    expect(snapshot?.segments).toHaveLength(2);
    expect(snapshot?.segments[0]?.segmentId).toBe('enterprise_profile');
    expect(snapshot?.segments[1]?.recordCount).toBe(36);
    expect(snapshot?.totalRecords).toBe(37);
    expect(snapshot?.totalChunks).toBe(415);
    expect(snapshot?.totalNodes).toBe(257);
    expect(snapshot?.totalEdges).toBe(275);
    expect(snapshot?.recentActivity).toHaveLength(1);
    expect(snapshot?.recentActivity[0]?.actor).toBe('Import pipeline');
    expect(snapshot?.recentActivity[0]?.what).toContain(
      'Imported segment enterprise_profile',
    );
    expect(snapshot?.lastIngestedAt).toBe('2026-04-29T12:00:00Z');
  });

  it('coerces stringified numeric counts (Supabase numeric → string)', async () => {
    const segmentRows = [
      {
        segment_id: 'kpi_dictionary',
        segment_name: 'KPI dictionary',
        family_number: 5,
        record_count: '50',
        coverage_score: '100.00',
        stale_count: '0',
        missing_count: '0',
        health_state: 'complete',
        last_reviewed_at: null,
        last_ingested_at: null,
      },
    ];
    fromMock.mockImplementation((table: string) => {
      if (table === 'data_inventory_segments')
        return makeBuilder({ data: segmentRows, error: null });
      return makeBuilder({ data: [], error: null });
    });
    const snapshot = await getSetupInventorySnapshot('apex-retail');
    expect(snapshot?.segments[0]?.recordCount).toBe(50);
    expect(snapshot?.segments[0]?.coverageScore).toBe(100);
  });
});
