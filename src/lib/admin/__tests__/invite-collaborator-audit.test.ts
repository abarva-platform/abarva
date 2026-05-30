/**
 * invite-collaborator-audit tests — PRE-W4-PR-1.
 *
 * Coverage:
 *   - `maskInviteeEmail` masks correctly across boundary inputs.
 *   - `writeInviteAudit` no-ops when fixture mode is on.
 *   - When live, the row is INSERTed into `admin_audit_log` with the
 *     masked email — the raw email never appears in metadata.
 *   - When `clients.id` cannot be resolved, returns false without
 *     throwing.
 */

const mockIsFixtureMode = jest.fn();
const mockMaybeSingle = jest.fn();
const mockInsert = jest.fn();
const mockFrom = jest.fn(() => ({ insert: mockInsert }));

jest.mock('@/lib/admin/data/admin-data-mode', () => {
  const actual = jest.requireActual('@/lib/admin/data/admin-data-mode');
  return { ...actual, isFixtureMode: () => mockIsFixtureMode() };
});

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: { maybeSingle: (args: unknown) => mockMaybeSingle(args) },
}));

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: () => ({ from: mockFrom }),
}));

import {
  maskInviteeEmail,
  writeInviteAudit,
} from '@/lib/admin/invite-collaborator-audit';

beforeEach(() => {
  jest.clearAllMocks();
  mockIsFixtureMode.mockReturnValue(false);
  mockMaybeSingle.mockResolvedValue({ id: 'client-uuid-123' });
  mockInsert.mockResolvedValue({ error: null });
});

describe('maskInviteeEmail', () => {
  it.each([
    ['morgan@example.com', 'm***@example.com'],
    ['Q@x.test', 'Q***@x.test'],
    ['user@deep.sub.example.com', 'u***@deep.sub.example.com'],
    ['', '***@***'],
    ['no-at', '***@***'],
    ['a@', '***@***'],
    ['@b.com', '***@***'],
  ])('masks %p → %p', (input, expected) => {
    expect(maskInviteeEmail(input)).toBe(expected);
  });
});

describe('writeInviteAudit', () => {
  const baseInput = {
    tenantCanonicalKey: 'apex-retail',
    actorUserId: 'user_admin',
    inviteeEmail: 'morgan@example.com',
    invitationId: 'inv_abc',
    role: 'collaborator',
    action: 'invite_sent' as const,
  };

  it('skips the write in fixture mode', async () => {
    mockIsFixtureMode.mockReturnValue(true);
    const ok = await writeInviteAudit(baseInput);
    expect(ok).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns false when the client_id cannot be resolved', async () => {
    mockMaybeSingle.mockResolvedValue(null);
    const ok = await writeInviteAudit(baseInput);
    expect(ok).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('inserts a row with the masked email — raw email never persisted', async () => {
    const ok = await writeInviteAudit(baseInput);
    expect(ok).toBe(true);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    const row = mockInsert.mock.calls[0]![0];
    expect(row.client_id).toBe('client-uuid-123');
    expect(row.category).toBe('auth');
    expect(row.action).toBe('invite_sent');
    expect(row.target_kind).toBe('invitation');
    expect(row.summary).toContain('m***@example.com');
    expect(row.metadata).toMatchObject({
      actor_user_id: 'user_admin',
      invitee_email_masked: 'm***@example.com',
      invitation_id: 'inv_abc',
      role: 'collaborator',
    });
    // Cross-check: the raw email is NOWHERE in the persisted payload.
    const serialized = JSON.stringify(row);
    expect(serialized).not.toContain('morgan@example.com');
  });

  it('emits the invite_accepted action when called from the webhook path', async () => {
    await writeInviteAudit({ ...baseInput, action: 'invite_accepted' });
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0]![0].action).toBe('invite_accepted');
    expect(mockInsert.mock.calls[0]![0].summary).toMatch(/accepted/i);
  });

  it('returns false (does not throw) when supabase insert errors', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'permission denied' } });
    const ok = await writeInviteAudit(baseInput);
    expect(ok).toBe(false);
  });

  it('includes programs in metadata only when non-empty', async () => {
    await writeInviteAudit({ ...baseInput, programs: ['p1', 'p2'] });
    expect(mockInsert.mock.calls[0]![0].metadata.programs).toEqual(['p1', 'p2']);

    mockInsert.mockClear();
    await writeInviteAudit({ ...baseInput, programs: [] });
    expect(mockInsert.mock.calls[0]![0].metadata.programs).toBeUndefined();
  });
});
