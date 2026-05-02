const getProgramByIdMock = jest.fn();
const fromMock = jest.fn();

let deliverablesFixture: Array<{ id: string; deliverable_type_key: string; status: string }>;
let modulesFixture: Array<{ module_key: string; status: string }>;
let participantsFixture: Array<{ approval_authority: string | null }>;
let approvalRequestsFixture: Array<{
  request_status: string | null;
  brief_snapshot: Record<string, unknown> | null;
}>;
let milestonesFixture: Array<{ id: string; name: string | null; status: string | null }>;
let evidenceFixture: Array<{ id: string }>;
let deliverableVersionsFixture: Array<{
  content: string | null;
  structured_data: Record<string, unknown> | null;
  generated_at: string;
}>;

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
        eq: jest.fn(() => Promise.resolve({ data: deliverablesFixture })),
      })),
    };
  }

  if (table === 'program_modules') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: modulesFixture })),
      })),
    };
  }

  if (table === 'engagement_participants') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: participantsFixture })),
      })),
    };
  }

  if (table === 'program_approval_requests') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: approvalRequestsFixture })),
          })),
        })),
      })),
    };
  }

  if (table === 'program_milestones') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: milestonesFixture })),
        })),
      })),
    };
  }

  if (table === 'deliverable_versions') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: deliverableVersionsFixture })),
          })),
        })),
      })),
    };
  }

  if (table === 'program_evidence_items') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: evidenceFixture })),
          })),
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
    deliverablesFixture = [
      { id: 'business-case', deliverable_type_key: 'business_case', status: 'signed_off' },
      { id: 'readiness', deliverable_type_key: 'readiness_and_change_plan', status: 'signed_off' },
      { id: 'tower', deliverable_type_key: 'tower_handoff_plan', status: 'signed_off' },
    ];
    modulesFixture = [
      { module_key: 'funding_approval', status: 'completed' },
      { module_key: 'sponsor_alignment', status: 'completed' },
    ];
    participantsFixture = [];
    approvalRequestsFixture = [];
    milestonesFixture = [];
    evidenceFixture = [];
    deliverableVersionsFixture = [];
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

  it('blocks P1 to P2 when the signed Discovery report declares unresolved hard gaps', async () => {
    getProgramByIdMock.mockResolvedValue({
      id: 'program-1',
      currentPhase: 1,
      archetype: 'ams_consolidation',
    });
    deliverablesFixture = [
      { id: 'discovery-report', deliverable_type_key: 'discovery_report', status: 'signed_off' },
    ];
    evidenceFixture = [{ id: 'p1-workshop-notes' }];
    deliverableVersionsFixture = [
      {
        content:
          'P1 Discovery Synthesis. HARD gaps: Technical Owner not yet named; ' +
          'MTTR baseline not yet pulled from ITSM. CONDITIONAL PROCEED. Do not advance to P2 charter until baseline attestation is complete.',
        structured_data: null,
        generated_at: '2026-05-02T00:00:00.000Z',
      },
    ];

    const result = await evaluateGate(
      { clientId: 'client-1', userId: 'person-1' },
      'program-1',
      1,
      2,
    );

    expect(result.pass).toBe(false);
    expect(result.failedChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ check: 'discovery_baseline_attested', severity: 'hard' }),
        expect.objectContaining({ check: 'discovery_stakeholders_named', severity: 'hard' }),
        expect.objectContaining({ check: 'p2_readiness_cleared', severity: 'hard' }),
      ]),
    );
    expect(result.requiresApproval).toBe(false);
  });

  it('accepts a signed P0 origination brief as the seed artifact without overloading discovery_report', async () => {
    getProgramByIdMock.mockResolvedValue({
      id: 'program-1',
      currentPhase: 0,
      archetype: null,
    });
    deliverablesFixture = [
      { id: 'origination-brief', deliverable_type_key: 'origination_brief', status: 'signed_off' },
    ];
    participantsFixture = [{ approval_authority: 'sponsor' }];
    approvalRequestsFixture = [];
    deliverableVersionsFixture = [
      {
        content:
          'P0 Origination Brief. Problem trigger: Epic, claims, coding, and prior-auth analytics are fragmented. ' +
          'Value hypothesis: a governed analytics modernization will improve trusted delivery speed through a shared evidence family. ' +
          'Scope boundary: prior authorization and coding quality use case first. ' +
          'P1 handoff: first evidence request is current-state analytics cycle time and data lineage completeness. ' +
          'Discovery capacity time box: four-week P1 discovery.',
        structured_data: null,
        generated_at: '2026-05-02T00:00:00.000Z',
      },
    ];

    const result = await evaluateGate(
      { clientId: 'client-1', userId: 'person-1' },
      'program-1',
      0,
      1,
    );

    expect(result.failedChecks).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ check: 'program_seed_recorded' }),
        expect.objectContaining({ check: 'value_hypothesis_seed' }),
      ]),
    );
    expect(result.failedChecks.map((check) => check.check)).not.toContain('discovery_report_signed_off');
  });
});
