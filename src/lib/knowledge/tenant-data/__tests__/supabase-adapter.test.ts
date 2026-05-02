// TD-2 · SupabaseTenantDataAdapter unit tests
//
// Testing approach
// ----------------
// The DB-touching helpers in this codebase use mocked Supabase clients
// (canonical pattern: `src/lib/programs/__tests__/approval.test.ts`).
// Jest in this repo does not have a disposable Postgres fixture wired
// up, so the integration scenarios listed in the TD-2 deliverables
// (Apex 14 segments, Meridian 100+ KPIs, etc.) are written below as
// `it.skip` blocks that document the contract and turn back on once the
// fixture lands. The mocked-client tests below cover field mapping,
// tenant/segment filtering, limit clamps, classification lowercasing,
// embedding-status mapping, the keyword OR clause, evidence-record
// shaping, and tenant-isolation behavior at the query-builder layer.
//
// What this file does NOT cover
// -----------------------------
// • Real RLS evaluation (service-role bypasses RLS by design).
// • Cross-row tenant leakage on a real DB (TENANT_ISOLATION_PROBES owns
//   the harness for that; the broker boundary keeps leakage in tests).
// • Graph reads (`listGraphNodes`, `listGraphEdgesForNode`,
//   `getGraphNeighborhood`, `pathBetween`) — owned by `GraphTraversal`
//   (TD-3) and verified by `graph-traversal.test.ts`. The TD-3-WIRE
//   delegation tests below confirm the adapter forwards to that class.
// • Vector search (`chunksByVector`) — TD-9 owns those.

const fromMock = jest.fn<unknown, [string]>();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: fromMock })),
}));

jest.mock('pg', () => {
  const query = jest.fn();
  const Pool = jest.fn(() => ({ query }));
  return { Pool, __mockPgQuery: query };
});

import { createClient } from '@supabase/supabase-js';
import { Pool as mockPgPoolImport } from 'pg';

import {
  SupabaseTenantDataAdapter,
  __resetSupabaseTenantDataAdapterForTests,
  getSupabaseTenantDataAdapter,
} from '../supabase-adapter';

const mockPgPool = mockPgPoolImport as unknown as jest.Mock;
const mockPgQuery = (jest.requireMock('pg') as { __mockPgQuery: jest.Mock })
  .__mockPgQuery;

// ── Query-builder shim ────────────────────────────────────────────────
//
// Each `from(table)` call returns a fresh builder. The test stages an
// outcome (`data` / `error`) and a terminal verb (`limit`, `maybeSingle`,
// or `then`). The shim records the chain of filter calls so each test
// can assert tenant + segment scoping without leaking shared state.

interface BuilderCall {
  table: string;
  select: string | null;
  filters: Array<{ op: 'eq' | 'in' | 'or'; column: string; value: unknown }>;
  limit: number | null;
  terminal: 'limit' | 'maybeSingle' | 'auto' | null;
}

interface StagedResult {
  data: unknown;
  error: { message: string } | null;
}

let stagedResults: StagedResult[] = [];
let calls: BuilderCall[] = [];

function makeBuilder(table: string) {
  const call: BuilderCall = {
    table,
    select: null,
    filters: [],
    limit: null,
    terminal: null,
  };
  calls.push(call);

  const resolve = () => {
    const next = stagedResults.shift();
    return Promise.resolve(next ?? { data: null, error: null });
  };

  const builder: Record<string, unknown> = {
    select(cols: string) {
      call.select = cols;
      return builder;
    },
    eq(column: string, value: unknown) {
      call.filters.push({ op: 'eq', column, value });
      return builder;
    },
    in(column: string, value: unknown) {
      call.filters.push({ op: 'in', column, value });
      return builder;
    },
    or(value: unknown) {
      call.filters.push({ op: 'or', column: '__or__', value });
      return builder;
    },
    limit(n: number) {
      call.limit = n;
      call.terminal = 'limit';
      return resolve();
    },
    maybeSingle() {
      call.terminal = 'maybeSingle';
      return resolve();
    },
    // Some flows resolve the builder directly (no terminal verb).
    then(
      onResolve: (v: StagedResult) => unknown,
      onReject?: (e: unknown) => unknown,
    ) {
      call.terminal = call.terminal ?? 'auto';
      return resolve().then(onResolve, onReject);
    },
  };
  return builder;
}

