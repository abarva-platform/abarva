const getProgramByIdMock = jest.fn();
const writeProgramAuditLogBestEffortMock = jest.fn();
const fromMock = jest.fn();

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  __esModule: true,
  getAzureWriteFluentClient: () => ({ from: fromMock }),
}));

jest.mock('../queries', () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

jest.mock('../audit-log', () => ({
  __esModule: true,
  writeProgramAuditLogBestEffort: (...args: unknown[]) =>
    writeProgramAuditLogBestEffortMock(...args),
}));

import { ensurePhaseGateDeliverable } from '../mutations';

function selectMaybeSingle(result: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

function insertSelectSingle(result: unknown, payloads: unknown[]) {
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

function insertOnly(payloads: unknown[]) {
  return {
    insert: jest.fn((payload) => {
      payloads.push(payload);
      return { error: null };
    }),
  };
}

function upsertOnly(payloads: unknown[]) {
  return {
    upsert: jest.fn((payload) => {
      payloads.push(payload);
      return { error: null };
    }),
  };
}

describe('ensurePhaseGateDeliverable', () => {
  beforeEach(() => {
    fromMock.mockReset();
    getProgramByIdMock.mockReset();
    writeProgramAuditLogBestEffortMock.mockReset();
    getProgramByIdMock.mockResolvedValue({ id: 'program-1' });
    writeProgramAuditLogBestEffortMock.mockResolvedValue(undefined);
  });

  it('creates the gate deliverable in in_review when none exists', async () => {
    const typePayloads: unknown[] = [];
    const deliverablePayloads: unknown[] = [];
    const versionPayloads: unknown[] = [];

    fromMock.mockImplementation((table: string) => {
      if (table === 'deliverable_types') return upsertOnly(typePayloads);
      if (
        table === 'deliverables_v2' &&
        fromMock.mock.calls.filter(([t]) => t === 'deliverables_v2').length === 1
      ) {
        return selectMaybeSingle({ data: null, error: null });
      }
      if (table === 'deliverables_v2') {
        return insertSelectSingle(
          { data: { id: 'charter-1' }, error: null },
          deliverablePayloads,
        );
      }
      if (table === 'deliverable_versions') return insertOnly(versionPayloads);
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await ensurePhaseGateDeliverable(
      { clientId: 'client-1', userId: 'person-1' },
      'program-1',
      { deliverableTypeKey: 'charter', title: 'Program Charter', content: 'x' },
    );

    expect(result).toEqual({
      deliverableId: 'charter-1',
      status: 'in_review',
      created: true,
    });
    // The gate row must be born sign-off-ready (in_review), typed, and owned.
    expect(deliverablePayloads[0]).toEqual(
      expect.objectContaining({
        engagement_id: 'program-1',
        deliverable_type_key: 'charter',
        status: 'in_review',
        created_by: 'person-1',
      }),
    );
    expect(versionPayloads).toHaveLength(1);
  });

  it('returns an existing deliverable untouched (never resets a signed_off record)', async () => {
    const deliverablePayloads: unknown[] = [];
    fromMock.mockImplementation((table: string) => {
      if (table === 'deliverable_types') return upsertOnly([]);
      if (table === 'deliverables_v2') {
        // Only the find should run; any insert here is a bug.
        const calls = fromMock.mock.calls.filter(([t]) => t === 'deliverables_v2').length;
        if (calls === 1) {
          return selectMaybeSingle({
            data: { id: 'charter-existing', status: 'signed_off' },
            error: null,
          });
        }
        return insertSelectSingle({ data: { id: 'should-not-insert' }, error: null }, deliverablePayloads);
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await ensurePhaseGateDeliverable(
      { clientId: 'client-1', userId: 'person-1' },
      'program-1',
      { deliverableTypeKey: 'charter', title: 'Program Charter' },
    );

    expect(result).toEqual({
      deliverableId: 'charter-existing',
      status: 'signed_off',
      created: false,
    });
    // Critical: no insert — a re-save must not clobber a signed_off record.
    expect(deliverablePayloads).toHaveLength(0);
  });
});
