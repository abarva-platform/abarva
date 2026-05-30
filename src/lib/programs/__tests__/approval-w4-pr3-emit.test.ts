/**
 * W4-PR-3 · approval.ts notification emit wiring
 *
 * Verifies that `submitForApproval` fires `approval.requested` and
 * `decideApprovalRequest` fires `program.gate_decision` through the
 * notification broker AFTER the primary DB writes land. Also asserts
 * the fire-and-forget contract — a broker failure must not propagate
 * to the caller — and that no emit is made when the primary action
 * fails (e.g. validation rejection before the DB write).
 */

// ── Mock the data plane ────────────────────────────────────────────────
//
// Mirror the harness from approval.test.ts: a per-table query builder
// whose `.single()` / array resolution is staged via `pendingResults`.

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

let pendingResults: Array<Partial<QueryState>> = [];

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
  const staged = pendingResults.shift();
  if (staged) Object.assign(state, staged);

  const qb = {
    insert(row: Record<string, unknown>) {
      state.insertedRow = row;
      return qb;
    },
    update(payload: Record<string, unknown>) {
      state.updatePayload = payload;
      return qb;
    },
    select(cols: string) {
      state.selectColumns = cols;
      return qb;
    },
    eq(column: string, value: unknown) {
      state.filters.push({ column, value });
      return qb;
    },
    lt(column: string, value: unknown) {
      state.filters.push({ column, value });
      return qb;
    },
    order() {
      return Promise.resolve(state.arrayResult);
    },
    single() {
      return Promise.resolve(state.singleResult);
    },
    maybeSingle() {
      return Promise.resolve(state.maybeSingleResult);
    },
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

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: () => ({ from: fromMock }),
}));

// ── Mock the broker and the legacy resend-based notifications ───────────

const emitNotificationMock = jest.fn(async (_input?: unknown) => ({
  eventId: 'evt_1',
  enqueuedDeliveries: 1,
}));

jest.mock('@/lib/admin/broker/notification-broker', () => ({
  emitNotification: (input: unknown) => emitNotificationMock(input),
}));

jest.mock('@/lib/programs/approval-notifications', () => ({
  notifyApprovalSubmitted: jest.fn().mockResolvedValue(undefined),
  notifyApprovalApproved: jest.fn().mockResolvedValue(undefined),
  notifyApprovalRejected: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/programs/audit-log', () => ({
  writeProgramAuditLogBestEffort: jest.fn().mockResolvedValue(undefined),
}));

import { submitForApproval, decideApprovalRequest } from '../approval';

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
    brief_snapshot: { name: 'Test program', phase: '2' },
    created_at: '2026-04-29T10:00:00.000Z',
    updated_at: '2026-04-29T10:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  emitNotificationMock.mockClear();
  emitNotificationMock.mockResolvedValue({ eventId: 'evt_1', enqueuedDeliveries: 1 });
  fromMock.mockClear();
  pendingResults = [];
});

describe('W4-PR-3 · submitForApproval → emitNotification("approval.requested")', () => {
  it('emits after the primary insert succeeds with the template payload shape', async () => {
    pendingResults.push({
      singleResult: { data: makeDbRow(), error: null },
    });
    pendingResults.push({ arrayResult: { data: null, error: null } });

    await submitForApproval({
      tenantKey: 'apex-retail',
      programId: 'eng_1',
      requestedByUserId: 'user_1',
      briefSnapshot: { name: 'Test program', phase: '2' },
    });

    // The broker call is fire-and-forget; let the microtask queue
    // drain before asserting.
    await new Promise((r) => setImmediate(r));

    expect(emitNotificationMock).toHaveBeenCalledTimes(1);
    const arg = emitNotificationMock.mock.calls[0]?.[0] as { tenantKey?: string; eventType?: string; payload: Record<string, unknown>; actorUserId?: string; targetResourceId?: string };
    expect(arg).toMatchObject({
      tenantKey: 'apex-retail',
      eventType: 'approval.requested',
      actorUserId: 'user_1',
      targetResourceId: 'req_1',
    });
    expect(arg.payload).toMatchObject({
      requestId: 'req_1',
      programId: 'eng_1',
      programName: 'Test program',
      phase: '2',
      requestedBy: 'user_1',
    });
    expect(arg.payload.producedAtIso).toEqual(expect.any(String));
  });

  it('does NOT emit when the primary insert fails', async () => {
    pendingResults.push({
      singleResult: { data: null, error: { message: 'RLS denied' } },
    });

    await expect(
      submitForApproval({
        tenantKey: 'apex-retail',
        programId: 'eng_1',
        requestedByUserId: 'user_1',
        briefSnapshot: { name: 'Test program' },
      }),
    ).rejects.toThrow(/insert into program_approval_requests failed/);

    await new Promise((r) => setImmediate(r));
    expect(emitNotificationMock).not.toHaveBeenCalled();
  });

  it('does NOT propagate broker failures into the caller', async () => {
    pendingResults.push({
      singleResult: { data: makeDbRow(), error: null },
    });
    pendingResults.push({ arrayResult: { data: null, error: null } });

    emitNotificationMock.mockRejectedValueOnce(new Error('broker down'));

    // The primary path must still succeed.
    const out = await submitForApproval({
      tenantKey: 'apex-retail',
      programId: 'eng_1',
      requestedByUserId: 'user_1',
      briefSnapshot: { name: 'Test program' },
    });
    await new Promise((r) => setImmediate(r));

    expect(out.id).toBe('req_1');
    expect(emitNotificationMock).toHaveBeenCalledTimes(1);
  });
});