beforeEach(() => {
  stagedResults = [];
  calls = [];
  fromMock.mockReset();
  mockPgQuery.mockReset();
  mockPgPool.mockClear();
  fromMock.mockImplementation((table: string) => makeBuilder(table) as never);
  __resetSupabaseTenantDataAdapterForTests();
  delete process.env.DATABASE_URL;
});

function makeAdapter(): SupabaseTenantDataAdapter {
  return new SupabaseTenantDataAdapter({ from: fromMock } as never);
}

// ── listSegments ──────────────────────────────────────────────────────

describe('SupabaseTenantDataAdapter.listSegments', () => {
  it('routes registered private-plane tenants through their private Supabase schema', async () => {
    const schemaMock = jest.fn(() => ({ from: fromMock }));
    stagedResults = [
      {
        data: [
          {
            tenant_key: 'northstar-health',
            segment_id: 'program_inventory',
            segment_name: 'Program inventory',
            family_number: 6,
            expected_baseline: { expected_record_count: 1 },
            coverage_score: 100,
            health_state: 'complete',
            record_count: 1,
            stale_count: 0,
            missing_count: 0,
            last_reviewed_at: null,
            last_ingested_at: '2026-05-01T00:00:00Z',
            provenance_summary: null,
          },
        ],
        error: null,
      },
    ];
    const adapter = new SupabaseTenantDataAdapter({
      from: fromMock,
      schema: schemaMock,
    } as never);

    const out = await adapter.listSegments('northstar-health');

    expect(schemaMock).toHaveBeenCalledWith('client_northstar_health_private');
    expect(out[0]).toMatchObject({
      tenantKey: 'northstar-health',
      segmentId: 'program_inventory',
      recordCount: 1,
    });
    expect(calls[0].table).toBe('data_inventory_segments');
    expect(calls[0].filters).toEqual([
      { op: 'eq', column: 'tenant_key', value: 'northstar-health' },
    ]);
  });

  it('maps rows and translates health states to the contract union', async () => {
    stagedResults = [
      {
        data: [
          {
            tenant_key: 'apex-retail',
            segment_id: 'enterprise_profile',
            segment_name: 'Enterprise profile',
            family_number: 1,
            expected_baseline: { expected_record_count: 1 },
            coverage_score: '100.00',
            health_state: 'complete',
            record_count: '1',
            stale_count: '0',
            missing_count: '0',
            last_reviewed_at: '2026-04-29T00:00:00Z',
            last_ingested_at: '2026-04-30T00:00:00Z',
            provenance_summary: {},
          },
          {
            tenant_key: 'apex-retail',
            segment_id: 'kpi_dictionary',
            segment_name: 'KPI dictionary',
            family_number: 5,
            expected_baseline: { expected_record_count: 150 },
            coverage_score: 65.5,
            health_state: 'partial',
            record_count: 98,
            stale_count: 5,
            missing_count: 52,
            last_reviewed_at: null,
            last_ingested_at: '2026-04-30T00:00:00Z',
            provenance_summary: null,
          },
          {
            tenant_key: 'apex-retail',
            segment_id: 'org_structure',
            segment_name: 'Org structure',
            family_number: 2,
            expected_baseline: {},
            coverage_score: 20,
            health_state: 'sparse',
            record_count: 6,
            stale_count: 0,
            missing_count: 29,
            last_reviewed_at: null,
            last_ingested_at: null,
            provenance_summary: null,
          },
          {
            tenant_key: 'apex-retail',
            segment_id: 'compliance_posture',
            segment_name: 'Compliance posture',
            family_number: 12,
            expected_baseline: {},
            coverage_score: 0,
            health_state: 'not_started',
            record_count: 0,
            stale_count: 0,
            missing_count: 20,
            last_reviewed_at: null,
            last_ingested_at: null,
            provenance_summary: null,
          },
        ],
        error: null,
      },
    ];

    const out = await makeAdapter().listSegments('apex-retail');

    expect(out).toHaveLength(4);
    expect(out[0]).toMatchObject({
      tenantKey: 'apex-retail',
      segmentId: 'enterprise_profile',
      coveragePct: 100,
      health: 'complete',
      recordCount: 1,
      expectedRecordCount: 1,
      lastIngestedAt: '2026-04-30T00:00:00Z',
    });
    expect(out[1].health).toBe('partial');
    expect(out[2].health).toBe('thin');
    expect(out[3].health).toBe('shell_only');

    expect(calls[0].table).toBe('data_inventory_segments');
    expect(calls[0].filters).toEqual([
      { op: 'eq', column: 'tenant_key', value: 'apex-retail' },
    ]);
  });

  it('throws a contextual error when Supabase reports a failure', async () => {
    stagedResults = [{ data: null, error: { message: 'connection refused' } }];
    await expect(makeAdapter().listSegments('apex-retail')).rejects.toThrow(
      /listSegments failed for tenant 'apex-retail': connection refused/,
    );
  });

  it('falls back to server-only Postgres when a private schema is not exposed through PostgREST', async () => {
    process.env.DATABASE_URL = 'postgres://user:pass@example.com:5432/db';
    stagedResults = [{ data: null, error: { message: 'Invalid schema: client_apex_retail_private' } }];
    mockPgQuery.mockResolvedValueOnce({
      rows: [
        {
          tenant_key: 'apex-retail',
          segment_id: 'program_inventory',
          segment_name: 'Program inventory',
          family_number: 6,
          expected_baseline: { expected_record_count: 4 },
          coverage_score: 100,
          health_state: 'complete',
          record_count: 4,
          stale_count: 0,
          missing_count: 0,
          last_reviewed_at: null,
          last_ingested_at: '2026-05-01T00:00:00Z',
          provenance_summary: null,
        },
      ],
    });

    const out = await makeAdapter().listSegments('apex-retail');

    expect(mockPgPool).toHaveBeenCalledWith(
      expect.objectContaining({ connectionString: process.env.DATABASE_URL }),
    );
    expect(mockPgQuery).toHaveBeenCalledWith(
      'select tenant_key, segment_id, segment_name, family_number, expected_baseline, coverage_score, health_state, record_count, stale_count, missing_count, last_reviewed_at, last_ingested_at, provenance_summary from "client_apex_retail_private"."data_inventory_segments" where tenant_key = $1',
      ['apex-retail'],
    );
    expect(out[0]).toMatchObject({
      tenantKey: 'apex-retail',
      segmentId: 'program_inventory',
      recordCount: 4,
    });
  });

  it('returns [] when the table has no rows for the tenant', async () => {
    stagedResults = [{ data: [], error: null }];
    await expect(makeAdapter().listSegments('unknown-tenant')).resolves.toEqual([]);
  });
});

