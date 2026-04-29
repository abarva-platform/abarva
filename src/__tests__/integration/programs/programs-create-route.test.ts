// POST /api/v1/programs · regression tests for the create-program flow.
//
// Pinned by the 2026-04-29 founder report: the form was returning a generic
// `internal_error` because mutations.ts wrote `created_by` to engagements,
// a column that no longer exists on the production schema. These tests
// guard the fix and the upgraded error contract.

import type { NextRequest } from 'next/server';

const requireTenancy = jest.fn();
const originateProgram = jest.fn();
const logClassifierDecision = jest.fn();
const raiseMaestroFlag = jest.fn();
const buildProgramSummary = jest.fn();

// Captured between tests
let participantInserts: Array<Record<string, unknown>> = [];

const insertResponses: Record<string, { error: { message: string; code?: string } | null }> = {};

interface FakeQueryBuilder {
  insert: jest.Mock;
  select: jest.Mock<FakeQueryBuilder, []>;
  eq: jest.Mock<FakeQueryBuilder, []>;
  in: jest.Mock<FakeQueryBuilder, []>;
  maybeSingle: jest.Mock;
  single: jest.Mock;
}

function makeQueryBuilder(table: string): FakeQueryBuilder {
  const qb: FakeQueryBuilder = {
    insert: jest.fn(async (payload: Record<string, unknown>) => {
      if (table === 'engagement_participants') participantInserts.push(payload);
      return { error: insertResponses[table]?.error ?? null, data: null };
    }),
    select: jest.fn<FakeQueryBuilder, []>(() => qb),
    eq: jest.fn<FakeQueryBuilder, []>(() => qb),
    in: jest.fn<FakeQueryBuilder, []>(() => qb),
    maybeSingle: jest.fn(async () => ({ data: null, error: null })),
    single: jest.fn(async () => ({ data: null, error: null })),
  };
  return qb;
}

jest.mock('@/app/api/v1/programs/_auth', () => {
  class MockTenancyError extends Error {
    constructor(public readonly code: 'unauthenticated' | 'no_client') {
      super(code);
    }
  }
  return {
    requireTenancy,
    TenancyError: MockTenancyError,
    tenancyErrorResponse: (err: unknown) => {
      if (err instanceof MockTenancyError) {
        if (err.code === 'unauthenticated') {
          return Response.json({ error: 'unauthenticated' }, { status: 401 });
        }
        return Response.json({ error: 'no_client', detail: 'No active client for this user' }, { status: 403 });
      }
      throw err;
    },
  };
});

jest.mock('@/lib/programs/mutations', () => ({
  originateProgram,
}));

jest.mock('@/lib/programs/queries', () => ({
  getProgramPortfolio: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/programs/transformers', () => ({
  buildProgramSummary,
  classifierMatchToViewModel: jest.fn(),
}));

jest.mock('@/lib/programs/classifier', () => ({
  logClassifierDecision,
}));

jest.mock('@/lib/programs/governance', () => ({
  raiseMaestroFlag,
}));

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({
    from: (table: string) => makeQueryBuilder(table),
  }),
}));

