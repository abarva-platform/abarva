// OV2-2a · approval.ts unit tests
//
// File-header note on the testing approach:
//
// The DB-touching helpers in this codebase are exercised via mocked
// Supabase clients in unit tests (see e.g.
// src/__tests__/integration/programs/programs-create-route.test.ts for
// the canonical pattern). End-to-end coverage against a real Postgres
// instance happens through the migration runner + manual QA path
// described in the OV2-2a PR description; the fixture infra for a
// disposable test DB is not yet wired into Jest in this repo.
//
// These tests verify the helper-level behavior:
//   • field mapping snake_case ↔ camelCase
//   • the "submit also flips the engagement" two-step
//   • rationale required for rejection
//   • withdraw fails when the user does not match
//   • queue ordering, field selection, and tenant filter
//   • RLS smoke · the migration's policies are asserted to exist
//
// The DB triggers (sync_engagement_lifecycle_on_decision +
// updated_at touch) are unit-tested separately via the migration
// runner — they're SQL-side and not in the JS surface.

const insertMock = jest.fn();
const updateMock = jest.fn();
const selectMock = jest.fn();
const eqMock = jest.fn();
const orderMock = jest.fn();
const singleMock = jest.fn();
const maybeSingleMock = jest.fn();

interface QueryState {
  table: string;
  insertedRow: Record<string, unknown> | null;
  updatePayload: Record<string, unknown> | null;
  filters: Array<{ column: string; value: unknown }>;
  selectColumns: string | null;
  orderBy: { column: string; ascending: boolean } | null;
  singleResult: { data: unknown; error: unknown };
  maybeSingleResult: { data: unknown; error: unknown };
  arrayResult: { data: unknown; error: unknown };
}

let lastQuery: QueryState | null = null;

function makeQueryBuilder(table: string) {
  const state: QueryState = {
    table,
    insertedRow: null,
    updatePayload: null,
    filters: [],
    selectColumns: null,
    orderBy: null,
    singleResult: { data: null, error: null },
    maybeSingleResult: { data: null, error: null },
    arrayResult: { data: [], error: null },
  };
  lastQuery = state;

  const qb = {
    insert(row: Record<string, unknown>) {
      state.insertedRow = row;
      insertMock(table, row);
      return qb;
    },
    update(payload: Record<string, unknown>) {
      state.updatePayload = payload;
      updateMock(table, payload);
      return qb;
    },
    select(cols: string) {
      state.selectColumns = cols;
      selectMock(table, cols);
      // Promise-able for the order().then chain
      return qb;
    },
    eq(column: string, value: unknown) {
      state.filters.push({ column, value });
      eqMock(table, column, value);
      return qb;
    },
    order(column: string, opts: { ascending: boolean }) {
      state.orderBy = { column, ascending: opts.ascending };
      orderMock(table, column, opts);
      return Promise.resolve(state.arrayResult);
    },
    single() {
      singleMock(table);
      return Promise.resolve(state.singleResult);
    },
    maybeSingle() {
      maybeSingleMock(table);
      return Promise.resolve(state.maybeSingleResult);
    },
    // Some flows resolve the builder directly (e.g. update without select)
    then(
      resolve: (v: { data: unknown; error: unknown }) => unknown,
      reject: (e: unknown) => unknown,
    ) {
      try {
        resolve(state.arrayResult);
      } catch (e) {
        reject(e);
      }
    },
  };
  return qb;
}

const fromMock = jest.fn((table: string) => makeQueryBuilder(table));

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({ from: fromMock }),
}));

import {
  submitForApproval,
  decideApprovalRequest,
  withdrawApprovalRequest,
  getApprovalQueueForTenant,
  getApprovalRequestById,
  type ApprovalRequest,
} from '../approval';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Helper: shape of the row the DB returns (snake_case)
function makeDbRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'req_1',
    tenant_key: 'apex-retail',
    program_id: 'eng_1',
    requested_by_user_id: 'user_1',
    requested_at: '2026-04-29T10:00:00.000Z',
    request_status: 'pending',
    decided_by_user_id: null,
    decided_at: null,
    decision_rationale: null,
    brief_snapshot: { name: 'Test program', archetype: 'workflow_automation' },
    created_at: '2026-04-29T10:00:00.000Z',
    updated_at: '2026-04-29T10:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  insertMock.mockClear();
  updateMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  orderMock.mockClear();
  singleMock.mockClear();
  maybeSingleMock.mockClear();
  fromMock.mockClear();
  lastQuery = null;
});