// ── listRecords ───────────────────────────────────────────────────────

describe('SupabaseTenantDataAdapter.listRecords', () => {
  it('maps rows, lowercases classification, and threads tenant + segment filters', async () => {
    stagedResults = [
      {
        data: [
          {
            tenant_key: 'apex-retail',
            segment_id: 'kpi_dictionary',
            record_id: 'kpi_dictionary:apex:net-promoter-score',
            title: 'Net Promoter Score',
            record_kind: 'kpi_definition',
            source_doc: 'kpi_dictionary.csv',
            source_path: '05_kpi_dictionary/kpi_dictionary.csv',
            source_basis: 'tenant_admin_upload',
            uploaded_by: 'Apex synthetic dataset import',
            data_classification: 'Internal',
            confidence: '0.85',
            last_reviewed: '2026-04-15',
            freshness_state: 'fresh',
            ingestion_status: 'indexed',
            indexed_at: '2026-04-30T00:00:00Z',
            record_text: 'NPS …',
            record_payload: { caveat: 'Survey response rate < 30%' },
          },
        ],
        error: null,
      },
    ];

    const out = await makeAdapter().listRecords('apex-retail', 'kpi_dictionary', {
      recordKind: 'kpi_definition',
      limit: 25,
    });

    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      tenantKey: 'apex-retail',
      segmentId: 'kpi_dictionary',
      recordId: 'kpi_dictionary:apex:net-promoter-score',
      recordKind: 'kpi_definition',
      title: 'Net Promoter Score',
      classification: 'internal',
      confidence: 0.85,
      caveat: 'Survey response rate < 30%',
      sourceBasis: 'tenant_admin_upload',
      createdAt: '2026-04-30T00:00:00Z',
      updatedAt: '2026-04-15',
    });

    expect(calls[0].table).toBe('data_inventory_records');
    expect(calls[0].filters).toEqual([
      { op: 'eq', column: 'tenant_key', value: 'apex-retail' },
      { op: 'eq', column: 'segment_id', value: 'kpi_dictionary' },
      { op: 'eq', column: 'record_kind', value: 'kpi_definition' },
    ]);
    expect(calls[0].limit).toBe(25);
  });

  it('clamps limit to MAX_RECORD_LIMIT (200) and defaults to 50', async () => {
    stagedResults = [{ data: [], error: null }];
    await makeAdapter().listRecords('apex-retail', 'kpi_dictionary', { limit: 5000 });
    expect(calls[0].limit).toBe(200);

    stagedResults = [{ data: [], error: null }];
    await makeAdapter().listRecords('apex-retail', 'kpi_dictionary');
    expect(calls[1].limit).toBe(50);
  });

  it('throws a contextual error on Supabase failure', async () => {
    stagedResults = [{ data: null, error: { message: 'permission denied' } }];
    await expect(
      makeAdapter().listRecords('apex-retail', 'kpi_dictionary'),
    ).rejects.toThrow(/listRecords failed/);
  });
});

