/**
 * PRE-W4-PR-4 · notify-sponsor server action unit tests
 *
 * Coverage:
 *   • Increments notify_count and bumps escalation_level 0 → 1
 *   • Writes one admin_audit_log row with action='approval_sponsor_notified'
 *   • Rejects when auth fails
 *   • Rejects when the request belongs to a different tenant
 */

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const markSponsorNotifiedMock = jest.fn();
const getApprovalRequestByIdMock = jest.fn();

jest.mock('@/lib/programs/approval', () => ({
  markSponsorNotified: (...args: unknown[]) =>
    markSponsorNotifiedMock(...args),
  getApprovalRequestById: (...args: unknown[]) =>
    getApprovalRequestByIdMock(...args),
}));

const requireAdminDecideMock = jest.fn();

class FakeAdminAuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    public readonly code: string,
  ) {
    super(code);
    this.name = 'AdminAuthError';
  }
}

jest.mock('@/app/api/admin/programs/approvals/_auth', () => ({
  requireAdminDecide: (...args: unknown[]) => requireAdminDecideMock(...args),
  AdminAuthError: FakeAdminAuthError,
}));

const writeApprovalEscalationAuditMock = jest.fn();
jest.mock('../_audit-writer', () => ({
  writeApprovalEscalationAudit: (...args: unknown[]) =>
    writeApprovalEscalationAuditMock(...args),
}));

import { notifySponsorAction } from '../notify-sponsor';

const REQUEST_ID = 'req-abc';
const TENANT = 'apex-retail';

function makeExisting(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: REQUEST_ID,
    tenantKey: TENANT,
    programId: 'eng-1',
    requestedByUserId: 'user-9',
    requestedAt: '2026-05-28T00:00:00.000Z',
    requestStatus: 'pending',
    decidedByUserId: null,
    decidedAt: null,
    decisionRationale: null,
    briefSnapshot: {},
    createdAt: '2026-05-28T00:00:00.000Z',
    updatedAt: '2026-05-28T00:00:00.000Z',
    escalationLevel: 0,
    lastNotifiedAt: null,
    notifyCount: 0,
    escalatedToUserId: null,
    ...over,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  requireAdminDecideMock.mockResolvedValue({
    userId: 'admin-1',
    tenantKey: TENANT,
    isAdmin: true,
  });
  writeApprovalEscalationAuditMock.mockResolvedValue(true);
});

describe('notifySponsorAction', () => {
  it('increments notify_count and bumps escalation_level on first call', async () => {
    getApprovalRequestByIdMock.mockResolvedValue(makeExisting());
    markSponsorNotifiedMock.mockResolvedValue(
      makeExisting({
        notifyCount: 1,
        escalationLevel: 1,
        lastNotifiedAt: '2026-05-30T12:00:00.000Z',
      }),
    );

    const out = await notifySponsorAction(REQUEST_ID);

    expect(out.ok).toBe(true);
    expect(out.notifyCount).toBe(1);
    expect(out.escalationLevel).toBe(1);
    expect(out.notifiedAt).toBe('2026-05-30T12:00:00.000Z');
    expect(markSponsorNotifiedMock).toHaveBeenCalledWith({
      requestId: REQUEST_ID,
    });
  });

  it('writes an admin_audit_log row with approval_sponsor_notified', async () => {
    getApprovalRequestByIdMock.mockResolvedValue(makeExisting());
    markSponsorNotifiedMock.mockResolvedValue(
      makeExisting({
        notifyCount: 1,
        escalationLevel: 1,
        lastNotifiedAt: '2026-05-30T12:00:00.000Z',
      }),
    );

    await notifySponsorAction(REQUEST_ID);

    expect(writeApprovalEscalationAuditMock).toHaveBeenCalledTimes(1);
    const arg = writeApprovalEscalationAuditMock.mock.calls[0][0] as {
      action: string;
      tenantKey: string;
      actorUserId: string;
      requestId: string;
      metadata: Record<string, unknown>;
    };
    expect(arg.action).toBe('approval_sponsor_notified');
    expect(arg.tenantKey).toBe(TENANT);
    expect(arg.actorUserId).toBe('admin-1');
    expect(arg.requestId).toBe(REQUEST_ID);
    expect(arg.metadata.notify_count).toBe(1);
    expect(arg.metadata.escalation_level).toBe(1);
  });

  it('preserves escalation_level=2 when re-notifying after escalation', async () => {
    getApprovalRequestByIdMock.mockResolvedValue(
      makeExisting({ escalationLevel: 2, notifyCount: 3 }),
    );
    markSponsorNotifiedMock.mockResolvedValue(
      makeExisting({
        escalationLevel: 2,
        notifyCount: 4,
        lastNotifiedAt: '2026-05-30T12:30:00.000Z',
      }),
    );

    const out = await notifySponsorAction(REQUEST_ID);
    expect(out.escalationLevel).toBe(2);
    expect(out.notifyCount).toBe(4);
  });

  it('returns unauthorized when requireAdminDecide throws', async () => {
    requireAdminDecideMock.mockRejectedValue(
      new FakeAdminAuthError(403, 'forbidden_admin_required'),
    );
    const out = await notifySponsorAction(REQUEST_ID);
    expect(out.ok).toBe(false);
    expect(out.error).toBe('unauthorized');
    expect(markSponsorNotifiedMock).not.toHaveBeenCalled();
  });

  it('returns wrong_tenant when request belongs to a different tenant', async () => {
    getApprovalRequestByIdMock.mockResolvedValue(
      makeExisting({ tenantKey: 'meridian-health' }),
    );
    const out = await notifySponsorAction(REQUEST_ID);
    expect(out.ok).toBe(false);
    expect(out.error).toBe('wrong_tenant');
    expect(markSponsorNotifiedMock).not.toHaveBeenCalled();
  });

  it('returns not_found when no request', async () => {
    getApprovalRequestByIdMock.mockResolvedValue(null);
    const out = await notifySponsorAction(REQUEST_ID);
    expect(out.ok).toBe(false);
    expect(out.error).toBe('not_found');
  });

  it('rejects empty requestId', async () => {
    const out = await notifySponsorAction('');
    expect(out.ok).toBe(false);
    expect(out.error).toBe('failed');
  });
});
