// EXPORT-1 · audit.ts unit tests.
//
// We mock the Supabase client to verify the insert payload shape and
// error propagation. Real DB tests come in EXPORT-4 when the API route
// exists.

const insertMock = jest.fn();

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: jest.fn(() => ({
    from: jest.fn(() => ({ insert: insertMock })),
  })),
}));

import { recordExportAudit } from '@/lib/programs/exports/audit';

describe('recordExportAudit', () => {
  beforeEach(() => {
    insertMock.mockReset();
  });

  it('inserts a snake_cased row matching the migration column shape on success', async () => {
    insertMock.mockResolvedValueOnce({ error: null });
    await recordExportAudit({
      tenantKey: 'apex-retail',
      programId: '11111111-1111-1111-1111-111111111111',
      deliverableKind: 'program-charter',
      format: 'docx',
      filename: 'apex-program-charter-20260429.docx',
      sizeBytes: 47_000,
      actorUserId: 'user_clerk_42',
      outcome: 'success',
    });
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith({
      tenant_key: 'apex-retail',
      program_id: '11111111-1111-1111-1111-111111111111',
      deliverable_kind: 'program-charter',
      format: 'docx',
      filename: 'apex-program-charter-20260429.docx',
      size_bytes: 47_000,
      actor_user_id: 'user_clerk_42',
      outcome: 'success',
      error_message: null,
    });
  });

  it('passes program_id as null when omitted (cross-program export)', async () => {
    insertMock.mockResolvedValueOnce({ error: null });
    await recordExportAudit({
      tenantKey: 'apex-retail',
      deliverableKind: 'archetype-primer',
      format: 'html',
      filename: 'primer-archetype-primer-20260429.html',
      sizeBytes: 18_000,
      actorUserId: 'user_clerk_99',
      outcome: 'success',
    });
    const payload = insertMock.mock.calls[0][0];
    expect(payload.program_id).toBeNull();
    expect(payload.error_message).toBeNull();
  });

  it('passes the supplied error_message on outcome=error', async () => {
    insertMock.mockResolvedValueOnce({ error: null });
    await recordExportAudit({
      tenantKey: 'apex-retail',
      programId: '22222222-2222-2222-2222-222222222222',
      deliverableKind: 'okr-baseline',
      format: 'xlsx',
      filename: 'okr-okr-baseline-20260429.xlsx',
      sizeBytes: 0,
      actorUserId: 'user_clerk_77',
      outcome: 'error',
      errorMessage: 'sheet "current" exceeded 10 MB cap',
    });
    const payload = insertMock.mock.calls[0][0];
    expect(payload.outcome).toBe('error');
    expect(payload.error_message).toBe('sheet "current" exceeded 10 MB cap');
    expect(payload.size_bytes).toBe(0);
  });

  it('records a denied outcome with zero size', async () => {
    insertMock.mockResolvedValueOnce({ error: null });
    await recordExportAudit({
      tenantKey: 'meridian',
      programId: '33333333-3333-3333-3333-333333333333',
      deliverableKind: 'program-charter',
      format: 'docx',
      filename: 'denied-program-charter-20260429.docx',
      sizeBytes: 0,
      actorUserId: 'user_clerk_03',
      outcome: 'denied',
      errorMessage: 'wrong tenant',
    });
    const payload = insertMock.mock.calls[0][0];
    expect(payload.outcome).toBe('denied');
    expect(payload.tenant_key).toBe('meridian');
    expect(payload.error_message).toBe('wrong tenant');
  });

  it('throws a descriptive error when the Supabase insert errors', async () => {
    insertMock.mockResolvedValueOnce({ error: { message: 'permission denied' } });
    await expect(
      recordExportAudit({
        tenantKey: 'apex-retail',
        deliverableKind: 'roadmap',
        format: 'html',
        filename: 'roadmap-roadmap-20260429.html',
        sizeBytes: 9000,
        actorUserId: 'user_clerk_42',
        outcome: 'success',
      }),
    ).rejects.toThrow(/recordExportAudit failed: permission denied/);
  });
});
