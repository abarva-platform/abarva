/**
 * PRE-W4-PR-4 · escalate-approval server action unit tests
 *
 * Coverage:
 *   • Sets escalation_level=2 and stores escalated_to_user_id
 *   • Writes one admin_audit_log row with action='approval_escalated'
 *   • Refuses when already at level 2
 *   • Refuses cross-tenant requests
 */

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const escalateToPlatformAdminMock = jest.fn();
const getApprovalRequestByIdMock = jest.fn();

jest.mock('@/lib/programs/approval', () => ({
  escalateToPlatformAdmin: (...args: unknown[]) =>
    escalateToPlatformAdminMock(...args),
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

import { escalateApprovalAction } from '../escalate-approval';

const REQUEST_ID = 'req-xyz';
const TENANT = 'apex-retail';

function makeExisting(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: REQUEST_ID,
    tenantKey: TENANT,
    programId: 'eng-2',
    requestedByUserId: 'user-9',
    requestedAt: '2026-05-27T00:00:00.000Z',
    requestStatus: 'pending',
    decidedByUserId: null,
    decidedAt: null,
    decisionRationale: null,
    briefSnapshot: {},
    createdAt: '2026-05-27T00:00:00.000Z',
    updatedAt: '2026-05-27T00:00:00.000Z',
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

describe('escalateApprovalAction', () => {
  it('sets escalation_level=2 and records escalated_to_user_id', async () => {
    getApprovalRequestByIdMock.mockResolvedValue(makeExisting());
    escalateToPlatformAdminMock.mockResolvedValue(
      makeExisting({
        escalationLevel: 2,
        escalatedToUserId: 'admin-1',
      }),
    );

    const out = await escalateApprovalAction(REQUEST_ID);

    expect(out.ok).toBe(true);
    expect(out.escalationLevel).toBe(2);
    expect(out.escalatedToUserId).toBe('admin-1');
    expect(escalateToPlatformAdminMock).toHaveBeenCalledWith({
      requestId: REQUEST_ID,
      escalatedToUserId: 'admin-1',
    });
  });

  it('writes an admin_audit_log row with approval_escalated', async () => {
    getApprovalRequestByIdMock.mockResolvedValue(makeExisting());
    escalateToPlatformAdminMock.mockResolvedValue(
      makeExisting({
        escalationLevel: 2,
        escalatedToUserId: 'admin-1',
      }),
    );

    await escalateApprovalAction(REQUEST_ID);

    expect(writeApprovalEscalationAuditMock).toHaveBeenCalledTimes(1);
    const arg = writeApprovalEscalationAuditMock.mock.calls[0][0] as {
      action: string;
      tenantKey: string;
      actorUserId: string;
      metadata: Record<string, unknown>;
    };
    expect(arg.action).toBe('approval_escalated');
    expect(arg.tenantKey).toBe(TENANT);
    expect(arg.actorUserId).toBe('admin-1');
    expect(arg.metadata.escalation_level).toBe(2);
    expect(arg.metadata.from_level).toBe(0);
  });

  it('refuses when already escalated to level 2', async () => {
    getApprovalRequestByIdMock.mockResolvedValue(
      makeExisting({ escalationLevel: 2, escalatedToUserId: 'admin-7' }),
    );
    const out = await escalateApprovalAction(REQUEST_ID);
    expect(out.ok).toBe(false);
    expect(out.error).toBe('already_escalated');
    expect(escalateToPlatformAdminMock).not.toHaveBeenCalled();
  });

  it('refuses cross-tenant requests', async () => {
    getApprovalRequestByIdMock.mockResolvedValue(
      makeExisting({ tenantKey: 'meridian-health' }),
    );
    const out = await escalateApprovalAction(REQUEST_ID);
    expect(out.ok).toBe(false);
    expect(out.error).toBe('wrong_tenant');
  });

  it('returns unauthorized when auth fails', async () => {
    requireAdminDecideMock.mockRejectedValue(
      new FakeAdminAuthError(401, 'unauthenticated'),
    );
    const out = await escalateApprovalAction(REQUEST_ID);
    expect(out.ok).toBe(false);
    expect(out.error).toBe('unauthorized');
  });

  it('rejects empty requestId', async () => {
    const out = await escalateApprovalAction('');
    expect(out.ok).toBe(false);
    expect(out.error).toBe('failed');
  });

  it('honors an explicit escalatedToUserIdOverride', async () => {
    getApprovalRequestByIdMock.mockResolvedValue(makeExisting());
    escalateToPlatformAdminMock.mockResolvedValue(
      makeExisting({
        escalationLevel: 2,
        escalatedToUserId: 'platform-admin-99',
      }),
    );
    const out = await escalateApprovalAction(REQUEST_ID, 'platform-admin-99');
    expect(out.ok).toBe(true);
    expect(escalateToPlatformAdminMock).toHaveBeenCalledWith({
      requestId: REQUEST_ID,
      escalatedToUserId: 'platform-admin-99',
    });
  });
});