// ── getRecord ─────────────────────────────────────────────────────────

describe('SupabaseTenantDataAdapter.getRecord', () => {
  it('returns the mapped record when found', async () => {
    stagedResults = [
      {
        data: {
          tenant_key: 'apex-retail',
          segment_id: 'it_landscape',
          record_id: 'it_landscape:sys:apex:sap-s4',
          title: 'SAP S/4HANA',
          record_kind: 'systems_inventory',
          source_doc: 'systems_inventory.csv',
          source_path: '03_it_landscape/systems_inventory.csv',
          source_basis: 'tenant_admin_upload',
          uploaded_by: 'Apex synthetic dataset import',
          data_classification: 'Confidential',
          confidence: 0.9,
          last_reviewed: '2026-04-20',
          freshness_state: 'fresh',
          ingestion_status: 'indexed',
          indexed_at: '2026-04-30T00:00:00Z',
          record_text: '…',
          record_payload: { vendor: 'SAP' },
        },
        error: null,
      },
    ];

    const out = await makeAdapter().getRecord('apex-retail', 'it_landscape:sys:apex:sap-s4');
    expect(out).not.toBeNull();
    expect(out?.title).toBe('SAP S/4HANA');
    expect(out?.classification).toBe('confidential');
    expect(out?.payload).toEqual({ vendor: 'SAP' });

    expect(calls[0].terminal).toBe('maybeSingle');
    expect(calls[0].filters).toEqual([
      { op: 'eq', column: 'tenant_key', value: 'apex-retail' },
      { op: 'eq', column: 'record_id', value: 'it_landscape:sys:apex:sap-s4' },
    ]);
  });

  it('returns null when not found', async () => {
    stagedResults = [{ data: null, error: null }];
    await expect(
      makeAdapter().getRecord('apex-retail', 'nonexistent'),
    ).resolves.toBeNull();
  });

  it('throws on Supabase error', async () => {
    stagedResults = [{ data: null, error: { message: 'boom' } }];
    await expect(
      makeAdapter().getRecord('apex-retail', 'x'),
    ).rejects.toThrow(/getRecord failed/);
  });
});

// ── Graph methods (TD-3-WIRE delegation) ──────────────────────────────
//
// The four graph methods on the adapter delegate to a `GraphTraversal`
// instance constructed in the adapter's constructor. We verify that with
// a Jest spy on the class prototype: each adapter call should invoke the
// matching GraphTraversal method exactly once with the same arguments.
// Behavioural coverage (BFS shape, tenant isolation, depth clamping)
// lives in `graph-traversal.test.ts` and is not re-asserted here.

import { GraphTraversal } from '../graph-traversal';