describe('W4-PR-3 · decideApprovalRequest → emitNotification("program.gate_decision")', () => {
  it('emits "approved" decision after the primary update lands', async () => {
    pendingResults.push({
      singleResult: {
        data: makeDbRow({
          request_status: 'approved',
          decided_by_user_id: 'admin_1',
          decided_at: '2026-04-29T11:00:00.000Z',
        }),
        error: null,
      },
    });
    pendingResults.push({ arrayResult: { data: null, error: null } });

    await decideApprovalRequest({
      requestId: 'req_1',
      decidedByUserId: 'admin_1',
      decision: 'approved',
    });
    await new Promise((r) => setImmediate(r));

    expect(emitNotificationMock).toHaveBeenCalledTimes(1);
    const arg = emitNotificationMock.mock.calls[0]?.[0] as { tenantKey?: string; eventType?: string; payload: Record<string, unknown>; actorUserId?: string; targetResourceId?: string };
    expect(arg).toMatchObject({
      tenantKey: 'apex-retail',
      eventType: 'program.gate_decision',
      actorUserId: 'admin_1',
      targetResourceId: 'eng_1',
    });
    expect(arg.payload).toMatchObject({
      programId: 'eng_1',
      programName: 'Test program',
      decision: 'approved',
      newPhase: '2',
      decidedBy: 'admin_1',
    });
  });

  it('maps a rejected request to decision="blocked"', async () => {
    pendingResults.push({
      singleResult: {
        data: makeDbRow({
          request_status: 'rejected',
          decided_by_user_id: 'admin_1',
          decision_rationale: 'Scope too broad',
        }),
        error: null,
      },
    });
    pendingResults.push({ arrayResult: { data: null, error: null } });

    await decideApprovalRequest({
      requestId: 'req_1',
      decidedByUserId: 'admin_1',
      decision: 'rejected',
      rationale: 'Scope too broad',
    });
    await new Promise((r) => setImmediate(r));

    expect(emitNotificationMock).toHaveBeenCalledTimes(1);
    const arg = emitNotificationMock.mock.calls[0]?.[0] as { tenantKey?: string; eventType?: string; payload: Record<string, unknown>; actorUserId?: string; targetResourceId?: string };
    expect(arg.payload).toMatchObject({
      decision: 'blocked',
      rationale: 'Scope too broad',
    });
  });

  it('does NOT emit when the primary update fails (already decided)', async () => {
    pendingResults.push({
      singleResult: { data: null, error: { message: 'no row' } },
    });

    await expect(
      decideApprovalRequest({
        requestId: 'req_1',
        decidedByUserId: 'admin_1',
        decision: 'approved',
      }),
    ).rejects.toThrow(/failed to update request/);

    await new Promise((r) => setImmediate(r));
    expect(emitNotificationMock).not.toHaveBeenCalled();
  });

  it('does NOT propagate broker failures into the caller', async () => {
    pendingResults.push({
      singleResult: {
        data: makeDbRow({
          request_status: 'approved',
          decided_by_user_id: 'admin_1',
        }),
        error: null,
      },
    });
    pendingResults.push({ arrayResult: { data: null, error: null } });

    emitNotificationMock.mockRejectedValueOnce(new Error('broker down'));

    const out = await decideApprovalRequest({
      requestId: 'req_1',
      decidedByUserId: 'admin_1',
      decision: 'approved',
    });
    await new Promise((r) => setImmediate(r));

    expect(out.requestStatus).toBe('approved');
    expect(emitNotificationMock).toHaveBeenCalledTimes(1);
  });
});