// A small helper that lets each test stage the next two `from()` calls
// (insert→single, then update on engagements). The harness above stores
// the most-recent state in lastQuery and overwrites on each from().
let pendingResults: Array<Partial<QueryState>> = [];
fromMock.mockImplementation((table: string) => {
  const qb = makeQueryBuilder(table);
  // Apply staged result for this from() call, if any.
  const staged = pendingResults.shift();
  if (staged && lastQuery) {
    Object.assign(lastQuery, staged);
  }
  return qb;
});

beforeEach(() => {
  pendingResults = [];
});

describe('submitForApproval', () => {
  it('inserts a pending row, flips engagements.lifecycle_state, and returns camelCase', async () => {
    const inserted = makeDbRow();
    pendingResults.push({ singleResult: { data: inserted, error: null } });
    pendingResults.push({ arrayResult: { data: null, error: null } });

    const out = await submitForApproval({
      tenantKey: 'apex-retail',
      programId: 'eng_1',
      requestedByUserId: 'user_1',
      briefSnapshot: { name: 'Test program' },
    });

    expect(out.id).toBe('req_1');
    expect(out.tenantKey).toBe('apex-retail');
    expect(out.programId).toBe('eng_1');
    expect(out.requestedByUserId).toBe('user_1');
    expect(out.requestStatus).toBe('pending');
    expect(out.briefSnapshot).toEqual({
      name: 'Test program',
      archetype: 'workflow_automation',
    });

    // Insert payload uses snake_case columns
    const insertCall = insertMock.mock.calls.find(
      ([t]) => t === 'program_approval_requests',
    );
    expect(insertCall?.[1]).toMatchObject({
      tenant_key: 'apex-retail',
      program_id: 'eng_1',
      requested_by_user_id: 'user_1',
    });

    // Engagement flip happened
    const engagementUpdate = updateMock.mock.calls.find(
      ([t]) => t === 'engagements',
    );
    expect(engagementUpdate?.[1]).toEqual({
      lifecycle_state: 'submitted_for_approval',
    });
  });

  it('throws if tenantKey is missing', async () => {
    await expect(
      submitForApproval({
        tenantKey: '',
        programId: 'eng_1',
        requestedByUserId: 'user_1',
        briefSnapshot: {},
      }),
    ).rejects.toThrow(/tenantKey is required/);
  });

  it('throws if programId is missing', async () => {
    await expect(
      submitForApproval({
        tenantKey: 'apex-retail',
        programId: '',
        requestedByUserId: 'user_1',
        briefSnapshot: {},
      }),
    ).rejects.toThrow(/programId is required/);
  });

  it('throws if requestedByUserId is missing', async () => {
    await expect(
      submitForApproval({
        tenantKey: 'apex-retail',
        programId: 'eng_1',
        requestedByUserId: '',
        briefSnapshot: {},
      }),
    ).rejects.toThrow(/requestedByUserId is required/);
  });

  it('wraps DB insert errors with input context', async () => {
    pendingResults.push({
      singleResult: { data: null, error: { message: 'duplicate key' } },
    });

    await expect(
      submitForApproval({
        tenantKey: 'apex-retail',
        programId: 'eng_1',
        requestedByUserId: 'user_1',
        briefSnapshot: {},
      }),
    ).rejects.toThrow(/insert into program_approval_requests failed/);
  });
});

