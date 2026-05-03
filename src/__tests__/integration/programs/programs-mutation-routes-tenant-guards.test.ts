import type { NextRequest } from 'next/server';

class TenancyError extends Error {
  constructor(public readonly code: 'unauthenticated' | 'no_client') {
    super(code);
  }
}

const requireTenancy = jest.fn();
const getProgramsRouteSupabase = jest.fn();
const getProgramById = jest.fn();
const loadUserProgramAccessPolicy = jest.fn();

const evaluateGate = jest.fn();
const requestFounderApproval = jest.fn();
const hasAuthority = jest.fn();

const advancePhase = jest.fn();
const createMilestone = jest.fn();
const updateMilestoneStatus = jest.fn();
const createRisk = jest.fn();
const createWorkItem = jest.fn();
const updateWorkItemStatus = jest.fn();
const setModuleStatus = jest.fn();
const publishDeliverable = jest.fn();
const signOffDeliverable = jest.fn();
const blockWorkItem = jest.fn();
const markWorkItemNexusDrafted = jest.fn();

jest.mock('@/app/api/v1/programs/_auth', () => ({
  TenancyError,
  requireTenancy,
  tenancyErrorResponse: (err: unknown) => {
    if (err instanceof TenancyError) {
      return Response.json({ error: err.code }, { status: err.code === 'unauthenticated' ? 401 : 403 });
    }
    throw err;
  },
}));

jest.mock('@/lib/programs/programs-auth-mode-server', () => ({
  getProgramsRouteSupabase,
}));

jest.mock('@/lib/programs/queries', () => ({
  getProgramById,
}));

jest.mock('@/lib/auth/program-access-policy', () => ({
  loadUserProgramAccessPolicy,
}));

jest.mock('@/lib/programs/governance', () => ({
  evaluateGate,
  requestFounderApproval,
  hasAuthority,
}));

jest.mock('@/lib/programs/mutations', () => ({
  advancePhase,
  createMilestone,
  updateMilestoneStatus,
  createRisk,
  createWorkItem,
  updateWorkItemStatus,
  setModuleStatus,
  publishDeliverable,
  signOffDeliverable,
}));

jest.mock('@/lib/programs/execute', () => ({
  blockWorkItem,
  markWorkItemNexusDrafted,
}));

const CTX = { clientId: 'client_meridian', userId: 'person_1', role: 'client_admin' };
const OWN_PROGRAM = 'eng_own';
const FOREIGN_PROGRAM = 'eng_foreign';

function makePost(body: unknown): NextRequest {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function makePatch(body: unknown): NextRequest {
  return new Request('http://localhost', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function makeRiskUpdateSupabase(result: { data: { id: string } | null; error: unknown }) {
  return {
    from: (table: string) => {
      if (table !== 'program_risks') throw new Error(`unexpected table ${table}`);
      return {
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                maybeSingle: async () => result,
              }),
            }),
          }),
        }),
      };
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancy.mockResolvedValue(CTX);
  getProgramsRouteSupabase.mockResolvedValue({ mode: 'service_role', supabase: { mocked: true } });
  getProgramById.mockImplementation((_ctx, programId) =>
    programId === OWN_PROGRAM ? Promise.resolve({ id: OWN_PROGRAM, currentPhase: 0 }) : Promise.resolve(null),
  );
  loadUserProgramAccessPolicy.mockResolvedValue({
    programIdsAllowed: null,
    canApproveGates: true,
  });

  evaluateGate.mockResolvedValue({
    failedChecks: [],
    requiresApproval: false,
    approverRole: null,
  });
  requestFounderApproval.mockResolvedValue('far_1');
  hasAuthority.mockResolvedValue(true);

  advancePhase.mockResolvedValue({ programId: OWN_PROGRAM, newPhase: 1, snapshotId: 'snap_1' });
  createMilestone.mockResolvedValue('ms_1');
  updateMilestoneStatus.mockResolvedValue(true);
  createRisk.mockResolvedValue('risk_1');
  createWorkItem.mockResolvedValue('wi_1');
  updateWorkItemStatus.mockResolvedValue(true);
  setModuleStatus.mockResolvedValue(true);
  publishDeliverable.mockResolvedValue(true);
  signOffDeliverable.mockResolvedValue(true);
  blockWorkItem.mockResolvedValue(true);
  markWorkItemNexusDrafted.mockResolvedValue(true);
});

