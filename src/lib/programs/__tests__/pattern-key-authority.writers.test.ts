/**
 * No external writer persists an unresolved pattern key as an
 * acted-upon match (backlog item 126).
 *
 * `pattern_match_logs` rows carry `acted_upon: true` and
 * `matched_by_agent: 'classifier_v1'`, so a row reads as evidence that
 * a classification resolved against the catalog. Three writers take
 * that key from their caller rather than from the classifier:
 *
 *   • `commit_program` — from a model, over chat
 *   • `originateProgram` — from a request body
 *   • `submitOriginationBrief` — from the origination form
 *
 * Each is driven for real here and the rows it hands the write client
 * are read back. The claim is not "the resolver exists" — it is that a
 * key the catalog does not promote never reaches a governed row.
 */

// ── shared: the catalog read behind the resolver ─────────────────────
const azureMaybeSingleMock = jest.fn();
jest.mock('@/lib/data-plane/azureRead', () => ({
  __esModule: true,
  azureRead: {
    maybeSingle: (...args: unknown[]) => azureMaybeSingleMock(...args),
    query: jest.fn(async () => []),
    select: jest.fn(async () => []),
  },
}));

// ── commit_program's dependencies ───────────────────────────────────
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

const loadUserProgramAccessPolicyMock = jest.fn();
jest.mock('@/lib/auth/program-access-policy', () => ({
  __esModule: true,
  loadUserProgramAccessPolicy: (...args: unknown[]) =>
    loadUserProgramAccessPolicyMock(...args),
}));

jest.mock('@/lib/programs/origination-drafts', () => ({
  __esModule: true,
  markDraftCommitted: jest.fn(),
}));

// ── submitOriginationBrief's own tenancy module ─────────────────────
const originationRequireTenancyMock = jest.fn();
jest.mock('@/lib/auth/tenancy', () => ({
  __esModule: true,
  requireTenancy: (...args: unknown[]) => originationRequireTenancyMock(...args),
  TenancyError: class TenancyError extends Error {
    code = 'unauthenticated';
  },
}));

// ── a write client that records every row it is handed ──────────────
interface WriteRecord {
  table: string;
  insertedRow: Record<string, unknown> | null;
  singleResult: { data: unknown; error: unknown };
  maybeSingleResult: { data: unknown; error: unknown };
}

let writeLog: WriteRecord[] = [];
let pendingResults: Array<Partial<WriteRecord>> = [];

