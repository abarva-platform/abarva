const insertMock = jest.fn();

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({
    from: (table: string) => ({
      insert: (payload: Record<string, unknown>) => insertMock(table, payload),
    }),
  }),
}));

jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: jest.fn(async () => ({ key: 'apexretail' })),
}));

import { writeProgramAuditLog } from '../audit-log';

describe('program audit log', () => {
  beforeEach(() => {
    insertMock.mockResolvedValue({ error: null });
  });

  it('persists valid UUID actor ids instead of nulling them', async () => {
    const actorId = '20961187-9fad-482a-9cca-f49436fc86bf';

    await writeProgramAuditLog(
      { clientId: 'client-1', userId: actorId, role: 'program_user' },
      {
        tenantKey: 'apex-retail',
        programId: 'f9fc92e8-3bbc-45d2-8e78-59671bb4feb3',
        action: 'program_evidence_captured',
        evidenceRefs: ['evidence-1'],
      },
    );

    expect(insertMock).toHaveBeenCalledWith(
      'program_audit_log',
      expect.objectContaining({ actor_id: actorId }),
    );
  });

  it('keeps non-uuid fallback ids out of the UUID column', async () => {
    await writeProgramAuditLog(
      { clientId: 'client-1', userId: 'clerk:user_123', role: 'program_user' },
      {
        tenantKey: 'apex-retail',
        programId: 'f9fc92e8-3bbc-45d2-8e78-59671bb4feb3',
        action: 'program_evidence_captured',
        evidenceRefs: ['evidence-1'],
      },
    );

    expect(insertMock).toHaveBeenCalledWith(
      'program_audit_log',
      expect.objectContaining({ actor_id: null }),
    );
  });
});