type RouteCase = {
  name: string;
  modulePath: string;
  method: 'POST' | 'PATCH';
  params: Record<string, string>;
  body: Record<string, unknown>;
  successStatus: number;
  assertSuccessMock?: () => void;
  configureCrossTenantWriteDenied?: () => void;
};

const programScopedCases: RouteCase[] = [
  {
    name: 'advance',
    modulePath: '@/app/api/v1/programs/[programId]/advance/route',
    method: 'POST',
    params: { programId: OWN_PROGRAM },
    body: { toPhase: 1, snapshot: { source: 'test' } },
    successStatus: 200,
    assertSuccessMock: () => expect(advancePhase).toHaveBeenCalled(),
  },
  {
    name: 'milestones create',
    modulePath: '@/app/api/v1/programs/[programId]/milestones/route',
    method: 'POST',
    params: { programId: OWN_PROGRAM },
    body: { name: 'Milestone 1' },
    successStatus: 201,
    assertSuccessMock: () => expect(createMilestone).toHaveBeenCalled(),
  },
  {
    name: 'risks create',
    modulePath: '@/app/api/v1/programs/[programId]/risks/route',
    method: 'POST',
    params: { programId: OWN_PROGRAM },
    body: { title: 'Risk 1' },
    successStatus: 201,
    assertSuccessMock: () => expect(createRisk).toHaveBeenCalled(),
  },
  {
    name: 'work-items create',
    modulePath: '@/app/api/v1/programs/[programId]/work-items/route',
    method: 'POST',
    params: { programId: OWN_PROGRAM },
    body: { title: 'Work item 1', itemType: 'task' },
    successStatus: 201,
    assertSuccessMock: () => expect(createWorkItem).toHaveBeenCalled(),
  },
  {
    name: 'module status update',
    modulePath: '@/app/api/v1/programs/[programId]/module/[key]/status/route',
    method: 'POST',
    params: { programId: OWN_PROGRAM, key: 'baseline_capture' },
    body: { status: 'in_progress' },
    successStatus: 200,
    assertSuccessMock: () => expect(setModuleStatus).toHaveBeenCalled(),
  },
];

const resourceScopedCases: RouteCase[] = [
  {
    name: 'milestones status patch',
    modulePath: '@/app/api/v1/programs/[programId]/milestones/[milestoneId]/route',
    method: 'PATCH',
    params: { programId: OWN_PROGRAM, milestoneId: 'ms_1' },
    body: { status: 'hit' },
    successStatus: 200,
    assertSuccessMock: () => expect(updateMilestoneStatus).toHaveBeenCalled(),
    configureCrossTenantWriteDenied: () => updateMilestoneStatus.mockResolvedValueOnce(false),
  },
  {
    name: 'risk patch',
    modulePath: '@/app/api/v1/programs/[programId]/risks/[riskId]/route',
    method: 'PATCH',
    params: { programId: OWN_PROGRAM, riskId: 'risk_1' },
    body: { status: 'mitigating' },
    successStatus: 200,
    configureCrossTenantWriteDenied: () => {
      getProgramsRouteSupabase.mockResolvedValueOnce({
        mode: 'service_role',
        supabase: makeRiskUpdateSupabase({ data: null, error: null }),
      });
    },
  },
  {
    name: 'work-item patch',
    modulePath: '@/app/api/v1/programs/[programId]/work-items/[workItemId]/route',
    method: 'PATCH',
    params: { programId: OWN_PROGRAM, workItemId: 'wi_1' },
    body: { status: 'in_progress' },
    successStatus: 200,
    assertSuccessMock: () => expect(updateWorkItemStatus).toHaveBeenCalled(),
    configureCrossTenantWriteDenied: () => updateWorkItemStatus.mockResolvedValueOnce(false),
  },
  {
    name: 'deliverable publish',
    modulePath: '@/app/api/v1/programs/[programId]/deliverables/[deliverableId]/publish/route',
    method: 'POST',
    params: { programId: OWN_PROGRAM, deliverableId: 'deliv_1' },
    body: {},
    successStatus: 200,
    assertSuccessMock: () => expect(publishDeliverable).toHaveBeenCalled(),
    configureCrossTenantWriteDenied: () => publishDeliverable.mockResolvedValueOnce(false),
  },
  {
    name: 'deliverable sign-off',
    modulePath: '@/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route',
    method: 'POST',
    params: { programId: OWN_PROGRAM, deliverableId: 'deliv_1' },
    body: {},
    successStatus: 200,
    assertSuccessMock: () => expect(signOffDeliverable).toHaveBeenCalled(),
    configureCrossTenantWriteDenied: () => signOffDeliverable.mockResolvedValueOnce(false),
  },
];