describe('SupabaseTenantDataAdapter graph methods (TD-3-WIRE delegation)', () => {
  it('listGraphNodes delegates to GraphTraversal.listNodes with tenantKey + kind', async () => {
    const spy = jest
      .spyOn(GraphTraversal.prototype, 'listNodes')
      .mockResolvedValue([]);
    const adapter = makeAdapter();
    const out = await adapter.listGraphNodes('apex-retail', 'person');
    expect(out).toEqual([]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('apex-retail', 'person');
    spy.mockRestore();
  });

  it('listGraphEdgesForNode delegates to GraphTraversal.listEdgesForNode with direction', async () => {
    const spy = jest
      .spyOn(GraphTraversal.prototype, 'listEdgesForNode')
      .mockResolvedValue([]);
    const adapter = makeAdapter();
    await adapter.listGraphEdgesForNode(
      'apex-retail',
      'person:apex:diana-lopez',
      'incoming',
    );
    expect(spy).toHaveBeenCalledWith(
      'apex-retail',
      'person:apex:diana-lopez',
      'incoming',
    );
    spy.mockRestore();
  });

  it('getGraphNeighborhood delegates to GraphTraversal.getNeighborhood with opts', async () => {
    const spy = jest
      .spyOn(GraphTraversal.prototype, 'getNeighborhood')
      .mockResolvedValue({
        rootId: 'enterprise:apex-retail',
        nodes: [],
        edges: [],
        depth: 0,
      });
    const adapter = makeAdapter();
    await adapter.getGraphNeighborhood('apex-retail', 'enterprise:apex-retail', {
      maxDepth: 2,
      edgeKinds: ['LED_BY'],
    });
    expect(spy).toHaveBeenCalledWith('apex-retail', 'enterprise:apex-retail', {
      maxDepth: 2,
      edgeKinds: ['LED_BY'],
    });
    spy.mockRestore();
  });

  it('pathBetween delegates to GraphTraversal.findPath with maxDepth', async () => {
    const spy = jest
      .spyOn(GraphTraversal.prototype, 'findPath')
      .mockResolvedValue(null);
    const adapter = makeAdapter();
    const out = await adapter.pathBetween('apex-retail', 'a', 'b', 3);
    expect(out).toBeNull();
    expect(spy).toHaveBeenCalledWith('apex-retail', 'a', 'b', 3);
    spy.mockRestore();
  });
});

// ── Context chunks ────────────────────────────────────────────────────

describe('SupabaseTenantDataAdapter.listContextChunks', () => {
  it('maps rows and threads tenant + status filters; embedding stays null when pending', async () => {
    stagedResults = [
      {
        data: [
          {
            tenant_key: 'apex-retail',
            chunk_id: 'kpi_dictionary:k1:chunk:0',
            source_segment_id: 'kpi_dictionary',
            source_record_id: 'kpi_dictionary:apex:nps',
            source_doc: 'kpi_dictionary.csv',
            source_path: '05_kpi_dictionary/kpi_dictionary.csv',
            chunk_index: 0,
            chunk_text: 'Net Promoter Score …',
            token_count: 42,
            embedding_status: 'pending',
            embedding_model: null,
            embedded_at: null,
            provenance: {
              source_basis: 'tenant_admin_upload',
              data_classification: 'Internal',
            },
            chunk_metadata: { title: 'NPS' },
          },
        ],
        error: null,
      },
    ];

    const out = await makeAdapter().listContextChunks('apex-retail', {
      embeddingStatus: 'pending',
    });

    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      tenantKey: 'apex-retail',
      chunkId: 'kpi_dictionary:k1:chunk:0',
      recordId: 'kpi_dictionary:apex:nps',
      embeddingStatus: 'pending',
      sourceBasis: 'tenant_admin_upload',
      classification: 'internal',
    });
    expect(out[0].embedding).toBeUndefined();

    expect(calls[0].filters).toEqual([
      { op: 'eq', column: 'tenant_key', value: 'apex-retail' },
      { op: 'eq', column: 'embedding_status', value: 'pending' },
    ]);
  });

  it('uses an `in` filter when recordIds is provided', async () => {
    stagedResults = [{ data: [], error: null }];
    await makeAdapter().chunksByRecord('apex-retail', 'program_inventory:apex:cdp');

    expect(calls[0].filters).toEqual([
      { op: 'eq', column: 'tenant_key', value: 'apex-retail' },
      { op: 'in', column: 'source_record_id', value: ['program_inventory:apex:cdp'] },
    ]);
  });
});

describe('SupabaseTenantDataAdapter.chunksByKeyword', () => {
  it('builds an OR ILIKE clause across keywords and caps the limit', async () => {
    stagedResults = [{ data: [], error: null }];
    await makeAdapter().chunksByKeyword(
      'meridian-health',
      ['prior auth', 'denial rate'],
      75,
    );

    const orFilter = calls[0].filters.find((f) => f.op === 'or');
    expect(orFilter).toBeDefined();
    expect(orFilter?.value).toBe(
      'chunk_text.ilike.%prior auth%,chunk_text.ilike.%denial rate%',
    );
    // Cap is 50.
    expect(calls[0].limit).toBe(50);
  });

  it('returns [] without hitting Supabase when keywords are all empty', async () => {
    const out = await makeAdapter().chunksByKeyword('apex-retail', ['', '   ']);
    expect(out).toEqual([]);
    expect(calls).toHaveLength(0);
  });
});

