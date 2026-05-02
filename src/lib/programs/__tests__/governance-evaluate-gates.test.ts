const getProgramByIdMock = jest.fn();
const fromMock = jest.fn();

jest.mock('@/lib/programs/queries', () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  getServerSupabase: () => ({ from: fromMock }),
}));

import { evaluateGate } from '@/lib/programs/governance';

function tableResult(table: string) {
  if (table === 'deliverables_v2') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [
            { id: 'business-case', deliverable_type_key: 'business_case', status: 'signed_off' },
            { id: 'readiness', deliverable_type_key: 'readiness_and_change_plan', status: 'signed_off' },
            { id: 'tower', deliverable_type_key: 'tower_handoff_plan', status: 'signed_off' },
          ],
        })),
      })),
    };
  }

  if (table === 'program_modules') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [
            { module_key: 'funding_approval', status: 'completed' },
            { module_key: 'sponsor_alignment', status: 'completed' },
          ],
        })),
      })),
    };
  }

  if (table === 'engagement_participants') {
    return { select: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ data: [] })) })) };
  }

  if (table === 'program_approval_requests') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [] })),
          })),
        })),
      })),
    };
  }

  if (table === 'program_milestones') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [] })),
        })),
      })),
    };
  }

  throw new Error(`Unexpected table ${table}`);
}

describe('evaluateGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getProgramByIdMock.mockResolvedValue({
      id: 'program-1',
      currentPhase: 5,
      archetype: 'analytics_modernization',
    });
    fromMock.mockImplementation(tableResult);
  });

  it('does not let P5 module completion replace signed funding and sponsor artifacts', async () => {
    const result = await evaluateGate(
      { clientId: 'client-1', userId: 'person-1' },
      'program-1',
      5,
      6,
    );

    expect(result.pass).toBe(false);
    expect(result.failedChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ check: 'funding_approval_recorded', severity: 'hard' }),
        expect.objectContaining({ check: 'sponsor_alignment_confirmed', severity: 'hard' }),
      ]),
    );
  });
});