async function invokeRoute(routeCase: RouteCase, paramsOverride?: Record<string, string>, bodyOverride?: Record<string, unknown>) {
  const mod = await import(routeCase.modulePath);
  const req = routeCase.method === 'POST' ? makePost(bodyOverride ?? routeCase.body) : makePatch(bodyOverride ?? routeCase.body);
  return mod[routeCase.method](req, { params: Promise.resolve(paramsOverride ?? routeCase.params) });
}

describe('Programs mutation route guards', () => {
  describe.each(programScopedCases)('$name', (routeCase) => {
    it('allows own-tenant writes', async () => {
      const res = await invokeRoute(routeCase);
      expect(res.status).toBe(routeCase.successStatus);
      expect(getProgramsRouteSupabase).toHaveBeenCalledWith('mutation');
      routeCase.assertSuccessMock?.();
    });

    it('returns 404 for foreign-tenant program id', async () => {
      const foreignParams = { ...routeCase.params, programId: FOREIGN_PROGRAM };
      const res = await invokeRoute(routeCase, foreignParams);
      expect(res.status).toBe(404);
    });

    it('denies cross-tenant write attempts with crafted payloads', async () => {
      const foreignParams = { ...routeCase.params, programId: FOREIGN_PROGRAM };
      const craftedBody = { ...routeCase.body, engagementId: OWN_PROGRAM, clientId: 'client_apex' };
      const res = await invokeRoute(routeCase, foreignParams, craftedBody);
      expect(res.status).toBe(404);
    });

    it('denies users without tenant membership', async () => {
      requireTenancy.mockRejectedValueOnce(new TenancyError('no_client'));
      const res = await invokeRoute(routeCase);
      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: 'no_client' });
    });
  });

  describe.each(resourceScopedCases)('$name', (routeCase) => {
    it('allows own-tenant writes', async () => {
      if (routeCase.name === 'risk patch') {
        getProgramsRouteSupabase.mockResolvedValueOnce({
          mode: 'service_role',
          supabase: makeRiskUpdateSupabase({ data: { id: 'risk_1' }, error: null }),
        });
      }
      const res = await invokeRoute(routeCase);
      expect(res.status).toBe(routeCase.successStatus);
      expect(getProgramsRouteSupabase).toHaveBeenCalledWith('mutation');
      routeCase.assertSuccessMock?.();
    });

    it('returns 404 for foreign-tenant program id', async () => {
      const foreignParams = { ...routeCase.params, programId: FOREIGN_PROGRAM };
      const res = await invokeRoute(routeCase, foreignParams);
      expect(res.status).toBe(404);
    });

    it('denies cross-tenant write attempts using foreign resource ids', async () => {
      routeCase.configureCrossTenantWriteDenied?.();
      const res = await invokeRoute(routeCase);
      expect(res.status).toBe(404);
    });

    it('denies users without tenant membership', async () => {
      requireTenancy.mockRejectedValueOnce(new TenancyError('no_client'));
      const res = await invokeRoute(routeCase);
      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: 'no_client' });
    });
  });
});
