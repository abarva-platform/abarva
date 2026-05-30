/**
 * sendInvite server-action tests — PRE-W4-PR-1.
 *
 * Coverage:
 *   - unauthenticated → `unauthenticated`
 *   - non-admin caller → `forbidden`
 *   - no active tenancy → `no_active_tenant`
 *   - invalid email shape → `invalid_email`
 *   - invalid role → `invalid_role`
 *   - happy path → returns `invitationId` + masked email
 *   - happy path → writes one `admin_audit_log` row with masked email
 *   - duplicate Clerk record → `already_member`
 *   - Clerk 429 → `rate_limited`
 *   - in-process burst → `rate_limited` after 10 invites in a window
 *
 * The Clerk + tenancy + audit-writer modules are mocked so the test
 * does not need network or DB. The masking helper is verified
 * separately via its export.
 */

const mockAuth = jest.fn();
const mockGetUser = jest.fn();
const mockCreateInvitation = jest.fn();
const mockRequireTenancy = jest.fn();
const mockWriteInviteAudit = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  clerkClient: async () => ({
    users: { getUser: (id: string) => mockGetUser(id) },
    invitations: { createInvitation: (args: unknown) => mockCreateInvitation(args) },
  }),
}));

jest.mock('@clerk/backend/errors', () => ({
  isClerkAPIResponseError: (err: unknown): boolean =>
    !!err && typeof err === 'object' && '__clerk' in (err as Record<string, unknown>),
}));

jest.mock('@/lib/auth/tenancy', () => {
  const actual = jest.requireActual('@/lib/auth/tenancy');
  return {
    ...actual,
    requireTenancy: () => mockRequireTenancy(),
  };
});

jest.mock('@/lib/admin/invite-collaborator-audit', () => {
  const actual = jest.requireActual('@/lib/admin/invite-collaborator-audit');
  return {
    ...actual,
    writeInviteAudit: (args: unknown) => mockWriteInviteAudit(args),
  };
});

import { TenancyError } from '@/lib/auth/tenancy';
import { __resetInviteRateLimitForTests } from '@/lib/admin/invite-rate-limit';
import { maskInviteeEmail } from '@/lib/admin/invite-collaborator-audit';

function makeClerkError(opts: { code: string; message?: string; status?: number }) {
  return {
    __clerk: true,
    status: opts.status ?? 422,
    errors: [
      {
        code: opts.code,
        message: opts.message ?? 'Clerk error',
        longMessage: opts.message ?? 'Clerk error',
      },
    ],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  __resetInviteRateLimitForTests();
  mockWriteInviteAudit.mockResolvedValue(true);
  // Sensible defaults so individual tests only override what they need.
  mockAuth.mockResolvedValue({ userId: 'user_admin' });
  mockGetUser.mockResolvedValue({ publicMetadata: { role: 'admin' } });
  mockRequireTenancy.mockResolvedValue({
    clientId: 'client-uuid',
    clientKey: 'apex-retail',
    userId: 'user_admin',
  });
  mockCreateInvitation.mockResolvedValue({ id: 'inv_abc123' });
});

describe('maskInviteeEmail', () => {
  it('keeps the first char and full domain', () => {
    expect(maskInviteeEmail('morgan@example.com')).toBe('m***@example.com');
  });
  it('handles single-char locals', () => {
    expect(maskInviteeEmail('q@x.test')).toBe('q***@x.test');
  });
  it('defensive fallback for malformed input', () => {
    expect(maskInviteeEmail('not-an-email')).toBe('***@***');
    expect(maskInviteeEmail('')).toBe('***@***');
    expect(maskInviteeEmail('a@')).toBe('***@***');
  });
});