function makeQueryBuilder(table: string): unknown {
  const state: WriteRecord = {
    table,
    insertedRow: null,
    singleResult: { data: null, error: null },
    maybeSingleResult: { data: null, error: null },
  };
  const staged = pendingResults.shift();
  if (staged) Object.assign(state, staged);
  writeLog.push(state);

  const qb: Record<string, unknown> = {
    insert(row: Record<string, unknown>) {
      state.insertedRow = row;
      return qb;
    },
    update() {
      return qb;
    },
    delete() {
      return qb;
    },
    select() {
      return qb;
    },
    eq() {
      return qb;
    },
    gte() {
      return qb;
    },
    order() {
      return qb;
    },
    limit() {
      return qb;
    },
    single: () => Promise.resolve(state.singleResult),
    maybeSingle: () => Promise.resolve(state.maybeSingleResult),
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
jest.mock('@/lib/data-plane/postgresCompat', () => ({
  __esModule: true,
  getAzureWriteFluentClient: () => ({ from: fromMock }),
}));

import { commitProgramTool } from '@/lib/agent/tools/program/commitProgram';
import { originateProgram } from '../mutations';
import { PROMOTED_PATTERN_STATES } from '../pattern-key-authority';

const PROMOTED_KEY = 'PAT-PRG-CDP-001';
const UNRESOLVABLE_KEY = 'PAT-PRG-AMS-CONSOLIDATION-001';
const SPONSOR_UUID = '11111111-2222-3333-4444-555555555555';
const LEAD_UUID = '99999999-aaaa-bbbb-cccc-dddddddddddd';
const ENGAGEMENT_UUID = '00000000-0000-4000-8000-000000000abc';

/** The catalog answers for the promoted key and for nothing else. */
function catalogPromotesOnlyTheKnownKey() {
  azureMaybeSingleMock.mockImplementation(
    async (request: { where?: Record<string, unknown> }) => {
      const key = request?.where?.topic_key;
      if (key === PROMOTED_KEY) {
        return { topic_key: PROMOTED_KEY, promotion_state: PROMOTED_PATTERN_STATES[0] };
      }
      return null;
    },
  );
}

function patternMatchRows(): Array<Record<string, unknown>> {
  return writeLog
    .filter((w) => w.table === 'pattern_match_logs' && w.insertedRow !== null)
    .map((w) => w.insertedRow!);
}

function moduleStateRows(): Array<Record<string, unknown>> {
  return writeLog
    .filter((w) => w.table === 'module_state_log' && w.insertedRow !== null)
    .map((w) => w.insertedRow!);
}

beforeEach(() => {
  writeLog = [];
  pendingResults = [];
  fromMock.mockClear();
  azureMaybeSingleMock.mockReset();
  submitForApprovalMock.mockReset();
  requireTenancyMock.mockReset();
  getActiveClientRowMock.mockReset();
  loadUserProgramAccessPolicyMock.mockReset();
  originationRequireTenancyMock.mockReset();
  catalogPromotesOnlyTheKnownKey();
});

// ─────────────────────────────────────────────────────────────────────
// commit_program · the key arrives from a model
// ─────────────────────────────────────────────────────────────────────

describe('commit_program · pattern key authority', () => {
  function stageHappyPath() {
    requireTenancyMock.mockResolvedValue({
      clientId: 'client_uuid_1',
      userId: 'user_abc',
      role: 'client_admin',
    });
    loadUserProgramAccessPolicyMock.mockResolvedValue({ canCreatePrograms: true });
    getActiveClientRowMock.mockResolvedValue({
      id: 'client_uuid_1',
      name: 'Apex Retail Group',
      industry_code: 'retail',
      key: 'apexretail',
    });
    submitForApprovalMock.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000def',
    });
    // idempotency lookup → no prior row
    pendingResults.push({ maybeSingleResult: { data: null, error: null } });
    // engagement insert → success
    pendingResults.push({
      singleResult: { data: { id: ENGAGEMENT_UUID, name: 'Test Program' }, error: null },
    });
  }

  async function commitWith(matchedPatternId: string) {
    stageHappyPath();
    return commitProgramTool.handler(
      {
        program_name: 'Test Program',
        problem_statement: 'Reduce checkout abandonment',
        sponsor_person_id: SPONSOR_UUID,
        lead_person_id: LEAD_UUID,
        matched_pattern_id: matchedPatternId,
      },
      { request: new Request('http://localhost/'), surface: '/programs/new' } as never,
    );
  }

  it('records the match when the catalog promotes the key', async () => {
    const result = await commitWith(PROMOTED_KEY);
    expect(result.success).toBe(true);

    const matches = patternMatchRows();
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      pattern_key: PROMOTED_KEY,
      acted_upon: true,
      matched_by_agent: 'classifier_v1',
    });
    expect(moduleStateRows()[0]?.context_jsonb).toMatchObject({
      pattern_key: PROMOTED_KEY,
    });
  });

  it('persists the key the catalog matched, not the string the model typed', async () => {
    // The resolver matches on the trimmed key. Persisting the caller's
    // raw string instead writes a governed row that will not join back
    // to the catalog row it claims to cite.
    const result = await commitWith(`  ${PROMOTED_KEY}\n`);
    expect(result.success).toBe(true);
    expect(patternMatchRows()[0]?.pattern_key).toBe(PROMOTED_KEY);
    expect(
      (moduleStateRows()[0]?.context_jsonb as Record<string, unknown>).pattern_key,
    ).toBe(PROMOTED_KEY);
  });

  it('writes no match row at all when the catalog does not promote the key', async () => {
    const result = await commitWith(UNRESOLVABLE_KEY);
    // The program still commits — the match log is a side effect, and
    // losing a real approval submission over a bad key would be worse.
    expect(result.success).toBe(true);
    expect(patternMatchRows()).toHaveLength(0);
  });

  it('does not smuggle the unresolved key into the module state log', async () => {
    await commitWith(UNRESOLVABLE_KEY);
    const context = moduleStateRows()[0]?.context_jsonb as Record<string, unknown>;
    expect(context.pattern_key).toBeNull();
    // The refusal is recorded as a reason, not as the key itself — the
    // key is what reads as evidence.
    expect(context.pattern_key_refused).toBe('unknown_key');
    expect(JSON.stringify(context)).not.toContain(UNRESOLVABLE_KEY);
  });

  it('keeps the unresolved key out of the brief the approver reads', async () => {
    await commitWith(UNRESOLVABLE_KEY);
    const snapshot = submitForApprovalMock.mock.calls[0][0].briefSnapshot;
    expect(snapshot.matched_pattern_id).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────
// originateProgram · the key arrives in a request body
// ─────────────────────────────────────────────────────────────────────

describe('originateProgram · pattern key authority', () => {
  const ctx = { clientId: 'client_uuid_1', userId: 'user_abc', role: 'client_admin' };

  function stage() {
    // clients lookup for industry code
    pendingResults.push({
      maybeSingleResult: { data: { name: 'Apex Retail Group', industry_code: 'retail' }, error: null },
    });
    // engagements insert .select().single()
    pendingResults.push({
      singleResult: { data: { id: ENGAGEMENT_UUID }, error: null },
    });
  }

  async function originateWith(acceptedPatternKey: string) {
    stage();
    try {
      await originateProgram(ctx as never, {
        name: 'Test Program',
        useCase: 'Reduce checkout abandonment',
        archetype: null,
        originSource: 'user_initiated',
        acceptedPatternKey,
      } as never);
    } catch {
      // getProgramById read-back is not staged; every write we assert on
      // has already happened by then.
    }
  }

  it('records the match when the catalog promotes the key', async () => {
    await originateWith(PROMOTED_KEY);
    expect(patternMatchRows()).toHaveLength(1);
    expect(patternMatchRows()[0]).toMatchObject({
      pattern_key: PROMOTED_KEY,
      acted_upon: true,
    });
  });

  it('persists the key the catalog matched, not the string the body carried', async () => {
    await originateWith(`  ${PROMOTED_KEY}\n`);
    expect(patternMatchRows()[0]?.pattern_key).toBe(PROMOTED_KEY);
  });

  it('writes no match row when the catalog does not promote the key', async () => {
    await originateWith(UNRESOLVABLE_KEY);
    expect(patternMatchRows()).toHaveLength(0);
    const context = moduleStateRows()[0]?.context_jsonb as Record<string, unknown>;
    expect(context.pattern_key).toBeNull();
    expect(JSON.stringify(context)).not.toContain(UNRESOLVABLE_KEY);
  });
});

// ─────────────────────────────────────────────────────────────────────
// submitOriginationBrief · the key arrives from the origination form
// ─────────────────────────────────────────────────────────────────────

describe('submitOriginationBrief · pattern key authority', () => {
  /**
   * Driven far enough to prove the catalog is consulted before anything
   * is read or written for the program: the active-client read is the
   * next step after the gate, and it is made to throw.
   */
  async function submitAndStopAtActiveClient(matchedPatternId: string) {
    originationRequireTenancyMock.mockResolvedValue({
      userId: 'user_abc',
      clientKey: 'apexretail',
      clientId: 'client_uuid_1',
      role: 'client_admin',
    });
    loadUserProgramAccessPolicyMock.mockResolvedValue({ canCreatePrograms: true });
    getActiveClientRowMock.mockRejectedValue(new Error('stop-here'));

    const { submitOriginationBrief } = await import('../origination-submit');
    await expect(
      submitOriginationBrief({
        programName: 'Denials recovery program',
        problemStatement: 'Denial write-offs are rising faster than collections.',
        sponsor: 'CFO',
        matchedPatternId,
      } as never),
    ).rejects.toThrow();
  }

  it('consults the catalog for a supplied key before any program read or write', async () => {
    await submitAndStopAtActiveClient(UNRESOLVABLE_KEY);
    expect(azureMaybeSingleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'engagement_topics',
        where: expect.objectContaining({ topic_key: UNRESOLVABLE_KEY }),
      }),
    );
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('does not consult the catalog when no key was supplied', async () => {
    await submitAndStopAtActiveClient('');
    expect(azureMaybeSingleMock).not.toHaveBeenCalled();
  });
});
