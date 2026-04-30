// OV2-2d-NOTIFY · email send helper unit tests
//
// Two regimes:
//   • dev fallback (no RESEND_API_KEY) → console-log + synthetic id
//   • prod (mocked Resend SDK) → Resend client called with mapped args

const resendSendMock = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: resendSendMock },
  })),
}));

import { sendEmail, __resetEmailClientForTests } from '../send';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  resendSendMock.mockReset();
  __resetEmailClientForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('sendEmail · dev fallback (no API key)', () => {
  it('returns ok with a console- prefixed id when no key is set', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await sendEmail({
      to: 'admin@example.com',
      subject: 'Hello',
      html: '<p>hi</p>',
    });

    expect(result.ok).toBe(true);
    expect(result.id).toMatch(/^console-\d+$/);
    expect(resendSendMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      '[email:dev-fallback]',
      expect.objectContaining({
        to: 'admin@example.com',
        subject: 'Hello',
        hasHtml: true,
      }),
    );

    logSpy.mockRestore();
  });

  it('still uses dev fallback when key is empty string', async () => {
    process.env.RESEND_API_KEY = '';
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await sendEmail({
      to: 'a@b.com',
      subject: 's',
      html: '<p></p>',
    });

    expect(result.ok).toBe(true);
    expect(result.id).toMatch(/^console-/);
    expect(resendSendMock).not.toHaveBeenCalled();
  });
});

describe('sendEmail · prod (mocked Resend)', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 'test-key';
  });

  it('calls Resend with mapped args and returns the id on success', async () => {
    resendSendMock.mockResolvedValueOnce({
      data: { id: 'resend-id-123' },
      error: null,
    });

    const result = await sendEmail({
      to: ['x@example.com', 'y@example.com'],
      subject: 'Subj',
      html: '<p>body</p>',
      text: 'body',
      replyTo: 'reply@example.com',
      metadata: { Event: 'test.event', RequestId: 'r1' },
    });

    expect(result).toEqual({ ok: true, id: 'resend-id-123' });
    expect(resendSendMock).toHaveBeenCalledTimes(1);
    expect(resendSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['x@example.com', 'y@example.com'],
        subject: 'Subj',
        html: '<p>body</p>',
        text: 'body',
        reply_to: 'reply@example.com',
        headers: {
          'X-Abarva-Event': 'test.event',
          'X-Abarva-RequestId': 'r1',
        },
      }),
    );
  });

  it('uses RESEND_FROM_EMAIL when from is omitted', async () => {
    process.env.RESEND_FROM_EMAIL = 'sender@abarva.com';
    resendSendMock.mockResolvedValueOnce({ data: { id: 'i' }, error: null });

    await sendEmail({
      to: 'a@b.com',
      subject: 's',
      html: '<p>x</p>',
    });

    expect(resendSendMock.mock.calls[0][0].from).toBe('sender@abarva.com');
  });

  it('falls back to default sender when no env from is set', async () => {
    resendSendMock.mockResolvedValueOnce({ data: { id: 'i' }, error: null });

    await sendEmail({ to: 'a@b.com', subject: 's', html: '<p></p>' });

    expect(resendSendMock.mock.calls[0][0].from).toBe('noreply@abarva.example.com');
  });

  it('returns ok:false when Resend returns an error', async () => {
    resendSendMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'rate limited' },
    });

    const result = await sendEmail({ to: 'a@b.com', subject: 's', html: '<p></p>' });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('rate limited');
  });

  it('returns ok:false when Resend SDK throws', async () => {
    resendSendMock.mockRejectedValueOnce(new Error('network'));

    const result = await sendEmail({ to: 'a@b.com', subject: 's', html: '<p></p>' });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('network');
  });

  it('returns ok:false when Resend returns no id', async () => {
    resendSendMock.mockResolvedValueOnce({ data: {}, error: null });

    const result = await sendEmail({ to: 'a@b.com', subject: 's', html: '<p></p>' });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('resend_returned_no_id');
  });
});
