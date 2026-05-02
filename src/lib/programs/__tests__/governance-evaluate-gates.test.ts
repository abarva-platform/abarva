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

  it('accepts signed P1 Discovery Report content as ingested workshop evidence', async () => {
    getProgramByIdMock.mockResolvedValue({
      id: 'program-1',
      currentPhase: 1,
      archetype: 'analytics_modernization',
    });
    deliverablesFixture = [
      { id: 'discovery-report', deliverable_type_key: 'discovery_report', status: 'signed_off' },
    ];
    evidenceFixture = [];
    deliverableVersionsFixture = [
      {
        content:
          'P1 Discovery Report. Attendees: Katherine Oshima sponsor, Marcus Chen data owner, ' +
          'Linda Tran clinical informatics, Priya Nair revenue cycle, and Omar Haddad security. ' +
          'Workshop notes: data discovery session mapped Epic, claims, coding, prior auth, and VBC feeds. ' +
          'Baselines captured and owner attestation recorded. Source of record: Meridian analytics intake log and Epic/claims lineage workshop. ' +
          'Stakeholder map names required owners. Contradiction: shadow SaaS tools bypass central lineage. ' +
          'P2 readiness recommendation: proceed to Synthesis.',
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

    expect(result.failedChecks.map((check) => check.check)).not.toContain('discovery_notes_ingested');
    expect(result.failedChecks.filter((check) => check.severity === 'hard')).toEqual([]);
    expect(result.requiresApproval).toBe(true);
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

  it('accepts sponsor evidence inside a signed P0 origination brief for live-created programs', async () => {
    getProgramByIdMock.mockResolvedValue({
      id: 'program-1',
      currentPhase: 0,
      archetype: 'platform_modernization',
    });
    deliverablesFixture = [
      { id: 'origination-brief', deliverable_type_key: 'origination_brief', status: 'signed_off' },
    ];
    participantsFixture = [];
    approvalRequestsFixture = [];
    deliverableVersionsFixture = [
      {
        content:
          'P0 Origination Brief. Sponsor: Katherine Oshima. ' +
          'Problem trigger: Epic, claims, coding, and prior-auth analytics are fragmented. ' +
          'Value hypothesis: a governed analytics modernization will improve trusted delivery speed. ' +
          'Scope boundary: prior authorization and coding quality first cohort. ' +
          'P1 handoff: first evidence family is source-system inventory, data lineage, and analytics cycle time. ' +
          'Discovery capacity envelope: four-week P1 discovery with sponsor cadence.',
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

    expect(result.failedChecks.map((check) => check.check)).not.toContain('sponsor_assigned');
    expect(result.failedChecks.filter((check) => check.severity === 'hard')).toEqual([]);
    expect(result.requiresApproval).toBe(true);
  });

  it('combines approved Setup brief and signed P0 seed text for the value-hypothesis gate', async () => {
    getProgramByIdMock.mockResolvedValue({
      id: 'program-1',
      currentPhase: 0,
      archetype: 'platform_modernization',
    });
    deliverablesFixture = [
      { id: 'origination-brief', deliverable_type_key: 'origination_brief', status: 'signed_off' },
    ];
    participantsFixture = [];
    approvalRequestsFixture = [
      {
        request_status: 'approved',
        brief_snapshot: {
          sponsor: 'Katherine Oshima',
          problem_statement:
            'Epic, claims, coding, prior-auth, and VBC analytics are fragmented.',
          target_outcome:
            'Improve trusted analytics delivery speed and quality.',
        },
      },
    ];
    deliverableVersionsFixture = [
      {
        content:
          'Status: P0 seed signed off. Value hypothesis: governed analytics modernization improves trusted delivery speed. ' +
          'First cohort: care coordination and revenue-cycle analytics. ' +
          'Evidence family: source-system inventory, lineage baseline, and analytics cycle time. ' +
          'Discovery capacity envelope: four-week P1 discovery.',
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

    expect(result.failedChecks.map((check) => check.check)).not.toContain('value_hypothesis_seed');
    expect(result.failedChecks.filter((check) => check.severity === 'hard')).toEqual([]);
    expect(result.requiresApproval).toBe(true);
  });

  it('blocks P0 to P1 when only the Setup approval snapshot exists', async () => {
    getProgramByIdMock.mockResolvedValue({
      id: 'program-1',
      currentPhase: 0,
      archetype: 'platform_modernization',
    });
    deliverablesFixture = [];
    participantsFixture = [{ approval_authority: 'sponsor' }];
    approvalRequestsFixture = [
      {
        request_status: 'approved',
        brief_snapshot: {
          classification: 'platform_modernization',
          problem_statement:
            'Analytics delivery across Epic, claims, coding, prior auth, and VBC is fragmented.',
          target_outcome:
            '30% faster analytics delivery with better trust and quality.',
        },
      },
    ];
    deliverableVersionsFixture = [];

    const result = await evaluateGate(
      { clientId: 'client-1', userId: 'person-1' },
      'program-1',
      0,
      1,
    );

    expect(result.pass).toBe(false);
    expect(result.requiresApproval).toBe(false);
    expect(result.failedChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          check: 'program_seed_recorded',
          severity: 'hard',
        }),
        expect.objectContaining({
          check: 'value_hypothesis_seed',
          severity: 'hard',
        }),
      ]),
    );
  });
});