describe('decideApprovalRequest', () => {
  it('approves a pending request and returns the decided row', async () => {
    const updated = makeDbRow({
      request_status: 'approved',
      decided_by_user_id: 'admin_1',
      decided_at: '2026-04-29T11:00:00.000Z',
      brief_snapshot: {
        sponsor_person_id: 'sponsor_1',
        lead_person_id: 'lead_1',
      },
    });
    pendingResults.push({ singleResult: { data: updated, error: null } });

    const out = await decideApprovalRequest({
      requestId: 'req_1',
      decidedByUserId: 'admin_1',
      decision: 'approved',
    });

    expect(out.requestStatus).toBe('approved');
    expect(out.decidedByUserId).toBe('admin_1');
    expect(out.decidedAt).toBe('2026-04-29T11:00:00.000Z');

    // Update was scoped to pending rows only
    const filtered = eqMock.mock.calls.filter(
      ([t]) => t === 'program_approval_requests',
    );
    expect(filtered).toEqual(
      expect.arrayContaining([
        ['program_approval_requests', 'id', 'req_1'],
        ['program_approval_requests', 'request_status', 'pending'],
      ]),
    );
    expect(updateMock.mock.calls).toEqual(
      expect.arrayContaining([
        [
          'engagements',
          {
            lifecycle_state: 'approved',
            status: 'active',
            current_phase: 0,
            sponsor_person_id: 'sponsor_1',
            maestro_person_id: 'lead_1',
          },
        ],
      ]),
    );
  });

  it('rejects with rationale and persists the rationale', async () => {
    const updated = makeDbRow({
      request_status: 'rejected',
      decided_by_user_id: 'admin_1',
      decided_at: '2026-04-29T11:00:00.000Z',
      decision_rationale: 'Out of scope for this quarter',
    });
    pendingResults.push({ singleResult: { data: updated, error: null } });

    const out = await decideApprovalRequest({
      requestId: 'req_1',
      decidedByUserId: 'admin_1',
      decision: 'rejected',
      rationale: 'Out of scope for this quarter',
    });

    expect(out.requestStatus).toBe('rejected');
    expect(out.decisionRationale).toBe('Out of scope for this quarter');

    const updateCall = updateMock.mock.calls.find(
      ([t]) => t === 'program_approval_requests',
    );
    expect(updateCall?.[1]).toMatchObject({
      request_status: 'rejected',
      decision_rationale: 'Out of scope for this quarter',
    });
    expect(updateMock.mock.calls).toEqual(
      expect.arrayContaining([
        [
          'engagements',
          { lifecycle_state: 'rejected', status: 'draft' },
        ],
      ]),
    );
  });

  it('throws when rejecting without rationale', async () => {
    await expect(
      decideApprovalRequest({
        requestId: 'req_1',
        decidedByUserId: 'admin_1',
        decision: 'rejected',
      }),
    ).rejects.toThrow(/rationale is required when decision is rejected/);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('throws when rejecting with whitespace-only rationale', async () => {
    await expect(
      decideApprovalRequest({
        requestId: 'req_1',
        decidedByUserId: 'admin_1',
        decision: 'rejected',
        rationale: '   ',
      }),
    ).rejects.toThrow(/rationale is required when decision is rejected/);
  });

  it('rejects unknown decision values', async () => {
    await expect(
      decideApprovalRequest({
        requestId: 'req_1',
        decidedByUserId: 'admin_1',
        decision: 'maybe' as unknown as 'approved',
      }),
    ).rejects.toThrow(/decision must be/);
  });

  it('throws if requestId is missing', async () => {
    await expect(
      decideApprovalRequest({
        requestId: '',
        decidedByUserId: 'admin_1',
        decision: 'approved',
      }),
    ).rejects.toThrow(/requestId is required/);
  });

  it('throws if decidedByUserId is missing', async () => {
    await expect(
      decideApprovalRequest({
        requestId: 'req_1',
        decidedByUserId: '',
        decision: 'approved',
      }),
    ).rejects.toThrow(/decidedByUserId is required/);
  });

  it('wraps DB errors as already-decided / not-pending failures', async () => {
    pendingResults.push({
      singleResult: { data: null, error: { message: 'no rows' } },
    });

    await expect(
      decideApprovalRequest({
        requestId: 'req_1',
        decidedByUserId: 'admin_1',
        decision: 'approved',
      }),
    ).rejects.toThrow(/already decided/);
  });
});

describe('withdrawApprovalRequest', () => {
  it('only succeeds when the requesting user matches AND status is pending', async () => {
    const updated = makeDbRow({
      request_status: 'withdrawn',
      decided_at: '2026-04-29T12:00:00.000Z',
    });
    pendingResults.push({ singleResult: { data: updated, error: null } });

    const out = await withdrawApprovalRequest('req_1', 'user_1');

    expect(out.requestStatus).toBe('withdrawn');

    const filtered = eqMock.mock.calls.filter(
      ([t]) => t === 'program_approval_requests',
    );
    expect(filtered).toEqual(
      expect.arrayContaining([
        ['program_approval_requests', 'id', 'req_1'],
        ['program_approval_requests', 'requested_by_user_id', 'user_1'],
        ['program_approval_requests', 'request_status', 'pending'],
      ]),
    );
  });

  it('throws if a different user tries to withdraw', async () => {
    pendingResults.push({
      singleResult: { data: null, error: { message: 'no rows match' } },
    });

    await expect(
      withdrawApprovalRequest('req_1', 'other_user'),
    ).rejects.toThrow(/not the requester, or not pending/);
  });

  it('throws if requestId is missing', async () => {
    await expect(withdrawApprovalRequest('', 'user_1')).rejects.toThrow(
      /requestId is required/,
    );
  });

  it('throws if requestedByUserId is missing', async () => {
    await expect(withdrawApprovalRequest('req_1', '')).rejects.toThrow(
      /requestedByUserId is required/,
    );
  });
});

describe('getApprovalQueueForTenant', () => {
  it('returns only pending rows for the tenant, ordered by requested_at desc', async () => {
    const newer = makeDbRow({
      id: 'req_2',
      requested_at: '2026-04-29T15:00:00.000Z',
    });
    const older = makeDbRow({
      id: 'req_1',
      requested_at: '2026-04-29T10:00:00.000Z',
    });
    pendingResults.push({
      arrayResult: { data: [newer, older], error: null },
    });

    const out = await getApprovalQueueForTenant('apex-retail');
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe('req_2');
    expect(out[1].id).toBe('req_1');

    // Ordering call landed
    expect(orderMock).toHaveBeenCalledWith(
      'program_approval_requests',
      'requested_at',
      { ascending: false },
    );

    // Tenant + status filters were applied
    const filters = eqMock.mock.calls.filter(
      ([t]) => t === 'program_approval_requests',
    );
    expect(filters).toEqual(
      expect.arrayContaining([
        ['program_approval_requests', 'tenant_key', 'apex-retail'],
        ['program_approval_requests', 'request_status', 'pending'],
      ]),
    );
  });

  it('returns [] for a tenant with no pending requests', async () => {
    pendingResults.push({ arrayResult: { data: [], error: null } });
    const out = await getApprovalQueueForTenant('meridian');
    expect(out).toEqual([]);
  });

  it('throws if tenantKey is missing', async () => {
    await expect(getApprovalQueueForTenant('')).rejects.toThrow(
      /tenantKey is required/,
    );
  });

  it('wraps DB errors', async () => {
    pendingResults.push({
      arrayResult: { data: null, error: { message: 'connection refused' } },
    });
    await expect(getApprovalQueueForTenant('apex-retail')).rejects.toThrow(
      /query failed/,
    );
  });
});

describe('getApprovalRequestById', () => {
  it('returns the row when found', async () => {
    pendingResults.push({
      maybeSingleResult: { data: makeDbRow(), error: null },
    });
    const out: ApprovalRequest | null = await getApprovalRequestById('req_1');
    expect(out).not.toBeNull();
    expect(out!.id).toBe('req_1');
    expect(out!.tenantKey).toBe('apex-retail');
  });

  it('returns null when not found', async () => {
    pendingResults.push({ maybeSingleResult: { data: null, error: null } });
    const out = await getApprovalRequestById('req_missing');
    expect(out).toBeNull();
  });

  it('throws if requestId is missing', async () => {
    await expect(getApprovalRequestById('')).rejects.toThrow(
      /requestId is required/,
    );
  });

  it('wraps DB errors', async () => {
    pendingResults.push({
      maybeSingleResult: { data: null, error: { message: 'boom' } },
    });
    await expect(getApprovalRequestById('req_1')).rejects.toThrow(
      /query failed/,
    );
  });
});

// ── RLS smoke · static SQL inspection ──────────────────────────────────
// The migration is the source of truth for RLS. We assert the policies
// exist by static-scanning the SQL — this catches accidental deletion
// or rename without spinning up a Postgres instance.
describe('migration: program_approval_requests RLS policies', () => {
  const sql = readFileSync(
    path.resolve(
      process.cwd(),
      'supabase/migrations/20260430120100_program_approval_workflow.sql',
    ),
    'utf-8',
  );

  it('enables row-level security on program_approval_requests', () => {
    expect(sql).toMatch(
      /ALTER TABLE program_approval_requests ENABLE ROW LEVEL SECURITY/,
    );
  });

  it('declares the four required policies', () => {
    expect(sql).toMatch(/service_role_all_program_approval_requests/);
    expect(sql).toMatch(/authenticated_read_program_approval_requests/);
    expect(sql).toMatch(/authenticated_insert_program_approval_requests/);
    expect(sql).toMatch(/tenant_admin_update_program_approval_requests/);
    expect(sql).toMatch(/block_delete_program_approval_requests/);
  });

  it('blocks DELETE for authenticated role (USING (false))', () => {
    // The block-delete policy must use a literal false predicate.
    expect(sql).toMatch(
      /CREATE POLICY "block_delete_program_approval_requests"[\s\S]*?FOR DELETE TO authenticated[\s\S]*?USING \(false\)/,
    );
  });

  it('scopes SELECT and INSERT to the JWT tenant_key', () => {
    expect(sql).toMatch(/tenant_key = \(auth\.jwt\(\) ->> 'tenant_key'\)/);
  });

  it('scopes UPDATE to the tenant_admin role claim', () => {
    expect(sql).toMatch(/\(auth\.jwt\(\) ->> 'role'\) = 'tenant_admin'/);
  });

  it('declares the lifecycle-state sync trigger and updated_at trigger', () => {
    expect(sql).toMatch(/sync_engagement_lifecycle_on_decision/);
    expect(sql).toMatch(/update_program_approval_requests_updated_at/);
  });
});
