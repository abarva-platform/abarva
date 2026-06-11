// Source approval-request notification — unit tests.
//
// We mock the legacy email channel (@/lib/email/send) so sendEmail returns a
// controllable result, then assert sender/recipient resolution, subject
// content, and the channel mapping (email_sent vs logged_fallback vs error).

const sendEmailMock = jest.fn();

jest.mock('@/lib/email/send', () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...args),
}));

import { sendApprovalRequestEmail } from '../approval-request';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  sendEmailMock.mockReset();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.SOURCE_APPROVAL_NOTIFY_TO;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

const baseInput = {
  eventId: 'evt-123',
  eventName: 'Apex AMS Outsourcing 2026',
  stageLabel: '3. BAFO',
  reviewUrl: 'https://app.abarva.ai/source/events/evt-123/approval',
};

test('sends from the Resend-verified subdomain support@send.abarva.ai by default', async () => {
  delete process.env.SOURCE_APPROVAL_FROM_EMAIL;
  sendEmailMock.mockResolvedValue({ ok: true, id: 'resend-1' });
  await sendApprovalRequestEmail(baseInput);
  expect(sendEmailMock).toHaveBeenCalledTimes(1);
  const msg = sendEmailMock.mock.calls[0][0];
  expect(msg.from).toBe('support@send.abarva.ai');
});

test('SOURCE_APPROVAL_FROM_EMAIL overrides the sender (must be a verified domain)', async () => {
  process.env.SOURCE_APPROVAL_FROM_EMAIL = 'sourcing@send.abarva.ai';
  sendEmailMock.mockResolvedValue({ ok: true, id: 'resend-1' });
  await sendApprovalRequestEmail(baseInput);
  const msg = sendEmailMock.mock.calls[0][0];
  expect(msg.from).toBe('sourcing@send.abarva.ai');
  delete process.env.SOURCE_APPROVAL_FROM_EMAIL;
});

test('recipient defaults to admin@abarva.ai when no approverEmail and no env', async () => {
  sendEmailMock.mockResolvedValue({ ok: true, id: 'resend-1' });
  const result = await sendApprovalRequestEmail(baseInput);
  const msg = sendEmailMock.mock.calls[0][0];
  expect(msg.to).toBe('admin@abarva.ai');
  expect(result.to).toBe('admin@abarva.ai');
});

test('SOURCE_APPROVAL_NOTIFY_TO overrides the default recipient', async () => {
  process.env.SOURCE_APPROVAL_NOTIFY_TO = 'ops@abarva.ai';
  sendEmailMock.mockResolvedValue({ ok: true, id: 'resend-1' });
  const result = await sendApprovalRequestEmail(baseInput);
  expect(result.to).toBe('ops@abarva.ai');
});

test('approverEmail wins when provided', async () => {
  process.env.SOURCE_APPROVAL_NOTIFY_TO = 'ops@abarva.ai';
  sendEmailMock.mockResolvedValue({ ok: true, id: 'resend-1' });
  const result = await sendApprovalRequestEmail({ ...baseInput, approverEmail: 'approver@client.test' });
  const msg = sendEmailMock.mock.calls[0][0];
  expect(msg.to).toBe('approver@client.test');
  expect(result.to).toBe('approver@client.test');
});

test('subject contains eventName and stageLabel', async () => {
  sendEmailMock.mockResolvedValue({ ok: true, id: 'resend-1' });
  await sendApprovalRequestEmail(baseInput);
  const msg = sendEmailMock.mock.calls[0][0];
  expect(msg.subject).toContain('Apex AMS Outsourcing 2026');
  expect(msg.subject).toContain('3. BAFO');
});

test('console-* id maps to logged_fallback with delivered true', async () => {
  sendEmailMock.mockResolvedValue({ ok: true, id: 'console-123' });
  const result = await sendApprovalRequestEmail(baseInput);
  expect(result.channel).toBe('logged_fallback');
  expect(result.delivered).toBe(true);
  expect(result.id).toBe('console-123');
});

test('real id maps to email_sent', async () => {
  sendEmailMock.mockResolvedValue({ ok: true, id: 'resend-abc' });
  const result = await sendApprovalRequestEmail(baseInput);
  expect(result.channel).toBe('email_sent');
  expect(result.delivered).toBe(true);
});

test('ok:false maps to error channel with delivered false', async () => {
  sendEmailMock.mockResolvedValue({ ok: false, error: 'provider_down' });
  const result = await sendApprovalRequestEmail(baseInput);
  expect(result.channel).toBe('error');
  expect(result.delivered).toBe(false);
  expect(result.error).toBe('provider_down');
});
