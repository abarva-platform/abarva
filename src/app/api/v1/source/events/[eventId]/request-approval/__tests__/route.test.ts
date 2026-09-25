const requireTenancyMock = jest.fn();
const activeClientMock = jest.fn();
const accessPolicyMock = jest.fn();
const sendMock = jest.fn();
const getUserMock = jest.fn();
const fromMock = jest.fn();

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: (error: Error) => { throw error; },
}));
jest.mock('@/lib/active-client', () => ({ getActiveClientRow: () => activeClientMock() }));
jest.mock('@/lib/auth/source-access-policy', () => ({
  loadUserSourceAccessPolicy: () => accessPolicyMock(),
}));
jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureReadFluentClient: () => ({ from: fromMock }),
}));
jest.mock('@clerk/nextjs/server', () => ({
  clerkClient: async () => ({ users: { getUser: getUserMock } }),
}));
jest.mock('@/lib/source/notifications/approval-request', () => ({
  sendApprovalRequestEmail: (...args: unknown[]) => sendMock(...args),
}));

import { POST } from '../route';

function eventQuery(event: unknown) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data: event, error: null }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

function participantQuery(rows: unknown[]) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    then: (resolve: (value: unknown) => unknown) => resolve({ data: rows, error: null }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

const params = { params: Promise.resolve({ eventId: 'event-1' }) };
const request = (body: object) => new Request('https://app.example.test/api/source', {
  method: 'POST',
  body: JSON.stringify(body),
});

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({ userId: 'user_requester', clientKey: 'meridian-health' });
  activeClientMock.mockResolvedValue({ key: 'meridian-health' });
  accessPolicyMock.mockResolvedValue({ accessLevel: 'source_member', sourceEventIdsAllowed: ['event-1'] });
  getUserMock.mockResolvedValue({
    firstName: 'Alex', lastName: 'Reviewer',
    primaryEmailAddress: { emailAddress: 'admin@abarva.ai' },
  });
  sendMock.mockResolvedValue({ delivered: true, channel: 'logged_fallback', to: 'admin@abarva.ai', id: 'console-1' });
  fromMock.mockImplementation((table: string) => {
    if (table === 'source_events') return eventQuery({ id: 'event-1', event_name: 'Governed event', client_key: 'meridian-health' });
    if (table === 'source_event_participants') return participantQuery([
      { user_id: 'user_approver', approval_authority: 'approver', can_approve_source_stages: true },
    ]);
    throw new Error(`Unexpected table ${table}`);
  });
});

test('rejects a body-supplied email before any send', async () => {
  const response = await POST(request({ approverEmail: 'outsider@example.com' }), params);
  expect(response.status).toBe(400);
  expect(sendMock).not.toHaveBeenCalled();
  expect(fromMock).not.toHaveBeenCalled();
});

test('requires an event in the active tenant and a unique approver assignment', async () => {
  fromMock.mockImplementation((table: string) => table === 'source_events' ? eventQuery(null) : participantQuery([]));
  expect((await POST(request({}), params)).status).toBe(404);
  expect(sendMock).not.toHaveBeenCalled();

  fromMock.mockImplementation((table: string) => table === 'source_events'
    ? eventQuery({ id: 'event-1', event_name: 'Governed event', client_key: 'meridian-health' })
    : participantQuery([]));
  expect((await POST(request({}), params)).status).toBe(409);
  expect(sendMock).not.toHaveBeenCalled();
});

test('does not notify a viewer or a participant outside the test allowlist', async () => {
  accessPolicyMock.mockResolvedValueOnce({ accessLevel: 'source_viewer', sourceEventIdsAllowed: ['event-1'] });
  expect((await POST(request({}), params)).status).toBe(403);
  getUserMock.mockResolvedValueOnce({
    firstName: 'External', lastName: 'Reviewer',
    primaryEmailAddress: { emailAddress: 'external@example.com' },
  });
  expect((await POST(request({}), params)).status).toBe(403);
  expect(sendMock).not.toHaveBeenCalled();
});

test('sends only to the resolved event participant with the stored event name', async () => {
  const response = await POST(request({ stageLabel: 'Review' }), params);
  expect(response.status).toBe(200);
  expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
    approverEmail: 'admin@abarva.ai',
    eventName: 'Governed event',
  }));
});

test('sponsor request refuses an ordinary approver rather than notifying an admin in their place', async () => {
  const response = await POST(request({ approvalKind: 'sponsor_commitment' }), params);
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ error: 'sponsor_assignment_required' });
  expect(sendMock).not.toHaveBeenCalled();
});

test('sponsor request uses only the assigned sponsor and a fixed signed-in Scope review link', async () => {
  fromMock.mockImplementation((table: string) => table === 'source_events'
    ? eventQuery({ id: 'event-1', event_name: 'Governed event', client_key: 'meridian-health' })
    : participantQuery([
      { user_id: 'user_admin', role: 'admin', approval_authority: 'approver', can_approve_source_stages: true },
      { user_id: 'user_sponsor', role: 'sponsor', approval_authority: 'approver', can_approve_source_stages: true },
    ]));
  const response = await POST(request({ approvalKind: 'sponsor_commitment', stageLabel: 'Award approved', stageKey: 'award' }), params);
  expect(response.status).toBe(200);
  expect(getUserMock).toHaveBeenCalledWith('user_sponsor');
  expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
    stageLabel: 'Sponsor commitment',
    reviewUrl: 'https://app.abarva.ai/source/events/event-1?stage=scope',
  }));
});

test('sponsor request refuses ambiguous sponsor assignment and invalid request kind', async () => {
  fromMock.mockImplementation((table: string) => table === 'source_events'
    ? eventQuery({ id: 'event-1', event_name: 'Governed event', client_key: 'meridian-health' })
    : participantQuery([
      { user_id: 'user_sponsor', role: 'sponsor', approval_authority: 'approver', can_approve_source_stages: true },
      { user_id: 'user_other', role: 'sponsor', approval_authority: 'approver', can_approve_source_stages: true },
    ]));
  expect((await POST(request({ approvalKind: 'sponsor_commitment' }), params)).status).toBe(409);
  expect((await POST(request({ approvalKind: 'self_approve' }), params)).status).toBe(400);
  expect(sendMock).not.toHaveBeenCalled();
});
