/**
 * commit_program tool tests
 *
 * Two tiers of coverage:
 *
 *  1. Pre-flight UUID validation (Surface 1 PR1.5 invariant) — locks
 *     in the actionable "that's a role, not a person" recovery
 *     message. Pure, no DB. Predates OV2-2b.
 *
 *  2. OV2-2b approval-queue wiring — verifies the new flow:
 *      • engagement is inserted with lifecycle_state =
 *        'submitted_for_approval' (NOT 'active')
 *      • submitForApproval is called with the right tenant_key,
 *        program_id, requested_by_user_id, and a populated
 *        brief_snapshot
 *      • the tool result includes engagement_id and
 *        approval_request_id
 *      • when submitForApproval throws, the engagement is rolled
 *        back via DELETE so we never leave an orphan
 *
 *  Mock strategy mirrors src/lib/programs/__tests__/approval.test.ts:
 *  the `from(...)` query builder is hand-rolled so each call can be
 *  staged with a specific result. submitForApproval is also mocked at
 *  the module boundary so we can observe its arguments without
 *  re-mocking the supabase client a second time.
 */

import type { ApprovalRequest } from '@/lib/programs/approval';

// ── Mocks (declared before importing the module under test) ─────────

const submitForApprovalMock = jest.fn();
jest.mock('@/lib/programs/approval', () => ({
  __esModule: true,
  submitForApproval: (...args: unknown[]) => submitForApprovalMock(...args),
}));

const requireTenancyMock = jest.fn();
jest.mock('@/app/api/v1/programs/_auth', () => {
  class TenancyError extends Error {
    constructor(public readonly code: 'unauthenticated' | 'no_client') {
      super(code);
    }
  }
  return {
    __esModule: true,
    requireTenancy: (...args: unknown[]) => requireTenancyMock(...args),
    TenancyError,
  };
});

const getActiveClientRowMock = jest.fn();
jest.mock('@/lib/active-client', () => ({
  __esModule: true,
  getActiveClientRow: (...args: unknown[]) => getActiveClientRowMock(...args),
}));

const markDraftCommittedMock = jest.fn();
jest.mock('@/lib/programs/origination-drafts', () => ({
  __esModule: true,
  markDraftCommitted: (...args: unknown[]) => markDraftCommittedMock(...args),
}));

// ── Hand-rolled supabase query-builder mock ─────────────────────────

interface QueryState {
  table: string;
  insertedRow: Record<string, unknown> | null;
  updatePayload: Record<string, unknown> | null;
  deleted: boolean;
  filters: Array<{ op: 'eq' | 'gte' | 'limit'; column?: string; value?: unknown }>;
  selectColumns: string | null;
  orderBy: { column: string; ascending: boolean } | null;
  singleResult: { data: unknown; error: unknown };
  maybeSingleResult: { data: unknown; error: unknown };
}

type QueryRecord = QueryState;

let queryLog: QueryRecord[] = [];
let pendingResults: Array<Partial<QueryState>> = [];

function makeQueryBuilder(table: string): unknown {
  const state: QueryState = {
    table,
    insertedRow: null,
    updatePayload: null,
    deleted: false,
    filters: [],
    selectColumns: null,
    orderBy: null,
    singleResult: { data: null, error: null },
    maybeSingleResult: { data: null, error: null },
  };

  const staged = pendingResults.shift();
  if (staged) Object.assign(state, staged);

  queryLog.push(state);

  const qb = {
    insert(row: Record<string, unknown>) {
      state.insertedRow = row;
      return qb;
    },
    update(payload: Record<string, unknown>) {
      state.updatePayload = payload;
      return qb;
    },
    delete() {
      state.deleted = true;
      return qb;
    },
    select(cols: string) {
      state.selectColumns = cols;
      return qb;
    },
    eq(column: string, value: unknown) {
      state.filters.push({ op: 'eq', column, value });
      return qb;
    },
    gte(column: string, value: unknown) {
      state.filters.push({ op: 'gte', column, value });
      return qb;
    },
    order(column: string, opts: { ascending: boolean }) {
      state.orderBy = { column, ascending: opts.ascending };
      return qb;
    },
    limit(n: number) {
      state.filters.push({ op: 'limit', value: n });
      return qb;
    },
    single() {
      return Promise.resolve(state.singleResult);
    },
    maybeSingle() {
      return Promise.resolve(state.maybeSingleResult);
    },
    // For inserts/deletes that resolve directly without .select()/.single()
    then(
      resolve: (v: { data: unknown; error: unknown }) => unknown,
      reject: (e: unknown) => unknown,
    ) {
      try {
        resolve({ data: null, error: null });
      } catch (e) {
        reject(e);
      }
    },
  };
  return qb;
}

