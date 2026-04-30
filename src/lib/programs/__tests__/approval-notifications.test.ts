// OV2-2d-NOTIFY · approval-notifications unit tests
//
// Verifies that each notify function calls sendEmail with the right
// subject + recipient set, that failures are swallowed, and that
// rejection bodies include the rationale.

const sendEmailMock = jest.fn();
const getUserMock = jest.fn();

jest.mock('@/lib/email/send', () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...args),
}));

jest.mock('@clerk/nextjs/server', () => ({
  clerkClient: jest.fn(async () => ({
    users: { getUser: getUserMock },
  })),
}));

import {
  notifyApprovalApproved,
  notifyApprovalRejected,
  notifyApprovalSubmitted,
  resolveTenantAdminRecipients,
} from '../approval-notifications';
import type { ApprovalRequest } from '../approval';

function makeRequest(overrides: Partial<ApprovalRequest> = {}): ApprovalRequest {
  return {
    id: 'req_1',
    tenantKey: 'apex-retail',
    programId: 'eng_1',
    requestedByUserId: 'user_1',
    requestedAt: '2026-04-29T10:00:00.000Z',
    requestStatus: 'pending',
    decidedByUserId: null,
    decidedAt: null,
    decisionRationale: null,
    briefSnapshot: { programName: 'Contact Center AI Refresh' },
    createdAt: '2026-04-29T10:00:00.000Z',
    updatedAt: '2026-04-29T10:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  sendEmailMock.mockReset();
  sendEmailMock.mockResolvedValue({ ok: true, id: 'e1' });
  getUserMock.mockReset();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('resolveTenantAdminRecipients', () => {
  it('returns the platform-admin allowlist (RBAC fallback)', async () => {
    const recipients = await resolveTenantAdminRecipients('apex-retail');
    expect(recipients).toEqual(['anand.sundaram@thesundaram.com']);
  });
});

describe('notifyApprovalSubmitted', () => {
  it('sends to each tenant admin with the right subject and metadata', async () => {
    getUserMock.mockResolvedValueOnce({
      firstName: 'Sarah',
      lastName: 'Lee',
      primaryEmailAddress: { emailAddress: 'sarah@example.com' },
    });

    await notifyApprovalSubmitted(makeRequest());

    // One send per platform-admin recipient.
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const subjects = sendEmailMock.mock.calls.map((c) => c[0].subject);
    for (const s of subjects) {
      expect(s).toBe('New program brief queued for approval — Contact Center AI Refresh');
    }
    const recipients = sendEmailMock.mock.calls.map((c) => c[0].to);
    expect(recipients).toEqual(
      ['anand.sundaram@thesundaram.com'],
    );
    const firstCall = sendEmailMock.mock.calls[0][0];
    expect(firstCall.metadata).toMatchObject({
      Event: 'approval.submitted',
      RequestId: 'req_1',
      TenantKey: 'apex-retail',
    });
    expect(firstCall.html).toContain('Sarah Lee');
    expect(firstCall.html).toContain('/admin/programs/approvals');
  });

  it('falls back to a generic requester name when Clerk lookup fails', async () => {
    getUserMock.mockRejectedValueOnce(new Error('clerk down'));

    await notifyApprovalSubmitted(makeRequest());

    expect(sendEmailMock).toHaveBeenCalled();
    expect(sendEmailMock.mock.calls[0][0].html).toContain('A teammate');
  });

  it('swallows sendEmail rejections and never throws', async () => {
    getUserMock.mockResolvedValueOnce({
      firstName: 'X',
      primaryEmailAddress: { emailAddress: 'x@x' },
    });
    sendEmailMock.mockRejectedValue(new Error('boom'));

    await expect(notifyApprovalSubmitted(makeRequest())).resolves.toBeUndefined();
  });
});

describe('notifyApprovalApproved', () => {
  it('sends to the requester with the approved subject and program link', async () => {
    getUserMock.mockResolvedValueOnce({
      primaryEmailAddress: { emailAddress: 'requester@example.com' },
    });

    await notifyApprovalApproved(
      makeRequest({ requestStatus: 'approved', programId: 'eng_42' }),
    );

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const args = sendEmailMock.mock.calls[0][0];
    expect(args.to).toBe('requester@example.com');
    expect(args.subject).toBe(
      'Your program brief was approved — Contact Center AI Refresh',
    );
    expect(args.html).toContain('/programs/eng_42');
    expect(args.metadata.Event).toBe('approval.approved');
  });

  it('sends nothing when the requester has no email on file', async () => {
    getUserMock.mockResolvedValueOnce({});

    await notifyApprovalApproved(makeRequest({ requestStatus: 'approved' }));

    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});

describe('notifyApprovalRejected', () => {
  it('includes the decision rationale in the email body', async () => {
    getUserMock.mockResolvedValueOnce({
      primaryEmailAddress: { emailAddress: 'requester@example.com' },
    });

    await notifyApprovalRejected(
      makeRequest({
        requestStatus: 'rejected',
        decisionRationale: 'Outcomes are not measurable yet.',
      }),
    );

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const args = sendEmailMock.mock.calls[0][0];
    expect(args.subject).toBe(
      'Your program brief was returned — Contact Center AI Refresh',
    );
    expect(args.html).toContain('Outcomes are not measurable yet.');
    expect(args.html).toContain('/programs/new');
    expect(args.metadata.Event).toBe('approval.rejected');
  });

  it('escapes HTML in the rationale to avoid injection', async () => {
    getUserMock.mockResolvedValueOnce({
      primaryEmailAddress: { emailAddress: 'r@r.com' },
    });

    await notifyApprovalRejected(
      makeRequest({
        requestStatus: 'rejected',
        decisionRationale: '<script>alert(1)</script>',
      }),
    );

    const html = sendEmailMock.mock.calls[0][0].html as string;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('uses a default rationale when none is provided', async () => {
    getUserMock.mockResolvedValueOnce({
      primaryEmailAddress: { emailAddress: 'r@r.com' },
    });

    await notifyApprovalRejected(
      makeRequest({ requestStatus: 'rejected', decisionRationale: '' }),
    );

    const html = sendEmailMock.mock.calls[0][0].html as string;
    expect(html).toContain('No rationale provided.');
  });

  it('swallows sendEmail rejections and never throws', async () => {
    getUserMock.mockResolvedValueOnce({
      primaryEmailAddress: { emailAddress: 'r@r.com' },
    });
    sendEmailMock.mockRejectedValue(new Error('boom'));

    await expect(
      notifyApprovalRejected(
        makeRequest({ requestStatus: 'rejected', decisionRationale: 'x' }),
      ),
    ).resolves.toBeUndefined();
  });
});