describe('SupabaseTenantDataAdapter.chunksByVector', () => {
  it('throws when Pinecone is not configured', async () => {
    const adapter = new SupabaseTenantDataAdapter(
      { from: fromMock } as never,
      () => null, // no Pinecone client
    );
    await expect(
      adapter.chunksByVector('apex-retail', [0.1, 0.2]),
    ).rejects.toThrow(/Pinecone not configured/);
  });

  it('throws when queryVector is empty', async () => {
    const fakePinecone = {
      upsert: jest.fn(),
      query: jest.fn(),
      deleteByIds: jest.fn(),
      deleteByTenant: jest.fn(),
    };
    const adapter = new SupabaseTenantDataAdapter(
      { from: fromMock } as never,
      () => fakePinecone,
    );
    await expect(
      adapter.chunksByVector('apex-retail', []),
    ).rejects.toThrow(/non-empty number\[\]/);
    expect(fakePinecone.query).not.toHaveBeenCalled();
  });

  it('returns ContextChunks ordered by Pinecone score with vectorScore populated', async () => {
    const fakePinecone = {
      upsert: jest.fn(),
      query: jest.fn().mockResolvedValue([
        {
          id: 'chunk:apex:nps:0',
          score: 0.92,
          metadata: {
            tenant_key: 'apex-retail',
            record_kind: 'kpi_definition',
            source_segment: 'kpi_dictionary',
            record_id: 'kpi_dictionary:apex:nps',
          },
        },
        {
          id: 'chunk:apex:cdp:0',
          score: 0.81,
          metadata: {
            tenant_key: 'apex-retail',
            record_kind: 'program_record',
            source_segment: 'program_inventory',
            record_id: 'program:apex-cdp-2026',
          },
        },
      ]),
      deleteByIds: jest.fn(),
      deleteByTenant: jest.fn(),
    };
    stagedResults = [
      {
        data: [
          // Postgres returns rows out-of-order; we expect the adapter
          // to preserve Pinecone's relevance ordering.
          {
            tenant_key: 'apex-retail',
            chunk_id: 'chunk:apex:cdp:0',
            source_segment_id: 'program_inventory',
            source_record_id: 'program:apex-cdp-2026',
            source_doc: 'programs.csv',
            source_path: '06_program_inventory/programs.csv',
            chunk_index: 0,
            chunk_text: 'Apex CDP 2026 program …',
            token_count: 50,
            embedding_status: 'embedded',
            embedding_model: 'text-embedding-3-small',
            embedded_at: '2026-04-29T00:00:00Z',
            provenance: { source_basis: 'tenant_admin_upload', data_classification: 'Internal' },
            chunk_metadata: { title: 'Apex CDP' },
          },
          {
            tenant_key: 'apex-retail',
            chunk_id: 'chunk:apex:nps:0',
            source_segment_id: 'kpi_dictionary',
            source_record_id: 'kpi_dictionary:apex:nps',
            source_doc: 'kpi_dictionary.csv',
            source_path: '05_kpi_dictionary/kpi_dictionary.csv',
            chunk_index: 0,
            chunk_text: 'NPS measures customer loyalty …',
            token_count: 30,
            embedding_status: 'embedded',
            embedding_model: 'text-embedding-3-small',
            embedded_at: '2026-04-29T00:00:00Z',
            provenance: { source_basis: 'tenant_admin_upload', data_classification: 'Internal' },
            chunk_metadata: { title: 'NPS' },
          },
        ],
        error: null,
      },
    ];

    const adapter = new SupabaseTenantDataAdapter(
      { from: fromMock } as never,
      () => fakePinecone,
    );
    const out = await adapter.chunksByVector('apex-retail', [0.1, 0.2], 5);

    expect(out).toHaveLength(2);
    expect(out[0].chunkId).toBe('chunk:apex:nps:0');
    expect(out[0].vectorScore).toBe(0.92);
    expect(out[1].chunkId).toBe('chunk:apex:cdp:0');
    expect(out[1].vectorScore).toBe(0.81);

    // Pinecone query received tenantKey + topK.
    expect(fakePinecone.query).toHaveBeenCalledWith({
      vector: [0.1, 0.2],
      tenantKey: 'apex-retail',
      topK: 5,
    });

    // Postgres call hydrated by chunk_id (in-clause) + tenant_key.
    expect(calls[0].table).toBe('enterprise_context_chunks');
    expect(calls[0].filters).toEqual([
      { op: 'eq', column: 'tenant_key', value: 'apex-retail' },
      { op: 'in', column: 'chunk_id', value: ['chunk:apex:nps:0', 'chunk:apex:cdp:0'] },
    ]);
  });

  it('skips Pinecone hits without a Postgres backing row (silent)', async () => {
    const fakePinecone = {
      upsert: jest.fn(),
      query: jest.fn().mockResolvedValue([
        { id: 'orphan-chunk', score: 0.99, metadata: { tenant_key: 'apex-retail', record_kind: 'k', source_segment: 's', record_id: 'r' } },
      ]),
      deleteByIds: jest.fn(),
      deleteByTenant: jest.fn(),
    };
    stagedResults = [{ data: [], error: null }];

    const adapter = new SupabaseTenantDataAdapter(
      { from: fromMock } as never,
      () => fakePinecone,
    );
    const out = await adapter.chunksByVector('apex-retail', [0.1]);
    expect(out).toEqual([]);
  });

  it('returns [] without hitting Postgres when Pinecone returns no hits', async () => {
    const fakePinecone = {
      upsert: jest.fn(),
      query: jest.fn().mockResolvedValue([]),
      deleteByIds: jest.fn(),
      deleteByTenant: jest.fn(),
    };
    const adapter = new SupabaseTenantDataAdapter(
      { from: fromMock } as never,
      () => fakePinecone,
    );
    const out = await adapter.chunksByVector('apex-retail', [0.1]);
    expect(out).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it('clamps limit to MAX_VECTOR_LIMIT (50) and defaults to 10', async () => {
    const fakePinecone = {
      upsert: jest.fn(),
      query: jest.fn().mockResolvedValue([]),
      deleteByIds: jest.fn(),
      deleteByTenant: jest.fn(),
    };
    const adapter = new SupabaseTenantDataAdapter(
      { from: fromMock } as never,
      () => fakePinecone,
    );
    await adapter.chunksByVector('apex-retail', [0.1], 9999);
    expect((fakePinecone.query as jest.Mock).mock.calls[0][0].topK).toBe(50);

    await adapter.chunksByVector('apex-retail', [0.1]);
    expect((fakePinecone.query as jest.Mock).mock.calls[1][0].topK).toBe(10);
  });

  it('passes tenant key through to Pinecone — tenant A query never sees tenant B vector', async () => {
    const fakePinecone = {
      upsert: jest.fn(),
      query: jest.fn().mockResolvedValue([]),
      deleteByIds: jest.fn(),
      deleteByTenant: jest.fn(),
    };
    const adapter = new SupabaseTenantDataAdapter(
      { from: fromMock } as never,
      () => fakePinecone,
    );
    await adapter.chunksByVector('tenant-a', [0.1]);
    await adapter.chunksByVector('tenant-b', [0.1]);
    expect((fakePinecone.query as jest.Mock).mock.calls[0][0].tenantKey).toBe('tenant-a');
    expect((fakePinecone.query as jest.Mock).mock.calls[1][0].tenantKey).toBe('tenant-b');
  });
});

// ── Evidence ──────────────────────────────────────────────────────────

describe('SupabaseTenantDataAdapter.getEvidence', () => {
  it('shapes an EvidenceRecord from the JSON payload', async () => {
    stagedResults = [
      {
        data: {
          tenant_key: 'apex-retail',
          segment_id: 'evidence_ledger',
          record_id: 'evidence_ledger:ev:apex:001',
          title: 'CDP rollout reduces lead time by 22%',
          record_kind: 'evidence_claim',
          source_doc: 'cdp_rollout_memo.pdf',
          source_path: '09_evidence_ledger/cdp_rollout_memo.pdf',
          source_basis: 'tenant_admin_upload',
          uploaded_by: 'Apex synthetic dataset import',
          data_classification: 'Confidential',
          confidence: 0.78,
          last_reviewed: '2026-04-25',
          freshness_state: 'fresh',
          ingestion_status: 'indexed',
          indexed_at: '2026-04-30T00:00:00Z',
          record_text: '…',
          record_payload: {
            claim: 'Lead time fell 22% post-rollout',
            source_doc: 'cdp_rollout_memo.pdf',
            caveat: 'Only the West region',
          },
        },
        error: null,
      },
    ];

    const out = await makeAdapter().getEvidence(
      'apex-retail',
      'evidence_ledger:ev:apex:001',
    );
    expect(out).toMatchObject({
      tenantKey: 'apex-retail',
      evidenceId: 'evidence_ledger:ev:apex:001',
      claim: 'Lead time fell 22% post-rollout',
      sourceDoc: 'cdp_rollout_memo.pdf',
      classification: 'confidential',
      confidence: 0.78,
      caveat: 'Only the West region',
    });
    expect(calls[0].filters).toEqual([
      { op: 'eq', column: 'tenant_key', value: 'apex-retail' },
      { op: 'eq', column: 'segment_id', value: 'evidence_ledger' },
      { op: 'eq', column: 'record_id', value: 'evidence_ledger:ev:apex:001' },
    ]);
  });

  it('returns null when the row is missing', async () => {
    stagedResults = [{ data: null, error: null }];
    await expect(
      makeAdapter().getEvidence('apex-retail', 'evidence_ledger:nope'),
    ).resolves.toBeNull();
  });
});

// ── hasPersistedData ──────────────────────────────────────────────────

describe('SupabaseTenantDataAdapter.hasPersistedData', () => {
  it('returns true when a segment row exists', async () => {
    stagedResults = [{ data: [{ segment_id: 'enterprise_profile' }], error: null }];
    await expect(
      makeAdapter().hasPersistedData('apex-retail'),
    ).resolves.toBe(true);
    expect(calls[0].limit).toBe(1);
    expect(calls[0].filters).toEqual([
      { op: 'eq', column: 'tenant_key', value: 'apex-retail' },
    ]);
  });

  it('returns false when no rows exist', async () => {
    stagedResults = [{ data: [], error: null }];
    await expect(
      makeAdapter().hasPersistedData('unknown-tenant'),
    ).resolves.toBe(false);
  });
});

// ── Singleton wiring ──────────────────────────────────────────────────

describe('getSupabaseTenantDataAdapter() singleton', () => {
  const realUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const realKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  afterEach(() => {
    if (realUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = realUrl;
    }
    if (realKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = realKey;
    }
    __resetSupabaseTenantDataAdapterForTests();
    (createClient as jest.Mock).mockClear();
  });

  it('returns null when env vars are unset', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    __resetSupabaseTenantDataAdapterForTests();
    expect(getSupabaseTenantDataAdapter()).toBeNull();
  });

  it('caches the adapter instance across calls', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    __resetSupabaseTenantDataAdapterForTests();
    const a = getSupabaseTenantDataAdapter();
    const b = getSupabaseTenantDataAdapter();
    expect(a).not.toBeNull();
    expect(a).toBe(b);
    // createClient was called exactly once across both getters.
    expect((createClient as jest.Mock).mock.calls.length).toBe(1);
  });
});

