/** complete_module tool tests */

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

const upsertMock = jest.fn();
const fromMock = jest.fn(() => ({ upsert: upsertMock }));
jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  getServerSupabase: () => ({ from: fromMock }),
}));

import { completeModuleTool } from '../program/completeModule';

function makeCtx() {
  return {
    request: new Request('http://localhost/'),
    surface: '/programs/program-1',
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({
    clientId: 'client-1',
    userId: 'person-1',
    role: 'Director, IT Procurement',
  });
  upsertMock.mockResolvedValue({ error: null });
});

describe('complete_module tool', () => {
  it('maps P5 approval and alignment modules to phase 5 by default', async () => {
    for (const moduleKey of ['funding_approval', 'capacity_approval', 'sponsor_alignment']) {
      const result = await completeModuleTool.handler(
        {
          program_id: 'program-1',
          module_key: moduleKey,
        },
        makeCtx(),
      );

      expect(result.success).toBe(true);
    }

    expect(fromMock).toHaveBeenCalledWith('program_modules');
    expect(upsertMock).toHaveBeenCalledTimes(3);
    for (const call of upsertMock.mock.calls) {
      expect(call[0]).toEqual(
        expect.objectContaining({
          phase_number: 5,
          module_order: 5,
          status: 'completed',
          assigned_user_id: 'person-1',
        }),
      );
      expect(call[1]).toMatchObject({
        onConflict: 'engagement_id,module_key',
        ignoreDuplicates: false,
      });
    }
  });
});
