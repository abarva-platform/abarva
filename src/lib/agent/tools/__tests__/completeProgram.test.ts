/** complete_program tool tests */

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

const updateEq2Mock = jest.fn();
const updateEq1Mock = jest.fn(() => ({ eq: updateEq2Mock }));
const updateMock = jest.fn(() => ({ eq: updateEq1Mock }));
const insertMock = jest.fn();
const fromMock = jest.fn((table: string) => {
  if (table === 'engagements') return { update: updateMock };
  if (table === 'module_state_log') return { insert: insertMock };
  return { insert: jest.fn() };
});

jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  getServerSupabase: () => ({ from: fromMock }),
}));

const writeAuditMock = jest.fn();
jest.mock('@/lib/programs/audit-log', () => ({
  __esModule: true,
  writeProgramAuditLogBestEffort: (...args: unknown[]) => writeAuditMock(...args),
}));

import { completeProgramTool } from '../program/completeProgram';

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({ clientId: 'client-1', userId: 'person-1' });
  updateEq2Mock.mockResolvedValue({ error: null });
  insertMock.mockResolvedValue({ error: null });
});

describe('complete_program tool', () => {
  it('marks P6 Tower Handoff complete and writes an audit event', async () => {
    const writer = { write: jest.fn() };

    const result = await completeProgramTool.handler(
      {
        program_id: 'program-1',
        completion_notes: 'Tower handoff setup completed and monitoring contract signed.',
      },
      {
        request: new Request('http://localhost/programs/program-1'),
        surface: '/programs/program-1',
        writer,
      },
    );

    expect(result.success).toBe(true);
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      lifecycle_state: 'completed',
      status: 'completed',
      current_phase: 6,
    }));
    expect(writeAuditMock).toHaveBeenCalledWith(
      { clientId: 'client-1', userId: 'person-1' },
      expect.objectContaining({
        action: 'program_completed',
        fromState: 'P6',
        toState: 'completed',
      }),
    );
    expect(writer.write).toHaveBeenCalledWith(expect.stringContaining('program-phase-changed'));
  });
});