const fromMock = jest.fn((table: string) => makeQueryBuilder(table));

jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  getServerSupabase: () => ({ from: fromMock }),
}));

// Module under test — imported AFTER mocks so the registry import does
// not fail and the real handler picks up the mocked dependencies.
import { commitProgramTool } from '../program/commitProgram';

function makeCtx(surface = '/programs/new') {
  return {
    request: new Request('http://localhost/'),
    surface,
  };
}

const SPONSOR_UUID = '11111111-2222-3333-4444-555555555555';
const LEAD_UUID = '99999999-aaaa-bbbb-cccc-dddddddddddd';
const ENGAGEMENT_UUID = '00000000-0000-4000-8000-000000000abc';
const APPROVAL_UUID = '00000000-0000-4000-8000-000000000def';

function makeApprovalRequest(
  overrides: Partial<ApprovalRequest> = {},
): ApprovalRequest {
  return {
    id: APPROVAL_UUID,
    tenantKey: 'apexretail',
    programId: ENGAGEMENT_UUID,
    requestedByUserId: 'user_abc',
    requestedAt: '2026-04-29T10:00:00.000Z',
    requestStatus: 'pending',
    decidedByUserId: null,
    decidedAt: null,
    decisionRationale: null,
    briefSnapshot: {},
    createdAt: '2026-04-29T10:00:00.000Z',
    updatedAt: '2026-04-29T10:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  submitForApprovalMock.mockReset();
  requireTenancyMock.mockReset();
  getActiveClientRowMock.mockReset();
  markDraftCommittedMock.mockReset();
  fromMock.mockClear();
  queryLog = [];
  pendingResults = [];
});

// ─────────────────────────────────────────────────────────────────────
// Tier 1 · pre-flight UUID validation (Surface 1 PR1.5 invariant)
// ─────────────────────────────────────────────────────────────────────

