const getProgramByIdMock = jest.fn();
const writeProgramAuditLogBestEffortMock = jest.fn();

const fromMock = jest.fn();

jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  getServerSupabase: () => ({ from: fromMock }),
}));

jest.mock('../queries', () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

jest.mock('../audit-log', () => ({
  __esModule: true,
  writeProgramAuditLogBestEffort: (...args: unknown[]) => writeProgramAuditLogBestEffortMock(...args),
}));

import { completeDeliverable } from '../mutations';

function makeSelectMaybeSingleBuilder(result: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

function makeInsertSelectSingleBuilder(result: unknown, payloads: unknown[]) {
  return {
    insert: jest.fn((payload) => {
      payloads.push(payload);
      return {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(result),
      };
    }),
  };
}

function makeInsertOnlyBuilder(payloads: unknown[]) {
  return {
    insert: jest.fn((payload) => {
      payloads.push(payload);
      return { error: null };
    }),
  };
}

describe('completeDeliverable actor attribution', () => {
  beforeEach(() => {
    fromMock.mockReset();
    getProgramByIdMock.mockReset();
    writeProgramAuditLogBestEffortMock.mockReset();
    getProgramByIdMock.mockResolvedValue({ id: 'program-1' });
    writeProgramAuditLogBestEffortMock.mockResolvedValue(undefined);
  });

  it('uses the signed-in user as created_by and records Nexus as provenance', async () => {
    const deliverablePayloads: unknown[] = [];
    const versionPayloads: unknown[] = [];
    const moduleLogPayloads: unknown[] = [];

    fromMock.mockImplementation((table: string) => {
      if (table === 'deliverables_v2' && fromMock.mock.calls.filter(([t]) => t === 'deliverables_v2').length === 1) {
        return makeSelectMaybeSingleBuilder({ data: null, error: null });
      }
      if (table === 'deliverables_v2') {
        return makeInsertSelectSingleBuilder(
          { data: { id: 'deliverable-1' }, error: null },
          deliverablePayloads,
        );
      }
      if (table === 'deliverable_versions') {
        return makeInsertSelectSingleBuilder(
          { data: { id: 'version-1' }, error: null },
          versionPayloads,
        );
      }
      if (table === 'module_state_log') {
        return makeInsertOnlyBuilder(moduleLogPayloads);
      }
      throw new Error(`Unexpected table ${table}`);
    });

    await completeDeliverable(
      { clientId: 'client-1', userId: 'person-1' },
      'program-1',
      {
        deliverableTypeKey: 'origination_brief',
        title: 'P0 Seed Brief',
        content: 'Accepted P0 seed content',
        signOff: true,
      },
    );

    expect(deliverablePayloads[0]).toEqual(
      expect.objectContaining({
        created_by: 'person-1',
        signed_off_by: 'person-1',
      }),
    );
    expect(deliverablePayloads[0]).not.toEqual(
      expect.objectContaining({ created_by: 'nexus' }),
    );
    expect(versionPayloads[0]).toEqual(
      expect.objectContaining({
        structured_data: expect.objectContaining({
          completed_by_tool: true,
          generated_by_agent: 'Nexus',
          signed_off: true,
        }),
      }),
    );
  });
});