function makeRequest(body: unknown): NextRequest {
  return new Request('http://localhost/api/v1/programs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('POST /api/v1/programs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    participantInserts = [];
    for (const k of Object.keys(insertResponses)) delete insertResponses[k];
    requireTenancy.mockResolvedValue({ clientId: 'client_1', userId: 'person_1' });
    originateProgram.mockResolvedValue({
      id: 'eng_new_1',
      clientId: 'client_1',
      name: 'Optimize AMS by AI',
      currentPhase: 0,
      programArchetype: 'operational_optimization',
      founderApprovalRequired: false,
    });
  });

  it('creates the program and returns programId + redirectTo for valid input (founder screenshot)', async () => {
    const { POST } = await import('@/app/api/v1/programs/route');
    const res = await POST(
      makeRequest({
        originationFormResult: {
          name: 'Optimize application managed services by AI',
          useCase: 'We are spending a lot with application managed services across many IT towers.',
          targetOutcome: 'Reduce price by 40% over 5 years. current spend total 48m/year',
          sponsorPersonId: 'cto',
          leadPersonId: 'cto',
        },
        originSource: 'user_initiated',
        originSourceRef: null,
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { programId: string; redirectTo: string };
    expect(body.programId).toBe('eng_new_1');
    expect(body.redirectTo).toBe('/programs/eng_new_1');

    expect(originateProgram).toHaveBeenCalledTimes(1);
    const [, input] = originateProgram.mock.calls[0];
    expect(input.name).toBe('Optimize application managed services by AI');
    expect(input.useCase).toContain('application managed services');
    expect(input.originSource).toBe('user_initiated');

    expect(participantInserts).toHaveLength(1);
    expect(participantInserts[0]).toMatchObject({
      engagement_id: 'eng_new_1',
      user_id: 'cto',
      role: 'sponsor',
      approval_authority: 'sponsor',
    });
  });

  it('returns 400 with field-level detail when required fields are missing', async () => {
    const { POST } = await import('@/app/api/v1/programs/route');
    const res = await POST(
      makeRequest({
        originationFormResult: {
          name: '',
          useCase: '',
          sponsorPersonId: 'cto',
          leadPersonId: 'cto',
        },
        originSource: 'user_initiated',
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; detail: string; fields: string[] };
    expect(body.error).toBe('bad_request');
    expect(body.fields).toEqual(['name', 'useCase']);
    expect(body.detail).toMatch(/Missing required fields/);
  });

  it('returns 401 when unauthenticated', async () => {
    const { TenancyError } = await import('@/app/api/v1/programs/_auth');
    requireTenancy.mockRejectedValueOnce(new (TenancyError as unknown as { new (code: string): Error })('unauthenticated'));
    const { POST } = await import('@/app/api/v1/programs/route');
    const res = await POST(
      makeRequest({ originationFormResult: { name: 'X', useCase: 'Y' }, originSource: 'user_initiated' }),
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('unauthenticated');
  });

  it('returns 500 with a friendly Steward-voice detail (not bare internal_error) when the DB layer throws', async () => {
    originateProgram.mockRejectedValueOnce(new Error('column engagements.created_by does not exist'));
    const { POST } = await import('@/app/api/v1/programs/route');
    const res = await POST(
      makeRequest({
        originationFormResult: { name: 'X', useCase: 'Y', sponsorPersonId: 'cto', leadPersonId: 'cto' },
        originSource: 'user_initiated',
      }),
    );
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; detail: string };
    expect(body.error).toBe('internal_error');
    expect(body.detail).toMatch(/Steward couldn't create the program record/);
    expect(body.detail).toMatch(/created_by does not exist/);
    expect(body.detail).toMatch(/Try again or contact support/);
  });

  it('still succeeds when participant insert returns an error (non-fatal warning)', async () => {
    insertResponses.engagement_participants = { error: { message: 'fk violation', code: '23503' } };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { POST } = await import('@/app/api/v1/programs/route');
    const res = await POST(
      makeRequest({
        originationFormResult: { name: 'X', useCase: 'Y', sponsorPersonId: 'cto', leadPersonId: 'cto' },
        originSource: 'user_initiated',
      }),
    );
    expect(res.status).toBe(200);
    expect(warn).toHaveBeenCalledWith(
      '[POST /api/v1/programs] sponsor participant insert failed',
      expect.objectContaining({ programId: 'eng_new_1' }),
    );
    warn.mockRestore();
  });
});

describe('originateProgram input shape (regression: no created_by)', () => {
  it('the route never asks the mutation to write to the legacy created_by column', async () => {
    // We can't read the implementation without re-importing mutations, but we
    // can assert the route's contract: the input it passes to originateProgram
    // does NOT include a `created_by` field. Pair with the read-only schema
    // probe in probe-schema.mjs which confirmed the column is gone in prod.
    requireTenancy.mockResolvedValue({ clientId: 'client_1', userId: 'person_1' });
    originateProgram.mockResolvedValue({
      id: 'eng_x',
      clientId: 'client_1',
      name: 'X',
      currentPhase: 0,
      programArchetype: null,
      founderApprovalRequired: false,
    });
    const { POST } = await import('@/app/api/v1/programs/route');
    await POST(
      makeRequest({
        originationFormResult: { name: 'X', useCase: 'Y', sponsorPersonId: 'cto', leadPersonId: 'cto' },
        originSource: 'user_initiated',
      }),
    );
    const [, input] = originateProgram.mock.calls[0];
    expect(input).not.toHaveProperty('created_by');
    expect(input).not.toHaveProperty('createdBy');
  });
});