// ── Integration scenarios (skipped — wired once Jest gets a DB fixture) ─

describe.skip('SupabaseTenantDataAdapter — Apex/Meridian integration scenarios', () => {
  // These exercise the contract end-to-end against the real Supabase DB
  // loaded by `src/scripts/setup-data/load-meridian-setup-data.ts` and
  // the Apex equivalent. Re-enable when Jest gets a disposable Postgres
  // fixture.

  it('hasPersistedData("apex-retail") returns true', async () => {
    /* requires real DB */
  });

  it('hasPersistedData("unknown-tenant") returns false', async () => {
    /* requires real DB */
  });

  it('listSegments("apex-retail") returns 14 SegmentRollup rows', async () => {
    /* requires real DB */
  });

  it('listRecords("apex-retail", "kpi_dictionary") returns >= 50 rows', async () => {
    /* requires real DB */
  });

  it('listRecords("meridian-health", "kpi_dictionary") returns >= 100 rows', async () => {
    /* requires real DB */
  });

  it('getRecord(known) returns the record; getRecord(unknown) returns null', async () => {
    /* requires real DB */
  });

  it('listContextChunks(pending) returns rows with embedding === undefined', async () => {
    /* requires real DB */
  });

  it('chunksByKeyword("meridian-health", ["prior auth"], 10) returns relevant chunks', async () => {
    /* requires real DB */
  });

  it('listRecords("apex-retail", "kpi_dictionary") does NOT include meridian rows (tenant isolation)', async () => {
    /* requires real DB */
  });
});