describe('commit_program · sponsor/lead UUID pre-flight', () => {
  it('rejects role-title sponsor_person_id with actionable recovery', async () => {
    const result = await commitProgramTool.handler(
      {
        program_name: 'AI Led Product Lifecycle Transformation',
        problem_statement: 'CapEx + DORA transformation',
        sponsor_person_id: 'CTO',
      },
      makeCtx(),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/invalid_sponsor_person_id/);
      expect(result.recovery).toMatch(/role/);
      expect(result.recovery).toMatch(/full name/);
    }
  });

  it('rejects a personal name as sponsor_person_id', async () => {
    const result = await commitProgramTool.handler(
      {
        program_name: 'Test',
        problem_statement: 'Test',
        sponsor_person_id: 'Lin Martinez',
      },
      makeCtx(),
    );
    expect(result.success).toBe(false);
  });

  it('rejects a role-title lead_person_id when sponsor is valid', async () => {
    const result = await commitProgramTool.handler(
      {
        program_name: 'Test',
        problem_statement: 'Test',
        sponsor_person_id: SPONSOR_UUID,
        lead_person_id: 'Head of Platform',
      },
      makeCtx(),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/invalid_lead_person_id/);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// Tier 2 · OV2-2b approval-queue wiring
// ─────────────────────────────────────────────────────────────────────

describe('commit_program · OV2-2b approval-queue flow', () => {
  function stageHappyPath(activeClientOverrides: Record<string, unknown> = {}) {
    requireTenancyMock.mockResolvedValue({
      clientId: 'client_uuid_1',
      userId: 'user_abc',
      role: 'client',
    });
    getActiveClientRowMock.mockResolvedValue({
      id: 'client_uuid_1',
      name: 'Apex Retail Group',
      industry_code: 'retail',
      key: 'apexretail',
      ...activeClientOverrides,
    });
    // Idempotency lookup (engagements maybeSingle) → no prior row
    pendingResults.push({ maybeSingleResult: { data: null, error: null } });
    // Engagement insert .select().single() → success
    pendingResults.push({
      singleResult: {
        data: { id: ENGAGEMENT_UUID, name: 'Test Program' },
        error: null,
      },
    });
  }

  it('inserts the engagement in submitted_for_approval and queues an approval request', async () => {
    stageHappyPath();
    submitForApprovalMock.mockResolvedValue(makeApprovalRequest());

    const writes: string[] = [];
    const ctx = {
      ...makeCtx(),
      writer: { write: (s: string) => writes.push(s) },
    };

    const result = await commitProgramTool.handler(
      {
        program_name: 'Test Program',
        problem_statement: 'Reduce checkout abandonment',
        target_outcome: 'Lift conversion 4 points',
        sponsor_person_id: SPONSOR_UUID,
        lead_person_id: LEAD_UUID,
        classification: 'workflow_automation',
        matched_pattern_id: 'PAT-PRG-CDP-001',
      },
      ctx,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.engagement_id).toBe(ENGAGEMENT_UUID);
    expect(result.data.approval_request_id).toBe(APPROVAL_UUID);
    expect(result.data.lifecycle_state).toBe('submitted_for_approval');
    expect(result.data.redirect_to).toBe(`/programs/${ENGAGEMENT_UUID}`);

    // 1 · the engagement insert payload carries the new lifecycle state
    const engagementInsert = queryLog.find(
      (q) => q.table === 'engagements' && q.insertedRow !== null,
    );
    expect(engagementInsert).toBeDefined();
    expect(engagementInsert!.insertedRow).toMatchObject({
      client_id: 'client_uuid_1',
      industry_code: 'RETAIL',
      name: 'Test Program',
      lifecycle_state: 'submitted_for_approval',
      status: 'draft',
      current_phase: 0,
      program_archetype: 'workflow_automation',
      origin_source: 'maestro_console',
    });

    // 2 · submitForApproval was called with the right inputs and a
    //     populated brief_snapshot
    expect(submitForApprovalMock).toHaveBeenCalledTimes(1);
    const submitArgs = submitForApprovalMock.mock.calls[0][0];
    expect(submitArgs.tenantKey).toBe('apexretail');
    expect(submitArgs.programId).toBe(ENGAGEMENT_UUID);
    expect(submitArgs.requestedByUserId).toBe('user_abc');
    expect(submitArgs.briefSnapshot).toMatchObject({
      program_name: 'Test Program',
      problem_statement: 'Reduce checkout abandonment',
      target_outcome: 'Lift conversion 4 points',
      sponsor_person_id: SPONSOR_UUID,
      lead_person_id: LEAD_UUID,
      classification: 'workflow_automation',
      matched_pattern_id: 'PAT-PRG-CDP-001',
      submitted_from_surface: '/programs/new',
    });
    expect(typeof submitArgs.briefSnapshot.submitted_at).toBe('string');

    // 3 · navigation sentinel still emitted for the client
    expect(writes.some((w) => w.includes('[[program-created:'))).toBe(true);
  });

  it('falls back to the configured client industry code when the client row is missing one', async () => {
    stageHappyPath({ industry_code: null });
    submitForApprovalMock.mockResolvedValue(makeApprovalRequest());

    const result = await commitProgramTool.handler(
      {
        program_name: 'Test Program',
        problem_statement: 'Test',
        sponsor_person_id: SPONSOR_UUID,
      },
      makeCtx(),
    );

    expect(result.success).toBe(true);
    const engagementInsert = queryLog.find(
      (q) => q.table === 'engagements' && q.insertedRow !== null,
    );
    expect(engagementInsert?.insertedRow?.industry_code).toBe('RETAIL');
  });

  it('defaults lead_person_id to sponsor_person_id when not provided', async () => {
    stageHappyPath();
    submitForApprovalMock.mockResolvedValue(makeApprovalRequest());

    await commitProgramTool.handler(
      {
        program_name: 'Test Program',
        problem_statement: 'Test',
        sponsor_person_id: SPONSOR_UUID,
      },
      makeCtx(),
    );

    const submitArgs = submitForApprovalMock.mock.calls[0][0];
    expect(submitArgs.briefSnapshot.lead_person_id).toBe(SPONSOR_UUID);
  });

  it('omits empty optional fields from the brief snapshot', async () => {
    stageHappyPath();
    submitForApprovalMock.mockResolvedValue(makeApprovalRequest());

    await commitProgramTool.handler(
      {
        program_name: 'Test',
        problem_statement: 'Test',
        sponsor_person_id: SPONSOR_UUID,
        target_outcome: '   ', // whitespace-only — should drop
      },
      makeCtx(),
    );

    const submitArgs = submitForApprovalMock.mock.calls[0][0];
    expect(submitArgs.briefSnapshot.target_outcome).toBeUndefined();
    expect(submitArgs.briefSnapshot.timeline).toBeUndefined();
  });

  it('rolls back the engagement when submitForApproval throws', async () => {
    stageHappyPath();
    submitForApprovalMock.mockRejectedValue(
      new Error('insert into program_approval_requests failed: RLS denied'),
    );

    const result = await commitProgramTool.handler(
      {
        program_name: 'Test Program',
        problem_statement: 'Test',
        sponsor_person_id: SPONSOR_UUID,
      },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/approval_submit_failed/);
    expect(result.error).toMatch(/RLS denied/);
    expect(result.recovery).toMatch(/rolled back/);

    // Compensating delete on engagements with the just-created id
    const rollback = queryLog.find(
      (q) => q.table === 'engagements' && q.deleted === true,
    );
    expect(rollback).toBeDefined();
    expect(rollback!.filters).toEqual([
      { op: 'eq', column: 'id', value: ENGAGEMENT_UUID },
    ]);
  });

  it('returns failure (and does NOT call submitForApproval) when the engagement insert fails', async () => {
    requireTenancyMock.mockResolvedValue({
      clientId: 'client_uuid_1',
      userId: 'user_abc',
    });
    getActiveClientRowMock.mockResolvedValue({
      id: 'client_uuid_1',
      name: 'Apex Retail Group',
      industry_code: 'retail',
      key: 'apexretail',
    });
    // Idempotency lookup → no prior
    pendingResults.push({ maybeSingleResult: { data: null, error: null } });
    // Engagement insert fails
    pendingResults.push({
      singleResult: {
        data: null,
        error: { message: 'unique violation: engagements_name_idx' },
      },
    });

    const result = await commitProgramTool.handler(
      {
        program_name: 'Test',
        problem_statement: 'Test',
        sponsor_person_id: SPONSOR_UUID,
      },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/engagement_insert_failed/);
    expect(submitForApprovalMock).not.toHaveBeenCalled();
  });

  it('returns the existing engagement on idempotent replay (same name within 5 minutes)', async () => {
    requireTenancyMock.mockResolvedValue({
      clientId: 'client_uuid_1',
      userId: 'user_abc',
    });
    getActiveClientRowMock.mockResolvedValue({
      id: 'client_uuid_1',
      name: 'Apex Retail Group',
      industry_code: 'retail',
      key: 'apexretail',
    });
    // Idempotency lookup → found prior submission
    pendingResults.push({
      maybeSingleResult: {
        data: {
          id: ENGAGEMENT_UUID,
          name: 'Test Program',
          created_at: new Date().toISOString(),
          lifecycle_state: 'submitted_for_approval',
        },
        error: null,
      },
    });
    // Approval lookup for the existing engagement → found
    pendingResults.push({
      maybeSingleResult: { data: { id: APPROVAL_UUID }, error: null },
    });

    const result = await commitProgramTool.handler(
      {
        program_name: 'Test Program',
        problem_statement: 'Test',
        sponsor_person_id: SPONSOR_UUID,
      },
      makeCtx(),
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.idempotent_replay).toBe(true);
    expect(result.data.engagement_id).toBe(ENGAGEMENT_UUID);
    expect(result.data.approval_request_id).toBe(APPROVAL_UUID);
    // submitForApproval is NOT called on replay — we already have one.
    expect(submitForApprovalMock).not.toHaveBeenCalled();
  });
});