describe('sendInvite', () => {
  it('returns unauthenticated when no session', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const { sendInvite } = await import('../send-invite');
    const result = await sendInvite({
      tenantKey: 'apex-retail',
      email: 'a@b.com',
      role: 'collaborator',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('unauthenticated');
    expect(mockCreateInvitation).not.toHaveBeenCalled();
    expect(mockWriteInviteAudit).not.toHaveBeenCalled();
  });

  it('rejects non-admin callers', async () => {
    mockGetUser.mockResolvedValue({ publicMetadata: { role: 'collaborator' } });
    const { sendInvite } = await import('../send-invite');
    const result = await sendInvite({
      tenantKey: 'apex-retail',
      email: 'a@b.com',
      role: 'collaborator',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('forbidden');
    expect(mockCreateInvitation).not.toHaveBeenCalled();
  });

  it('rejects when no active tenancy is resolvable', async () => {
    mockRequireTenancy.mockImplementation(() => {
      throw new TenancyError('no_client');
    });
    const { sendInvite } = await import('../send-invite');
    const result = await sendInvite({
      tenantKey: 'apex-retail',
      email: 'a@b.com',
      role: 'collaborator',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('no_active_tenant');
  });

  it('rejects malformed email addresses', async () => {
    const { sendInvite } = await import('../send-invite');
    for (const bad of ['', 'no-at-sign', 'a@', '@b.com', 'spaces in@addr.com']) {
      const r = await sendInvite({
        tenantKey: 'apex-retail',
        email: bad,
        role: 'collaborator',
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.code).toBe('invalid_email');
    }
    expect(mockCreateInvitation).not.toHaveBeenCalled();
  });

  it('rejects unknown roles', async () => {
    const { sendInvite } = await import('../send-invite');
    const result = await sendInvite({
      tenantKey: 'apex-retail',
      email: 'morgan@example.com',
      role: 'superuser',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('invalid_role');
    expect(mockCreateInvitation).not.toHaveBeenCalled();
  });

  it('returns invitationId on success and writes one audit row', async () => {
    const { sendInvite } = await import('../send-invite');
    const result = await sendInvite({
      tenantKey: 'apex-retail',
      email: 'Morgan@Example.com',
      role: 'collaborator',
      programs: ['prog-1', 'prog-2'],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.invitationId).toBe('inv_abc123');
      expect(result.maskedEmail).toBe('m***@example.com');
    }

    expect(mockCreateInvitation).toHaveBeenCalledTimes(1);
    const inviteArgs = mockCreateInvitation.mock.calls[0]![0];
    expect(inviteArgs.emailAddress).toBe('morgan@example.com'); // normalized
    expect(inviteArgs.publicMetadata.tenant_canonical_key).toBe('apex-retail');
    expect(inviteArgs.publicMetadata.invited_by_user_id).toBe('user_admin');
    expect(inviteArgs.publicMetadata.role).toBe('collaborator');
    expect(inviteArgs.publicMetadata.programs).toEqual(['prog-1', 'prog-2']);

    // Audit writer fires fire-and-forget; the action does not await
    // it. Give the microtask queue a tick to settle.
    await new Promise((r) => setImmediate(r));
    expect(mockWriteInviteAudit).toHaveBeenCalledTimes(1);
    const auditArgs = mockWriteInviteAudit.mock.calls[0]![0];
    expect(auditArgs).toMatchObject({
      tenantCanonicalKey: 'apex-retail',
      actorUserId: 'user_admin',
      inviteeEmail: 'morgan@example.com',
      invitationId: 'inv_abc123',
      role: 'collaborator',
      action: 'invite_sent',
    });
  });

  it('maps Clerk duplicate_record to already_member', async () => {
    mockCreateInvitation.mockRejectedValue(
      makeClerkError({ code: 'duplicate_record', message: 'Already a member.' }),
    );
    const { sendInvite } = await import('../send-invite');
    const result = await sendInvite({
      tenantKey: 'apex-retail',
      email: 'a@b.com',
      role: 'collaborator',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('already_member');
  });

  it('maps Clerk 429 to rate_limited', async () => {
    mockCreateInvitation.mockRejectedValue(
      makeClerkError({ code: 'rate_limit_exceeded', status: 429, message: 'slow down' }),
    );
    const { sendInvite } = await import('../send-invite');
    const result = await sendInvite({
      tenantKey: 'apex-retail',
      email: 'a@b.com',
      role: 'collaborator',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('rate_limited');
  });

  it('enforces the in-process rate limit at 10 per window', async () => {
    const { sendInvite } = await import('../send-invite');
    // First 10 succeed.
    for (let i = 0; i < 10; i++) {
      const r = await sendInvite({
        tenantKey: 'apex-retail',
        email: `user${i}@example.com`,
        role: 'collaborator',
      });
      expect(r.ok).toBe(true);
    }
    // 11th is blocked locally — Clerk is never called.
    const blocked = await sendInvite({
      tenantKey: 'apex-retail',
      email: 'user11@example.com',
      role: 'collaborator',
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.code).toBe('rate_limited');
      expect(blocked.retryInMs).toBeGreaterThan(0);
    }
    expect(mockCreateInvitation).toHaveBeenCalledTimes(10);
  });
});
