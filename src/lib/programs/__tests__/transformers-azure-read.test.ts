import { azureRead } from '@/lib/data-plane/azureRead';
import { buildProgramSummary } from '../transformers';
import type { ProgramCore } from '../types.db';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    count: jest.fn(),
    maybeSingle: jest.fn(),
    query: jest.fn(),
    select: jest.fn(),
  },
}));

jest.mock('../queries', () => ({
  getMilestones: jest.fn(),
  getModuleState: jest.fn().mockResolvedValue([]),
  getRisks: jest.fn(),
  getWorkItems: jest.fn(),
}));

jest.mock('../governance', () => ({
  evaluateGate: jest.fn(),
  gateCriteriaForPhase: jest.fn(),
}));

const maybeSingleMock = azureRead.maybeSingle as jest.MockedFunction<typeof azureRead.maybeSingle>;
const selectMock = azureRead.select as jest.MockedFunction<typeof azureRead.select>;
const countMock = azureRead.count as jest.MockedFunction<typeof azureRead.count>;

const sponsorUuid = '00000000-0000-4000-8000-000000000101';
const leadUuid = '00000000-0000-4000-8000-000000000102';

const baseProgram: ProgramCore = {
  id: 'eng-1',
  clientId: 'client-apex',
  name: 'Modernize merchandise planning',
  sponsorPersonId: null,
  problemStatement: null,
  targetOutcome: null,
  timelineHorizon: null,
  valueProjectedLowUsd: null,
  valueProjectedHighUsd: null,
  valueVerifiedUsd: null,
  valueVerifiedStatus: null,
  valueCurrency: 'USD',
  valueAssumptions: null,
  archetype: 'strategic_transformation',
  originSource: null,
  originSourceRef: null,
  status: 'active',
  lifecycleState: 'approved',
  currentPhase: 1,
  currentModuleKey: null,
  maestroOversightLevel: null,
  founderApprovalRequired: false,
  phaseLockedAt: null,
  phaseLockedByUserId: null,
  dataResidencyRegion: null,
  retentionPolicyYears: null,
  archivedAt: null,
  deletedAt: null,
  createdAt: '2026-05-29T10:00:00Z',
  updatedAt: null,
  charter: null,
  functionPackKey: null,
  functionPackConfidence: null,
  gatesPassed: [],
};

describe('program transformers azureRead reads', () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
    selectMock.mockReset();
    countMock.mockReset();

    selectMock.mockImplementation(async (request) => {
      if (request.table === 'engagement_participants') {
        return [
          { user_id: sponsorUuid, approval_authority: 'sponsor', role: 'Sponsor' },
          { user_id: leadUuid, approval_authority: 'approver', role: 'Lead' },
        ] as never;
      }
      return [] as never;
    });

    maybeSingleMock.mockImplementation(async (request) => {
      if (request.table === 'clients') return { name: 'Apex Retail Group' } as never;
      if (request.table === 'persons' && request.where?.id === sponsorUuid) {
        return { id: sponsorUuid, name: 'Avery Chen', role: 'COO' } as never;
      }
      if (request.table === 'persons' && request.where?.id === leadUuid) {
        return { id: leadUuid, name: 'Sam Rivera', role: 'VP Delivery' } as never;
      }
      if (request.table === 'pattern_match_logs') return { pattern_key: 'retail-oms-01' } as never;
      if (request.table === 'deliverables_v2') return { title: 'Planning charter', status: 'draft' } as never;
      if (request.table === 'module_state_log') return { created_at: '2026-05-29T12:00:00Z' } as never;
      if (request.table === 'engagement_topics') return { title: 'Retail OMS modernization' } as never;
      return null;
    });

    countMock.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
  });

  it('builds program summaries without a runtime Supabase client', async () => {
    const summary = await buildProgramSummary(baseProgram);

    expect(summary).toMatchObject({
      id: 'eng-1',
      name: 'Modernize merchandise planning',
      clientName: 'Retail Demo',
      patternKey: 'retail-oms-01',
      patternName: 'Retail OMS modernization',
      charterSummary: 'Planning charter',
      attentionBadge: { label: '1 critical flag', variant: 'danger' },
      sponsorPerson: { id: sponsorUuid, name: 'Avery Chen', title: 'COO' },
      leadPerson: { id: leadUuid, name: 'Sam Rivera', title: 'VP Delivery' },
    });
    expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
      table: 'engagement_participants',
      where: expect.objectContaining({ engagement_id: 'eng-1' }),
    }));
    expect(countMock).toHaveBeenCalledWith(expect.objectContaining({
      table: 'maestro_oversight_flags',
      where: expect.objectContaining({ engagement_id: 'eng-1', severity: 'critical' }),
    }));
  });

  it('does not query uuid-typed persons.id with legacy participant display names', async () => {
    selectMock.mockImplementation(async (request) => {
      if (request.table === 'engagement_participants') {
        return [
          { user_id: 'Anand Sundaram', approval_authority: 'sponsor', role: 'Sponsor' },
          { user_id: 'Portfolio Lead', approval_authority: 'approver', role: 'Lead' },
        ] as never;
      }
      return [] as never;
    });

    const summary = await buildProgramSummary(baseProgram);

    expect(summary.sponsorPerson).toMatchObject({
      id: 'Anand Sundaram',
      name: 'Anand Sundaram',
    });
    expect(summary.leadPerson).toMatchObject({
      id: 'Portfolio Lead',
      name: 'Portfolio Lead',
    });
    expect(maybeSingleMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'persons',
        where: { id: 'Anand Sundaram' },
      }),
    );
  });
});
